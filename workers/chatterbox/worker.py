#!/usr/bin/env python3
"""Chatterbox boundary. Configure CHATTERBOX_COMMAND to a local JSONL-compatible synthesizer."""
import json
import os
import subprocess
import sys

VERSION = 1

def main():
    for line in sys.stdin:
        request_id = "unknown"
        try:
            req = json.loads(line)
            request_id = req.get("requestId", request_id)
            if req.get("protocolVersion") != VERSION or req.get("operation") != "synthesize":
                raise ValueError("unsupported Chatterbox worker protocol or operation")
            command = os.environ.get("CHATTERBOX_COMMAND")
            if not command:
                raise RuntimeError("CHATTERBOX_COMMAND is not configured; it must name a local JSONL-compatible Chatterbox runner")
            completed = subprocess.run([command], input=json.dumps(req) + "\n", text=True, capture_output=True)
            if completed.returncode != 0: raise RuntimeError(completed.stdout.strip() or completed.stderr.strip() or "Chatterbox runner failed")
            result = json.loads(completed.stdout.strip().splitlines()[-1])
            if not isinstance(result.get("words"), list) or not os.path.isfile(result.get("audioPath", "")):
                raise ValueError("Chatterbox runner returned an invalid or incomplete result")
            print(json.dumps({"protocolVersion": VERSION, "requestId": request_id, "ok": True, "outputs": [result["audioPath"]], "metadata": {"words": result["words"], "durationSeconds": result["durationSeconds"], "providerVersion": result.get("providerVersion", "chatterbox-local")}}), flush=True)
        except Exception as exc:
            print(json.dumps({"protocolVersion": VERSION, "requestId": request_id, "ok": False, "error": str(exc)}), flush=True)

if __name__ == "__main__": main()
