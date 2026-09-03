# tscircuit: Text to Hardware promo

A short vertical promo built entirely from verified tscircuit output and a real VHS-captured Neovim session.

The example circuit intentionally leaves board dimensions and PCB coordinates unspecified so tscircuit automatically packs the board around the components.

```sh
bun run video render examples/promo/video-1080p.ts
bun run video render examples/promo/video.ts
```
