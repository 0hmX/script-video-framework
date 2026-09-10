# Script Video Framework

A deterministic, local-first TypeScript/Bun pipeline that turns declarative scripts into technical explainer videos. Manim is the sole animation engine; narration and rendering run behind versioned JSON-lines worker protocols.

## Quick start

```sh
bun install
bun run typecheck
bun test
bun run video validate examples/board/video.ts --json
bun run video inspect examples/board/video.ts
```

For a real render, install Python 3, Manim Community, FFmpeg, `tsci`, and a local Kokoro environment. VHS, Neovim, ttyd, and their capture dependencies are installed under `.tools/` by the local runtime installer; they do not modify the global PATH.

```sh
bun run video render examples/board/video.ts
```

```sh
./scripts/install-editor-capture-tools.zsh
```

To keep the preceding scene's visualization on screen while narration continues, use `visual.continue`. It carries forward the latest non-caption visual stack; captions remain specific to the new scene. An optional `at` or `durationSeconds` on the continuation replaces the previous timing.

```ts
{
  id: "explain-result",
  narration: "Stay on the generated board while we inspect it.",
  visuals: [{ type: "visual.continue" }, { type: "captions" }],
}
```

`video doctor` reports the exact local prerequisites. Builds never download media or prompt for input. See [ARCHITECTURE.md](./ARCHITECTURE.md) for package boundaries and [docs/limitations.md](./docs/limitations.md) for current limitations.

The implementation brief is preserved in [PROJECT_PROMPT.md](./PROJECT_PROMPT.md). This repository does not inherit from or depend on Eui.

## Campaigns

Campaign `1` is a [vertical, one-minute Shorts series](./campaigns/1/README.md) that teaches tscircuit by progressively building an RP2040 handheld board.



## Kokoro narration

Run `scripts/install-kokoro` (requires uv) to install the isolated CPU runtime and download weights. Use `voice: { provider: "kokoro", voice: "af_heart", sampleRate: 24000 }`. The legacy `narrator` voice maps to `af_heart`. Native timestamps drive cue alignment; no separate forced-alignment model is loaded. `scripts/kokoro-check` verifies offline readiness. Builds use cached weights with networking disabled for the model hub. Chatterbox synthesis is removed; old projects must select Kokoro before rerendering. Completed media is preserved.

Validation: `bun run typecheck`, `bun test`, and `python3 -m unittest discover -s workers/kokoro -p "test_*.py"`.
