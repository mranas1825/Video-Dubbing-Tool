import os
import sys
import json
import asyncio


# Comprehensive Microsoft Edge-TTS Neural Voice Mapping (Male & Female for 45+ World Languages)
EDGE_TTS_VOICE_MAP = {
    "English": {
        "Male": "en-US-ChristopherNeural",
        "Female": "en-US-AvaNeural"
    },
    "Urdu": {
        "Male": "ur-PK-AsadNeural",
        "Female": "ur-PK-UzmaNeural"
    },
    "Hindi": {
        "Male": "hi-IN-MadhurNeural",
        "Female": "hi-IN-SwaraNeural"
    },
    "Arabic": {
        "Male": "ar-SA-HamedNeural",
        "Female": "ar-SA-ZariyahNeural"
    },
    "Spanish": {
        "Male": "es-ES-AlvaroNeural",
        "Female": "es-ES-ElviraNeural"
    },
    "French": {
        "Male": "fr-FR-HenriNeural",
        "Female": "fr-FR-DeniseNeural"
    },
    "German": {
        "Male": "de-DE-KillianNeural",
        "Female": "de-DE-KatjaNeural"
    },
    "Portuguese": {
        "Male": "pt-BR-AntonioNeural",
        "Female": "pt-BR-FranciscaNeural"
    },
    "Russian": {
        "Male": "ru-RU-DmitryNeural",
        "Female": "ru-RU-SvetlanaNeural"
    },
    "Turkish": {
        "Male": "tr-TR-AhmetNeural",
        "Female": "tr-TR-EmelNeural"
    },
    "Indonesian": {
        "Male": "id-ID-ArdiNeural",
        "Female": "id-ID-GadisNeural"
    },
    "Chinese (Mandarin)": {
        "Male": "zh-CN-YunxiNeural",
        "Female": "zh-CN-XiaoxiaoNeural"
    },
    "Japanese": {
        "Male": "ja-JP-KeitaNeural",
        "Female": "ja-JP-NanamiNeural"
    },
    "Korean": {
        "Male": "ko-KR-InJoonNeural",
        "Female": "ko-KR-SunHiNeural"
    },
    "Italian": {
        "Male": "it-IT-DiegoNeural",
        "Female": "it-IT-ElsaNeural"
    },
    "Dutch": {
        "Male": "nl-NL-MaartenNeural",
        "Female": "nl-NL-ColetteNeural"
    },
    "Polish": {
        "Male": "pl-PL-MarekNeural",
        "Female": "pl-PL-ZofiaNeural"
    },
    "Swedish": {
        "Male": "sv-SE-MattiasNeural",
        "Female": "sv-SE-SofieNeural"
    },
    "Ukrainian": {
        "Male": "uk-UA-OstapNeural",
        "Female": "uk-UA-PolinaNeural"
    },
    "Vietnamese": {
        "Male": "vi-VN-NamMinhNeural",
        "Female": "vi-VN-HoaiMyNeural"
    },
    "Thai": {
        "Male": "th-TH-NiwatNeural",
        "Female": "th-TH-PremwadeeNeural"
    },
    "Bengali": {
        "Male": "bn-IN-BashkarNeural",
        "Female": "bn-IN-TanishaaNeural"
    },
    "Punjabi": {
        "Male": "pa-IN-GurpreetNeural",
        "Female": "pa-IN-OjasNeural"
    },
    "Tamil": {
        "Male": "ta-IN-ValluvarNeural",
        "Female": "ta-IN-[#1]PallaviNeural"
    },
    "Telugu": {
        "Male": "te-IN-MohanNeural",
        "Female": "te-IN-ShrutiNeural"
    },
    "Marathi": {
        "Male": "mr-IN-ManoharNeural",
        "Female": "mr-IN-AarohiNeural"
    },
    "Gujarati": {
        "Male": "gu-IN-NiranjanNeural",
        "Female": "gu-IN-DhwaniNeural"
    },
    "Persian (Farsi)": {
        "Male": "fa-IR-FaridNeural",
        "Female": "fa-IR-DilaraNeural"
    },
    "Swahili": {
        "Male": "sw-KE-RafikiNeural",
        "Female": "sw-KE-ZuriNeural"
    },
    "Tagalog (Filipino)": {
        "Male": "fil-PH-AngeloNeural",
        "Female": "fil-PH-BlessicaNeural"
    },
    "Romanian": {
        "Male": "ro-RO-EmilNeural",
        "Female": "ro-RO-AlinaNeural"
    },
    "Czech": {
        "Male": "cs-CZ-AntoninNeural",
        "Female": "cs-CZ-[#1]VlastaNeural"
    },
    "Greek": {
        "Male": "el-GR-NestorasNeural",
        "Female": "el-GR-AthinaNeural"
    },
    "Hungarian": {
        "Male": "hu-HU-TamásNeural",
        "Female": "hu-HU-NoemiNeural"
    },
    "Danish": {
        "Male": "da-DK-JeppeNeural",
        "Female": "da-DK-ChristelNeural"
    },
    "Finnish": {
        "Male": "fi-FI-HarriNeural",
        "Female": "fi-FI-NooraNeural"
    },
    "Norwegian": {
        "Male": "no-NO-FinnNeural",
        "Female": "no-NO-PernilleNeural"
    },
    "Hebrew": {
        "Male": "he-IL-AvriNeural",
        "Female": "he-IL-HilaNeural"
    },
    "Malay": {
        "Male": "ms-MY-OsmanNeural",
        "Female": "ms-MY-YasminNeural"
    },
    "Slovak": {
        "Male": "sk-SK-LukasNeural",
        "Female": "sk-SK-ViktoriaNeural"
    },
    "Bulgarian": {
        "Male": "bg-BG-BorislavNeural",
        "Female": "bg-BG-KalinaNeural"
    },
    "Croatian": {
        "Male": "hr-HR-SreckoNeural",
        "Female": "hr-HR-GabrijelaNeural"
    },
    "Serbian": {
        "Male": "sr-RS-NicholasNeural",
        "Female": "sr-RS-[#1]SophieNeural"
    },
    "Kannada": {
        "Male": "kn-IN-GaganNeural",
        "Female": "kn-IN-SapnaNeural"
    },
    "Malayalam": {
        "Male": "ml-IN-MidhunNeural",
        "Female": "ml-IN-SobhanaNeural"
    }
}

async def generate_edge_tts(text, output_path, language="English", gender="Male"):
    try:
        import edge_tts
    except ImportError:
        print("[TTS Error] Missing 'edge-tts' package. Please run: pip install edge-tts", flush=True)
        raise RuntimeError("Missing 'edge-tts' Python dependency.")

    lang_voices = EDGE_TTS_VOICE_MAP.get(language, EDGE_TTS_VOICE_MAP["English"])
    voice = lang_voices.get(gender, lang_voices.get("Male", "en-US-ChristopherNeural"))
    print(f"[TTS Engine] Generating free Edge-TTS neural voiceover in '{language}' ({gender}) using voice '{voice}'...", flush=True)
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_path)
    return output_path


def generate_elevenlabs_tts(text, output_path, api_key, voice_id=None, gender="Male"):
    """Paid ElevenLabs Multilingual v2 API integration."""
    import urllib.request
    import urllib.error

    if not voice_id or not voice_id.strip():
        voice_id = "21m00Tcm4TlvDq8ikWAM" if gender == "Female" else "pNInz6obpgDQGcFmaJgB"
    
    voice_id = voice_id.strip()
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key.strip()
    }
    data = json.dumps({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as response:
            with open(output_path, "wb") as f:
                f.write(response.read())
        return output_path
    except urllib.error.HTTPError as e:
        if e.code == 402:
            raise RuntimeError("ElevenLabs credits exhausted for this account — switch to Free TTS or upgrade your ElevenLabs plan.")
        elif e.code == 401:
            raise RuntimeError("Invalid ElevenLabs API Key — please check your credentials.")
        elif e.code == 404:
            raise RuntimeError(f"ElevenLabs Voice ID '{voice_id}' not found.")
        else:
            raise RuntimeError(f"ElevenLabs API Error ({e.code}): {e.reason}")


def generate_voiceover(text, output_path, target_language="English", gender="Male", paid_key=None, paid_provider="ElevenLabs", voice_id=None, use_elevenlabs=False):
    """
    Tiered TTS Generator with Gender Selection & ElevenLabs Support:
    Attempts ElevenLabs if enabled and key present. Cleanly falls back to Edge-TTS free engine.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    used_engine = f"Free Edge-TTS ({gender})"

    if (use_elevenlabs or paid_provider.lower() == "elevenlabs") and paid_key and paid_key.strip():
        print(f"[TTS] Attempting ElevenLabs API (Voice ID: '{voice_id or 'Preset'}')...", flush=True)
        try:
            generate_elevenlabs_tts(text, output_path, paid_key.strip(), voice_id=voice_id, gender=gender)
            used_engine = f"Paid ElevenLabs ({voice_id or gender})"
            print(f"[TTS Success] Generated via ElevenLabs API.", flush=True)
            return {"output_path": output_path, "engine_used": used_engine}
        except Exception as e:
            print(f"[TTS Warning] ElevenLabs API failed ({str(e)}). Falling back to Free Edge-TTS engine...", flush=True)

    # Fallback to Edge-TTS free engine with specified gender
    asyncio.run(generate_edge_tts(text, output_path, language=target_language, gender=gender))
    return {"output_path": output_path, "engine_used": used_engine}


def load_audio_file_safe(file_path):
    """
    Loads audio file safely into pydub AudioSegment. Uses PyAV as robust zero-dependency fallback on Windows if ffprobe is missing.
    """
    import pydub
    from pydub import AudioSegment
    try:
        return AudioSegment.from_file(file_path)
    except Exception:
        import av
        container = av.open(file_path)
        stream = container.streams.audio[0]
        resampler = av.AudioResampler(format='s16', layout='stereo', rate=44100)
        raw_bytes = bytearray()
        for frame in container.decode(stream):
            for r_frame in resampler.resample(frame):
                raw_bytes.extend(r_frame.to_ndarray().tobytes())
        return AudioSegment(bytes(raw_bytes), sample_width=2, frame_rate=44100, channels=2)


def generate_segment_aligned_voiceover(
    segments,
    output_path,
    target_language="English",
    gender="Male",
    video_duration=0.0,
    paid_key=None,
    paid_provider="ElevenLabs",
    voice_id=None,
    use_elevenlabs=False
):
    """
    Generates segment-by-segment TTS audio and aligns each segment to its exact timestamp on a master audio timeline.
    Pads silence between speech segments so dubbed audio plays continuously for the FULL video duration.
    """
    import pydub
    import imageio_ffmpeg
    from pydub import AudioSegment

    try:
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        os.environ["PATH"] = os.path.dirname(ffmpeg_exe) + os.pathsep + os.environ.get("PATH", "")
        AudioSegment.converter = ffmpeg_exe
    except Exception:
        pass

    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    temp_dir = os.path.join(os.path.dirname(os.path.abspath(output_path)), "tts_segments_temp")
    os.makedirs(temp_dir, exist_ok=True)

    if not segments:
        print("[TTS Warning] No segments provided for alignment. Using continuous text fallback...", flush=True)
        return generate_voiceover("Welcome to DubCraft AI.", output_path, target_language, gender, paid_key, paid_provider, voice_id=voice_id, use_elevenlabs=use_elevenlabs)

    # Calculate total master audio timeline duration (in ms)
    last_seg_end = segments[-1].get("end", 0.0) if segments else 0.0
    master_duration_sec = max(video_duration, last_seg_end + 1.0)
    master_duration_ms = int(master_duration_sec * 1000)

    print(f"[TTS Segment Alignment] Processing {len(segments)} segment(s)... Target Audio Timeline Duration: {master_duration_sec:.2f}s", flush=True)

    master_audio = AudioSegment.silent(duration=master_duration_ms)
    used_engines = set()

    for idx, seg in enumerate(segments):
        seg_text = seg.get("text", "").strip()
        if not seg_text:
            continue

        seg_start_ms = max(0, int(seg.get("start", 0.0) * 1000))
        seg_end_ms = int(seg.get("end", 0.0) * 1000)

        seg_temp_path = os.path.join(temp_dir, f"seg_{idx:03d}.mp3")

        try:
            res = generate_voiceover(
                seg_text,
                seg_temp_path,
                target_language=target_language,
                gender=gender,
                paid_key=paid_key,
                paid_provider=paid_provider,
                voice_id=voice_id,
                use_elevenlabs=use_elevenlabs
            )
            used_engines.add(res.get("engine_used", "Free (Edge-TTS)"))

            if os.path.exists(seg_temp_path):
                seg_audio = load_audio_file_safe(seg_temp_path)
                seg_audio_len_ms = len(seg_audio)

                # Expand master timeline if segment exceeds current length
                needed_length = seg_start_ms + seg_audio_len_ms
                if needed_length > len(master_audio):
                    master_audio = master_audio + AudioSegment.silent(duration=needed_length - len(master_audio))

                # Overlay segment audio at its exact timestamp
                master_audio = master_audio.overlay(seg_audio, position=seg_start_ms)
                print(f"  [Segment {idx+1}/{len(segments)}] Timestamp: {seg.get('start', 0.0):.2f}s -> {seg.get('end', 0.0):.2f}s | TTS Clip Duration: {seg_audio_len_ms/1000.0:.2f}s | Text: \"{seg_text[:40]}\"", flush=True)

                # Clean up segment temp file
                try:
                    os.remove(seg_temp_path)
                except Exception:
                    pass
        except Exception as seg_err:
            print(f"  [Segment {idx+1} Warning] Failed to generate segment TTS ({seg_err}). Continuing...", flush=True)

    # Ensure master audio matches or exceeds full video duration
    if video_duration > 0 and len(master_audio) < int(video_duration * 1000):
        master_audio = master_audio + AudioSegment.silent(duration=int(video_duration * 1000) - len(master_audio))

    master_audio.export(output_path, format="mp3")
    final_duration_sec = len(master_audio) / 1000.0
    print(f"[TTS Alignment Success] Exported master dubbed audio track ({final_duration_sec:.2f}s) to: '{output_path}'", flush=True)

    # Clean up temp folder
    try:
        os.rmdir(temp_dir)
    except Exception:
        pass

    return {
        "output_path": output_path,
        "engine_used": ", ".join(used_engines) if used_engines else "Free (Edge-TTS)",
        "duration_sec": final_duration_sec
    }


if __name__ == "__main__":
    out = "temp_test_tts.mp3"
    res = generate_voiceover("Hello, this is a test of DubCraft AI voiceover engine.", out, target_language="English", gender="Female")
    print(json.dumps(res, indent=2))


