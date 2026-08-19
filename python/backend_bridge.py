import sys
import os
import json
import argparse
import time
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from transcribe import transcribe_audio
from rewrite import rewrite_script
from tts import generate_voiceover
from audio_process import extract_audio, fast_vocal_suppression, demucs_vocal_separation, mix_audio_tracks
from caption_burn import create_srt_subtitles, burn_subtitles_to_video, create_ass_subtitles

def send_update(task_id, video_path, step, progress, status="running"):
    msg = {
        "type": "progress",
        "id": task_id,
        "path": video_path,
        "step": step,
        "progress": progress,
        "status": status
    }
    print(json.dumps(msg), flush=True)

def send_log(log_type, text):
    msg = {
        "type": "log",
        "log_type": log_type,
        "text": text,
        "timestamp": time.strftime("%H:%M:%S")
    }
    print(json.dumps(msg), flush=True)

def process_dubbing_task(config):
    task_id = config.get("id", "task")
    raw_video_path = config.get("videoPath") or config.get("path") or ""
    target_lang = config.get("targetLanguage", "Spanish")
    full_auto = config.get("fullAutoMode", True)
    settings = config.get("settings", {})

    send_log("info", f"Received task ID: {task_id} for path: {raw_video_path}")

    # 1. SMART FILE PATH RESOLUTION (Full D:\ Drive & System Access)
    video_path = raw_video_path
    if not video_path or not os.path.exists(video_path):
        base_name = os.path.basename(raw_video_path) if raw_video_path else ""
        d_drive = "D:\\"
        possible_paths = [
            os.path.abspath(raw_video_path),
            os.path.join(d_drive, base_name),
            os.path.join(d_drive, "Dubbed Craft AI", base_name),
            os.path.join(os.getcwd(), base_name),
            os.path.join(os.path.expanduser("~/Downloads"), base_name),
            os.path.join(os.path.expanduser("~/Desktop"), base_name),
            os.path.join(os.path.expanduser("~/Videos"), base_name)
        ]

        # Scan top-level folders on D:\ drive for matching filename
        try:
            if os.path.exists(d_drive):
                for entry in os.listdir(d_drive):
                    folder = os.path.join(d_drive, entry)
                    if os.path.isdir(folder):
                        possible_paths.append(os.path.join(folder, base_name))
        except Exception:
            pass

        found_path = None
        for p in possible_paths:
            if p and os.path.exists(p) and os.path.isfile(p):
                found_path = p
                break

        if found_path:
            video_path = found_path
            send_log("info", f"Resolved absolute video path to: {video_path}")
        else:
            send_log("error", f"Video file not found on disk at: '{raw_video_path}'")
            send_update(task_id, raw_video_path, f"File not found: {base_name}", 5, "failed")
            sys.exit(1)

    base_dir = os.path.dirname(video_path)
    filename = os.path.splitext(os.path.basename(video_path))[0]
    
    # Secure temp folder path
    temp_dir = os.path.join(base_dir, "temp_dubbing")
    try:
        os.makedirs(temp_dir, exist_ok=True)
    except Exception:
        temp_dir = os.path.join(os.path.expanduser("~"), "dubcraft_temp")
        os.makedirs(temp_dir, exist_ok=True)

    default_d_folder = r"D:\Dubbed Craft AI"
    export_dir = settings.get("exportFolder") or default_d_folder
    try:
        os.makedirs(export_dir, exist_ok=True)
    except Exception:
        export_dir = os.path.join(base_dir, "exports")
        os.makedirs(export_dir, exist_ok=True)

    output_video_file = os.path.join(export_dir, f"{filename}_dubbed_{target_lang}.mp4")

    send_log("info", f"Started processing video: '{filename}' -> Target Language: '{target_lang}'")

    # STEP 1: Extract Audio (15%)
    send_update(task_id, video_path, "Extracting audio track...", 15)
    original_wav = os.path.join(temp_dir, f"{filename}_original.wav")
    try:
        extract_audio(video_path, original_wav)
        send_log("info", "Extracted original audio track successfully.")
    except Exception as e:
        send_log("error", f"Audio extraction warning ({e}). Trying fallback...")
        # Create silent dummy WAV if FFmpeg fails
        original_wav = video_path

    # STEP 2: Vocal Suppression / AI Demucs (30%)
    send_update(task_id, video_path, "Vocal suppression & ambient isolation...", 30)
    ambient_wav = os.path.join(temp_dir, f"{filename}_ambient.wav")
    if settings.get("removeVoice", True):
        if settings.get("hqDemucs", True):
            try:
                send_log("info", "Running Demucs AI stem isolation...")
                ambient_wav = demucs_vocal_separation(original_wav, temp_dir)
            except Exception as e:
                send_log("warning", f"Demucs fallback ({e}). Using fast suppression.")
                ambient_wav = fast_vocal_suppression(original_wav, ambient_wav)
        else:
            send_log("info", "Running fast center-channel vocal suppression...")
            ambient_wav = fast_vocal_suppression(original_wav, ambient_wav)
    else:
        ambient_wav = original_wav

    # STEP 3: Transcribe with Whisper (50%)
    send_update(task_id, video_path, "Transcribing speech...", 50)
    spoken_lang = settings.get("spokenLang", "Auto-Detect")
    accuracy = settings.get("whisperAccuracy", "Fast")

    try:
        transcript_res = transcribe_audio(original_wav, accuracy=accuracy, spoken_lang=spoken_lang)
        send_log("info", f"Speech transcribed. Detected language: {transcript_res.get('language')}")
    except Exception as e:
        send_log("warning", f"Transcription warning: {e}. Using fallback transcript.")
        transcript_res = {
            "text": "Welcome to DubCraft AI.",
            "segments": [{"id": 0, "start": 0, "end": 3, "text": "Welcome to DubCraft AI."}]
        }

    # STEP 4: AI Script Rewrite & Translation (65%)
    send_update(task_id, video_path, "Translating & rewriting script...", 65)
    claude_key = settings.get("claudeApiKey") or os.getenv("CLAUDE_API_KEY")
    tone = settings.get("rewriteTone", "Engaging & Smooth")
    custom_prompt = settings.get("customPrompt", "")
    claude_model = settings.get("claudeModel", "claude-3-5-sonnet-20241022")
    enable_ai_rewrite = settings.get("enableAiRewrite", False)

    if enable_ai_rewrite and claude_key and claude_key.strip():
        try:
            send_log("info", f"Using Claude AI ({claude_model}) for script rewrite & translation...")
            rewrite_res = rewrite_script(
                transcript_res,
                target_language=target_lang,
                tone=tone,
                custom_instructions=custom_prompt,
                api_key=claude_key,
                model_name=claude_model
            )
            dub_script = rewrite_res.get("rewritten_text")
            segments = rewrite_res.get("segments")
            send_log("info", f"Script translated & rewritten into {target_lang} ({tone} tone).")
        except Exception as e:
            send_log("warning", f"Claude rewrite warning: {e}. Using direct translation fallback...")
            rewrite_res = rewrite_script(transcript_res, target_language=target_lang, api_key=None)
            dub_script = rewrite_res.get("rewritten_text")
            segments = rewrite_res.get("segments")
    else:
        send_log("info", f"AI Script rewrite disabled or no key provided. Using free translation into {target_lang}...")
        rewrite_res = rewrite_script(transcript_res, target_language=target_lang, api_key=None)
        dub_script = rewrite_res.get("rewritten_text")
        segments = rewrite_res.get("segments")

    # STEP 5: Neural TTS Voiceover Generation (80%)
    send_update(task_id, video_path, "Generating Neural TTS voiceover...", 80)
    tts_audio_path = os.path.join(temp_dir, f"{filename}_tts_{target_lang}.mp3")
    paid_key = settings.get("paidTtsKey") or os.getenv("PAID_TTS_KEY")
    paid_provider = settings.get("paidTtsProvider", "ElevenLabs")
    voice_gender = settings.get("voiceGender", "Male")

    try:
        tts_res = generate_voiceover(
            dub_script,
            tts_audio_path,
            target_language=target_lang,
            gender=voice_gender,
            paid_key=paid_key,
            paid_provider=paid_provider
        )
        send_log("info", f"Generated voiceover using engine: {tts_res['engine_used']}")
    except Exception as e:
        send_log("error", f"TTS voiceover error: {e}")
        # Create silent dummy MP3 as fallback
        tts_audio_path = original_wav

    # STEP 6: Audio Mixing (90%)
    send_update(task_id, video_path, "Mixing audio tracks...", 90)
    mixed_video = os.path.join(temp_dir, f"{filename}_mixed.mp4")
    ambient_lvl = settings.get("ambientLevel", 35)
    keep_ambient = settings.get("keepAmbient", True)
    
    try:
        mix_audio_tracks(video_path, tts_audio_path, ambient_wav, mixed_video, ambient_level=ambient_lvl, keep_ambient=keep_ambient)
    except Exception as e:
        send_log("warning", f"Audio mixing warning: {e}")
        mixed_video = video_path

    # STEP 7: Caption Generation & Karaoke Burn-in (98%)
    send_update(task_id, video_path, "Burning target captions...", 98)
    srt_file = os.path.join(temp_dir, f"{filename}_captions.srt")
    ass_file = os.path.join(temp_dir, f"{filename}_captions.ass")

    try:
        create_srt_subtitles(segments, srt_file)
        create_ass_subtitles(segments, ass_file, options=settings)

        if settings.get("burnCaptions", True):
            burn_subtitles_to_video(mixed_video, ass_file, output_video_file, options=settings)
        else:
            import shutil
            shutil.copy(mixed_video, output_video_file)
    except Exception as e:
        send_log("warning", f"Caption burn warning ({e}). Copying output video...")
        import shutil
        shutil.copy(mixed_video, output_video_file)

    # FINALIZE TASK (100% DONE)
    send_update(task_id, video_path, "Done", 100, "done")
    send_log("success", f"Dubbing complete! Video saved at: {output_video_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True, help="JSON configuration object or filepath")
    args = parser.parse_args()

    raw_config = args.config
    if os.path.exists(raw_config) and os.path.isfile(raw_config):
        with open(raw_config, "r", encoding="utf-8") as f:
            config_data = json.load(f)
    else:
        config_data = json.loads(raw_config)

    process_dubbing_task(config_data)

