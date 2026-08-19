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


def generate_elevenlabs_tts(text, output_path, api_key, gender="Male"):
    """Paid ElevenLabs Multilingual v2 API integration."""
    import urllib.request

    # ElevenLabs preset Voice IDs: Male (Adam) vs Female (Rachel)
    voice_id = "21m00Tcm4TlvDq8ikWAM" if gender == "Female" else "pNInz6obpgDQGcFmaJgB"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": api_key
    }
    data = json.dumps({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }).encode("utf-8")

    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req) as response:
        with open(output_path, "wb") as f:
            f.write(response.read())
    return output_path

def generate_voiceover(text, output_path, target_language="English", gender="Male", paid_key=None, paid_provider="ElevenLabs"):
    """
    Tiered TTS Generator with Gender Selection:
    Attempts paid provider (ElevenLabs / Azure) if key present. Cleanly falls back to Edge-TTS free engine.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)

    used_engine = "Free (Edge-TTS)"

    if paid_key and paid_key.strip():
        print(f"[TTS] Attempting paid engine ({paid_provider}) for {gender} voice...", flush=True)
        try:
            if paid_provider.lower() == "elevenlabs":
                generate_elevenlabs_tts(text, output_path, paid_key.strip(), gender=gender)
                used_engine = f"Paid ElevenLabs ({gender})"
                print(f"[TTS Success] Generated via ElevenLabs paid API.", flush=True)
                return {"output_path": output_path, "engine_used": used_engine}
        except Exception as e:
            print(f"[TTS Warning] Paid API failed ({str(e)}). Falling back to Free Edge-TTS engine...", flush=True)

    # Fallback to Edge-TTS free engine with specified gender
    asyncio.run(generate_edge_tts(text, output_path, language=target_language, gender=gender))
    return {"output_path": output_path, "engine_used": used_engine}

if __name__ == "__main__":
    out = "temp_test_tts.mp3"
    res = generate_voiceover("Hello, this is a test of DubCraft AI voiceover engine.", out, target_language="English", gender="Female")
    print(json.dumps(res, indent=2))

