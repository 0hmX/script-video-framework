import { access, mkdir, readdir, stat } from "node:fs/promises"
import { dirname, isAbsolute, relative, resolve } from "node:path"
import type { Visual } from "@script-video/schema"

export function resolveLocalInput(projectDir: string, source: string): string {
  if (/^(?:https?|data):/i.test(source)) throw new Error(`Network media is forbidden: ${source}`)
  const absolute = resolve(projectDir, source)
  const rel = relative(projectDir, absolute)
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error(`Input escapes project directory: ${source}`)
  return absolute
}

async function run(command: string[], cwd: string): Promise<void> {
  const proc = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe" })
  const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
  if (code !== 0) throw new Error(`${command.join(" ")} failed\n${stdout}${stderr}`.trim())
}

async function findGenerated(dir: string, suffixes: string[]): Promise<string> {
  const entries = await readdir(dir, { recursive: true })
  const candidates = entries.map(String).filter(file => suffixes.some(suffix => file.toLowerCase().endsWith(suffix)))
  if (!candidates.length) throw new Error(`tsci produced no expected asset in ${dir}`)
  const detailed = await Promise.all(candidates.map(async file => ({ file: resolve(dir, file), mtime: (await stat(resolve(dir, file))).mtimeMs })))
  return detailed.sort((a, b) => b.mtime - a.mtime)[0]!.file
}

async function findPackageRoot(start: string): Promise<string> {
  let current = resolve(start)
  while (true) {
    try { await access(resolve(current, "package.json")); return current } catch {}
    const parent = dirname(current)
    if (parent === current) return start
    current = parent
  }
}

export async function buildTscircuitAsset(projectDir: string, visual: Extract<Visual, { type: "tscircuit.board" }>): Promise<string> {
  const source = resolveLocalInput(projectDir, visual.source)
  await access(source)
  await run(["tsci", "check", "netlist", source], projectDir)
  await run(["tsci", "check", "schematic-placement", source], projectDir)
  await run(["tsci", "check", "placement", source], projectDir)
  const flag = visual.view === "pcb" ? "--pcb-png" : visual.view === "schematic" ? "--schematic-png" : "--3d-png"
  await run(["tsci", "build", source, flag], projectDir)
  const dist = resolve(await findPackageRoot(dirname(source)), "dist")
  await mkdir(dist, { recursive: true })
  const hints = visual.view === "pcb" ? [".pcb.png", "pcb.png"] : visual.view === "schematic" ? [".schematic.png", "schematic.png"] : [".3d.png", "3d.png"]
  return findGenerated(dist, hints)
}

export async function resolveVisualAsset(projectDir: string, visual: Visual): Promise<string | undefined> {
  if (visual.type === "media.image") {
    const path = resolveLocalInput(projectDir, visual.source)
    await access(path)
    return path
  }
  if (visual.type === "tscircuit.board") return buildTscircuitAsset(projectDir, visual)
}
