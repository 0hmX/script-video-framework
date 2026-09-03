import { expect, test } from "bun:test"
import { resolve } from "node:path"

test.skipIf(process.env.RUN_REAL_SMOKE !== "1")("board passes tscircuit checks", async () => {
  const source = resolve(import.meta.dir, "../examples/board/board.circuit.tsx")
  for (const check of ["netlist", "schematic-placement", "placement"]) {
    const proc = Bun.spawn(["tsci", "check", check, source], { cwd: resolve(import.meta.dir, "../examples/board"), stdout: "inherit", stderr: "inherit" })
    expect(await proc.exited).toBe(0)
  }
}, 120_000)
