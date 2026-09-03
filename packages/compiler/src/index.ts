import type { AlignedWord, CompiledScene, ResolvedVideoProject } from "@script-video/schema"

export interface ParsedNarration { plainText: string; cues: Array<{ name: string; characterOffset: number }> }

export function parseNarration(input: string): ParsedNarration {
  const cues: ParsedNarration["cues"] = []
  let plainText = ""
  let cursor = 0
  const pattern = /\{([a-zA-Z][a-zA-Z0-9_-]*)\}/g
  for (const match of input.matchAll(pattern)) {
    plainText += input.slice(cursor, match.index)
    cues.push({ name: match[1]!, characterOffset: plainText.length })
    cursor = match.index! + match[0].length
  }
  plainText += input.slice(cursor)
  const leftover = plainText.match(/[{}]/)
  if (leftover) throw new Error(`Malformed narration cue near character ${leftover.index}`)
  const names = new Set<string>()
  for (const cue of cues) {
    if (names.has(cue.name)) throw new Error(`Duplicate cue: ${cue.name}`)
    names.add(cue.name)
  }
  return { plainText: plainText.replace(/\s+/g, " ").trim(), cues }
}

export const secondsToFrame = (seconds: number, fps: number) => Math.max(0, Math.round(seconds * fps))

function cueTime(characterOffset: number, text: string, words: AlignedWord[], duration: number): number {
  const before = text.slice(0, characterOffset).trim().split(/\s+/).filter(Boolean).length
  if (before === 0) return 0
  return words[Math.min(before - 1, words.length - 1)]?.endSeconds ?? duration
}

export function compileScene(project: ResolvedVideoProject, sceneIndex: number, words: AlignedWord[]): CompiledScene {
  const scene = project.scenes[sceneIndex]
  if (!scene) throw new Error(`Unknown scene index ${sceneIndex}`)
  const parsed = parseNarration(scene.narration)
  const durationSeconds = words.at(-1)?.endSeconds ?? 0
  const durationFrames = Math.max(1, secondsToFrame(durationSeconds, project.settings.fps))
  const cues: CompiledScene["cues"] = {}
  for (const cue of parsed.cues) {
    const seconds = cueTime(cue.characterOffset, parsed.plainText, words, durationSeconds)
    cues[cue.name] = { seconds, frame: secondsToFrame(seconds, project.settings.fps) }
  }
  const visuals = scene.visuals.map((visual) => {
    let startSeconds = 0
    if (visual.at && "cue" in visual.at) {
      const cue = cues[visual.at.cue]
      if (!cue) throw new Error(`Scene ${scene.id} visual references unknown cue ${visual.at.cue}`)
      startSeconds = Math.max(0, cue.seconds + (visual.at.offsetSeconds ?? 0))
    } else if (visual.at && "seconds" in visual.at) startSeconds = visual.at.seconds
    if (startSeconds > durationSeconds && durationSeconds > 0) throw new Error(`Scene ${scene.id} visual begins after narration ends`)
    const remaining = Math.max(1, durationFrames - secondsToFrame(startSeconds, project.settings.fps))
    const requested = visual.durationSeconds ? Math.max(1, secondsToFrame(visual.durationSeconds, project.settings.fps)) : remaining
    return { visual, startSeconds, startFrame: secondsToFrame(startSeconds, project.settings.fps), durationFrames: Math.min(requested, remaining) }
  })
  return { id: scene.id, durationSeconds, durationFrames, words, cues, visuals }
}

export interface CaptionCue { index: number; startSeconds: number; endSeconds: number; text: string }
export function makeCaptions(words: AlignedWord[], maxWords = 7): CaptionCue[] {
  const result: CaptionCue[] = []
  for (let i = 0; i < words.length; i += maxWords) {
    const group = words.slice(i, i + maxWords)
    if (!group.length) continue
    result.push({ index: result.length + 1, startSeconds: group[0]!.startSeconds, endSeconds: group.at(-1)!.endSeconds, text: group.map(w => w.word).join(" ") })
  }
  return result
}
