---
name: script-video-authoring
description: Author or revise synchronized TypeScript explainer videos in this script-video-framework repository. Use for short narration scenes, Manim/VHS/tscircuit visuals, speech timing, and visual.continue decisions. Do not use for generic video editing or publishing.
---

# Script Video Authoring

Create declarative `defineVideo()` projects rendered only by this framework's Manim worker.

## Prepare

- Inspect the target project, its assets, circuit sources, and VHS tapes.
- Treat `packages/schema/src/index.ts` as the current API.
- Read [visual-reference.md](references/visual-reference.md) when adding or changing visual declarations.
- Read [capture-sync.md](references/capture-sync.md) when working with terminal or editor recordings.
- For long episodes, consider separating a beat plan from visual mapping as `examples/kicad-people-01` does.

## Author small scenes

- Give each scene one spoken idea and one coherent visual state. One sentence is often best; use one or two by default and never more than four.
- Split aggressively when the idea, evidence, action, or synchronization target changes. If a capture is too long, divide the real capture as well as the narration.
- Every scene must introduce useful evidence, add a meaningful overlay, show a real interaction, or continue the current visual.
- Add `{cue-name}` before the word that should trigger a Manim reveal. Prefer speech cues over guessed seconds.
- Add captions to narrated scenes. Keep narration concise and overlay text sparse, monochrome, and non-repetitive.

## Keep speech and screen synchronized

Synchronization is an acceptance requirement. Each spoken clause must match the action or result visible at that moment.

- VHS actions are not cue-controlled; write narration to the tape's real order and pacing.
- Never announce a command or result materially before or after it appears.
- If timing drifts, shorten or split the narration and capture, adjust natural pauses, or move explanation to a following static-result scene. Do not add filler speech.
- Visible CLI footage must show plausible human actions and real commands. Hide setup and cleanup.
- Do not dump files with `cat`, `sed`, `head`, `tail`, `awk`, `printf`, `echo`, here-documents, or print scripts. Show source in a real editor. A real captured `git diff` is allowed when the change is the subject.

## Continue or replace

Use `{ type: "visual.continue" }` when another short scene needs the complete previous non-caption stack.

- It requires an earlier visual, may appear once, and cannot be mixed with replacement visuals; captions are allowed.
- It carries every previous overlay. Redeclare the base visual when overlays must change.
- It restarts typewriters, captures, workflow animations, and slow zooms because each scene renders independently. Never use it to extend a recording.
- `at` or `durationSeconds` on the continuation replaces that timing on every carried item.

## Choose evidence

- Use `terminal.session` or `editor.session` for real workflows, `tscircuit.board` for verified circuit outputs, and geometry for useful callouts.
- Use `text` as a label, not the main animation. Use `code.typewriter` only when typing is the concept.
- Use workflow illustrations and the constrained prompt preset only for explanations, not engineering evidence.
- Technical circuit visuals must be verified tscircuit exports. Use the `tscircuit` skill when changing circuit source or integration.
- Use only local project assets. Do not add another animation engine, generated Python, publishing, or GUI automation.

## Verify

```sh
bun run video validate path/to/video.ts --json
bun run video inspect path/to/video.ts
bun run video preview path/to/video.ts --fake-voice
```

Watch captures at normal speed and reject mismatched speech, actions, or results. Before a final render, run `bun run video doctor` and render without fake voice. Run `bun run typecheck` and `bun test` when framework code changes.
