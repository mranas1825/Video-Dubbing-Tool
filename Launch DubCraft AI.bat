@echo off
title DubCraft AI - Multilingual Studio Launcher
echo ========================================================
echo        DubCraft AI - Multilingual Studio (Native Desktop)
echo ========================================================
echo Starting native application... Please wait a moment.
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo.
    echo [Setup] Creating Python virtual environment...
    python -m venv venv
    echo [Setup] Installing required Python AI packages...
    call venv\Scripts\activate.bat
    pip install -r python\requirements.txt
    echo [Setup] Python Environment initialized successfully!
    echo.
)

npx electron .
