# Capture synchronization

VHS playback starts with its scene; narration cues cannot trigger commands or keystrokes inside it. Design each tape and its narration together.

## Record

- Keep one coherent task per capture. One-sentence scenes and small tapes are preferred when they improve timing.
- Hide fixture setup, cleanup, environment variables, and prompt configuration.
- Show only commands a human would plausibly run, at readable typing and pause speeds.
- Use real build, check, test, or inspection output. Never fabricate evidence.
- Show source through normal editor navigation. Do not dump it with shell printing commands.
- Let a result remain visible long enough to understand before the next action.

The spoken order must match the visible order: name the action as it appears, explain it while it runs, then interpret the result while that result is visible. Do not discuss generated output before saving the edit that produces it.

## Fix and review

If timing fails, first shorten the narration; then split the scene and tape; then adjust natural VHS pauses. Move extra interpretation to a static result instead of filling dead time. `visual.continue` cannot extend a capture because it restarts playback.

Render with fake voice during iteration and watch at normal speed. Reject the scene if speech outruns the recording, the result arrives materially early or late, meaningful activity is cut off, or captions obscure important content.
