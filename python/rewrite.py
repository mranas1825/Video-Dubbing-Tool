import os
import sys
import json
import urllib.request
import urllib.parse


def translate_free_google(text, target_language="Spanish"):
    """
    Free Google Translate API fallback (0-dependency, no API key required).
    Translates text directly into target language for seamless free dubbing.
    """
    if not text or not text.strip():
        return text

    lang_code_map = {
        "English": "en", "Urdu": "ur", "Hindi": "hi", "Arabic": "ar", "Spanish": "es",
        "French": "fr", "German": "de", "Portuguese": "pt", "Russian": "ru", "Turkish": "tr",
        "Indonesian": "id", "Chinese (Mandarin)": "zh-CN", "Japanese": "ja", "Korean": "ko",
        "Italian": "it", "Dutch": "nl", "Polish": "pl", "Swedish": "sv", "Ukrainian": "uk",
        "Vietnamese": "vi", "Thai": "th", "Bengali": "bn", "Punjabi": "pa", "Tamil": "ta",
        "Telugu": "te", "Marathi": "mr", "Gujarati": "gu", "Persian (Farsi)": "fa",
        "Swahili": "sw", "Tagalog (Filipino)": "tl", "Romanian": "ro", "Czech": "cs",
        "Greek": "el", "Hungarian": "hu", "Danish": "da", "Finnish": "fi", "Norwegian": "no",
        "Hebrew": "he", "Malay": "ms", "Slovak": "sk", "Bulgarian": "bg", "Croatian": "hr",
        "Serbian": "sr", "Kannada": "kn", "Malayalam": "ml"
    }

    target_code = lang_code_map.get(target_language, "es")

    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_code}&dt=t&q={urllib.parse.quote(text)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            translated_chunks = [item[0] for item in res_data[0] if item and item[0]]
            return "".join(translated_chunks)
    except Exception as e:
        print(f"[Free Translation Warning] {e}", flush=True)
        return text

def rewrite_script(
    transcript_data,
    target_language="Spanish",
    tone="Engaging & Smooth",
    custom_instructions="",
    api_key=None,
    model_name="claude-3-5-sonnet-20241022"
):
    """
    Translates and rewrites original transcript into target language.
    Uses Claude API if key present & enabled. Falls back to free Google Translation if disabled/no key.
    """
    effective_api_key = api_key or os.getenv("CLAUDE_API_KEY") or os.getenv("ANTHROPIC_API_KEY")

    original_text = transcript_data.get("text", "")
    segments = transcript_data.get("segments", [])

    if not effective_api_key or not effective_api_key.strip():
        print(f"[Free Translation] No Claude API key. Translating directly to '{target_language}' via Free Translator...", flush=True)
        translated_text = translate_free_google(original_text, target_language)
        
        translated_segments = []
        for seg in segments:
            seg_text = seg.get("text", "")
            trans_seg = translate_free_google(seg_text, target_language)
            new_seg = dict(seg)
            new_seg["text"] = trans_seg
            translated_segments.append(new_seg)

        return {
            "rewritten_text": translated_text,
            "segments": translated_segments,
            "note": "Free direct translation applied"
        }

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=effective_api_key)
    except ImportError:
        print("[Claude AI Warning] 'anthropic' package not installed. Using free translation fallback...", flush=True)
        translated_text = translate_free_google(original_text, target_language)
        translated_segments = []
        for seg in segments:
            seg_text = seg.get("text", "")
            trans_seg = translate_free_google(seg_text, target_language)
            new_seg = dict(seg)
            new_seg["text"] = trans_seg
            translated_segments.append(new_seg)
        return {
            "rewritten_text": translated_text,
            "segments": translated_segments,
            "note": "Free translation applied (anthropic package missing)"
        }

    prompt = f"""You are a professional video dubbing scriptwriter and translator.

Original Transcript:
"{original_text}"

Target Language: {target_language}
Desired Tone: {tone}
Custom Instructions: {custom_instructions if custom_instructions else "Ensure natural speech rhythm suitable for voiceover timing."}

Task:
1. Translate and rewrite the script into {target_language}.
2. Ensure the tone is {tone}.
3. Maintain accurate meaning while optimizing word count and rhythm for video voiceover.
4. Output a JSON object with:
   - "rewritten_text": Full translated & rewritten script as a continuous string.
   - "rewritten_segments": Array of rewritten segments matching the segment count and timing structure of the original segments.

Original Segment Timings:
{json.dumps([{ 'start': s['start'], 'end': s['end'], 'text': s.get('text', '') } for s in segments])}

Format output STRICTLY as valid JSON.
"""

    try:
        response = client.messages.create(
            model=model_name,
            max_tokens=4000,
            messages=[{"role": "user", "content": prompt}]
        )

        reply_content = response.content[0].text
        json_start = reply_content.find('{')
        json_end = reply_content.rfind('}') + 1
        if json_start != -1 and json_end != 0:
            parsed = json.loads(reply_content[json_start:json_end])
            return {
                "rewritten_text": parsed.get("rewritten_text", original_text),
                "segments": parsed.get("rewritten_segments", segments)
            }
        else:
            return {
                "rewritten_text": reply_content.strip(),
                "segments": segments
            }
    except Exception as e:
        print(f"[Claude AI Error] {str(e)}. Falling back to free direct translation...", flush=True)
        translated_text = translate_free_google(original_text, target_language)
        return {
            "rewritten_text": translated_text,
            "segments": segments,
            "error": str(e)
        }

if __name__ == "__main__":
    test_data = {"text": "Hello world, welcome to AI dubbing.", "segments": [{"start": 0, "end": 2, "text": "Hello world"}]}
    print(json.dumps(rewrite_script(test_data, target_language="Spanish"), indent=2))
