# Architecture

The framework is a resumable directed build graph. Authored TypeScript is loaded once and immediately converted to a schema-validated, serializable value. Unknown visual types and unsafe paths fail before narration or rendering.

## Package plan

- `schema`: authored plans, timelines, worker messages, stage records, and manifests.
- `core`: the intentionally tiny public `defineVideo` API.
- `compiler`: cue parsing, aligned-word mapping, captions, and frame-exact timelines.
- `audio`: provider contract, per-scene content keys, fake provider, and Chatterbox worker adapter.
- `assets`: checked-in-local asset policy and verified `tsci` adapter.
- `renderer`: converts timelines plus assets into renderer-independent render plans.
- `renderer-manim`: validates the JSONL protocol and owns the Manim subprocess.
- `cli`: non-interactive commands, immutable stage cache, graph orchestration, muxing, captions, and manifests.
- `workers`: isolated Python implementation details for Manim and Chatterbox.
- `examples/board`: the first real tscircuit-backed authored project.

Dependencies point inward toward `schema`; `compiler` knows nothing about Manim or tscircuit. Python receives data only and never authored or model-generated code. Each cache record contains a versioned key, dependency keys, outputs, and completion metadata; a record is fresh only when its key matches and all outputs still exist.

## Build graph

`validate → voice → align/timeline → assets → prepare → render → mux/captions → manifest`

Narration keys include only narration, voice configuration, provider version, and audio settings. Visual edits therefore do not invalidate voice artifacts.

Prompt visuals pair author intent with a reviewed versioned Manim preset. The worker executes only its internal geometry implementation, never prompt-generated Python.
