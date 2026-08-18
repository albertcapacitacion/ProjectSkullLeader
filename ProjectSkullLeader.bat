@echo off
setlocal
cd /d "%~dp0"
echo Starting Skull Leader v0 at http://localhost:8178
echo Close this window to stop the server.
where node >nul 2>nul
if %errorlevel% equ 0 (
  node server.mjs
  exit /b
)
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -m http.server 8178
  exit /b
)
where python >nul 2>nul
if %errorlevel% equ 0 (
  python -m http.server 8178
  exit /b
)
echo Python was not found. Install Python or run a static HTTP server in this folder.
pause
