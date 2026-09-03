import { defineVideo } from "@script-video/core"

const boardWithoutLabel = `export default function BoardElementExample() {
  return (
    <board
      name="BOARD_ELEMENT_EXAMPLE"
      width="60mm"
      height="36mm"
      borderRadius="3mm"
      pcbStyle={{ silkscreenTextVisibility: "visible" }}
    >
      <hole name="H1" pcbX={-25} pcbY={13} diameter="3.2mm" />
      <hole name="H2" pcbX={25} pcbY={13} diameter="3.2mm" />
      <hole name="H3" pcbX={-25} pcbY={-13} diameter="3.2mm" />
      <hole name="H4" pcbX={25} pcbY={-13} diameter="3.2mm" />
    </board>
  )
}`

const boardWithLabel = `export default function BoardElementExample() {
  return (
    <board
      name="BOARD_ELEMENT_EXAMPLE"
      width="60mm"
      height="36mm"
      borderRadius="3mm"
      pcbStyle={{ silkscreenTextVisibility: "visible" }}
    >
      <hole name="H1" pcbX={-25} pcbY={13} diameter="3.2mm" />
      <hole name="H2" pcbX={25} pcbY={13} diameter="3.2mm" />
      <hole name="H3" pcbX={-25} pcbY={-13} diameter="3.2mm" />
      <hole name="H4" pcbX={25} pcbY={-13} diameter="3.2mm" />
      <silkscreentext
        text="tscircuit <board>"
        pcbX={0}
        pcbY={0}
        fontSize={2.4}
      />
    </board>
  )
}`

export default defineVideo({
  title: "The tscircuit board element",
  settings: { width: 2160, height: 3840, fps: 30, safeMargin: 192 },
  voice: { provider: "chatterbox", voice: "narrator", sampleRate: 24000 },
  scenes: [
    {
      id: "board-outline",
      narration: "Every tscircuit printed circuit board starts with one element. The board element {show-board}defines the physical outline that every component, trace, hole, and marking must fit inside.",
      visuals: [
        { type: "text", text: "The <board> element", role: "title", at: { seconds: 0 } },
        { id: "board-pcb", type: "tscircuit.board", source: "./board.circuit.tsx", at: { cue: "show-board" }, view: "pcb" },
        { type: "captions" },
      ],
    },
    {
      id: "board-dimensions",
      narration: "The board declarations become physical geometry, not decoration. {show-size}This horizontal span is exactly sixty millimeters, while the height is thirty six millimeters and every corner uses a three millimeter radius.",
      visuals: [
        { id: "board-pcb-dimensions", type: "tscircuit.board", source: "./board.circuit.tsx", view: "pcb" },
        { type: "geometry.line", from: [-3, -1.37], to: [-3, -1.85], at: { cue: "show-size" } },
        { type: "geometry.line", from: [3, -1.37], to: [3, -1.85], at: { cue: "show-size" } },
        { type: "geometry.measurement", from: [-3, -1.85], to: [3, -1.85], label: "60 mm", at: { cue: "show-size" } },
        { type: "geometry.line", from: [3, -1.37], to: [3.32, -1.37], at: { cue: "show-size", offsetSeconds: 0.35 } },
        { type: "geometry.line", from: [3, 2.27], to: [3.32, 2.27], at: { cue: "show-size", offsetSeconds: 0.35 } },
        { type: "geometry.measurement", from: [3.32, -1.37], to: [3.32, 2.27], label: "36 mm", at: { cue: "show-size", offsetSeconds: 0.35 } },
        { type: "captions" },
      ],
    },
    {
      id: "mounting-holes",
      narration: "Four mounting holes sit near the rounded corners. {show-holes}Each hole is positioned from the board center and uses a precise three point two millimeter diameter, so the mechanical result stays repeatable.",
      visuals: [
        { id: "board-pcb-holes", type: "tscircuit.board", source: "./board.circuit.tsx", view: "pcb" },
        { type: "geometry.measurement", from: [-2.7, 1.48], to: [-2.3, 1.48], label: "Ø 3.2 mm", at: { cue: "show-holes" } },
        { type: "captions" },
      ],
    },
    {
      id: "meaningful-source-edit",
      narration: "A code view is useful only when it explains a visible result. {add-label}Here, one line adds the centered silkscreen label to the actual board source. The verified preview below shows exactly what that edit produces before the buffer is saved.",
      visuals: [
        {
          id: "edit-silkscreen-label",
          type: "editor.session",
          editor: "nvim",
          source: "./board.circuit.tsx",
          displayPath: "~/Documents/tscircuits/script-video-framework/examples/board/board.circuit.tsx",
          initialCode: boardWithoutLabel,
          code: boardWithLabel,
          capture: {
            driver: "vhs",
            tape: "./editor/add-silkscreen.tape",
            initialSource: "./editor/board-before.circuit.tsx",
            resultSource: "./.video/vhs-home/Documents/tscircuits/script-video-framework/examples/board/board.circuit.tsx",
            inputs: ["./editor/nvim.lua"],
          },
          preview: { source: "./board.circuit.tsx", view: "pcb" },
        },
        { type: "captions" },
      ],
    },
    {
      id: "verified-pcb",
      narration: "The generated PCB view {show-features}confirms the rounded boundary, all four holes, and the actual silkscreen marking. These colors come directly from the verified tscircuit renderer.",
      visuals: [
        { id: "board-pcb-verified", type: "tscircuit.board", source: "./board.circuit.tsx", view: "pcb", at: { cue: "show-features" } },
        { type: "captions" },
      ],
    },
    {
      id: "verified-three-d",
      narration: "Because Circuit JSON remains authoritative, {show-three-d}the same source also produces this three dimensional board. The PCB and 3D views are generated from the checked circuit rather than redrawn for the video.",
      visuals: [
        { id: "board-3d-verified", type: "tscircuit.board", source: "./board.circuit.tsx", view: "3d", at: { cue: "show-three-d" } },
        { type: "captions" },
      ],
    },
  ],
})
