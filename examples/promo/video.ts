import { defineVideo } from "@script-video/core"

const circuitBeforeConnections = `export default function TextToHardware() {
  return (
    <board>
      <pinheader
        name="J1"
        pinCount={2}
        pinLabels={["VBUS", "GND"]}
        footprint="pinrow2"
        schX={-5}
      />
      <pushbutton name="SW1" footprint="pushbutton" schX={-1.5} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schX={2}
      />
      <led
        name="LED1"
        color="red"
        footprint="0603"
        schX={5.5}
      />
    </board>
  )
}`

const connectedCircuit = `export default function TextToHardware() {
  return (
    <board>
      <pinheader
        name="J1"
        pinCount={2}
        pinLabels={["VBUS", "GND"]}
        footprint="pinrow2"
        schX={-5}
      />
      <pushbutton name="SW1" footprint="pushbutton" schX={-1.5} />
      <resistor
        name="R1"
        resistance="1k"
        footprint="0603"
        schX={2}
      />
      <led
        name="LED1"
        color="red"
        footprint="0603"
        schX={5.5}
      />
      <trace name="power" from=".J1 > .VBUS" to=".SW1 > .pin1" />
      <trace name="power_pad" from=".J1 > .VBUS" to=".SW1 > .pin2" />
      <trace name="switched_power" from=".SW1 > .pin3" to=".R1 > .pin1" />
      <trace name="switched_power_pad" from=".SW1 > .pin4" to=".R1 > .pin1" />
      <trace name="led_drive" from=".R1 > .pin2" to=".LED1 > .anode" />
      <trace name="return" from=".LED1 > .cathode" to=".J1 > .GND" />
    </board>
  )
}`

export default defineVideo({
  title: "tscircuit — text to hardware",
  settings: { width: 2160, height: 3840, fps: 30, safeMargin: 192 },
  voice: { provider: "chatterbox", voice: "narrator", sampleRate: 24000 },
  scenes: [
    {
      id: "hook",
      narration: "What if building hardware started the same way software does? With text.",
      visuals: [
        { type: "text", text: "TEXT → HARDWARE", role: "title" },
        { type: "text", text: "tscircuit", role: "secondary", y: 2.9 },
        { id: "hook-board", type: "tscircuit.board", source: "./promo.circuit.tsx", view: "3d", at: { seconds: 1.2 } },
        { type: "captions" },
      ],
    },
    {
      id: "write-the-circuit",
      narration: "Write real electronic components in TypeScript. Connect a button, a resistor, and an LED with readable source code.",
      visuals: [
        {
          id: "connect-promo-circuit",
          type: "editor.session",
          editor: "nvim",
          source: "./promo.circuit.tsx",
          displayPath: "~/Documents/tscircuits/text-to-hardware/index.circuit.tsx",
          initialCode: circuitBeforeConnections,
          code: connectedCircuit,
          capture: {
            driver: "vhs",
            tape: "./editor/connect-circuit.tape",
            initialSource: "./editor/promo-before.circuit.tsx",
            resultSource: "./.video/vhs-home/Documents/tscircuits/text-to-hardware/index.circuit.tsx",
            inputs: ["./editor/nvim.lua"],
          },
          preview: { source: "./promo.circuit.tsx", view: "pcb" },
        },
        { type: "captions" },
      ],
    },
    {
      id: "schematic",
      narration: "That same source compiles into a connected schematic you can inspect and validate.",
      visuals: [
        { type: "text", text: "ONE SOURCE", role: "title" },
        { id: "promo-schematic", type: "tscircuit.board", source: "./promo.circuit.tsx", view: "schematic", at: { seconds: 0.7 } },
        { type: "captions" },
      ],
    },
    {
      id: "packed-pcb",
      narration: "Then tscircuit packs the components and routes a real printed circuit board automatically.",
      visuals: [
        { type: "text", text: "AUTOMATIC PCB", role: "title" },
        { id: "promo-pcb", type: "tscircuit.board", source: "./promo.circuit.tsx", view: "pcb", at: { seconds: 0.7 } },
        { type: "captions" },
      ],
    },
    {
      id: "three-d",
      narration: "See the hardware in three dimensions before you send anything to manufacture.",
      visuals: [
        { type: "text", text: "READY TO BUILD", role: "title" },
        { id: "promo-three-d", type: "tscircuit.board", source: "./promo.circuit.tsx", view: "3d", at: { seconds: 0.5 } },
        { type: "captions" },
      ],
    },
    {
      id: "install",
      narration: "From text to hardware. Install tscircuit with Bun, run tsci init, and build your first device.",
      visuals: [
        { type: "text", text: "bun install --global tscircuit", role: "title", y: 2.0 },
        { type: "text", text: "tsci init", role: "body", y: 0.4 },
        { type: "text", text: "tscircuit.com", role: "secondary", y: -1.0 },
        { type: "captions" },
      ],
    },
  ],
})
