import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { stageRecordSchema, type StageRecord } from "@script-video/schema"

export function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
  if (value && typeof value === "object") return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`).join(",")}}`
  return JSON.stringify(value)
}

export function contentKey(version: string, value: unknown): string {
  return new Bun.CryptoHasher("sha256").update(version).update("\0").update(stableJson(value)).digest("hex")
}

export class StageCache {
  constructor(readonly root: string) {}
  path(stage: string) { return resolve(this.root, "stages", `${stage}.json`) }
  async read(stage: string): Promise<StageRecord | undefined> {
    try { return stageRecordSchema.parse(JSON.parse(await readFile(this.path(stage), "utf8"))) } catch { return undefined }
  }
  async fresh(stage: string, key: string): Promise<StageRecord | undefined> {
    const record = await this.read(stage)
    if (!record || record.key !== key) return undefined
    try { await Promise.all(record.outputs.map(path => access(path))); return record } catch { return undefined }
  }
  async write(stage: string, key: string, dependencyKeys: Record<string, string>, outputs: string[], metadata: Record<string, unknown> = {}): Promise<StageRecord> {
    const record: StageRecord = { version: 1, stage, key, dependencyKeys, outputs, completedAt: new Date().toISOString(), metadata }
    const path = this.path(stage)
    await mkdir(dirname(path), { recursive: true })
    const temporary = `${path}.${crypto.randomUUID()}.tmp`
    await writeFile(temporary, JSON.stringify(record, null, 2) + "\n")
    await rename(temporary, path)
    return record
  }
}
