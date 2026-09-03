import { mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { parseNarration } from "@script-video/compiler"
import { PROTOCOL_VERSION, alignedWordSchema, workerResponseSchema, type AlignedWord } from "@script-video/schema"

export interface SynthesisRequest { requestId: string; text: string; voice: string; sampleRate: number; outputPath: string }
export interface SynthesisResult { audioPath: string; words: AlignedWord[]; durationSeconds: number; providerVersion: string }
export interface VoiceProvider { readonly id: string; readonly version: string; synthesize(request: SynthesisRequest): Promise<SynthesisResult> }

function wavSilence(seconds: number, sampleRate: number): Uint8Array {
  const samples = Math.ceil(seconds * sampleRate)
  const dataSize = samples * 2
  const bytes = new Uint8Array(44 + dataSize)
  const view = new DataView(bytes.buffer)
  const label = (offset: number, value: string) => [...value].forEach((char, i) => bytes[offset + i] = char.charCodeAt(0))
  label(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); label(8, "WAVEfmt ")
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  label(36, "data"); view.setUint32(40, dataSize, true)
  return bytes
}

/** Deterministic offline provider for tests and pipeline development. */
export class FakeVoiceProvider implements VoiceProvider {
  readonly id = "fake"
  readonly version = "fake-1"
  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    const text = parseNarration(request.text).plainText
    const tokens = text.match(/\S+/g) ?? []
    const wordSeconds = 0.32
    const words = tokens.map((word, index) => ({ word, startSeconds: index * wordSeconds, endSeconds: (index + 1) * wordSeconds }))
    const durationSeconds = Math.max(wordSeconds, words.at(-1)?.endSeconds ?? 0)
    await mkdir(dirname(request.outputPath), { recursive: true })
    await writeFile(request.outputPath, wavSilence(durationSeconds, request.sampleRate))
    return { audioPath: request.outputPath, words, durationSeconds, providerVersion: this.version }
  }
}

export class ChatterboxVoiceProvider implements VoiceProvider {
  readonly id = "chatterbox"
  readonly version = "chatterbox-jsonl-2"
  constructor(private readonly command = process.env.CHATTERBOX_WORKER ?? new URL("../../../scripts/chatterbox-local", import.meta.url).pathname, private readonly worker = new URL("../../../workers/chatterbox/worker.py", import.meta.url).pathname) {}
  async synthesize(request: SynthesisRequest): Promise<SynthesisResult> {
    const args = this.command === "python3" ? [this.worker] : []
    const proc = Bun.spawn([this.command, ...args], { stdin: "pipe", stdout: "pipe", stderr: "pipe" })
    proc.stdin.write(JSON.stringify({ protocolVersion: PROTOCOL_VERSION, operation: "synthesize", ...request }) + "\n")
    proc.stdin.end()
    const [stdout, stderr, exitCode] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
    if (exitCode !== 0) throw new Error(`Chatterbox worker failed: ${stderr.trim()}`)
    const line = stdout.trim().split("\n").at(-1)
    if (!line) throw new Error("Chatterbox worker returned no response")
    const envelope = workerResponseSchema.parse(JSON.parse(line))
    if (!envelope.ok) throw new Error(envelope.error)
    const metadata = envelope.metadata
    const words = alignedWordSchema.array().parse(metadata.words)
    const durationSeconds = Number(metadata.durationSeconds)
    if (!Number.isFinite(durationSeconds)) throw new Error("Chatterbox response lacks a valid duration")
    return { audioPath: envelope.outputs[0]!, words, durationSeconds, providerVersion: String(metadata.providerVersion ?? this.version) }
  }
}
