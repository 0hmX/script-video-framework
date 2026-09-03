# Limitations

- Chatterbox is isolated behind a JSONL worker. `scripts/install-local-runtimes.zsh` explicitly installs code and verified model weights under ignored local directories; builds never download them.
- Chatterbox does not expose word timestamps, so the bundled runner performs acoustic word-level forced alignment with torchaudio's local MMS alignment model. The first vocabulary is English letters and apostrophes; unsupported authored tokens fail explicitly. The deterministic fake provider is used by offline tests.
- On platforms where Chatterbox's optional native Perth watermark implementation is unavailable, the local runner uses Perth's packaged dummy watermarker so synthesis remains functional; it does not claim the output is watermarked.
- Manim, FFmpeg, and tscircuit are external local tools. `video doctor` reports them; integration tests do not install them.
- The initial Manim vocabulary is deliberately small: text, VHS-captured Neovim editing sessions, TSX typewriter code, captions, images, tscircuit exports, lines, arrows, and measurement lines. Editor sessions record real Neovim keystrokes against a sandboxed source copy, require declared starting and final buffers, and are not a code-diff system.
- `prompt` visuals generate real Manim motion from a reviewed, versioned preset. The prompt records author intent, while the preset constrains execution to schema-validated internal geometry; no model-generated Python or raster asset is loaded. The first preset is `code-to-board`.
- Rendering uses Geist when installed, with Arial and the system sans-serif selected by Pango as documented fallbacks.
- The board example can only complete a real smoke render on a machine with all runtime dependencies and a configured local voice.
