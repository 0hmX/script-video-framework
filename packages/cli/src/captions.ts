import type { CaptionCue } from "@script-video/compiler"

const srtTime = (seconds: number) => {
  const ms = Math.round(seconds * 1000); const h = Math.floor(ms / 3600000); const m = Math.floor(ms / 60000) % 60; const s = Math.floor(ms / 1000) % 60
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")},${String(ms % 1000).padStart(3,"0")}`
}
const vttTime = (seconds: number) => srtTime(seconds).replace(",", ".")
export const toSrt = (cues: CaptionCue[]) => cues.map(c => `${c.index}\n${srtTime(c.startSeconds)} --> ${srtTime(c.endSeconds)}\n${c.text}\n`).join("\n")
export const toVtt = (cues: CaptionCue[]) => `WEBVTT\n\n${cues.map(c => `${vttTime(c.startSeconds)} --> ${vttTime(c.endSeconds)}\n${c.text}\n`).join("\n")}`
