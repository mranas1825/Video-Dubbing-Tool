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

def extract_audio(video_path, output_audio_path):
    """Extracts original audio track from video as WAV."""
    cmd = [
        get_ffmpeg_cmd(), "-y",
        "-i", video_path,
        "-vn", "-acodec", "pcm_s16le", "-ar", "44100", "-ac", "2",
        output_audio_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return output_audio_path

def fast_vocal_suppression(audio_path, output_ambient_path):
    """
    Fast center-channel vocal suppression filter in FFmpeg.
    Inverts center panning to remove mono dialogue while keeping ambient stereo sound.
    """
    cmd = [
        get_ffmpeg_cmd(), "-y",
        "-i", audio_path,
        "-af", "pan=stereo|c0=c0-c1|c1=c1-c0,highpass=f=200,lowpass=f=12000",
        output_ambient_path
    ]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return output_ambient_path
    except Exception as e:
        print(f"[Vocal Suppression Warning] Fast suppression filter error: {e}", flush=True)
        return audio_path

def demucs_vocal_separation(audio_path, output_dir):
    """
    Demucs AI high-quality stem separation.
    Separates audio into vocals and background (no_vocals).
    Auto-falls back to fast vocal suppression on error/timeout.
    """
    os.makedirs(output_dir, exist_ok=True)
    try:
        import torch
        device_arg = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[Demucs AI] Starting Vocal Separation on Device: '{device_arg.upper()}'...", flush=True)
        cmd = [
            sys.executable, "-m", "demucs.separate",
            "--two-stems", "vocals",
            "-d", device_arg,
            "-o", output_dir,
            audio_path
        ]
        # Run Demucs with 60 second timeout
        subprocess.run(cmd, check=True, timeout=60, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)



        # Locate separated background track
        base_name = os.path.splitext(os.path.basename(audio_path))[0]
        demucs_out_no_vocals = os.path.join(output_dir, "htdemucs", base_name, "no_vocals.wav")

        if os.path.exists(demucs_out_no_vocals):
            print("[Demucs Success] HQ Background stem isolated.", flush=True)
            return demucs_out_no_vocals
        else:
            raise FileNotFoundError("Demucs output file not found")
    except Exception as e:
        print(f"[Demucs Fallback] Demucs failed or timed out ({str(e)}). Falling back to Fast Vocal Suppression...", flush=True)
        fallback_path = os.path.join(output_dir, "fast_ambient_fallback.wav")
        return fast_vocal_suppression(audio_path, fallback_path)

def mix_audio_tracks(original_video, new_tts_audio, ambient_track, output_video, ambient_level=40, keep_ambient=True):
    """
    Mixes new TTS voiceover with controlled ambient background audio and embeds back into video.
    Guarantees completion with 15s subprocess timeout.
    """
    vol_factor = (ambient_level / 100.0) if keep_ambient else 0.0

    if not keep_ambient or vol_factor == 0.0 or not os.path.exists(ambient_track):
        cmd = [
            get_ffmpeg_cmd(), "-y",
            "-i", original_video,
            "-i", new_tts_audio,
            "-c:v", "copy",
            "-c:a", "aac",
            "-map", "0:v:0",
            "-map", "1:a:0",
            output_video
        ]
        try:
            subprocess.run(cmd, check=True, timeout=15, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"[Audio Overlay Warning] {e}. Using simple overlay...", flush=True)
            fallback_cmd = [
                get_ffmpeg_cmd(), "-y",
                "-i", original_video,
                "-i", new_tts_audio,
                "-c:v", "copy",
                "-c:a", "aac",
                output_video
            ]
            subprocess.run(fallback_cmd, check=True, timeout=15, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    else:
        try:
            filter_complex = f"[1:a]volume=1.0[tts];[2:a]volume={vol_factor:.2f}[amb];[tts][amb]amix=inputs=2:duration=first[aout]"
            cmd = [
                get_ffmpeg_cmd(), "-y",
                "-i", original_video,
                "-i", new_tts_audio,
                "-i", ambient_track,
                "-filter_complex", filter_complex,
                "-map", "0:v:0",
                "-map", "[aout]",
                "-c:v", "copy",
                "-c:a", "aac",
                output_video
            ]
            subprocess.run(cmd, check=True, timeout=15, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as e:
            print(f"[Audio Mix Complex Notice] {e}. Overlaying clean TTS track...", flush=True)
            fallback_cmd = [
                get_ffmpeg_cmd(), "-y",
                "-i", original_video,
                "-i", new_tts_audio,
                "-c:v", "copy",
                "-c:a", "aac",
                "-map", "0:v:0",
                "-map", "1:a:0",
                output_video
            ]
            subprocess.run(fallback_cmd, check=True, timeout=15, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return output_video




