# Limitations

- Kokoro 0.9.4 supports American English narration at 24 kHz in this adapter. The default voice is `af_heart`; `narrator` maps to it. Native model timestamps are mapped back to source words, with an explicit failure if a spoken word has no timing. This is model-derived timing, not a separate acoustic forced aligner.
- Manim, FFmpeg, and tscircuit are external local tools. `video doctor` reports them; integration tests do not install them.
- The initial Manim vocabulary is deliberately small: text, VHS-captured Neovim editing sessions, TSX typewriter code, captions, images, tscircuit exports, lines, arrows, and measurement lines. Editor sessions record real Neovim keystrokes against a sandboxed source copy, require declared starting and final buffers, and are not a code-diff system.
- `prompt` visuals generate real Manim motion from a reviewed, versioned preset. The prompt records author intent, while the preset constrains execution to schema-validated internal geometry; no model-generated Python or raster asset is loaded. The first preset is `code-to-board`.
- Rendering uses Geist when installed, with Arial and the system sans-serif selected by Pango as documented fallbacks.
- The board example can only complete a real smoke render on a machine with all runtime dependencies and a configured local voice.
