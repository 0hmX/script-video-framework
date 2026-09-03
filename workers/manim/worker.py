#!/usr/bin/env python3
"""Versioned JSONL Manim worker. Authored Python is never loaded or executed."""
import json
import math
import os
import shutil
import subprocess
import sys
import tempfile

PROTOCOL_VERSION = 1

def respond(request_id, ok, **kwargs):
    print(json.dumps({"protocolVersion": PROTOCOL_VERSION, "requestId": request_id, "ok": ok, **kwargs}), flush=True)

def validate(req):
    if req.get("protocolVersion") != PROTOCOL_VERSION or req.get("operation") != "render":
        raise ValueError("unsupported Manim worker protocol or operation")
    if not isinstance(req.get("scenes"), list) or not req["scenes"]:
        raise ValueError("render request must contain scenes")
    if not isinstance(req.get("output"), str) or "://" in req["output"]:
        raise ValueError("output must be a local path")

def render(req):
    try:
        from manim import config, Scene, Text, ImageMobject, Line, Arrow, Group, VGroup, RoundedRectangle, Rectangle, Circle, ValueTracker, WHITE, GREY_B, DOWN, UP
    except Exception as exc:
        raise RuntimeError("Manim Community is unavailable; install it in MANIM_PYTHON") from exc

    settings = req["settings"]
    try:
        from manimpango import list_fonts
        font_family = "Geist" if "Geist" in list_fonts() else "Arial"
        mono_font_family = "Geist Mono" if "Geist Mono" in list_fonts() else "Menlo"
    except Exception:
        font_family = "Arial"
        mono_font_family = "Menlo"
    config.pixel_width = settings["width"]
    config.pixel_height = settings["height"]
    config.frame_width = 8.0
    config.frame_height = 8.0 * settings["height"] / settings["width"]
    config.frame_rate = settings["fps"]
    config.background_color = "#0a0a0a"
    config.disable_caching = True
    config.verbosity = "ERROR"

    assets = req.get("assets", {})
    segment_dir = tempfile.mkdtemp(prefix="script-video-manim-")
    segments = []

    class TimelineScene(Scene):
        scene_data = None
        selected_font = "Arial"
        selected_mono_font = "Menlo"
        def construct(self):
            scene = self.scene_data
            scheduled = []
            caption_requested = any(item["visual"]["type"] == "captions" for item in scene["visuals"])
            for item in scene["visuals"]:
                visual = item["visual"]
                if visual["type"] == "code.typewriter":
                    code = visual["code"]
                    chunk_size = 2
                    steps = max(1, (len(code) + chunk_size - 1) // chunk_size)
                    typing_frames = min(item["durationFrames"], max(1, round(visual.get("typingSeconds", 3) * settings["fps"])))
                    for step in range(1, steps + 1):
                        end = min(len(code), step * chunk_size)
                        event_frame = item["startFrame"] + round((step - 1) * typing_frames / steps)
                        scheduled.append((event_frame, "code", {"text": code[:end], "complete": end == len(code), "visual": visual}))
                elif visual["type"] == "editor.session":
                    capture_path = assets.get(f'{visual["id"]}:capture')
                    if not capture_path or not os.path.isfile(capture_path):
                        raise ValueError(f'missing VHS editor capture: {visual["id"]}')
                    frame_dir = tempfile.mkdtemp(prefix="editor-frames-", dir=segment_dir)
                    frame_pattern = os.path.join(frame_dir, "frame-%05d.png")
                    completed = subprocess.run(
                        ["ffmpeg", "-v", "error", "-y", "-i", capture_path, "-vf", f'fps={settings["fps"]}', frame_pattern],
                        capture_output=True,
                        text=True,
                    )
                    if completed.returncode != 0:
                        raise RuntimeError("FFmpeg could not decode VHS editor capture: " + completed.stderr[-1000:])
                    capture_frames = sorted(os.path.join(frame_dir, name) for name in os.listdir(frame_dir) if name.endswith(".png"))
                    if not capture_frames:
                        raise ValueError(f'VHS editor capture contains no frames: {visual["id"]}')
                    for index, path in enumerate(capture_frames[:item["durationFrames"]]):
                        scheduled.append((item["startFrame"] + index, "editor_capture", {"path": path, "visual": visual}))
                elif visual["type"] != "captions": scheduled.append((item["startFrame"], "visual", item))
            if caption_requested:
                words = scene["words"]
                for index in range(0, len(words), 7):
                    group = words[index:index + 7]
                    scheduled.append((round(group[0]["startSeconds"] * settings["fps"]), "caption", group))
            scheduled.sort(key=lambda event: event[0])
            frame = 0
            active_caption = None
            active_code = None
            active_editor_shell = None
            active_editor_buffer = None
            active_editor_id = None
            for event_frame, event_type, payload in scheduled:
                delay = max(0, event_frame - frame) / settings["fps"]
                if delay: self.wait(delay)
                if event_type == "caption":
                    if active_caption is not None: self.remove(active_caption)
                    text = " ".join(word["word"] for word in payload)
                    active_caption = Text(text, font=self.selected_font, font_size=30, color=WHITE)
                    if active_caption.width > config.frame_width * 0.80: active_caption.scale_to_fit_width(config.frame_width * 0.80)
                    active_caption.to_edge(DOWN, buff=max(1.0, settings["safeMargin"] / settings["height"] * config.frame_height))
                    active_caption.set_z_index(20)
                    self.add(active_caption)
                    frame = event_frame
                    continue
                if event_type == "code":
                    if active_code is not None: self.remove(active_code)
                    visual = payload["visual"]
                    code_text = payload["text"] + ("" if payload["complete"] else "_")
                    active_code = Text(code_text, font=self.selected_mono_font, font_size=24, color=WHITE, line_spacing=0.8)
                    if active_code.width > config.frame_width * 0.84: active_code.scale_to_fit_width(config.frame_width * 0.84)
                    if active_code.height > config.frame_height * 0.58: active_code.scale_to_fit_height(config.frame_height * 0.58)
                    active_code.move_to([visual.get("x", 0), visual.get("y", 0.5), 0]).set_z_index(10)
                    self.add(active_code)
                    frame = event_frame
                    continue
                if event_type == "editor_capture":
                    visual = payload["visual"]
                    if active_editor_id != visual["id"]:
                        if active_editor_shell is not None: self.remove(active_editor_shell)
                        preview_label = Text("tscircuit preview  •  verified", font=self.selected_mono_font, font_size=17, color=GREY_B).move_to([0, 0.72, 0])
                        preview_path = assets.get(f'{visual["id"]}:preview')
                        if not preview_path or not os.path.isfile(preview_path): raise ValueError(f'missing verified editor preview: {visual["id"]}')
                        preview = ImageMobject(preview_path).scale_to_fit_width(6.35).move_to([0, -2.2, 0])
                        if preview.height > 3.75: preview.scale_to_fit_height(3.75)
                        active_editor_shell = Group(preview_label, preview).set_z_index(7)
                        self.add(active_editor_shell)
                        active_editor_id = visual["id"]
                    if active_editor_buffer is not None: self.remove(active_editor_buffer)
                    active_editor_buffer = ImageMobject(payload["path"]).scale_to_fit_width(7.2).move_to([0, 3.3, 0]).set_z_index(9)
                    if active_editor_buffer.height > 3.8: active_editor_buffer.scale_to_fit_height(3.8)
                    self.add(active_editor_buffer)
                    frame = event_frame
                    continue
                item = payload
                visual = item["visual"]
                kind = visual["type"]
                obj = None
                if kind == "text":
                    size = 64 if visual.get("role") == "title" else 42
                    color = GREY_B if visual.get("role") == "secondary" else WHITE
                    obj = Text(visual["text"], font=self.selected_font, font_size=size, color=color)
                    if obj.width > config.frame_width * 0.84: obj.scale_to_fit_width(config.frame_width * 0.84)
                    if visual.get("role") == "title" and "x" not in visual and "y" not in visual:
                        obj.to_edge(UP, buff=0.75)
                    else: obj.move_to([visual.get("x", 0), visual.get("y", 0), 0])
                    obj.set_z_index(10)
                elif kind in ("media.image", "tscircuit.board"):
                    key = visual.get("id") or visual.get("source")
                    path = assets.get(key)
                    if not path or not os.path.isfile(path): raise ValueError(f"missing verified asset: {key}")
                    obj = ImageMobject(path).scale_to_fit_width(config.frame_width * 0.78).shift(UP * 0.45)
                elif kind == "prompt":
                    if visual.get("preset") != "code-to-board": raise ValueError("unsupported prompt preset")
                    tracker = ValueTracker(0)
                    tracker.add_updater(lambda mob, dt: mob.increment_value(dt))
                    code_lines = VGroup(*[
                        Text(line, font=self.selected_mono_font, font_size=22, color=WHITE)
                        for line in ["<board", '  width="60mm"', '  height="36mm"', '  borderRadius="3mm"', ">"]
                    ]).arrange(DOWN, buff=0.16).move_to([0, -3.2, 0])
                    def update_code(mob):
                        t = tracker.get_value()
                        mob.move_to([0, -3.2 + min(t, 4.2) * 1.15, 0])
                        mob.set_opacity(max(0.04, 1.0 - t / 4.3))
                    code_lines.add_updater(update_code)
                    board = RoundedRectangle(width=5.2, height=3.1, corner_radius=0.28, color=WHITE).move_to([0, 2.2, 0])
                    holes = VGroup(*[Circle(radius=0.11, color=WHITE).move_to([x, y, 0]) for x, y in [(-2.1, 1.25), (2.1, 1.25), (-2.1, 3.15), (2.1, 3.15)]])
                    board_group = VGroup(board, holes)
                    def update_board(mob): mob.set_opacity(min(1.0, max(0.08, (tracker.get_value() - 0.8) / 2.5)))
                    board_group.add_updater(update_board)
                    self.add(tracker)
                    obj = VGroup(code_lines, board_group).set_z_index(8)
                elif kind in ("geometry.line", "geometry.arrow", "geometry.measurement"):
                    start = [*visual["from"], 0]
                    end = [*visual["to"], 0]
                    obj = Arrow(start, end, color=WHITE, buff=0) if kind == "geometry.arrow" else Line(start, end, color=WHITE)
                    if kind == "geometry.measurement":
                        horizontal = abs(end[0] - start[0]) >= abs(end[1] - start[1])
                        cap_half = 0.13
                        if horizontal:
                            caps = VGroup(
                                Line([start[0], start[1] - cap_half, 0], [start[0], start[1] + cap_half, 0], color=WHITE),
                                Line([end[0], end[1] - cap_half, 0], [end[0], end[1] + cap_half, 0], color=WHITE),
                            )
                            label_position = [(start[0] + end[0]) / 2, start[1] - 0.34, 0]
                            label = Text(visual["label"], font=self.selected_font, font_size=28, color=WHITE).move_to(label_position)
                        else:
                            caps = VGroup(
                                Line([start[0] - cap_half, start[1], 0], [start[0] + cap_half, start[1], 0], color=WHITE),
                                Line([end[0] - cap_half, end[1], 0], [end[0] + cap_half, end[1], 0], color=WHITE),
                            )
                            label_position = [start[0] + 0.34, (start[1] + end[1]) / 2, 0]
                            label = Text(visual["label"], font=self.selected_font, font_size=28, color=WHITE).rotate(math.pi / 2).move_to(label_position)
                        obj = VGroup(obj, caps, label)
                    obj.set_z_index(15)
                if obj is not None:
                    self.add(obj)
                frame = event_frame
            remaining = max(1, scene["durationFrames"] - frame) / settings["fps"]
            self.wait(remaining)

    try:
        for index, scene in enumerate(req["scenes"]):
            TimelineScene.scene_data = scene
            TimelineScene.selected_font = font_family
            TimelineScene.selected_mono_font = mono_font_family
            config.media_dir = os.path.join(segment_dir, f"scene-{index}")
            instance = TimelineScene()
            instance.render()
            segment_path = os.path.join(segment_dir, f"segment-{index}.mp4")
            shutil.copyfile(instance.renderer.file_writer.movie_file_path, segment_path)
            segments.append(segment_path)
        output = os.path.abspath(req["output"])
        os.makedirs(os.path.dirname(output), exist_ok=True)
        if len(segments) == 1:
            shutil.copyfile(segments[0], output)
        else:
            concat_file = os.path.join(segment_dir, "segments.txt")
            with open(concat_file, "w", encoding="utf8") as handle:
                for path in segments: handle.write("file '" + os.path.abspath(path).replace("'", "'\\''") + "'\n")
            completed = subprocess.run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_file, "-c", "copy", output], capture_output=True, text=True)
            if completed.returncode != 0: raise RuntimeError("FFmpeg scene concatenation failed: " + completed.stderr[-2000:])
        return output
    finally:
        shutil.rmtree(segment_dir, ignore_errors=True)

def main():
    for line in sys.stdin:
        request_id = "unknown"
        try:
            req = json.loads(line)
            request_id = req.get("requestId", request_id)
            validate(req)
            output = render(req)
            respond(request_id, True, outputs=[output], metadata={"rendererVersion": "manim-jsonl-17"})
        except Exception as exc:
            respond(request_id, False, error=str(exc))

if __name__ == "__main__":
    main()
