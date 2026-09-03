#!/usr/bin/env bun
import { access, readFile } from "node:fs/promises"
import { resolve } from "node:path"
import { ZodError } from "zod"
import { parseNarration } from "@script-video/compiler"
import { contentKey, StageCache } from "./cache.ts"
import { buildVideo } from "./pipeline.ts"
import { loadProject } from "./project.ts"

type JsonValue = Record<string, unknown>
const argv = process.argv.slice(2)
const json = argv.includes("--json")
const force = argv.includes("--force")
const fakeVoice = argv.includes("--fake-voice")
const unknownFlags = argv.filter(arg => arg.startsWith("--") && !["--json", "--force", "--fake-voice"].includes(arg))
const args = argv.filter(arg => !arg.startsWith("--"))
const command = args[0]
const projectArg = args[1]

function output(value: JsonValue, human: string) { console.log(json ? JSON.stringify(value) : human) }
function usage(): never {
  console.error("Usage: video <validate|voice|preview|render|inspect|doctor> [project] [--json] [--force] [--fake-voice]")
  process.exit(2)
}

async function commandExists(command: string, args = ["--version"]) {
  try {
    const proc = Bun.spawn([command, ...args], { stdout: "pipe", stderr: "pipe" })
    const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
    return { available: code === 0, version: (stdout || stderr).trim().split("\n")[0] ?? "" }
  } catch { return { available: false, version: "" } }
}

async function doctor() {
  const localPython = resolve(import.meta.dir, "../../../.venv/bin/python")
  const localTools = resolve(import.meta.dir, "../../../.tools/bin")
  const checks = {
    bun: await commandExists("bun"), python: await commandExists(localPython), manim: await commandExists(localPython, ["-m", "manim", "--version"]),
    ffmpeg: await commandExists("ffmpeg", ["-version"]), tsci: await commandExists("tsci"),
    vhs: await commandExists(resolve(localTools, "vhs")), nvim: await commandExists(resolve(localTools, "nvim")), ttyd: await commandExists(resolve(localTools, "ttyd")),
    geist: { available: await Bun.file("/Library/Fonts/Geist-Regular.otf").exists() || await Bun.file(`${process.env.HOME}/Library/Fonts/Geist-Regular.otf`).exists(), version: "" },
    chatterbox: { available: (await Promise.all(["ve.safetensors", "t3_cfg.safetensors", "s3gen.safetensors", "tokenizer.json", "conds.pt"].map(name => Bun.file(resolve(import.meta.dir, `../../../.models/chatterbox/${name}`)).exists()).concat([Bun.file(resolve(import.meta.dir, "../../../.models/torch/hub/checkpoints/model.pt")).exists()]))).every(Boolean), version: await Bun.file(resolve(import.meta.dir, "../../../.venv-chatterbox/bin/python")).exists() ? "chatterbox-tts 0.1.7 + torchaudio MMS alignment" : "not installed" },
  }
  const ok = checks.bun.available && checks.python.available && checks.manim.available && checks.ffmpeg.available && checks.tsci.available && checks.vhs.available && checks.nvim.available && checks.ttyd.available && checks.chatterbox.available
  output({ ok, checks }, Object.entries(checks).map(([name, result]) => `${result.available ? "✓" : "✗"} ${name}${result.version ? ` — ${result.version}` : ""}`).join("\n"))
  if (!ok) process.exitCode = 1
}

async function inspect(projectPath: string) {
  const loaded = await loadProject(projectPath)
  const cache = new StageCache(resolve(loaded.projectDir, ".video"))
  const scenes = await Promise.all(loaded.project.scenes.map(async scene => {
    const parsed = parseNarration(scene.narration)
    const voiceKey = contentKey("voice-1", { text: parsed.plainText, voice: loaded.project.voice, provider: fakeVoice ? "fake" : "chatterbox", providerVersion: fakeVoice ? "fake-1" : "chatterbox-jsonl-2" })
    const record = await cache.read(`voice-${scene.id}`)
    return { id: scene.id, cues: parsed.cues.map(c => c.name), narration: parsed.plainText, voiceKey, voiceFresh: record?.key === voiceKey && await Promise.all(record.outputs.map(path => Bun.file(path).exists())).then(v => v.every(Boolean)) }
  }))
  let manifest: unknown
  try { manifest = JSON.parse(await readFile(resolve(loaded.projectDir, ".video/manifest.json"), "utf8")) } catch { manifest = null }
  output({ ok: true, project: loaded.projectFile, scenes, manifest }, `${loaded.project.title ?? loaded.projectFile}\n${scenes.map(s => `- ${s.id}: cues [${s.cues.join(", ")}], voice ${s.voiceFresh ? "fresh" : "stale"}`).join("\n")}`)
}

async function main() {
  if (unknownFlags.length) usage()
  if (!command) usage()
  if (command === "doctor") { if (projectArg) usage(); return doctor() }
  if (!["validate", "voice", "preview", "render", "inspect"].includes(command) || !projectArg || args.length !== 2) usage()
  const loaded = await loadProject(projectArg)
  if (command === "validate") return output({ ok: true, project: loaded.projectFile, scenes: loaded.project.scenes.length }, `Valid: ${loaded.projectFile} (${loaded.project.scenes.length} scenes)`)
  if (command === "inspect") return inspect(projectArg)
  const result = await buildVideo(loaded, { render: command === "render" || command === "preview", voiceOnly: command === "voice", fakeVoice, force })
  output({ ok: true, command, ...result }, result.video ? `Built ${result.video}` : `Prepared ${result.manifest}`)
}

try { await main() } catch (error) {
  const message = error instanceof ZodError ? error.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join("\n") : error instanceof Error ? error.message : String(error)
  console.error(json ? JSON.stringify({ ok: false, error: message }) : `Error: ${message}`)
  process.exitCode = 1
}
