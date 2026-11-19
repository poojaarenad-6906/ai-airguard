@echo off
title AI AirGuard â€“ Dev Mode
color 0B
echo.
echo  =====================================================
echo   AI AirGuard â€“ DEVELOPMENT MODE
echo   Vite HMR on :5173  +  Flask API on :5000
echo  =====================================================
echo.

cd /d "%~dp0"

REM â”€â”€ Start Flask backend in a separate window â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo Starting Flask backend (port 5000)...
start "AI AirGuard Backend" cmd /k "cd /d %~dp0backend && set PYTHONUTF8=1 && set WATSONX_API_KEY=%WATSONX_API_KEY% && set WATSONX_PROJECT_ID=%WATSONX_PROJECT_ID% && set WATSONX_URL=%WATSONX_URL% && set WATSONX_MODEL_ID=%WATSONX_MODEL_ID% && set GROQ_API_KEY=%GROQ_API_KEY% && set PORT=5000 && python app.py"

timeout /t 2 /nobreak >nul

REM â”€â”€ Start Vite dev server â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
echo Starting Vite dev server (port 5173)...
echo.
echo  Open in browser: http://localhost:5173
echo.
npm run dev
pause
