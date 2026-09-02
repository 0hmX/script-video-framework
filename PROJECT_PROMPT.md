# Project Prompt: TypeScript Script-to-Video Framework

Build a new, standalone open-source framework that turns an authored script into a finished technical explainer video. This is a greenfield project. Do not modify, extend, or depend on the legacy Eui repository.

## Product goal

An author should be able to write one TypeScript project describing narration, timed sections, and verified visual sources, then run one non-interactive command to produce a deterministic MP4 with narration and captions.

The first reference project must explain the tscircuit `<board>` element. It must render a real board with tscircuit and use those generated PCB/3D assets in the video. It must never substitute an AI illustration for a technical artifact unless the author explicitly requests an illustration.

## Non-negotiable decisions

- Use TypeScript and Bun for the public API, compiler, orchestration, cache, CLI, tests, and package management.
- Use Manim Community as the only animation engine. Run it behind a small, versioned JSON-lines worker boundary so Python remains an implementation detail.
- Support the existing open-source Chatterbox voice workflow through an isolated local worker. Make voice providers replaceable without changing the compiler.
- Generate audio before final animation timing. Use word-level alignment to resolve narration cues and captions.
- Use local, content-addressed caching. A visual-only edit must not regenerate narration.
- Run headlessly and non-interactively. No GUI automation is part of the build.
- Do not include YouTube upload, social publishing, analytics, thumbnail generation, or account integrations.
- Do not include a code-diff animation tool.
- Do not download arbitrary network media during a build. Inputs must be checked-in local files or artifacts produced by an explicit verified generator.

## Visual direction

Default to a restrained editorial system inspired by Vercel's interface guidance, without copying Vercel branding:

- Near-black background with white and neutral-gray typography.
- Geist and Geist Mono when available, with documented fallbacks.
- No decorative gradients, glows, grids, HUD ornaments, glass panels, cards, pills, or colored subtitle rails.
- Do not apply theme colors to text. Text is black or white according to contrast, with gray only for secondary hierarchy.
- Lines must communicate real measurements, relationships, axes, or boundaries. Never add ornamental divider lines.
- Use spacing, scale, alignment, and typographic weight for hierarchy.
- Circuit renders retain their real technical colors; overlay typography remains monochrome.
- Captions must respect safe areas, avoid collisions, and never crop at frame edges.

## Authoring model

Expose a typed `defineVideo()` API from a small core package. A project should resemble:

```ts
export default defineVideo({
  settings: { width: 1080, height: 1920, fps: 30 },
  voice: { provider: "chatterbox", voice: "narrator" },
  scenes: [
    {
      id: "board-size",
      narration: "Width and height {show-size}define the physical board.",
      visuals: [
        {
          type: "tscircuit.board",
          source: "./board.circuit.tsx",
          at: { cue: "show-size" },
          view: "pcb",
        },
      ],
    },
  ],
})
```

The exact syntax may improve during implementation, but authored plans must remain declarative, serializable, schema-validated, and renderer-independent. Never execute model-generated Python from a project file.

Keep the initial visual vocabulary deliberately small:

- `text`
- `captions`
- `media.image` for verified local raster assets
- `tscircuit.board` for checked PCB, schematic, and 3D exports
- a minimal set of functional Manim geometry primitives for measurements and relationships

Reject unknown visual types before audio synthesis or rendering begins.

## Pipeline

Implement this resumable dependency graph:

```text
load + validate authored project
  → synthesize/reuse narration per scene
  → align words and resolve narration cues
  → compile a frame-accurate renderer-independent timeline
  → generate and verify declared technical assets
  → prepare validated Manim render data
  → render silent video
  → concatenate narration and mux audio
  → emit SRT and VTT captions
  → write a checksummed build manifest
```

Every stage must record:

- a versioned content key
- dependency keys
- generated artifact paths
- completion metadata

An artifact is reusable only when its key matches and every declared output still exists.

## tscircuit integration

Treat Circuit JSON and `tsci` output as authoritative. The adapter must:

1. Resolve the circuit source inside the project directory.
2. Run the appropriate `tsci check` commands.
3. Fail on validation errors before Manim starts.
4. Build only the requested PCB, schematic, or 3D views.
5. pass the resulting local assets to Manim without recreating or tracing them.

When implementation is performed by Codex, require the tscircuit skill for this package. Follow the nearest tscircuit documentation and never guess board properties or footprints when they can be verified.

## Package boundaries

Use a Bun workspace with focused packages:

```text
packages/schema          strict authored/build schemas
packages/core            public TypeScript authoring API
packages/compiler        cues, alignment mapping, frame timeline
packages/audio           provider interfaces, cache, Chatterbox adapter
packages/assets          local asset policy and tscircuit adapter
packages/renderer        prepared renderer-independent visual plan
packages/renderer-manim  Manim worker protocol and process adapter
packages/cli             commands and resumable build graph
workers/manim            deterministic Python renderer worker
workers/chatterbox       isolated local TTS worker
examples/board           verified end-to-end reference project
```

Avoid circular dependencies. Shared contracts belong in `schema`; compilation must not import Manim or tscircuit implementations.

## CLI

Provide these non-interactive commands:

```text
video validate <project>
video voice <project>
video preview <project>
video render <project>
video inspect <project>
video doctor
```

- `--json` produces stable machine-readable output.
- Exit `0` on success, `1` for build/runtime failure, and `2` for invalid CLI usage.
- `inspect` is read-only and explains resolved cues, durations, cache keys, stale stages, and outputs.
- `doctor` reports Bun, Python, Manim, FFmpeg, font, Chatterbox, and `tsci` availability.
- Commands must never prompt for input.

## Codex implementation workflow

Add a checked-in Zsh orchestrator that invokes `codex exec` non-interactively. Split implementation into bounded stages with saved JSON results and logs:

1. workspace, schemas, and authoring API
2. narration, alignment, and immutable cache
3. tscircuit asset adapter
4. renderer plan and Manim worker
5. CLI, graph, captions, and manifest
6. board example, visual QA, documentation, and review

The orchestrator must support dry-run, force, start-from-stage, and single-stage modes. Completed stages must be resumable. Use a strict output schema to prevent a stage from being marked complete while required work remains.

## Testing and acceptance criteria

The project is complete only when all of the following are true:

- `bun install`, typecheck, and tests succeed from a clean checkout.
- Unit tests cover schemas, cue parsing, frame rounding, cache invalidation, asset policy, stage freshness, and worker protocol validation.
- Integration tests use fakes and require no network, model download, GPU, or FFmpeg.
- A real smoke test renders the tscircuit board example with Manim and the selected local narration.
- The board source passes tscircuit netlist and placement checks.
- The final MP4 contains H.264 video and AAC audio at the configured dimensions and frame rate.
- Captions remain inside safe bounds in sampled frames.
- Visual-only changes reuse narration; narration or voice changes invalidate it.
- Interrupted builds resume without rerunning fresh stages.
- No upload/publishing code or code-diff animation exists.
- Documentation clearly separates the generic framework from the board example and lists honest limitations.

## Engineering rules

- Use Bun exclusively for TypeScript tasks.
- Prefer explicit versioned protocols across TypeScript/Python boundaries.
- Validate all external worker responses; never trust partial JSON or a zero exit code alone.
- Write caches atomically and tolerate interrupted or corrupt entries.
- Keep generated media, model weights, local environments, and render caches out of Git.
- Preserve a small public surface. Do not create speculative tools before a real example requires them.
- Do not claim an adapter is implemented when only its interface exists.

Start by producing a short architecture note and file plan, then implement the smallest vertical slice that validates one scene, synthesizes/aligned narration through fakes, compiles its timeline, and prepares a Manim request. Expand from that working slice until the board example passes every acceptance criterion.
