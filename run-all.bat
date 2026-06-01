@echo off
setlocal

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"
set "BACKEND_DIR=%ROOT%\backend"
set "FRONTEND_DIR=%ROOT%\frontend"
set "PIDS_DIR=%ROOT%\.run"
set "BACKEND_PID_FILE=%PIDS_DIR%\backend.pid"
set "FRONTEND_PID_FILE=%PIDS_DIR%\frontend.pid"
set "BROWSER_PID_FILE=%PIDS_DIR%\browser.pid"

echo ===============================================
echo   Sports Analytics - Start Backend + Frontend
echo ===============================================
echo.

if not exist "%BACKEND_DIR%\mvnw.cmd" (
  echo [ERROR] Backend launcher not found: "%BACKEND_DIR%\mvnw.cmd"
  pause
  exit /b 1
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend package.json not found: "%FRONTEND_DIR%\package.json"
  pause
  exit /b 1
)

if not exist "%PIDS_DIR%" mkdir "%PIDS_DIR%"
del /q "%BACKEND_PID_FILE%" 2>nul
del /q "%FRONTEND_PID_FILE%" 2>nul
del /q "%BROWSER_PID_FILE%" 2>nul

echo [INFO] Starting backend window...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','& { Set-Location -LiteralPath ""%BACKEND_DIR%""; $env:DB_PASSWORD=''25565''; $env:FOOTBALL_DATA_BASE_URL=''https://api.football-data.org/v4''; $env:FOOTBALL_DATA_API_TOKEN=''d00d6102bf9d4e1d8fa27300c6a2f9b2''; $env:API_FOOTBALL_API_KEY=''2e3e575f72d32a6943314c923adb1eb9''; .\mvnw spring-boot:run }' -PassThru | ForEach-Object { $_.Id } | Set-Content '%BACKEND_PID_FILE%'"

echo [INFO] Starting frontend window...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoExit','-Command','Set-Location -LiteralPath ""%FRONTEND_DIR%""; npm run dev' -PassThru | ForEach-Object { $_.Id } | Set-Content '%FRONTEND_PID_FILE%'"

echo [INFO] Waiting 5 seconds and opening app in browser...
timeout /t 5 /nobreak >nul
powershell -NoProfile -ExecutionPolicy Bypass -Command "$edge = Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'; if (Test-Path $edge) { $p = Start-Process $edge -ArgumentList '--new-window','http://localhost:5173/' -PassThru; Set-Content -Path '%BROWSER_PID_FILE%' -Value $p.Id } else { Start-Process 'http://localhost:5173/' }"

echo.
echo [OK] Backend and frontend were started in separate windows.
echo [OK] Browser opened at http://localhost:5173/
echo [TIP] To stop everything, run stop-all.bat
echo.
pause
