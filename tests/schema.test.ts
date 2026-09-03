import { expect, test } from "bun:test"
import { resolveVisualContinuations, videoProjectSchema, workerResponseSchema } from "@script-video/schema"

const base = { settings: { width: 1080, height: 1920, fps: 30 }, voice: { provider: "fake", voice: "v" }, scenes: [{ id: "a", narration: "hello", visuals: [] }] }
test("rejects unknown visual types", () => expect(() => videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ type: "sparkles" }] }] })).toThrow())
test("rejects network media", () => expect(() => videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ type: "media.image", source: "https://example.com/a.png" }] }] })).toThrow())
test("validates worker protocol", () => expect(() => workerResponseSchema.parse({ protocolVersion: 2, requestId: "x", ok: true, outputs: [] })).toThrow())
test("accepts a constrained Manim prompt", () => expect(videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ type: "prompt", prompt: "Animate authored code becoming a board", preset: "code-to-board" }] }] }).scenes[0]?.visuals[0]?.type).toBe("prompt"))
test("accepts a workflow illustration", () => expect(videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ type: "illustration.workflow", variant: "source-to-hardware" }] }] }).scenes[0]?.visuals[0]?.type).toBe("illustration.workflow"))
test("continues the previous non-caption visualization", () => {
  const project = videoProjectSchema.parse({ ...base, scenes: [
    { id: "first", narration: "hello", visuals: [{ type: "text", text: "Board", at: { seconds: 0.2 }, durationSeconds: 1 }, { type: "captions" }] },
    { id: "second", narration: "again", visuals: [{ type: "visual.continue" }, { type: "captions" }] },
  ] })
  const resolved = resolveVisualContinuations(project)
  expect(resolved.scenes[1]?.visuals).toEqual([{ type: "text", text: "Board", role: "body", at: undefined, durationSeconds: undefined }, { type: "captions" }])
})
test("rejects continuing without a previous visualization", () => expect(() => videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ type: "visual.continue" }] }] })).toThrow("requires an earlier"))
test("rejects mixing a continuation with a replacement", () => expect(() => videoProjectSchema.parse({ ...base, scenes: [
  { id: "first", narration: "hello", visuals: [{ type: "text", text: "First" }] },
  { id: "second", narration: "again", visuals: [{ type: "visual.continue" }, { type: "text", text: "Second" }] },
] })).toThrow("cannot be mixed"))
test("accepts a VHS-captured Neovim session", () => expect(videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ id: "edit", type: "editor.session", source: "./board.circuit.tsx", initialCode: "return (\n)", code: "return (\n  <board />\n)", capture: { driver: "vhs", tape: "./editor/edit.tape", initialSource: "./editor/before.tsx", resultSource: "./.video/editor/result.tsx", inputs: ["./editor/nvim.lua"] }, preview: { source: "./board.circuit.tsx", view: "pcb" } }] }] }).scenes[0]?.visuals[0]?.type).toBe("editor.session"))
test("accepts a VHS-captured terminal session", () => expect(videoProjectSchema.parse({ ...base, scenes: [{ ...base.scenes[0], visuals: [{ id: "cli-help", type: "terminal.session", capture: { driver: "vhs", tape: "./terminal/cli-help.tape", inputs: [] } }] }] }).scenes[0]?.visuals[0]?.type).toBe("terminal.session"))
