import { z } from "zod"

export const PROTOCOL_VERSION = 1 as const

const localPath = z.string().min(1).refine((value) => !/^(?:https?|data):/i.test(value), "network and data URLs are forbidden")
const cueAt = z.object({ cue: z.string().min(1), offsetSeconds: z.number().finite().optional() }).strict()
const secondsAt = z.object({ seconds: z.number().nonnegative() }).strict()
export const visualAtSchema = z.union([cueAt, secondsAt]).optional()

const visualBase = { id: z.string().min(1).optional(), at: visualAtSchema, durationSeconds: z.number().positive().optional() }
const editorSessionSchema = z.object({
  ...visualBase,
  id: z.string().min(1),
  type: z.literal("editor.session"),
  editor: z.literal("nvim").default("nvim"),
  source: localPath,
  displayPath: z.string().min(1).optional(),
  initialCode: z.string(),
  code: z.string().min(1),
  capture: z.object({
    driver: z.literal("vhs"),
    tape: localPath,
    initialSource: localPath,
    resultSource: localPath,
    inputs: z.array(localPath).default([]),
  }).strict(),
  preview: z.object({ source: localPath, view: z.enum(["pcb", "schematic", "3d"]).default("pcb") }).strict(),
}).strict()
const terminalSessionSchema = z.object({
  ...visualBase,
  id: z.string().min(1),
  type: z.literal("terminal.session"),
  capture: z.object({
    driver: z.literal("vhs"),
    tape: localPath,
    inputs: z.array(localPath).default([]),
  }).strict(),
}).strict()
export const visualSchema = z.discriminatedUnion("type", [
  z.object({ ...visualBase, type: z.literal("text"), text: z.string(), x: z.number().optional(), y: z.number().optional(), role: z.enum(["title", "body", "secondary"]).default("body") }).strict(),
  z.object({ ...visualBase, type: z.literal("code.typewriter"), code: z.string().min(1), language: z.literal("tsx").default("tsx"), typingSeconds: z.number().positive().default(3), x: z.number().optional(), y: z.number().optional() }).strict(),
  editorSessionSchema,
  terminalSessionSchema,
  z.object({ ...visualBase, type: z.literal("captions") }).strict(),
  z.object({ ...visualBase, type: z.literal("media.image"), source: localPath, fit: z.enum(["contain", "cover"]).default("contain") }).strict(),
  z.object({ ...visualBase, type: z.literal("prompt"), prompt: z.string().min(12), preset: z.literal("code-to-board") }).strict(),
  z.object({ ...visualBase, type: z.literal("tscircuit.board"), source: localPath, view: z.enum(["pcb", "schematic", "3d"]) }).strict(),
  z.object({ ...visualBase, type: z.literal("geometry.line"), from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) }).strict(),
  z.object({ ...visualBase, type: z.literal("geometry.arrow"), from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]) }).strict(),
  z.object({ ...visualBase, type: z.literal("geometry.measurement"), from: z.tuple([z.number(), z.number()]), to: z.tuple([z.number(), z.number()]), label: z.string() }).strict(),
])

export const videoProjectSchema = z.object({
  title: z.string().min(1).optional(),
  settings: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().int().positive(), safeMargin: z.number().int().nonnegative().default(72) }).strict(),
  voice: z.object({ provider: z.string().min(1), voice: z.string().min(1), sampleRate: z.number().int().positive().default(24000) }).strict(),
  scenes: z.array(z.object({ id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/), narration: z.string(), visuals: z.array(visualSchema) }).strict()).min(1),
}).strict().superRefine((value, ctx) => {
  const ids = new Set<string>()
  for (const [index, scene] of value.scenes.entries()) {
    if (ids.has(scene.id)) ctx.addIssue({ code: "custom", path: ["scenes", index, "id"], message: "scene id must be unique" })
    ids.add(scene.id)
  }
})

export type VideoProject = z.input<typeof videoProjectSchema>
export type ResolvedVideoProject = z.output<typeof videoProjectSchema>
export type Visual = z.output<typeof visualSchema>

export const alignedWordSchema = z.object({ word: z.string(), startSeconds: z.number().nonnegative(), endSeconds: z.number().nonnegative() }).strict().refine(v => v.endSeconds >= v.startSeconds, "word end must follow start")
export type AlignedWord = z.infer<typeof alignedWordSchema>

export const compiledSceneSchema = z.object({
  id: z.string(), durationSeconds: z.number().nonnegative(), durationFrames: z.number().int().nonnegative(),
  words: z.array(alignedWordSchema), cues: z.record(z.string(), z.object({ seconds: z.number().nonnegative(), frame: z.number().int().nonnegative() }).strict()),
  visuals: z.array(z.object({ visual: visualSchema, startSeconds: z.number().nonnegative(), startFrame: z.number().int().nonnegative(), durationFrames: z.number().int().positive() }).strict()),
}).strict()
export type CompiledScene = z.infer<typeof compiledSceneSchema>

export const renderRequestSchema = z.object({
  protocolVersion: z.literal(PROTOCOL_VERSION), requestId: z.string(), operation: z.literal("render"), output: localPath,
  settings: z.object({ width: z.number().int().positive(), height: z.number().int().positive(), fps: z.number().int().positive(), safeMargin: z.number().int().nonnegative() }).strict(),
  scenes: z.array(compiledSceneSchema), assets: z.record(z.string(), localPath),
}).strict()
export type RenderRequest = z.infer<typeof renderRequestSchema>

export const workerResponseSchema = z.discriminatedUnion("ok", [
  z.object({ protocolVersion: z.literal(PROTOCOL_VERSION), requestId: z.string(), ok: z.literal(true), outputs: z.array(localPath), metadata: z.record(z.string(), z.unknown()).default({}) }).strict(),
  z.object({ protocolVersion: z.literal(PROTOCOL_VERSION), requestId: z.string(), ok: z.literal(false), error: z.string().min(1) }).strict(),
])
export type WorkerResponse = z.infer<typeof workerResponseSchema>

export const stageRecordSchema = z.object({ version: z.literal(1), stage: z.string(), key: z.string(), dependencyKeys: z.record(z.string(), z.string()), outputs: z.array(z.string()), completedAt: z.string().datetime(), metadata: z.record(z.string(), z.unknown()) }).strict()
export type StageRecord = z.infer<typeof stageRecordSchema>

export const buildManifestSchema = z.object({ version: z.literal(1), project: z.string(), createdAt: z.string().datetime(), stages: z.array(stageRecordSchema), outputs: z.record(z.string(), z.object({ path: z.string(), sha256: z.string() }).strict()) }).strict()
