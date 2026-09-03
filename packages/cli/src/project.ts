import { access } from "node:fs/promises"
import { dirname, isAbsolute, resolve } from "node:path"
import { resolveVisualContinuations, videoProjectSchema, type ResolvedVideoProject } from "@script-video/schema"

export interface LoadedProject { project: ResolvedVideoProject; projectFile: string; projectDir: string }

export async function loadProject(input: string): Promise<LoadedProject> {
  const projectFile = isAbsolute(input) ? input : resolve(process.cwd(), input)
  await access(projectFile)
  const imported = await import(`${Bun.pathToFileURL(projectFile).href}?build=${Date.now()}`)
  const project = resolveVisualContinuations(videoProjectSchema.parse(imported.default))
  return { project, projectFile, projectDir: dirname(projectFile) }
}
