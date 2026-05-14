@echo off
:: ============================================================
:: PocketTube — start-backend.bat
:: Starts the Node.js backend and logs all output to a dated
:: file in backend\logs\ so you can inspect what happened.
::
:: Run manually:   double-click this file, or run from CMD
:: Auto-start:     imported via PocketTube-Backend.xml into
::                 Windows Task Scheduler (runs at user logon)
:: ============================================================

:: Change to the directory this script lives in (backend\)
cd /d "%~dp0"

:: Create the logs directory if it doesn't exist yet
if not exist "logs" mkdir logs

:: Build a timestamp string for the log filename: YYYY-MM-DD_HH-MM-SS
for /f "tokens=1-3 delims=/ " %%a in ('date /t') do (
  set _DATE=%%c-%%a-%%b
)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (
  set _TIME=%%a-%%b
)
set LOGFILE=logs\backend_%_DATE%_%_TIME%.log

echo [%date% %time%] Starting PocketTube backend... >> "%LOGFILE%"
echo [%date% %time%] Log file: %LOGFILE%

:: Start Node — stdout and stderr both go to the log file
node src\index.js >> "%LOGFILE%" 2>&1

echo [%date% %time%] Backend process exited with code %ERRORLEVEL% >> "%LOGFILE%"
