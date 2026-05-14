@echo off
:: ============================================================
:: PocketTube — start-ngrok.bat
:: Waits up to 30 seconds for the backend to become healthy,
:: then starts the ngrok tunnel on the permanent static domain.
::
:: Run manually:   double-click this file, or run from CMD
:: Auto-start:     imported via PocketTube-ngrok.xml into
::                 Windows Task Scheduler (runs 5 s after
::                 the PocketTube-Backend task at user logon)
:: ============================================================

cd /d "%~dp0"

if not exist "logs" mkdir logs

for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
  set _DATE=%%c-%%a-%%b
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
  set _TIME=%%a-%%b
)
set LOGFILE=logs\ngrok_%_DATE%_%_TIME%.log

echo [%date% %time%] Waiting for backend to become healthy... >> "%LOGFILE%"
echo [%date% %time%] Waiting for backend on http://localhost:8080/health ...

:: ── Health-check loop (30 seconds, 1-second intervals) ──────────────────────
set ATTEMPTS=0
:HEALTH_LOOP
  set /a ATTEMPTS+=1
  :: Use PowerShell to do the HTTP GET silently
  powershell -NoProfile -Command ^
    "try { $r = Invoke-WebRequest -Uri 'http://localhost:8080/health' -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1

  if %ERRORLEVEL% == 0 goto BACKEND_UP

  if %ATTEMPTS% geq 30 (
    echo [%date% %time%] ERROR: backend did not become healthy after 30 seconds. Aborting. >> "%LOGFILE%"
    echo [%date% %time%] ERROR: backend not healthy after 30s — ngrok not started.
    exit /b 1
  )

  timeout /t 1 /nobreak >nul
  goto HEALTH_LOOP

:BACKEND_UP
echo [%date% %time%] Backend is healthy after %ATTEMPTS% attempt(s). Starting ngrok... >> "%LOGFILE%"
echo [%date% %time%] Backend healthy! Starting ngrok tunnel...

:: ── Start ngrok with the permanent static domain ────────────────────────────
ngrok http --domain=tropics-proton-unbitten.ngrok-free.dev 8080 >> "%LOGFILE%" 2>&1

echo [%date% %time%] ngrok process exited with code %ERRORLEVEL% >> "%LOGFILE%"
