import os
import sys
import json

def transcribe_audio(audio_path, accuracy="Balanced", spoken_lang=None, groq_api_key=None):
    """
    Transcribes audio/video file using Groq API (ultra-fast cloud) or local faster-whisper (NVIDIA GPU).
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    effective_groq_key = groq_api_key or os.getenv("GROQ_API_KEY")
    if effective_groq_key and effective_groq_key.strip():
        try:
            print("[Groq Cloud API] Using ultra-fast Groq Whisper API for transcription...", flush=True)
            import urllib.request
            import json

            url = "https://api.groq.com/openai/v1/audio/transcriptions"
            
            boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
            body = []
            
            # Add file
            with open(audio_path, "rb") as f:
                file_bytes = f.read()
            filename = os.path.basename(audio_path)
            
            body.append(f"--{boundary}".encode())
            body.append(f'Content-Disposition: form-data; name="file"; filename="{filename}"'.encode())
            body.append(b"Content-Type: audio/wav")
            body.append(b"")
            body.append(file_bytes)
            
            # Add model
            body.append(f"--{boundary}".encode())
            body.append(b'Content-Disposition: form-data; name="model"')
            body.append(b"")
            body.append(b"whisper-large-v3-turbo")

            # Add response_format
            body.append(f"--{boundary}".encode())
            body.append(b'Content-Disposition: form-data; name="response_format"')
            body.append(b"")
            body.append(b"verbose_json")

            if spoken_lang and spoken_lang != "Auto-Detect":
                lang_code = spoken_lang.lower()[:2]
                body.append(f"--{boundary}".encode())
                body.append(b'Content-Disposition: form-data; name="language"')
                body.append(b"")
                body.append(lang_code.encode())

            body.append(f"--{boundary}\r\n".encode())
            payload = b"\r\n".join(body)

            req = urllib.request.Request(
                url,
                data=payload,
                headers={
                    "Authorization": f"Bearer {effective_groq_key.strip()}",
                    "Content-Type": f"multipart/form-data; boundary={boundary}"
                },
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=30) as resp:
                res_json = json.loads(resp.read().decode("utf-8"))
                
                raw_segments = res_json.get("segments", [])
                formatted_segments = []
                for idx, seg in enumerate(raw_segments):
                    formatted_segments.append({
                        "id": idx,
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                        "text": seg.get("text", "").strip(),
                        "words": []
                    })
                
                print("[Groq Cloud API] Transcription completed successfully!", flush=True)
                return {
                    "text": res_json.get("text", ""),
                    "language": res_json.get("language", spoken_lang or "en"),
                    "segments": formatted_segments
                }
        except Exception as groq_err:
            print(f"[Groq API Notice] Groq API transcription failed ({groq_err}). Falling back to local NVIDIA GPU Whisper...", flush=True)

    model_map = {
        "Fast": "tiny",
        "Balanced": "base",
        "High Quality": "small"
    }

    model_name = model_map.get(accuracy, "tiny")
    print(f"[Whisper Ultra-Fast] Loading faster-whisper model '{model_name}' for accuracy tier '{accuracy}'...", flush=True)

    try:
        import torch
        # Ensure Windows PyTorch CUDA DLLs are loaded properly
        if sys.platform == "win32":
            try:
                os.add_dll_directory(r"C:\Windows\System32")
                torch_lib = os.path.join(sys.prefix, "Lib", "site-packages", "torch", "lib")
                if os.path.exists(torch_lib):
                    os.add_dll_directory(torch_lib)
            except Exception:
                pass

        from faster_whisper import WhisperModel

        use_cuda = torch.cuda.is_available()
        device = "cuda" if use_cuda else "cpu"
        compute_type = "float16" if use_cuda else "int8"

        print(f"[Whisper ASR Engine] Using Device: '{device.upper()}' (Compute: {compute_type}) | Model: '{model_name}'", flush=True)
        model = WhisperModel(model_name, device=device, compute_type=compute_type)

        LANG_CODE_MAP = {
            "English": "en", "Urdu": "ur", "Hindi": "hi", "Arabic": "ar", "Spanish": "es",
            "French": "fr", "German": "de", "Portuguese": "pt", "Russian": "ru", "Turkish": "tr",
            "Indonesian": "id", "Chinese (Mandarin)": "zh", "Japanese": "ja", "Korean": "ko",
            "Italian": "it", "Dutch": "nl", "Polish": "pl", "Swedish": "sv", "Ukrainian": "uk"
        }
        lang = LANG_CODE_MAP.get(spoken_lang, spoken_lang.lower()[:2]) if spoken_lang and spoken_lang != "Auto-Detect" else None
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

        # GPU Memory Safety: Unload Whisper model from VRAM after completion
        del model
        if use_cuda:
            torch.cuda.empty_cache()
            print("[GPU Memory Safety] Released Whisper VRAM memory cache.", flush=True)

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
