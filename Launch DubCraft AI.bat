@echo off
title DubCraft AI - Auto-Updating Desktop Launcher
echo ========================================================
echo        DubCraft AI - Smart Auto-Updating Desktop Suite
echo ========================================================
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo [Setup] Initializing Python Virtual Environment...
    python -m venv venv
    call venv\Scripts\activate.bat
    pip install -r python\requirements.txt
)

if not exist "dist_electron\win-unpacked\DubCraft AI.exe" (
    echo [Auto-Build] Building updated DubCraft AI.exe executable...
    npm run dist
)

echo Starting DubCraft AI...
start "" "dist_electron\win-unpacked\DubCraft AI.exe"
