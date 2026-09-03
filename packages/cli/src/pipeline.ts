import { access, copyFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { basename, resolve } from "node:path"
import { buildManifestSchema, compiledSceneSchema, renderRequestSchema, type AlignedWord, type StageRecord } from "@script-video/schema"
import { ChatterboxVoiceProvider, FakeVoiceProvider, type VoiceProvider } from "@script-video/audio"
import { compileScene, makeCaptions, parseNarration, type CaptionCue } from "@script-video/compiler"
import { resolveVisualAsset } from "@script-video/assets"
import { prepareRenderRequest } from "@script-video/renderer"
import { ManimRenderer } from "@script-video/renderer-manim"
import { contentKey, StageCache } from "./cache.ts"
import { toSrt, toVtt } from "./captions.ts"
import type { LoadedProject } from "./project.ts"

const PIPELINE_VERSION = "pipeline-1"
const jsonWrite = async (path: string, value: unknown) => { await mkdir(resolve(path, ".."), { recursive: true }); await writeFile(path, JSON.stringify(value, null, 2) + "\n") }

async function run(command: string[], cwd: string, env?: Record<string, string>) {
  const proc = Bun.spawn(command, { cwd, ...(env ? { env: { ...process.env, ...env } } : {}), stdout: "pipe", stderr: "pipe" })
  const [out, err, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited])
  if (code !== 0) throw new Error(`${command.join(" ")} failed\n${out}${err}`.trim())
}

async function runWithRetries(command: string[], cwd: string, env: Record<string, string>, attempts = 3) {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try { await run(command, cwd, env); return }
    catch (error) {
      lastError = error
      if (attempt < attempts) await Bun.sleep(350 * attempt)
    }
  }
  throw lastError
}

export interface BuildOptions { render?: boolean; fakeVoice?: boolean; force?: boolean; voiceOnly?: boolean }
export interface BuildResult { outputDir: string; video?: string; manifest: string; stages: StageRecord[] }

export async function buildVideo(loaded: LoadedProject, options: BuildOptions = {}): Promise<BuildResult> {
  const { project, projectDir, projectFile } = loaded
  const root = resolve(projectDir, ".video")
  const cache = new StageCache(root)
  const stageRecords: StageRecord[] = []
  await mkdir(root, { recursive: true })

  const validateKey = contentKey("validate-1", project)
  let record = !options.force ? await cache.fresh("validate", validateKey) : undefined
  const validatedPath = resolve(root, "validated-project.json")
  if (!record) { await jsonWrite(validatedPath, project); record = await cache.write("validate", validateKey, {}, [validatedPath]) }
  stageRecords.push(record)

  const provider: VoiceProvider = options.fakeVoice || process.env.VIDEO_FAKE_VOICE === "1" ? new FakeVoiceProvider() : new ChatterboxVoiceProvider()
  const sceneWords: AlignedWord[][] = []
  const audioPaths: string[] = []
  const voiceKeys: string[] = []
  for (const scene of project.scenes) {
    const parsed = parseNarration(scene.narration)
    const key = contentKey("voice-1", { text: parsed.plainText, voice: project.voice, provider: provider.id, providerVersion: provider.version })
    voiceKeys.push(key)
    const stage = `voice-${scene.id}`
    const audioPath = resolve(root, "audio", `${scene.id}.wav`)
    const alignmentPath = resolve(root, "audio", `${scene.id}.words.json`)
    let voiceRecord = !options.force ? await cache.fresh(stage, key) : undefined
    if (!voiceRecord) {
      const result = await provider.synthesize({ requestId: crypto.randomUUID(), text: parsed.plainText, voice: project.voice.voice, sampleRate: project.voice.sampleRate, outputPath: audioPath })
      await jsonWrite(alignmentPath, result.words)
      voiceRecord = await cache.write(stage, key, { validate: validateKey }, [result.audioPath, alignmentPath], { durationSeconds: result.durationSeconds, providerVersion: result.providerVersion })
    }
    sceneWords.push(JSON.parse(await readFile(alignmentPath, "utf8")))
    audioPaths.push(audioPath)
    stageRecords.push(voiceRecord)
  }

  const timelineKey = contentKey("timeline-1", { project, voiceKeys })
  const timelinePath = resolve(root, "timeline.json")
  let timelineRecord = !options.force ? await cache.fresh("timeline", timelineKey) : undefined
  const scenes = project.scenes.map((_, index) => compileScene(project, index, sceneWords[index]!))
  compiledSceneSchema.array().parse(scenes)
  if (!timelineRecord) { await jsonWrite(timelinePath, scenes); timelineRecord = await cache.write("timeline", timelineKey, Object.fromEntries(voiceKeys.map((k,i) => [`voice-${project.scenes[i]!.id}`, k])), [timelinePath]) }
  stageRecords.push(timelineRecord)

  if (options.voiceOnly) {
    const manifestPath = resolve(root, "manifest.json")
    const outputs = { timeline: { path: timelinePath, sha256: new Bun.CryptoHasher("sha256").update(await Bun.file(timelinePath).arrayBuffer()).digest("hex") } }
    await jsonWrite(manifestPath, buildManifestSchema.parse({ version: 1, project: projectFile, createdAt: new Date().toISOString(), stages: stageRecords, outputs }))
    return { outputDir: root, manifest: manifestPath, stages: stageRecords }
  }

  const assets: Record<string, string> = {}
  const assetSources: Record<string, string> = {}
  for (const scene of project.scenes) for (const visual of scene.visuals) {
    if (visual.type === "media.image" || visual.type === "tscircuit.board") {
      const id = visual.id ?? visual.source
      const sourcePath = resolve(projectDir, visual.source)
      const bytes = await Bun.file(sourcePath).arrayBuffer()
      const key = contentKey("asset-1", { visual, sourceHash: new Bun.CryptoHasher("sha256").update(bytes).digest("hex") })
      const stage = `asset-${contentKey("id", id).slice(0, 12)}`
      let assetRecord = !options.force ? await cache.fresh(stage, key) : undefined
      let generated = assetRecord?.outputs[0]
      if (!generated) {
        generated = await resolveVisualAsset(projectDir, visual)
        if (!generated) throw new Error(`No asset produced for ${id}`)
        assetRecord = await cache.write(stage, key, { validate: validateKey }, [generated])
      }
      assets[id] = generated
      assetSources[id] = key
      stageRecords.push(assetRecord!)
      continue
    }
    if (visual.type === "editor.session") {
      const sourcePath = resolve(projectDir, visual.source)
      const sourceBytes = await Bun.file(sourcePath).arrayBuffer()
      const sourceText = new TextDecoder().decode(sourceBytes).trimEnd()
      const initialText = (await Bun.file(resolve(projectDir, visual.capture.initialSource)).text()).trimEnd()
      if (sourceText !== visual.code.trimEnd()) throw new Error(`editor.session final code does not match ${visual.source}`)
      if (initialText !== visual.initialCode.trimEnd()) throw new Error(`editor.session initial code does not match ${visual.capture.initialSource}`)
      const insertionLength = sourceText.length - initialText.length
      const isSingleInsertion = insertionLength >= 0 && Array.from({ length: initialText.length + 1 }, (_, offset) => offset).some(offset =>
        sourceText.slice(0, offset) === initialText.slice(0, offset) && sourceText.slice(offset + insertionLength) === initialText.slice(offset)
      )
      if (!isSingleInsertion) throw new Error("editor.session must describe one real insertion")
      const sourceId = `${visual.id}:source`
      const sourceKey = contentKey("editor-source-1", { visual: { source: visual.source, displayPath: visual.displayPath }, sourceHash: new Bun.CryptoHasher("sha256").update(sourceBytes).digest("hex") })
      assets[sourceId] = sourcePath
      assetSources[sourceId] = sourceKey

      const captureId = `${visual.id}:capture`
      const tapePath = resolve(projectDir, visual.capture.tape)
      const captureInputPaths = [tapePath, resolve(projectDir, visual.capture.initialSource), ...visual.capture.inputs.map(input => resolve(projectDir, input))]
      const captureInputHashes = await Promise.all(captureInputPaths.map(async path => ({
        path,
        sha256: new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex"),
      })))
      const captureKey = contentKey("editor-vhs-2", {
        source: visual.source,
        initialCode: visual.initialCode,
        code: visual.code,
        capture: visual.capture,
        sourceHash: new Bun.CryptoHasher("sha256").update(sourceBytes).digest("hex"),
        inputs: captureInputHashes,
        runtime: { vhs: "0.11.0", nvim: "0.12.5", ttyd: "1.7.7" },
      })
      const captureStage = `capture-${contentKey("id", visual.id).slice(0, 12)}`
      const capturePath = resolve(root, "editor", `${visual.id}.mp4`)
      const captureResultPath = resolve(projectDir, visual.capture.resultSource)
      let captureRecord = !options.force ? await cache.fresh(captureStage, captureKey) : undefined
      if (!captureRecord) {
        await mkdir(resolve(capturePath, ".."), { recursive: true })
        const toolBin = resolve(projectDir, "..", "..", ".tools", "bin")
        await runWithRetries([resolve(toolBin, "vhs"), tapePath, "-q", "-o", capturePath], projectDir, {
          PATH: `${toolBin}:${process.env.PATH ?? ""}`,
        })
        const capturedResult = (await Bun.file(captureResultPath).text()).trimEnd()
        if (capturedResult !== sourceText) throw new Error(`VHS capture saved buffer does not match ${visual.source}`)
        captureRecord = await cache.write(captureStage, captureKey, { validate: validateKey }, [capturePath, captureResultPath], {
          driver: "vhs",
          vhsVersion: "0.11.0",
          neovimVersion: "0.12.5",
        })
      }
      assets[captureId] = capturePath
      assetSources[captureId] = captureKey
      stageRecords.push(captureRecord)

      const previewId = `${visual.id}:preview`
      const previewVisual = { id: previewId, type: "tscircuit.board" as const, source: visual.preview.source, view: visual.preview.view }
      const previewPath = resolve(projectDir, previewVisual.source)
      const previewBytes = await Bun.file(previewPath).arrayBuffer()
      const previewKey = contentKey("editor-preview-1", { visual: previewVisual, sourceHash: new Bun.CryptoHasher("sha256").update(previewBytes).digest("hex") })
      const stage = `asset-${contentKey("id", previewId).slice(0, 12)}`
      let previewRecord = !options.force ? await cache.fresh(stage, previewKey) : undefined
      let generated = previewRecord?.outputs[0]
      if (!generated) {
        generated = await resolveVisualAsset(projectDir, previewVisual)
        if (!generated) throw new Error(`No preview asset produced for ${visual.id}`)
        previewRecord = await cache.write(stage, previewKey, { validate: validateKey }, [generated])
      }
      assets[previewId] = generated
      assetSources[previewId] = previewKey
      stageRecords.push(previewRecord!)
      continue
    }
    if (visual.type === "terminal.session") {
      const captureId = `${visual.id}:capture`
      const tapePath = resolve(projectDir, visual.capture.tape)
      const captureInputPaths = [tapePath, ...visual.capture.inputs.map(input => resolve(projectDir, input))]
      const captureInputHashes = await Promise.all(captureInputPaths.map(async path => ({
        path,
        sha256: new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex"),
      })))
      const captureKey = contentKey("terminal-vhs-1", {
        capture: visual.capture,
        inputs: captureInputHashes,
        runtime: { vhs: "0.11.0", ttyd: "1.7.7" },
      })
      const captureStage = `capture-${contentKey("id", visual.id).slice(0, 12)}`
      const capturePath = resolve(root, "terminal", `${visual.id}.mp4`)
      let captureRecord = !options.force ? await cache.fresh(captureStage, captureKey) : undefined
      if (!captureRecord) {
        await mkdir(resolve(capturePath, ".."), { recursive: true })
        const toolBin = resolve(projectDir, "..", "..", ".tools", "bin")
        await runWithRetries([resolve(toolBin, "vhs"), tapePath, "-q", "-o", capturePath], projectDir, {
          PATH: `${toolBin}:${process.env.PATH ?? ""}`,
        })
        captureRecord = await cache.write(captureStage, captureKey, { validate: validateKey }, [capturePath], {
          driver: "vhs",
          vhsVersion: "0.11.0",
        })
      }
      assets[captureId] = capturePath
      assetSources[captureId] = captureKey
      stageRecords.push(captureRecord)
    }
  }

  const prepareKey = contentKey("prepare-1", { timelineKey, assetSources, settings: project.settings })
  const silentPath = resolve(root, "render", "silent.mp4")
  const requestPath = resolve(root, "render-request.json")
  const request = prepareRenderRequest(project, scenes, assets, silentPath, prepareKey.slice(0, 24))
  let prepareRecord = !options.force ? await cache.fresh("prepare", prepareKey) : undefined
  if (!prepareRecord) { await jsonWrite(requestPath, request); prepareRecord = await cache.write("prepare", prepareKey, { timeline: timelineKey, ...assetSources }, [requestPath]) }
  stageRecords.push(prepareRecord)

  let finalVideo: string | undefined
  if (options.render) {
    const renderKey = contentKey("render-1", { prepareKey, renderer: "manim-jsonl-19" })
    let renderRecord = !options.force ? await cache.fresh("render", renderKey) : undefined
    if (!renderRecord) { await new ManimRenderer().render(renderRequestSchema.parse(request)); renderRecord = await cache.write("render", renderKey, { prepare: prepareKey }, [silentPath]) }
    stageRecords.push(renderRecord)
    finalVideo = resolve(root, `${basename(projectFile).replace(/\.[^.]+$/, "")}.mp4`)
    const muxKey = contentKey("mux-1", { renderKey, voiceKeys })
    let muxRecord = !options.force ? await cache.fresh("mux", muxKey) : undefined
    if (!muxRecord) {
      const audioList = resolve(root, "audio", "concat.txt")
      await writeFile(audioList, audioPaths.map(path => `file '${path.replaceAll("'", "'\\''")}'`).join("\n") + "\n")
      const narrationPath = resolve(root, "audio", "narration.m4a")
      const captions: CaptionCue[] = []; let offset = 0
      for (const words of sceneWords) { for (const cue of makeCaptions(words)) captions.push({ ...cue, index: captions.length + 1, startSeconds: cue.startSeconds + offset, endSeconds: cue.endSeconds + offset }); offset += words.at(-1)?.endSeconds ?? 0 }
      const srtPath = resolve(root, "captions.srt"); const vttPath = resolve(root, "captions.vtt")
      await writeFile(srtPath, toSrt(captions)); await writeFile(vttPath, toVtt(captions))
      await run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", audioList, "-c:a", "aac", narrationPath], projectDir)
      await run(["ffmpeg", "-y", "-i", silentPath, "-i", narrationPath, "-c:v", "copy", "-c:a", "aac", "-shortest", finalVideo], projectDir)
      muxRecord = await cache.write("mux", muxKey, { render: renderKey }, [finalVideo, srtPath, vttPath, narrationPath])
    }
    stageRecords.push(muxRecord)
  }

  const outputCandidates: Record<string, string> = { timeline: timelinePath, renderRequest: requestPath }
  if (finalVideo) Object.assign(outputCandidates, {
    video: finalVideo,
    silentVideo: silentPath,
    narration: resolve(root, "audio", "narration.m4a"),
    captionsSrt: resolve(root, "captions.srt"),
    captionsVtt: resolve(root, "captions.vtt"),
  })
  const outputs: Record<string, { path: string; sha256: string }> = {}
  for (const [name, path] of Object.entries(outputCandidates)) { await access(path); outputs[name] = { path, sha256: new Bun.CryptoHasher("sha256").update(await Bun.file(path).arrayBuffer()).digest("hex") } }
  const manifestPath = resolve(root, "manifest.json")
  const manifest = buildManifestSchema.parse({ version: 1, project: projectFile, createdAt: new Date().toISOString(), stages: stageRecords, outputs })
  await jsonWrite(manifestPath, manifest)
  return { outputDir: root, ...(finalVideo ? { video: finalVideo } : {}), manifest: manifestPath, stages: stageRecords }
}
