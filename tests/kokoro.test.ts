import { expect, test } from "bun:test"
import { KokoroVoiceProvider } from "@script-video/audio"
import { chmod, mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("Kokoro adapter preserves native timing and worker errors", async () => {
  const dir = await mkdtemp(join(tmpdir(), "kokoro-adapter-"))
  try {
    const command = join(dir, "worker")
    await writeFile(command, `#!/usr/bin/env python3
import json,sys
r=json.loads(sys.stdin.readline())
if r['voice']=='bad':
 print(json.dumps(dict(protocolVersion=1,requestId=r['requestId'],ok=False,error='Unsupported voice')))
else:
 print(json.dumps(dict(protocolVersion=1,requestId=r['requestId'],ok=True,outputs=[r['outputPath']],metadata=dict(words=[dict(word='Hello',startSeconds=0.1,endSeconds=0.6)],durationSeconds=0.8,providerVersion='kokoro-test'))))
`)
    await chmod(command, 0o700)
    const provider = new KokoroVoiceProvider(command)
    const request = { requestId: "test", text: "Hello", voice: "af_heart", sampleRate: 24000, outputPath: join(dir, "test.wav") }
    const result = await provider.synthesize(request)
    expect(result.words[0]?.startSeconds).toBe(0.1)
    expect(result.durationSeconds).toBe(0.8)
    expect(result.providerVersion).toBe("kokoro-test")
    expect(provider.id).toBe("kokoro")
    await expect(provider.synthesize({ ...request, voice: "bad" })).rejects.toThrow("Unsupported voice")
  } finally { await rm(dir, { recursive: true, force: true }) }
})
