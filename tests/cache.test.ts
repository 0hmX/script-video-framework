import { afterEach, expect, test } from "bun:test"
import { mkdtemp, rm, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { resolve } from "node:path"
import { contentKey, StageCache } from "@script-video/cli/src/cache.ts"

let dir = ""; afterEach(async () => { if (dir) await rm(dir, { recursive: true, force: true }) })
test("stable keys ignore object insertion order", () => expect(contentKey("v", { a: 1, b: 2 })).toBe(contentKey("v", { b: 2, a: 1 })))
test("freshness requires every output", async () => {
  dir = await mkdtemp(resolve(tmpdir(), "video-cache-")); const output = resolve(dir, "out"); await writeFile(output, "x")
  const cache = new StageCache(dir); await cache.write("one", "key", {}, [output]); expect(await cache.fresh("one", "key")).toBeTruthy()
  await unlink(output); expect(await cache.fresh("one", "key")).toBeUndefined()
})
