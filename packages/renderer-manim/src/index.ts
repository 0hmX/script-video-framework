import { access } from "node:fs/promises"
import { PROTOCOL_VERSION, renderRequestSchema, workerResponseSchema, type RenderRequest } from "@script-video/schema"

export class ManimRenderer {
  readonly version = "manim-jsonl-22"
  constructor(private readonly python = process.env.MANIM_PYTHON ?? new URL("../../../.venv/bin/python", import.meta.url).pathname, private readonly worker = new URL("../../../workers/manim/worker.py", import.meta.url).pathname) {}

  async render(input: RenderRequest): Promise<string> {
    const request = renderRequestSchema.parse(input)
    const proc = Bun.spawn([this.python, this.worker], { stdin: "pipe", stdout: "pipe", stderr: "pipe" })
    proc.stdin.write(JSON.stringify(request) + "\n")
    proc.stdin.end()
    const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
    if (code !== 0) throw new Error(`Manim worker failed: ${stderr.trim()}`)
    const line = stdout.trim().split("\n").at(-1)
    if (!line) throw new Error("Manim worker returned no response")
    const response = workerResponseSchema.parse(JSON.parse(line))
    if (response.protocolVersion !== PROTOCOL_VERSION || response.requestId !== request.requestId) throw new Error("Manim response does not match request")
    if (!response.ok) throw new Error(response.error)
    const output = response.outputs[0]
    if (!output) throw new Error("Manim worker declared no output")
    await access(output)
    return output
  }
}
