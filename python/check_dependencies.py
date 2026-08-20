import sys
import importlib

REQUIRED_PACKAGES = [
    ("faster_whisper", "faster-whisper"),
    ("edge_tts", "edge-tts"),
    ("anthropic", "anthropic"),
    ("demucs", "demucs"),
    ("torch", "torch"),
    ("dotenv", "python-dotenv"),
    ("imageio_ffmpeg", "imageio-ffmpeg")
]

def check_all_dependencies():
    print("=" * 60)
    print("      DubCraft AI Studio — Python Dependency Checker")
    print("=" * 60)

    missing = []
    installed = []

    for mod_name, pkg_name in REQUIRED_PACKAGES:
        try:
            mod = importlib.import_module(mod_name)
            ver = getattr(mod, "__version__", "Installed")
            installed.append((pkg_name, ver))
            print(f"[OK] {pkg_name:<20} -> Version: {ver}")
        except ImportError:
            missing.append(pkg_name)
            print(f"[FAIL] {pkg_name:<18} -> MISSING")

    print("-" * 60)
    try:
        import torch
        if torch.cuda.is_available():
            print(f"[CUDA GPU OK] NVIDIA GPU Detected: '{torch.cuda.get_device_name(0)}'")
        else:
            print("[CUDA GPU WARN] Running on CPU mode (CUDA unavailable)")
    except Exception:
        pass
    print("-" * 60)
    if missing:
        print(f"Status: {len(missing)} package(s) missing!")
        print("To fix, run:")
        print(f"  pip install {' '.join(missing)}")
        print("  OR")
        print("  pip install -r python/requirements.txt")
        sys.exit(1)
    else:
        print("Status: ALL dependencies installed and ready for DubCraft AI!")
        sys.exit(0)

if __name__ == "__main__":
    check_all_dependencies()
