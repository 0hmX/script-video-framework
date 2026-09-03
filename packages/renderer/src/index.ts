import { PROTOCOL_VERSION, renderRequestSchema, type CompiledScene, type RenderRequest, type ResolvedVideoProject } from "@script-video/schema"

export function prepareRenderRequest(project: ResolvedVideoProject, scenes: CompiledScene[], assets: Record<string, string>, output: string, requestId: string): RenderRequest {
  const request = { protocolVersion: PROTOCOL_VERSION, requestId, operation: "render" as const, output, settings: project.settings, scenes, assets }
  return renderRequestSchema.parse(request)
}
