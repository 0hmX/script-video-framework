#!/usr/bin/env python3
"""Kokoro speech with native token durations mapped to source whitespace words."""
import contextlib
import json
import os
import re
import sys
from pathlib import Path

VERSION = 'kokoro-0.9.4-native-alignment-1'


def align_words(text, tokens, duration):
    spans = list(re.finditer(r'\S+', text))
    timings = [[] for _ in spans]
    cursor = 0
    for token, start, end in tokens:
        if not token.strip():
            continue
        index = text.find(token, cursor)
        if index < 0:
            raise ValueError('Kokoro tokens could not be matched to source narration')
        cursor = index + len(token)
        if start is None or end is None:
            continue
        for i, span in enumerate(spans):
            if span.start() < cursor and span.end() > index:
                timings[i].append((start, end))
    result = []
    previous = 0.0
    for span, matches in zip(spans, timings):
        if not matches and re.search(r'\w', span.group()):
            raise ValueError('Kokoro omitted timing for a spoken word')
        start = max(previous, min((t[0] for t in matches), default=previous))
        end = min(duration, max(start, max((t[1] for t in matches), default=start)))
        result.append(dict(word=span.group(), startSeconds=start, endSeconds=end))
        previous = end
    return result


def main():
    import numpy as np
    import soundfile as sf
    import torch
    from kokoro import KPipeline
    torch.set_num_threads(int(os.environ.get('OMP_NUM_THREADS', '4')))
    pipeline = None
    for line in sys.stdin:
        request_id = 'unknown'
        try:
            req = json.loads(line)
            request_id = req.get('requestId', request_id)
            if req.get('protocolVersion') != 1 or req.get('operation') != 'synthesize':
                raise ValueError('Unsupported Kokoro protocol or operation')
            if req.get('sampleRate') != 24000:
                raise ValueError('Kokoro requires sampleRate 24000')
            text = req['text']
            if not text.strip():
                raise ValueError('Narration must not be empty')
            voice = req.get('voice', 'af_heart')
            if voice == 'narrator': voice = 'af_heart'
            if not re.fullmatch(r'a[fm]_[a-z]+', voice):
                raise ValueError('Use an American English Kokoro voice, such as af_heart')
            with contextlib.redirect_stdout(sys.stderr):
                if pipeline is None:
                    pipeline = KPipeline(lang_code='a', repo_id='hexgrad/Kokoro-82M', device='cpu')
                audio = []
                tokens = []
                offset = 0.0
                for chunk in pipeline(text, voice=voice, speed=1):
                    samples = chunk.audio.cpu().numpy()
                    for t in chunk.tokens:
                        start = t.start_ts
                        end = t.end_ts
                        tokens.append((t.text, None if start is None else start + offset,
                                       None if end is None else end + offset))
                    audio.append(samples)
                    offset += len(samples) / 24000
                if not audio: raise ValueError('Kokoro produced no audio')
                words = align_words(text, tokens, offset)
                output = Path(req['outputPath']).resolve()
                output.parent.mkdir(parents=True, exist_ok=True)
                sf.write(output, np.concatenate(audio), 24000, subtype='PCM_16')
            response = dict(protocolVersion=1, requestId=request_id, ok=True, outputs=[str(output)],
                            metadata=dict(words=words, durationSeconds=offset, providerVersion=VERSION))
        except Exception as error:
            response = dict(protocolVersion=1, requestId=request_id, ok=False, error=str(error))
        print(json.dumps(response), flush=True)


if __name__ == '__main__': main()
