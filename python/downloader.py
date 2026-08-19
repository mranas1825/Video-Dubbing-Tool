import sys
import os
import argparse
import json
import yt_dlp

def download_video(url, output_dir="downloads"):
    os.makedirs(output_dir, exist_ok=True)
    outtmpl = os.path.join(output_dir, '%(title)s.%(ext)s')

    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': outtmpl,
        'quiet': True,
        'no_warnings': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
            if not os.path.exists(filename):
                # Try replacing extension if yt-dlp merged into mp4
                base, _ = os.path.splitext(filename)
                if os.path.exists(base + ".mp4"):
                    filename = base + ".mp4"

            res = {
                "success": True,
                "filePath": os.path.abspath(filename),
                "title": info.get('title', 'Video'),
                "duration": info.get('duration', 0)
            }
            print(json.dumps(res))
            return res
    except Exception as e:
        err = {"success": False, "error": str(e)}
        print(json.dumps(err), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download video from link via yt-dlp")
    parser.add_argument("--url", required=True, help="Video URL (YouTube/TikTok)")
    args = parser.parse_args()

    download_video(args.url)
