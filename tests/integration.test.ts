import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { buildVideo } from "@script-video/cli/src/pipeline.ts"
import { loadProject } from "@script-video/cli/src/project.ts"
import { videoProjectSchema } from "@script-video/schema"

let dir = ""; afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }) })
test("offline vertical slice validates, voices, aligns and prepares", async () => {
  dir = await mkdtemp(resolve(tmpdir(), "video-integration-")); const file = resolve(dir, "video.ts")
  await writeFile(file, `export default {settings:{width:320,height:240,fps:30},voice:{provider:"fake",voice:"test"},scenes:[{id:"scene",narration:"Hello {now}board",visuals:[{type:"text",text:"Board",at:{cue:"now"}}]}]}`)
  const loaded = await loadProject(file); const first = await buildVideo(loaded, { fakeVoice: true })
  const visualProject = videoProjectSchema.parse({ settings:{width:320,height:240,fps:30}, voice:{provider:"fake",voice:"test"}, scenes:[{id:"scene",narration:"Hello {now}board",visuals:[{type:"text",text:"Visually changed",at:{cue:"now"}}]}] })
  const visualEdit = await buildVideo({ project: visualProject, projectFile: resolve(dir, "visual-edit.ts"), projectDir: dir }, { fakeVoice: true })
  expect(await Bun.file(first.manifest).exists()).toBe(true); expect(visualEdit.stages.find(s => s.stage === "voice-scene")?.completedAt).toBe(first.stages.find(s => s.stage === "voice-scene")?.completedAt)
  const narrationProject = videoProjectSchema.parse({ settings:{width:320,height:240,fps:30}, voice:{provider:"fake",voice:"test"}, scenes:[{id:"scene",narration:"Changed narration",visuals:[]}] })
  const narrationEdit = await buildVideo({ project: narrationProject, projectFile: resolve(dir, "narration-edit.ts"), projectDir: dir }, { fakeVoice: true })
  expect(narrationEdit.stages.find(s => s.stage === "voice-scene")?.key).not.toBe(first.stages.find(s => s.stage === "voice-scene")?.key)
})
