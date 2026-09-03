import type { VideoProject } from "@script-video/schema"

/** Identity helper providing contextual typing. Runtime validation happens before every build. */
export function defineVideo<const T extends VideoProject>(project: T): T {
  return project
}

export type { VideoProject, Visual } from "@script-video/schema"
