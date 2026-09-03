#!/usr/bin/env python3
"""Local Chatterbox synthesizer. It refuses to download model data during a build."""
import json
import gc
import os
import re
import sys
from pathlib import Path

def speech_chunks(text, max_words=70):
    tokens = re.findall(r"\S+", text)
    chunks = []
    start = 0
    while start < len(tokens):
        hard_end = min(len(tokens), start + max_words)
        end = hard_end
        if hard_end < len(tokens):
            sentence_ends = [
                index + 1
                for index in range(start + max_words // 2, hard_end)
                if re.search(r"[.!?][\"')\]]?$", tokens[index])
            ]
            if sentence_ends: end = sentence_ends[-1]
        chunks.append((" ".join(tokens[start:end]), tokens[start:end]))
        start = end
    return chunks

def align_words(waveform, sample_rate, display_tokens, bundle, align_model):
    import torch
    import torchaudio
    normalized = [re.sub(r"[^a-z']", "", token.lower()) for token in display_tokens]
    unsupported = [display for display, token in zip(display_tokens, normalized) if not token]
    if unsupported:
        raise RuntimeError("narration contains tokens unsupported by the initial English aligner: " + ", ".join(unsupported[:8]))
    audio = torchaudio.functional.resample(waveform.cpu(), sample_rate, bundle.sample_rate)
    with torch.inference_mode(): emission, _ = align_model(audio)
    token_spans = bundle.get_aligner()(emission[0], bundle.get_tokenizer()(normalized))
    seconds_per_emission = audio.shape[-1] / emission.shape[1] / bundle.sample_rate
    return [{
        "word": display,
        "startSeconds": spans[0].start * seconds_per_emission,
        "endSeconds": spans[-1].end * seconds_per_emission,
    } for display, spans in zip(display_tokens, token_spans)]

def main():
    import torch
    import torchaudio
    import perth
    # The native Perth implementation is not distributed for every macOS/Python
    # combination. Chatterbox otherwise crashes at construction time.
    if perth.PerthImplicitWatermarker is None:
        perth.PerthImplicitWatermarker = perth.DummyWatermarker
    from chatterbox.tts import ChatterboxTTS

    model_dir = Path(os.environ["CHATTERBOX_MODEL_DIR"])
    required = ["ve.safetensors", "t3_cfg.safetensors", "s3gen.safetensors", "tokenizer.json", "conds.pt"]
    missing = [name for name in required if not (model_dir / name).is_file()]
    if missing: raise RuntimeError("missing checked local Chatterbox weights: " + ", ".join(missing))
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model = ChatterboxTTS.from_local(model_dir, device)
    for line in sys.stdin:
        req = json.loads(line)
        text = req["text"]
        output = os.path.abspath(req["outputPath"])
        os.makedirs(os.path.dirname(output), exist_ok=True)
        sample_rate = model.sr
        generated = [
            (model.generate(chunk_text).cpu(), chunk_tokens)
            for chunk_text, chunk_tokens in speech_chunks(text)
        ]
        del model; gc.collect()
        if torch.backends.mps.is_available(): torch.mps.empty_cache()

        model_path = Path(os.environ["TORCH_HOME"]) / "hub" / "checkpoints" / "model.pt"
        if not model_path.is_file(): raise RuntimeError("missing local torchaudio MMS forced-alignment model")
        bundle = torchaudio.pipelines.MMS_FA
        align_model = bundle.get_model(with_star=False).to("cpu")
        pause_samples = round(sample_rate * 0.22)
        pause = torch.zeros((generated[0][0].shape[0], pause_samples), dtype=generated[0][0].dtype)
        joined = []
        words = []
        offset = 0.0
        for index, (waveform, tokens) in enumerate(generated):
            chunk_words = align_words(waveform, sample_rate, tokens, bundle, align_model)
            words.extend({
                **word,
                "startSeconds": word["startSeconds"] + offset,
                "endSeconds": word["endSeconds"] + offset,
            } for word in chunk_words)
            joined.append(waveform)
            offset += waveform.shape[-1] / sample_rate
            if index + 1 < len(generated):
                joined.append(pause)
                offset += pause_samples / sample_rate
        waveform = torch.cat(joined, dim=-1)
        torchaudio.save(output, waveform, sample_rate)
        duration = waveform.shape[-1] / sample_rate
        print(json.dumps({"audioPath": output, "durationSeconds": duration, "words": words, "providerVersion": "chatterbox-tts-0.1.7-mms-align-chunked-2"}), flush=True)

if __name__ == "__main__":
    try: main()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), flush=True)
        sys.exit(1)
