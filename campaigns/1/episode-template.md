# Campaign 1 episode template

Use this template when converting an idea into a framework project. Timing is a budget, not a reason to rush narration; cut scope until the lesson fits comfortably.

## Metadata

- Campaign ID: `1`
- Episode ID: two digits, matching `video-ideas.md`
- Format: 9:16 vertical, 30 fps
- Target runtime: 50–58 seconds
- Teaching revision: exact source commit or immutable artifact hash
- Final-board revision: exact source commit or immutable artifact hash
- Primary lesson: one sentence
- Visible result: one sentence
- Relevant check: exact command and expected evidence

## Beat contract

| Time | Narration job | Required visual action |
| --- | --- | --- |
| 00:00–00:04 | “By the end of this one-minute series, you’ll know how to build this handheld in tscircuit. Today: [specific outcome].” | Open on the verified final 3D board with a Manim camera push. |
| 00:04–00:09 | Point to the exact subsystem or workflow step affected today. | Continue the 3D view and use one purposeful crop, highlight, or pointer. |
| 00:09–00:35 | Perform the smallest real action that teaches the idea. | Use a real VHS terminal/editor capture, or inspect verified generated views. |
| 00:35–00:49 | Explain the consequence in the schematic, PCB, check output, or 3D view. | Cut to the newly generated evidence and animate only explanatory annotations. |
| 00:49–00:56 | State what changed and tee up the next dependency. | Show the full board with today’s completed subsystem highlighted. |

Every beat must either introduce a meaningful Manim animation, introduce a verified tscircuit result, or continue a real capture whose activity remains relevant. Static decorative text is not a beat.

## Script skeleton

Keep each placeholder to one or two sentences.

1. **Promise:** recurring campaign line plus today’s payoff.
2. **Locate:** where today’s change lives on the final handheld.
3. **Do:** the real command or source edit.
4. **Read the result:** what changed in generated evidence and why it matters.
5. **Close:** name the accumulated progress and the next build step.

## Framework mapping

- Final 3D, schematic, and PCB: `tscircuit.board` using a local pinned source.
- Real CLI: `terminal.session` with a VHS tape.
- Real source edit: `editor.session` with a VHS tape and result-source verification.
- Measurements and pointers: Manim geometry visuals or renderer-supported annotations.
- Captions: `captions` on every narrated scene.
- Reused active visual: `visual.continue`; do not recreate an unchanged image as a new decorative beat.

## Pre-render checklist

- Re-run the episode’s commands from a clean fixture.
- Run `tsci check netlist` before schematic-placement, PCB placement, and build checks.
- Run `tsci check shorts` after routing when the episode changes copper or connectivity.
- Confirm schematic-placement and PCB placement checks have no actionable violations before presenting the result as complete.
- Generate the episode’s board views from the teaching revision and record their hashes.
- Verify no token, credential, home-directory detail, or unrelated file appears in a capture.
- Run `bun run video validate <episode>/video.ts --json`.
- Render with Manim and inspect the full vertical frame, captions, safe margins, and final runtime.
