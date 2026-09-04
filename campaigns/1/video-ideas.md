# Campaign 1 video ideas

This is the production order. Each Short inherits the opener, beat structure, evidence rules, and runtime limit from the campaign README and episode template.

## Arc 1 — See the destination and start the toolchain

| # | Working title | Build/learning outcome | Required proof visual |
| --- | --- | --- | --- |
| 01 | How text becomes a handheld | Tour the final board, then map source → Circuit JSON → schematic, PCB, checks, and 3D. | Verified final 3D, then a Manim flow using real generated outputs. |
| 02 | Install tscircuit with Bun | Install the `tscircuit` package globally and prove the `tsci` executable is on the shell path. | Real VHS capture of `bun install --global tscircuit` and `command -v tsci`. |
| 03 | Three commands that diagnose your setup | Run `tsci version`, `tsci doctor`, and `tsci --help`; explain when each one is useful. | Real VHS output from the installed CLI. |
| 04 | Create the handheld project | Initialize a clean project, keep file creation separate from dependency installation, then install with Bun. | Real VHS capture of `tsci init handheld --no-install`, followed by `bun install`. |
| 05 | The five files that matter | Identify `index.circuit.tsx`, `package.json`, `tsconfig.json`, `tscircuit.config.json`, and `bun.lock`. | Real editor or terminal inspection of the generated project tree. |
| 06 | One source, three views | Start `tsci dev` and switch between schematic, PCB, and 3D without changing the source. | Real captured interaction plus the three verified views. |

## Arc 2 — Learn the source model on tiny circuits

| # | Working title | Build/learning outcome | Required proof visual |
| --- | --- | --- | --- |
| 07 | Your first `<board>` | Replace the starter with a named board and explain the default-exported TSX component. | Real edit, followed by the generated empty board view. |
| 08 | Add an LED and resistor | Add two builtin components with names, values, and simple footprints. | Real edit and a verified schematic/PCB before-and-after. |
| 09 | Footprints are physical | Change a resistor between 0402 and 0603 and show what changes physically but not electrically. | Matched schematic and PCB crops from both verified builds. |
| 10 | Connect pins with `<trace>` | Wire power → resistor → LED → ground using explicit selectors. | Real edit followed by a schematic path highlight. |
| 11 | Stop repeating power wires | Declare named `GND`, `V3V3`, and `VSYS` nets and connect multiple components to them. | Schematic before-and-after with Manim highlighting shared nets. |
| 12 | Schematic position is not PCB position | Move one part with `schX`/`schY`, then with `pcbX`/`pcbY`, and compare the independent results. | Synchronized verified schematic and PCB comparisons. |
| 13 | Build versus snapshot | Use `tsci build` for evaluated artifacts and `tsci snapshot` for review images. | Real VHS commands and the exact files they create. |
| 14 | Find parts with `tsci search` | Search the registry/footprint ecosystem and judge a result before adding it. | Real search output; the selected result is opened and inspected. |
| 15 | Import a real component | Use `tsci import` for one campaign component and inspect its pins, footprint, and CAD model. | Real import capture and a verified component preview. |
| 16 | Turn a circuit into a reusable block | Extract the controller/header assembly into a subcircuit and use it from the main board. | Real source edit and identical before/after connectivity views. |

## Arc 3 — Build the handheld one subsystem at a time

| # | Working title | Build/learning outcome | Required proof visual |
| --- | --- | --- | --- |
| 17 | Shape the handheld board | Set the 106 mm × 130 mm two-layer board, corner radius, and four mounting holes. | Manim measurements over the verified PCB outline and 3D view. |
| 18 | Place the RP2040 controller block | Add the Pico-style RP2040 subcircuit and orient it in the top half of the handheld. | Verified subcircuit schematic, PCB placement, and 3D result. |
| 19 | Add the 2.8-inch SPI display | Place the display module/connector and map power plus SPI signals to controller pins. | Schematic signal highlight followed by the verified 3D fit. |
| 20 | Wire one button correctly | Connect one pushbutton between a GPIO and ground; explain the four-pad switch mapping. | Pin close-up, real edit, and verified schematic continuity. |
| 21 | Turn one button into a D-pad | Reuse the button pattern for Up, Down, Left, and Right with deliberate physical spacing. | Manim placement guides over the verified PCB. |
| 22 | Add A/B/X/Y, Start, and Select | Complete the ten-button control matrix and assign readable trace names. | PCB progress reveal plus schematic highlight for the ten GPIO paths. |
| 23 | Add battery input and a power switch | Place the battery connector, cable slot, and mechanical power switch before designing regulation. | Verified 3D mechanical close-up and schematic power-entry path. |
| 24 | Build the boost converter | Add the boost IC, inductor, diode, feedback divider, and input/output capacitors as one power section. | Verified power schematic with Manim current-path highlighting. |
| 25 | Prefer USB power when it is present | Add the transistor logic that disables battery boost from VBUS and explain the intended handoff. | Two-state Manim highlight over the verified power schematic. |
| 26 | Turn PWM into an audio signal | Add the input resistor, PWM filter, coupling capacitor, and volume control. | Schematic path animation and a verified board placement crop. |
| 27 | Drive the speaker | Add the PAM8403-class amplifier, supply decoupling, ferrite beads, EMI capacitors, and speaker connector. | Verified audio-section schematic and 3D close-up. |
| 28 | Make a large schematic readable | Group controller, display, controls, power, and audio with schematic sections and intentional positions. | Full verified schematic before-and-after, cropped by Manim to each section. |
| 29 | Route power differently from signals | Apply deliberate trace-width classes, then add top and bottom ground pours with clearances. | PCB copper comparison plus measured trace-width callouts. |
| 30 | Add the labels that make hardware usable | Add concise silkscreen for controls, connectors, and power; check that labels do not collide with parts. | Verified top-board export and 3D close-ups of each label group. |

## Arc 4 — Prove and export the result

| # | Working title | Build/learning outcome | Required proof visual |
| --- | --- | --- | --- |
| 31 | The checks before you trust the pretty render | Run netlist, schematic-placement, PCB placement, trace-length, routing-difficulty, and short-circuit checks in the right order. | Real VHS capture of the checks; inspect any generated diagnostic image instead of hiding it. |
| 32 | From source to final handheld | Build the pinned source, inspect final schematic/PCB/3D outputs, and explain what export does—and does not—prove. | Real build/export capture and a final verified 3D progress reveal. |

## Recording notes

- A later episode may briefly recap an earlier concept, but it must add a new build increment.
- Commands in this plan describe intent. Confirm exact syntax with the installed CLI immediately before scripting and recording.
- For component-search and import episodes, select an actually available package/part during preproduction; never fabricate a registry result.
- Power and audio episodes explain the topology visible in the reference design. They are not a substitute for datasheet review, calculations, simulation, or hardware validation.
- The final board should emerge cumulatively from campaign-owned commits so every Short can pin a real before and after revision.
