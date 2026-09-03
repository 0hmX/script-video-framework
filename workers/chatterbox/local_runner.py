#!/usr/bin/env python3
"""Local Chatterbox synthesizer. It refuses to download model data during a build."""
import json
import gc
import os
import re
import sys
from pathlib import Path

def align_words(waveform, sample_rate, display_tokens):
    import torch
    import torchaudio
    model_path = Path(os.environ["TORCH_HOME"]) / "hub" / "checkpoints" / "model.pt"
    if not model_path.is_file(): raise RuntimeError("missing local torchaudio MMS forced-alignment model")
    normalized = [re.sub(r"[^a-z']", "", token.lower()) for token in display_tokens]
    if any(not token for token in normalized): raise RuntimeError("narration contains a word unsupported by the initial English aligner")
    bundle = torchaudio.pipelines.MMS_FA
    audio = torchaudio.functional.resample(waveform.cpu(), sample_rate, bundle.sample_rate)
    align_model = bundle.get_model(with_star=False).to("cpu")
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
        waveform = model.generate(text)
        sample_rate = model.sr
        torchaudio.save(output, waveform.cpu(), sample_rate)
        duration = waveform.shape[-1] / sample_rate
        tokens = re.findall(r"\S+", text)
        del model; gc.collect()
        if torch.backends.mps.is_available(): torch.mps.empty_cache()
        words = align_words(waveform, sample_rate, tokens)
        print(json.dumps({"audioPath": output, "durationSeconds": duration, "words": words, "providerVersion": "chatterbox-tts-0.1.7-mms-align-1"}), flush=True)

if __name__ == "__main__":
    try: main()
    except Exception as exc:
        print(json.dumps({"error": str(exc)}), flush=True)
        sys.exit(1)
