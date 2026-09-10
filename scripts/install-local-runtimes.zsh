#!/bin/zsh
set -euo pipefail
root=${0:A:h:h}
cd "$root"
bun install
"$root/scripts/install-editor-capture-tools.zsh"
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-manim.txt
"$root/scripts/install-kokoro"
print 'Runtime packages and model weights installed locally.'
