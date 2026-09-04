# Campaign 1 — Build a handheld in tscircuit

## Campaign promise

Teach tscircuit to people who already think in PCB tools such as KiCad, as well as software developers who are new to board design. Each vertical Short teaches one useful action and adds one understandable piece to a Game Boy-style RP2040 handheld.

The playlist begins with installation and the CLI, explains the source-to-board framework, and then builds the handheld subsystem by subsystem. By the finale, a viewer should understand where the board source, schematic, PCB, 3D preview, checks, and manufacturing exports come from; the series must not imply that watching it alone makes a design electrically safe or fabrication-ready.

## Final target

The visual destination is [`abse/gameboy`](https://tscircuit.com/abse/gameboy), a 106 mm × 130 mm, two-layer RP2040 handheld demo board. Its visible subsystems give the campaign its teaching order:

- RP2040/Pico-style controller section
- 2.8-inch SPI display connector
- D-pad, A/B/X/Y, Start, and Select controls
- battery connector, power switch, boost converter, and USB-power behavior
- PWM audio filter, volume control, amplifier, and speaker connector
- mounting holes, copper pours, and silkscreen labels

The registry page currently reports no license. Treat its source and generated media as reference material until reuse permission or a compatible license is confirmed. Production should build a campaign-owned teaching circuit and generate every schematic, PCB, and 3D shot from that checked source.

## Format

- Platform: YouTube Shorts and equivalent vertical feeds.
- Canvas: 1080×1920 or 2160×3840, 9:16, 30 fps.
- Runtime: aim for 50–58 seconds; never exceed 60 seconds.
- Scope: one question, one action, and one visible result per episode.
- Narration: one or two sentences per beat; four is the absolute maximum.
- Cadence: introduce a meaningful new visual or continue an active capture every one to three sentences.
- Tooling: Bun for TypeScript work, Manim for animation, and VHS for real CLI/editor capture.

## Mandatory recurring opener

Every episode starts on the verified final-board 3D view with a slow camera push. Use the same first line so a Short immediately reads as part of the playlist:

> By the end of this one-minute series, you’ll know how to build this handheld in tscircuit. Today: [specific outcome].

The first clause is the campaign promise; the second must name the episode payoff, such as “install the CLI” or “wire one D-pad button.” Keep the 3D shot to roughly four seconds, then use a Manim camera move or highlight to locate today’s subsystem before cutting to the real workflow.

## Visual contract

- Technical circuit visuals must be verified tscircuit exports from a pinned source revision.
- CLI and editor activity must be captured from real commands with VHS; never animate a synthetic command, success state, or code diff.
- Manim may crop, pan, zoom, label, measure, spotlight, and compare verified exports. It must not redraw a circuit as if the drawing were generated evidence.
- Overlay typography is monochrome. Use at most a title, captions, one pointer/measurement style, and one progress indicator.
- Show accumulated progress by highlighting the subsystem built today on the same full-board PCB or 3D view.
- Keep important board detail and captions inside the vertical safe area; do not simply crop a 16:9 render.
- End on evidence: a changed schematic/PCB/3D export or a real passing command relevant to the lesson.

## Teaching stance

Translate unfamiliar ideas into the KiCad mental model without claiming the tools work identically. Source is the authored input; Circuit JSON is the shared evaluated representation; schematic, PCB, 3D, checks, and exports are generated results that still require engineering review.

Use manual, inspectable steps first. AI may be covered later as an optional workflow, but the core campaign must remain reproducible without it.

## Playlist shape

The ordered 32-video build is in [`video-ideas.md`](./video-ideas.md). Episodes 1–6 establish the workflow, 7–16 teach the source model, 17–30 assemble the handheld, and 31–32 validate and export the final result.

## Definition of done for an episode

- The runtime is 60 seconds or less.
- The recurring 3D opener uses the campaign’s verified final board.
- The episode teaches exactly one primary idea and produces a visible result.
- All commands and flags were reconfirmed against the installed `tsci --help` before recording.
- Any board, schematic, or 3D view was generated from the source revision named in the episode notes.
- The relevant check passes; failures are taught honestly instead of being hidden.
- Narration does not claim electrical safety, regulatory compliance, or manufacturability.
- The video validates through the framework before rendering.
