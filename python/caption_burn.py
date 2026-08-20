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
    Generates ASS (Advanced SubStation Alpha) subtitles supporting CapCut-style preset models:
    - classic_white: Plain white bold text, no background box
    - yellow_stroke: Vibrant yellow bold text with thick black stroke outline
    - white_box: White text with solid black background box
    - teal_karaoke: Teal/Cyan background box with white text (karaoke word highlight)
    - bold_caps_box: All-caps bold text with dark background box
    """
    options = options or {}
    style_preset = options.get("captionStyle", "teal_karaoke")
    font_size = int(options.get("fontSize", 48))
    vertical_pos = int(options.get("verticalPosition", 78))
    karaoke = options.get("karaokeHighlight", True)
    font_name = options.get("fontName", "Arial Black")

    # MarginV calculated from 1080p resolution and percentage
    margin_v = int((100 - vertical_pos) * 10.8)

    # Style mapping for ASS: (PrimaryColour, HighlightColour, OutlineColour, BackColour, BorderStyle, Outline, Shadow)
    # Color format in ASS: &H[Alpha][Blue][Green][Red]
    style_configs = {
        "classic_white": {
            "font": "Arial Black",
            "primary": "&H00FFFFFF",    # Bold White
            "highlight": "&H0000FFFF",  # Yellow highlight
            "outline": "&H00000000",    # Black outline
            "back": "&H80000000",
            "border": 1, "outline_w": 2, "shadow_w": 1, "force_caps": False
        },
        "yellow_stroke": {
            "font": "Impact",
            "primary": "&H0000FFFF",    # Yellow
            "highlight": "&H00FFFFFF",  # White
            "outline": "&H00000000",    # Thick Black
            "back": "&H80000000",
            "border": 1, "outline_w": 4, "shadow_w": 2, "force_caps": True
        },
        "white_box": {
            "font": "Arial Black",
            "primary": "&H00FFFFFF",    # White
            "highlight": "&H0000FFFF",  # Yellow
            "outline": "&H00000000",
            "back": "&H00000000",       # Opaque black box
            "border": 3, "outline_w": 2, "shadow_w": 0, "force_caps": False
        },
        "teal_karaoke": {
            "font": "Arial Black",
            "primary": "&H00FFFFFF",    # White Text
            "highlight": "&H0000FFFF",  # Yellow word highlight
            "outline": "&H00000000",
            "back": "&H00D9B300",       # Solid Teal/Cyan Box (BGR: 00, B3, D9)
            "border": 3, "outline_w": 3, "shadow_w": 0, "force_caps": True
        },
        "bold_caps_box": {
            "font": "Trebuchet MS",
            "primary": "&H00FFFFFF",    # White
            "highlight": "&H0000FFFF",  # Yellow
            "outline": "&H00000000",
            "back": "&HCC111111",       # Dark box
            "border": 3, "outline_w": 2, "shadow_w": 0, "force_caps": True
        },

        # Backward compatibility fallbacks for legacy preset names
        "Hormozi Bold": {
            "font": "Arial Black", "primary": "&H00FFFFFF", "highlight": "&H0000FFFF",
            "outline": "&H00000000", "back": "&H80000000", "border": 1, "outline_w": 4, "shadow_w": 3, "force_caps": True
        },
        "Viral Yellow": {
            "font": "Impact", "primary": "&H0000FFFF", "highlight": "&H00FFFF00",
            "outline": "&H00000000", "back": "&H80000000", "border": 1, "outline_w": 3, "shadow_w": 2, "force_caps": True
        },
        "Cinema Box": {
            "font": "Arial Black", "primary": "&H00FFFFFF", "highlight": "&H0000FFFF",
            "outline": "&H00000000", "back": "&H00000000", "border": 3, "outline_w": 2, "shadow_w": 0, "force_caps": False
        }
    }

    cfg = style_configs.get(style_preset, style_configs["teal_karaoke"])
    active_font = cfg["font"] if font_name == "Komika Axis" else font_name
    force_caps = cfg.get("force_caps", False)

    os.makedirs(os.path.dirname(os.path.abspath(ass_path)), exist_ok=True)

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{active_font},{font_size},{cfg['primary']},{cfg['highlight']},{cfg['outline']},{cfg['back']},-1,0,0,0,100,100,0,0,{cfg['border']},{cfg['outline_w']},{cfg['shadow_w']},2,20,20,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""

    events = []
    for seg in segments:
        seg_start = seg.get("start", 0)
        seg_end = seg.get("end", 0)
        seg_text = seg.get("text", "").strip()
        if not seg_text:
            continue

        if force_caps:
            seg_text = seg_text.upper()

        words = seg.get("words", [])

        # If words list is missing or untranslated, generate synthetic word timings from segment text
        if karaoke and not words:
            raw_words = seg_text.split()
            if raw_words:
                total_duration = max(0.2, seg_end - seg_start)
                word_dur = total_duration / len(raw_words)
                words = []
                for w_idx, w_str in enumerate(raw_words):
                    w_s = seg_start + (w_idx * word_dur)
                    w_e = w_s + word_dur
                    words.append({"word": w_str, "start": w_s, "end": w_e})

        if karaoke and words:
            # Word-by-word Karaoke animation
            for idx, w in enumerate(words):
                w_start = format_ass_timestamp(w.get("start", seg_start))
                w_end = format_ass_timestamp(w.get("end", seg_end))
                
                # Build highlighted text line where current active word is highlighted
                line_parts = []
                for j, target_w in enumerate(words):
                    w_text = target_w.get("word", "").strip()
                    if force_caps:
                        w_text = w_text.upper()
                    if j == idx:
                        # Highlight current word in accent color
                        line_parts.append(f"{{\\c{cfg['highlight']}\\b1}}{w_text}{{\\r}}")
                    else:
                        line_parts.append(w_text)
                
                full_line = " ".join(line_parts)
                events.append(f"Dialogue: 0,{w_start},{w_end},Default,,0,0,0,,{full_line}")
        else:
            # Segment level caption
            s_start = format_ass_timestamp(seg_start)
            s_end = format_ass_timestamp(seg_end)
            events.append(f"Dialogue: 0,{s_start},{s_end},Default,,0,0,0,,{seg_text}")

    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events) + "\n")

    return ass_path


def burn_subtitles_to_video(input_video, srt_path, output_video, options=None):
    """
    Burns ASS/SRT captions directly into video using FFmpeg subtitle filter.
    If burnCaptions option is False, skips burn-in entirely and copies input_video.
    """
    options = options or {}
    if not options.get("burnCaptions", True):
        print("[Caption Burn-in] Subtitles disabled by user option. Copying clean video track...", flush=True)
        import shutil
        shutil.copy(input_video, output_video)
        return output_video

    ass_path = srt_path if srt_path.endswith(".ass") else srt_path.replace(".srt", ".ass")

    target_sub = ass_path if os.path.exists(ass_path) else srt_path
    if not os.path.exists(target_sub):
        import shutil
        shutil.copy(input_video, output_video)
        return output_video

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
            import shutil
            shutil.copy(input_video, output_video)
            return output_video

