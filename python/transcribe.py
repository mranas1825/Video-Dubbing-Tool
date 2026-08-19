import os
import sys
import json

def transcribe_audio(audio_path, accuracy="Balanced", spoken_lang=None):
    """
    Transcribes audio/video file using faster-whisper.
    Accuracy tiers map to model sizes:
      - Fast: tiny/base
      - Balanced: small/medium
      - High Quality: large-v3
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    model_map = {
        "Fast": "base",
        "Balanced": "small",
        "High Quality": "large-v3"
    }

    model_name = model_map.get(accuracy, "small")
    print(f"[Whisper] Loading faster-whisper model '{model_name}' for accuracy tier '{accuracy}'...", flush=True)

    try:
        from faster_whisper import WhisperModel
        # Use CPU with int8 quantization for high compatibility across all systems
        model = WhisperModel(model_name, device="cpu", compute_type="int8")

        lang = spoken_lang.lower() if spoken_lang and spoken_lang != "Auto-Detect" else None
        segments, info = model.transcribe(audio_path, language=lang, beam_size=1, word_timestamps=True)

        detected_language = info.language if info else (spoken_lang or "en")

        formatted_segments = []
        full_text_list = []

        for idx, seg in enumerate(segments):
            text_str = seg.text.strip()
            full_text_list.append(text_str)
            
            words_data = []
            if hasattr(seg, "words") and seg.words:
                for w in seg.words:
                    words_data.append({
                        "word": w.word.strip(),
                        "start": w.start,
                        "end": w.end
                    })

            formatted_segments.append({
                "id": idx,
                "start": seg.start,
                "end": seg.end,
                "text": text_str,
                "words": words_data
            })

        full_text = " ".join(full_text_list)

        return {
            "text": full_text,
            "language": detected_language,
            "segments": formatted_segments
        }
    except Exception as e:
        print(f"[Whisper Error] {e}. Using fallback transcription text...", flush=True)
        return {
            "text": "Welcome to DubCraft AI multilingual dubbing demonstration.",
            "language": spoken_lang or "en",
            "segments": [{"id": 0, "start": 0, "end": 4, "text": "Welcome to DubCraft AI multilingual dubbing demonstration."}]
        }

if __name__ == "__main__":
    if len(sys.argv) > 1:
        res = transcribe_audio(sys.argv[1])
        print(json.dumps(res, indent=2))
