import { readFileSync } from "node:fs"
import { defineVideo, type VideoProject, type Visual } from "@script-video/core"

const scriptPath = new URL(
  "../../docs/series/tscircuit-for-kicad-people/episode-01-cli-and-project-setup.md",
  import.meta.url,
)
const markdown = readFileSync(scriptPath, "utf8")
const spokenDigits = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]

const chapterIds: Record<string, string> = {
  "00:00": "opening",
  "03:30": "mental-model",
  "09:00": "what-we-install",
  "13:00": "install-bun",
  "19:00": "install-cli",
  "25:00": "read-cli-command",
  "29:00": "cli-map",
  "43:00": "ai-sidebar",
  "46:00": "initialize-project",
  "52:00": "inspect-project",
  "60:00": "verify-project",
}

function cleanNarration(section: string): string {
  return section
    .replace(/### Host checkpoint[\s\S]*?(?=\n### |\n---|$)/g, " ")
    .replace(/^### Narration\s*$/gm, " ")
    .replace(/^---\s*$/gm, " ")
    .replace(/[↓→]/g, " to ")
    .replace(/·/g, ", ")
    .replace(/&&/g, " and then ")
    .replace(/\|/g, " pipe to ")
    .replace(/```[^\n]*\n([\s\S]*?)```/g, (_, code: string) =>
      code
        .split("\n")
        .map(line => line.trim().replace(/^\$\s*/, ""))
        .filter(Boolean)
        .join(". "),
    )
    .replace(/^\|.*$/gm, " ")
    .replace(/^>.*$/gm, " ")
    .replace(/^#{1,6}\s+(.+)$/gm, "$1.")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\d/g, digit => ` ${spokenDigits[Number(digit)]} `)
    .replace(/(^|\s)[^A-Za-z']+(?=\s|$)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function textVisuals(title: string): Visual[] {
  return [
    { type: "text", text: title, role: "title" },
    { type: "text", text: "tscircuit for KiCad People  •  Episode 1", role: "secondary", y: 0.65 },
    { type: "captions" },
  ]
}

function terminalVisual(id: string, tape: string, inputs: string[] = []): Visual[] {
  return [
    { id, type: "terminal.session", capture: { driver: "vhs", tape, inputs } },
    { type: "captions" },
  ]
}

const chapterPattern = /^## (\d{2}:\d{2}) — (.+)$/gm
const matches = [...markdown.matchAll(chapterPattern)]
const terminalChapters: Record<string, Visual[]> = {
  "install-cli": terminalVisual("install-diagnostics", "./terminal/install-and-diagnose.tape"),
  "cli-map": terminalVisual("cli-command-map", "./terminal/cli-map.tape"),
  "initialize-project": terminalVisual("initialize-project", "./terminal/init-project.tape"),
  "inspect-project": terminalVisual("inspect-starter-files", "./terminal/inspect-project.tape", [
    "./fixture/index.circuit.tsx",
    "./fixture/package.json",
    "./fixture/tsconfig.json",
    "./fixture/tscircuit.config.json",
  ]),
}

interface Chapter {
  id: string
  title: string
  body: string
}

function splitCliMap(chapter: Chapter): Chapter[] {
  if (chapter.id !== "cli-map") return [chapter]

  const headingPattern = /^### (Group \d+: .+|End-of-map reminder)$/gm
  const headings = [...chapter.body.matchAll(headingPattern)]
  const overviewEnd = headings[0]?.index ?? chapter.body.length
  const result: Chapter[] = [
    {
      id: "cli-map-overview",
      title: "The complete CLI map",
      body: chapter.body.slice(0, overviewEnd),
    },
  ]

  headings.forEach((heading, index) => {
    const headingText = heading[1]!
    const start = heading.index! + heading[0].length
    const end = headings[index + 1]?.index ?? chapter.body.length
    const groupMatch = headingText.match(/^Group (\d+): (.+)$/)
    result.push({
      id: groupMatch ? `cli-group-${groupMatch[1]}` : "cli-map-reminder",
      title: groupMatch ? groupMatch[2]! : "Use help, not memory",
      body: chapter.body.slice(start, end),
    })
  })

  return result
}

const chapters: Chapter[] = matches.map((match, index) => {
  const timestamp = match[1]!
  const title = match[2]!.trim()
  const id = chapterIds[timestamp]
  if (!id) throw new Error(`No scene id for chapter ${timestamp}`)
  const start = match.index! + match[0].length
  const end = matches[index + 1]?.index ?? markdown.indexOf("\n## Review checklist", start)
  return { id, title, body: markdown.slice(start, end < 0 ? markdown.length : end) }
})

const scenes: VideoProject["scenes"] = chapters.flatMap(splitCliMap).map(chapter => {
  const narration = cleanNarration(chapter.body)
  const visuals =
    chapter.id === "cli-map-overview"
      ? terminalChapters["cli-map"]!
      : terminalChapters[chapter.id] ?? textVisuals(chapter.title)
  if (!narration) throw new Error(`Chapter ${chapter.id} has no narration`)
  return { id: chapter.id, narration, visuals }
})

export default defineVideo({
  title: "tscircuit for KiCad People — Episode 1",
  settings: { width: 1920, height: 1080, fps: 30, safeMargin: 96 },
  voice: { provider: "chatterbox", voice: "narrator", sampleRate: 24000 },
  scenes,
})
