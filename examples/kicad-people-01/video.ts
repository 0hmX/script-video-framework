import { readFileSync } from "node:fs"
import { defineVideo, type VideoProject, type Visual } from "@script-video/core"
import { episodeBeats, type EpisodeVisual, type TerminalCapture } from "./script.ts"

const initialCircuit = readFileSync(new URL("./fixture/index.before.tsx", import.meta.url), "utf8").trimEnd()
const finalCircuit = readFileSync(new URL("./fixture/index.circuit.tsx", import.meta.url), "utf8").trimEnd()

function terminal(id: string, tape: string, inputs: string[] = []): Visual[] {
  return [
    { id, type: "terminal.session", capture: { driver: "vhs", tape, inputs } },
    { type: "captions" },
  ]
}

const terminalCaptures: Record<TerminalCapture, Visual[]> = {
  install: terminal("install-tscircuit", "./terminal/install-only.tape"),
  init: terminal("create-project", "./terminal/create-project.tape"),
  verify: terminal("check-and-build", "./terminal/check-and-build.tape", [
    "./fixture/index.circuit.tsx",
    "./fixture/package.json",
    "./fixture/tsconfig.json",
  ]),
}

function visualsFor(plan: EpisodeVisual): Visual[] {
  if (plan.type === "continue") return [{ type: "visual.continue" }, { type: "captions" }]
  if (plan.type === "terminal") return terminalCaptures[plan.capture]
  if (plan.type === "editor") {
    return [
      {
        id: "build-led-circuit",
        type: "editor.session",
        editor: "nvim",
        source: "./fixture/index.circuit.tsx",
        displayPath: "~/Documents/tscircuits/script-video-framework/examples/kicad-people-01/fixture/index.circuit.tsx",
        initialCode: initialCircuit,
        code: finalCircuit,
        capture: {
          driver: "vhs",
          tape: "./editor/build-led-circuit.tape",
          initialSource: "./fixture/index.before.tsx",
          resultSource: "./.video/editor-home/Documents/tscircuits/script-video-framework/examples/kicad-people-01/fixture/index.circuit.tsx",
          inputs: ["./editor/nvim.lua"],
        },
        preview: { source: "./fixture/index.circuit.tsx", view: "pcb" },
      },
      { type: "captions" },
    ]
  }
  if (plan.type === "output") {
    return [
      {
        id: `generated-${plan.view}`,
        type: "tscircuit.board",
        source: "./fixture/index.circuit.tsx",
        view: plan.view,
        motion: "slow-zoom",
      },
      { type: "captions" },
    ]
  }
  return [
    { type: "illustration.workflow", variant: plan.variant },
    { type: "captions" },
  ]
}

const scenes: VideoProject["scenes"] = episodeBeats.map(beat => ({
  id: beat.id,
  narration: beat.narration,
  visuals: visualsFor(beat.visual),
}))

export default defineVideo({
  title: "tscircuit for KiCad People — Episode 1",
  settings: { width: 1920, height: 1080, fps: 30, safeMargin: 96 },
  voice: { provider: "chatterbox", voice: "narrator", sampleRate: 24000 },
  scenes,
})
