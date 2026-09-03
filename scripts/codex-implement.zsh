#!/usr/bin/env zsh
set -euo pipefail

root=${0:A:h:h}
state_dir="$root/.build/codex-stages"
dry_run=0
force=0
start=1
single=""

usage() { print -u2 'usage: scripts/codex-implement.zsh [--dry-run] [--force] [--start-from N] [--stage N]'; exit 2 }
while (( $# )); do
  case "$1" in
    --dry-run) dry_run=1 ;;
    --force) force=1 ;;
    --start-from) shift; (( $# )) || usage; start=$1 ;;
    --stage) shift; (( $# )) || usage; single=$1 ;;
    *) usage ;;
  esac
  shift
done

stages=(
  'workspace, schemas, and authoring API'
  'narration, alignment, and immutable cache'
  'tscircuit asset adapter'
  'renderer plan and Manim worker'
  'CLI, graph, captions, and manifest'
  'board example, visual QA, documentation, and review'
)
mkdir -p "$state_dir"
for number in {1..6}; do
  (( number >= start )) || continue
  [[ -z "$single" || "$number" == "$single" ]] || continue
  result="$state_dir/stage-$number.json"
  if [[ -f "$result" && $force -eq 0 ]]; then
    status=$(bun -e 'const x=await Bun.file(process.argv[1]).json(); console.log(x.status)' "$result")
    [[ "$status" == complete ]] && continue
  fi
  prompt="Implement stage $number (${stages[$number]}) from PROJECT_PROMPT.md. Work only in this repository. Use Bun for TypeScript. Run focused verification. Do not claim complete with remaining work."
  if (( dry_run )); then print "stage $number: $prompt"; continue; fi
  codex exec --full-auto --cwd "$root" --output-schema "$root/scripts/stage-result.schema.json" --output-last-message "$result" "$prompt" >"$state_dir/stage-$number.log" 2>&1
  bun -e 'const x=await Bun.file(process.argv[1]).json(); if(x.status!=="complete"||x.remainingWork.length) process.exit(1)' "$result"
done
