import { defineVideo } from "@script-video/core"
import project4k from "./video.ts"

export default defineVideo({
  ...project4k,
  settings: {
    ...project4k.settings,
    width: 1080,
    height: 1920,
    safeMargin: 96,
  },
})
