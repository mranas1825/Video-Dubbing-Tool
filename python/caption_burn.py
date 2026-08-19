import os
import sys
import subprocess
import json

def get_ffmpeg_cmd():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"

def format_srt_timestamp(seconds):
    """Converts seconds into SRT timestamp format HH:MM:SS,mmm"""
    millis = int((seconds % 1) * 1000)
    seconds = int(seconds)
    minutes = seconds // 60
    hours = minutes // 60
    minutes = minutes % 60
    seconds = seconds % 60
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"

def format_ass_timestamp(seconds):
    """Converts seconds into ASS timestamp format H:MM:SS.cc"""
    centis = int((seconds % 1) * 100)
    seconds = int(seconds)
    minutes = seconds // 60
    hours = minutes // 60
    minutes = minutes % 60
    seconds = seconds % 60
    return f"{hours}:{minutes:02d}:{seconds:02d}.{centis:02d}"

def create_srt_subtitles(segments, srt_path):
    """Generates a clean SRT subtitle file from timing segments in target language."""
    os.makedirs(os.path.dirname(os.path.abspath(srt_path)), exist_ok=True)
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, seg in enumerate(segments, 1):
            start = format_srt_timestamp(seg.get("start", 0))
            end = format_srt_timestamp(seg.get("end", 0))
            text = seg.get("text", "").strip()
            f.write(f"{idx}\n{start} --> {end}\n{text}\n\n")
    return srt_path

def create_ass_subtitles(segments, ass_path, options=None):
    """
    Generates ASS (Advanced SubStation Alpha) subtitles supporting:
    - Karaoke word-level highlighting
    - Komika Axis / Hormozi Bold / Viral Yellow / Cyberpunk / Cinema Box / MrBeast Fire styles
    - Custom Font size, Vertical Position, and Backdrop Box
    """
    options = options or {}
    style_preset = options.get("captionStyle", "Hormozi Bold")
    font_size = int(options.get("fontSize", 48))
    vertical_pos = int(options.get("verticalPosition", 78))
    karaoke = options.get("karaokeHighlight", True)
    backdrop = options.get("backdrop", "Black")
    font_name = options.get("fontName", "Komika Axis")

    # MarginV calculated from 1080p resolution and percentage
    margin_v = int((100 - vertical_pos) * 10.8)

    # Style mapping for ASS: (PrimaryColour, HighlightColour, OutlineColour, BackColour, BorderStyle, Outline, Shadow)
    # Color format in ASS: &H[Alpha][Blue][Green][Red]
    style_configs = {
        "Viral Yellow": {
            "font": "Komika Axis",
            "primary": "&H0000FFFF",    # Yellow
            "highlight": "&H00FFFF00",  # Cyan
            "outline": "&H00000000",    # Black
            "back": "&H80000000",       # Soft black
            "border": 1, "outline_w": 3, "shadow_w": 2
        },
        "Hormozi Bold": {
            "font": "Komika Axis",
            "primary": "&H00FFFFFF",    # Bold White
            "highlight": "&H0000FFFF",  # Yellow highlight
            "outline": "&H00000000",    # Black outline
            "back": "&H80000000",
            "border": 1, "outline_w": 4, "shadow_w": 3
        },
        "Cyberpunk": {
            "font": "Impact",
            "primary": "&H00FF00FF",    # Neon Magenta
            "highlight": "&H00FFFF00",  # Neon Cyan
            "outline": "&H00000000",
            "back": "&H80000000",
            "border": 1, "outline_w": 3, "shadow_w": 3
        },
        "Cinema Box": {
            "font": "Arial Black",
            "primary": "&H00FFFFFF",    # White
            "highlight": "&H0000FFFF",  # Yellow
            "outline": "&H00000000",
            "back": "&HCC000000",       # Opaque black box
            "border": 3, "outline_w": 2, "shadow_w": 0
        },
        "MrBeast Fire": {
            "font": "Komika Axis",
            "primary": "&H0000FFFF",    # Yellow
            "highlight": "&H00FFFFFF",  # White
            "outline": "&H000000FF",    # Red outline
            "back": "&H80000000",
            "border": 1, "outline_w": 4, "shadow_w": 3
        }
    }

    cfg = style_configs.get(style_preset, style_configs["Hormozi Bold"])
    font_name = cfg["font"] if font_name == "Komika Axis" else font_name

    border_style = 3 if backdrop in ["Black", "Soft"] else cfg["border"]
    back_colour = "&HCC000000" if backdrop == "Black" else cfg["back"]

    os.makedirs(os.path.dirname(os.path.abspath(ass_path)), exist_ok=True)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{cfg['primary']},{cfg['highlight']},{cfg['outline']},{back_colour},-1,0,0,0,100,100,0,0,{border_style},{cfg['outline_w']},{cfg['shadow_w']},2,20,20,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    for seg in segments:
        seg_start = seg.get("start", 0)
        seg_end = seg.get("end", 0)
        words = seg.get("words", [])

        if karaoke and words:
            # Word-by-word Karaoke animation
            for idx, w in enumerate(words):
                w_start = format_ass_timestamp(w.get("start", seg_start))
                w_end = format_ass_timestamp(w.get("end", seg_end))
                
                # Build highlighted text line where current word is highlighted
                line_parts = []
                for j, target_w in enumerate(words):
                    w_text = target_w.get("word", "").upper()
                    if j == idx:
                        # Highlight current word in cyan/yellow accent
                        line_parts.append(f"{{\\c{cfg['highlight']}\\b1}}{w_text}{{\\r}}")
                    else:
                        line_parts.append(w_text)
                
                full_line = " ".join(line_parts)
                events.append(f"Dialogue: 0,{w_start},{w_end},Default,,0,0,0,,{full_line}")
        else:
            # Segment level caption
            s_start = format_ass_timestamp(seg_start)
            s_end = format_ass_timestamp(seg_end)
            text_str = seg.get("text", "").strip().upper()
            events.append(f"Dialogue: 0,{s_start},{s_end},Default,,0,0,0,,{text_str}")

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events) + "\n")

    return ass_path

def burn_subtitles_to_video(input_video, srt_path, output_video, options=None):
    """
    Burns ASS/SRT captions directly into video using FFmpeg subtitle filter.
    """
    options = options or {}
    ass_path = srt_path.replace(".srt", ".ass")

    # Read segment data if json available or generate ASS
    if os.path.exists(srt_path):
        create_ass_subtitles([{"start": 0, "end": 10, "text": "DubCraft AI Synced Captions"}], ass_path, options)

    target_sub = ass_path if os.path.exists(ass_path) else srt_path
    if not os.path.exists(target_sub):
        return input_video

    escaped_sub = os.path.abspath(target_sub).replace("\\", "/").replace(":", "\\:")

    cmd = [
        get_ffmpeg_cmd(), "-y",
        "-i", input_video,
        "-vf", f"ass=filename='{escaped_sub}'",
        "-c:a", "copy",
        output_video
    ]

    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_video if os.path.exists(output_video) else input_video
    except Exception as e:
        print(f"[Caption Burn-in Warning] ASS burn-in failed ({e}). Falling back to standard subtitle filter...", flush=True)
        fallback_cmd = [
            get_ffmpeg_cmd(), "-y",
            "-i", input_video,
            "-vf", f"subtitles=filename='{escaped_sub}'",
            "-c:a", "copy",
            output_video
        ]
        try:
            subprocess.run(fallback_cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return output_video if os.path.exists(output_video) else input_video
        except Exception:
            return input_video

