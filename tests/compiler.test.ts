import { describe, expect, test } from "bun:test"
import { compileScene, makeCaptions, parseNarration, secondsToFrame } from "@script-video/compiler"
import { videoProjectSchema } from "@script-video/schema"

describe("compiler", () => {
  test("parses cues without retaining markers", () => expect(parseNarration("One {show}two.")).toEqual({ plainText: "One two.", cues: [{ name: "show", characterOffset: 4 }] }))
  test("rejects duplicate cues", () => expect(() => parseNarration("{x}a {x}b")).toThrow("Duplicate cue"))
  test("rounds to nearest frame", () => { expect(secondsToFrame(1.02, 30)).toBe(31); expect(secondsToFrame(1.01, 30)).toBe(30) })
  test("resolves cue frames from aligned words", () => {
    const project = videoProjectSchema.parse({ settings: { width: 100, height: 100, fps: 30 }, voice: { provider: "fake", voice: "v" }, scenes: [{ id: "one", narration: "Alpha {go}beta", visuals: [{ type: "text", text: "B", at: { cue: "go" } }] }] })
    const scene = compileScene(project, 0, [{ word: "Alpha", startSeconds: 0, endSeconds: .4 }, { word: "beta", startSeconds: .4, endSeconds: .8 }])
    expect(scene.cues.go).toEqual({ seconds: .4, frame: 12 }); expect(scene.visuals[0]?.startFrame).toBe(12)
  })
  test("chunks captions", () => expect(makeCaptions(Array.from({ length: 8 }, (_, i) => ({ word: String(i), startSeconds: i, endSeconds: i + 1 })))).toHaveLength(2))
})
