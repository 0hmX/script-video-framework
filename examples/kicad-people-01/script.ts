export type TerminalCapture = "install" | "init" | "verify"
export type OutputView = "pcb" | "schematic" | "3d"
export type IllustrationVariant = "kicad-bridge" | "source-to-hardware"

export type EpisodeVisual =
  | { type: "terminal"; capture: TerminalCapture }
  | { type: "editor"; capture: "build-led" }
  | { type: "output"; view: OutputView }
  | { type: "illustration"; variant: IllustrationVariant }

export interface EpisodeBeat {
  id: string
  narration: string
  visual: EpisodeVisual
}

/** Review script for “tscircuit for KiCad People — Episode 1”. */
export const episodeBeats: EpisodeBeat[] = [
  {
    id: "cold-open",
    narration: `This is not a mock-up and it is not a picture drawn for the video. It is a real three-dimensional preview generated from a tiny tscircuit project. In the next five minutes, we will begin where a KiCad user should begin: install the tool, create a project, make one deliberate circuit change, and follow that change into the schematic, routed board, and three-dimensional result. No A I is required, and no hidden graphical state is involved.`,
    visual: { type: "output", view: "3d" },
  },
  {
    id: "kicad-mental-model",
    narration: `KiCad teaches us to move between specialized canvases: schematic first, then footprints and board layout. tscircuit preserves those electrical and physical ideas, but moves the authored definition into a TypeScript file. That file is not a screenshot of the design. It is the design input. The schematic, PCB, and three-dimensional views are generated evidence. This distinction matters because source review tells us what someone intended to change, while generated views and checks tell us what the toolchain actually produced.`,
    visual: { type: "illustration", variant: "kicad-bridge" },
  },
  {
    id: "install",
    narration: `The package is named tscircuit and the executable is called T S C I. We use Bun for this project, so the installation has only three meaningful steps: confirm Bun is available, install tscircuit, and ask the installed executable for its version. This terminal recording runs those real commands. There is no fabricated success message. If your shell cannot find T S C I afterward, inspect the global Bun binary path before reinstalling, because the package may already be present while the shell path is wrong.`,
    visual: { type: "terminal", capture: "install" },
  },
  {
    id: "create-project",
    narration: `Next, create a clean project in a directory you recognize. The P W D command establishes exactly where we are, and init writes the starter into a new folder. We use no install so file generation and dependency installation remain separate operations. That separation is useful when teaching and debugging because you can see whether project creation succeeded before the network or package manager becomes involved. Read each prompt, confirm the name, and decline optional A I skills for this manual series.`,
    visual: { type: "terminal", capture: "init" },
  },
  {
    id: "edit-real-file",
    narration: `Now the terminal gets out of the way. We open the generated circuit file in real Neovim. The starter already contains a two-pin header. We add a one-kilohm resistor, a red indicator L E D, and three named traces: power into the resistor, resistor into the L E D, and the L E D back to ground. Notice what we do not add. There is no fixed board width, no board height, and no P C B X or P C B Y positioning. The physical layout remains free to pack tightly. When the buffer is saved, the file on disk is checked against the exact source used to generate the preview.`,
    visual: { type: "editor", capture: "build-led" },
  },
  {
    id: "schematic-result",
    narration: `Here is the first consequence of that edit: the generated schematic. The header, resistor, and L E D are not redrawn for presentation; this image comes from the checked circuit source. The series connection is visible from V bus through the resistor and diode to ground. Schematic coordinates are allowed because they improve documentation without forcing physical P C B placement. Electrical intent and physical packing are related, but they are not the same coordinate system.`,
    visual: { type: "output", view: "schematic" },
  },
  {
    id: "pcb-result",
    narration: `Now look at the generated P C B. Because the board has no explicit dimensions and the components have no manual P C B coordinates, tscircuit packs the header, resistor, and L E D into a compact outline and routes the named connections. This is the physical result we must inspect, not something a code diff can guarantee. We can immediately judge density, board edge clearance, component orientation, and whether the routing looks plausible before thinking about fabrication.`,
    visual: { type: "output", view: "pcb" },
  },
  {
    id: "source-to-hardware",
    narration: `The workflow is best understood as a transformation, not as code replacing electronics knowledge. A source file describes components and connectivity. The evaluator produces shared circuit data. From that data, tscircuit derives electrical drawings, copper geometry, checks, and mechanical previews. The animated board here is an illustration of that flow; the full-screen outputs on either side of it are the real generated artifacts. Keeping that distinction visible prevents a polished animation from being mistaken for engineering evidence.`,
    visual: { type: "illustration", variant: "source-to-hardware" },
  },
  {
    id: "verify",
    narration: `Before trusting the attractive output, run the engineering checks. Netlist validation confirms that every intended pin belongs to the expected connection. Schematic-placement validation catches documentation problems. P C B placement validation checks the packed physical arrangement. Build then evaluates the circuit and writes Circuit JSON plus the requested preview images. These are real commands against the same file edited moments ago. A clean command exit is useful evidence, but it still does not replace electrical design review, safety analysis, manufacturer constraints, or inspection of the final fabrication files.`,
    visual: { type: "terminal", capture: "verify" },
  },
  {
    id: "final-pcb",
    narration: `Return to the board with that context. The compact shape is not the result of manually nudging parts until a screenshot looked good. It comes from components, footprints, connectivity, and automatic packing encoded in a reproducible project. A teammate can review the source, install the same dependencies, rerun the checks, and regenerate this view. That is the bridge for a KiCad user: familiar electrical responsibility, but a project whose authored state behaves like software.`,
    visual: { type: "output", view: "pcb" },
  },
  {
    id: "final-three-d",
    narration: `Episode One ends with the three-dimensional result again, but now you know where it came from. We installed the actual command-line tool, created a project, edited a real file, inspected the schematic, checked the packed board, and built the outputs. In Episode Two, we will slow down further and explain the circuit source line by line: component props, footprints, ports, named traces, and the difference between schematic placement and P C B placement.`,
    visual: { type: "output", view: "3d" },
  },
]
