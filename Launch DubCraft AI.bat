@echo off
title DubCraft AI - Multilingual Studio Launcher
echo ========================================================
echo        DubCraft AI - Multilingual Studio (Native Desktop)
echo ========================================================
echo Starting native application... Please wait a moment.
cd /d "%~dp0"

if exist "dist_electron\win-unpacked\DubCraft AI.exe" (
    start "" "dist_electron\win-unpacked\DubCraft AI.exe"
) else (
    npx electron .
)
