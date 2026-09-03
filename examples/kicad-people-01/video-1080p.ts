import { defineVideo } from "@script-video/core"
import project4k from "./video.ts"

export default defineVideo({
  ...project4k,
  settings: {
    ...project4k.settings,
    width: 1920,
    height: 1080,
    safeMargin: 96,
  },
})
