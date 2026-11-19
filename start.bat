@echo off
title AI AirGuard â€“ Launcher
color 0B
echo.
echo  =====================================================
echo   AI AirGuard â€“ Bengaluru Air Quality Advisor
echo   IBM Granite + watsonx.ai  ^|  Hackathon Demo
echo  =====================================================
echo.

cd /d "%~dp0"

REM â”€â”€ Step 1: Build React frontend â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo [1/2] Building React frontend (Vite)...
call npm run build
if errorlevel 1 (
  echo  ERROR: npm build failed. Make sure node_modules is installed.
  echo  Run: npm install
  pause
  exit /b 1
)
echo  React build complete: dist\
echo.

REM â”€â”€ Step 2: Start Flask backend (serves React + API) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo [2/2] Starting Flask backend on http://localhost:5000
echo       (serves React app AND all /api/* endpoints)
echo.
echo  Open in browser: http://localhost:5000
echo  Press Ctrl+C to stop.
echo.

cd backend
set PYTHONUTF8=1
set WATSONX_API_KEY=%WATSONX_API_KEY%
set WATSONX_PROJECT_ID=%WATSONX_PROJECT_ID%
set WATSONX_URL=%WATSONX_URL%
set WATSONX_MODEL_ID=%WATSONX_MODEL_ID%
set GROQ_API_KEY=%GROQ_API_KEY%
set PORT=5000

python app.py
pause
