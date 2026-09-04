# Visual reference

Check `packages/schema/src/index.ts` if the API has changed.

## Project shape

```ts
import { defineVideo } from "@script-video/core"

export default defineVideo({
  settings: { width: 1920, height: 1080, fps: 30, safeMargin: 96 },
  voice: { provider: "chatterbox", voice: "narrator", sampleRate: 24000 },
  scenes: [{
    id: "board-size",
    narration: "The board {show-size}is sixty millimeters wide.",
    visuals: [
      { id: "pcb", type: "tscircuit.board", source: "./board.circuit.tsx", view: "pcb" },
      { type: "geometry.measurement", from: [-3, -1.8], to: [3, -1.8], label: "60 mm", at: { cue: "show-size" } },
      { type: "captions" },
    ],
  }],
})
```

Visuals share optional `id`, `durationSeconds`, and one of these timings:

```ts
at: { cue: "show-result", offsetSeconds: 0.25 }
at: { seconds: 1.2 }
```

A visual without `at` starts at zero. Static visuals accumulate until scene end; `durationSeconds` does not remove them. Paths are relative to the video project and cannot escape it or use network/data URLs. Manual coordinates use a logical width of 8 and height of `8 * pixelHeight / pixelWidth`.

## Visual types

| Type | Use and key fields |
| --- | --- |
| `visual.continue` | Carry the previous non-caption stack. See the main skill for restrictions. |
| `captions` | Render aligned captions for the current scene. |
| `text` | Short label with `text`, optional `x`, `y`, and `role: title \| body \| secondary`. |
| `code.typewriter` | TSX typing with `code`, optional `typingSeconds`, `x`, and `y`. |
| `tscircuit.board` | Verified `source` rendered as `view: pcb \| schematic \| 3d`; optional `motion: none \| slow-zoom`. |
| `geometry.line` | Functional overlay using `from` and `to` coordinates. |
| `geometry.arrow` | Directional overlay using `from` and `to`. |
| `geometry.measurement` | Dimension overlay using `from`, `to`, and `label`. |
| `media.image` | Verified local raster `source`; `fit` accepts `contain` or `cover`, though current rendering does not distinguish cover cropping. |
| `terminal.session` | Real VHS terminal recording. Read [capture-sync.md](capture-sync.md). |
| `editor.session` | Real VHS Neovim insertion plus verified tscircuit preview. Read [capture-sync.md](capture-sync.md). |
| `prompt` | Only the reviewed `code-to-board` preset; the prompt records intent and never generates Python. |
| `illustration.workflow` | `kicad-bridge` or `source-to-hardware` explanatory animation. |

## Capture declarations

```ts
{
  id: "verify",
  type: "terminal.session",
  capture: { driver: "vhs", tape: "./terminal/verify.tape", inputs: ["./fixture/index.circuit.tsx"] },
}
```

List every recording dependency in `inputs` for correct cache invalidation.

```ts
{
  id: "add-label",
  type: "editor.session",
  editor: "nvim",
  source: "./board.circuit.tsx",
  initialCode,
  code: finalCode,
  capture: {
    driver: "vhs",
    tape: "./editor/add-label.tape",
    initialSource: "./editor/board-before.circuit.tsx",
    resultSource: "./.video/editor/result.circuit.tsx",
    inputs: ["./editor/nvim.lua"],
  },
  preview: { source: "./board.circuit.tsx", view: "pcb" },
}
```

The editor pipeline requires one real insertion and verifies the initial source, final source, VHS-saved result, and generated preview.
