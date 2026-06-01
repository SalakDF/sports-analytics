@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "PIDS_DIR=%ROOT%\.run"
set "BACKEND_PID_FILE=%PIDS_DIR%\backend.pid"
set "FRONTEND_PID_FILE=%PIDS_DIR%\frontend.pid"
set "BROWSER_PID_FILE=%PIDS_DIR%\browser.pid"

echo ===============================================
echo   Sports Analytics - Stop Backend + Frontend
echo ===============================================
echo.

if not exist "%PIDS_DIR%" (
  echo [WARN] No PID folder found. Nothing to stop.
  echo.
  pause
  exit /b 0
)

if exist "%FRONTEND_PID_FILE%" (
  set /p FRONTEND_PID=<"%FRONTEND_PID_FILE%"
  echo [INFO] Stopping frontend tree PID !FRONTEND_PID!...
  taskkill /F /T /PID !FRONTEND_PID! >nul 2>&1
  if !errorlevel!==0 (echo [OK] Frontend stopped.) else (echo [WARN] Frontend PID was not running.)
) else (
  echo [WARN] Frontend PID file not found.
)

if exist "%BACKEND_PID_FILE%" (
  set /p BACKEND_PID=<"%BACKEND_PID_FILE%"
  echo [INFO] Stopping backend tree PID !BACKEND_PID!...
  taskkill /F /T /PID !BACKEND_PID! >nul 2>&1
  if !errorlevel!==0 (echo [OK] Backend stopped.) else (echo [WARN] Backend PID was not running.)
) else (
  echo [WARN] Backend PID file not found.
)

if exist "%BROWSER_PID_FILE%" (
  set /p BROWSER_PID=<"%BROWSER_PID_FILE%"
  echo [INFO] Stopping browser PID !BROWSER_PID!...
  taskkill /F /T /PID !BROWSER_PID! >nul 2>&1
  if !errorlevel!==0 (echo [OK] Browser closed.) else (echo [WARN] Browser PID was not running.)
) else (
  echo [WARN] Browser PID file not found.
)

REM Fallback by window title (if PID files are stale)
taskkill /F /FI "WINDOWTITLE eq Sports Analytics - Backend*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Sports Analytics - Frontend*" >nul 2>&1

del /q "%BACKEND_PID_FILE%" 2>nul
del /q "%FRONTEND_PID_FILE%" 2>nul
del /q "%BROWSER_PID_FILE%" 2>nul

echo.
echo [DONE] Stop command completed.
echo.
pause
