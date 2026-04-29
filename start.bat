@echo off
setlocal

set REPO=%~dp0
set BACKEND=%REPO%backend
set FRONTEND=%REPO%frontend

echo Freeing ports 8000 and 5173...
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":8000 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano ^| findstr ":5173 " ^| findstr "LISTENING"') do (
    taskkill /PID %%p /F >nul 2>&1
)

timeout /t 1 /nobreak >nul

echo Starting backend...
start "Backend - Agent Skill Library" cmd /k "cd /d %BACKEND% && uv run uvicorn app.main:app --reload --port 8000"

echo Starting frontend...
start "Frontend - Agent Skill Library" cmd /k "cd /d %FRONTEND% && npm run dev -- --port 5173"

echo Waiting for servers to start...
timeout /t 7 /nobreak >nul

echo Opening browser...
start "" "http://localhost:5173"

endlocal
