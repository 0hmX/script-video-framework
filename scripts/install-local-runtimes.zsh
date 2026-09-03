#!/bin/zsh
set -euo pipefail
root=${0:A:h:h}
cd "$root"
bun install
"$root/scripts/install-editor-capture-tools.zsh"
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-manim.txt
python311=${PYTHON311:-/opt/homebrew/bin/python3.11}
[[ -x "$python311" ]] || { print -u2 'Python 3.11 is required for Chatterbox (set PYTHON311)'; exit 1; }
"$python311" -m venv .venv-chatterbox
.venv-chatterbox/bin/python -m pip install -r requirements-chatterbox.txt
mkdir -p .models/chatterbox
.venv-chatterbox/bin/python - <<'PY'
from huggingface_hub import hf_hub_download
for name in ['ve.safetensors', 't3_cfg.safetensors', 's3gen.safetensors', 'tokenizer.json', 'conds.pt']:
    hf_hub_download(repo_id='ResembleAI/chatterbox', filename=name, local_dir='.models/chatterbox')
PY
TORCH_HOME="$root/.models/torch" .venv-chatterbox/bin/python - <<'PY'
import torchaudio
torchaudio.pipelines.MMS_FA.get_model()
PY
print 'Runtime packages and verified model weights installed locally.'
