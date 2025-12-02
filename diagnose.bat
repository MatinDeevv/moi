@echo off
REM Project ME - Runner Diagnostics Script
REM This script checks if everything is configured correctly

echo ========================================
echo Project ME Runner Diagnostics
echo ========================================
echo.

REM Check if Python is available
echo [1/5] Checking Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python not found! Install Python 3.10+ first.
    goto :end
)
echo ✓ Python is installed
echo.

REM Check if runner.py exists
echo [2/5] Checking runner.py...
if not exist "runner.py" (
    echo ❌ runner.py not found! Are you in the correct directory?
    echo    Current directory: %cd%
    echo    Expected: C:\Users\matin\moi
    goto :end
)
echo ✓ runner.py exists
echo.

REM Check if runner is accessible on port 4000
echo [3/5] Checking if runner is running on port 4000...
curl -s http://localhost:4000/health >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Runner is NOT running on port 4000
    echo.
    echo To start the runner, open a terminal and run:
    echo    cd C:\Users\matin\moi
    echo    python runner.py
    echo.
    echo Leave that terminal open!
    goto :end
)
echo ✓ Runner is responding on port 4000
echo.

REM Test runner health endpoint
echo [4/5] Testing runner health...
curl -s http://localhost:4000/health > temp_health.json
type temp_health.json
del temp_health.json
echo.
echo ✓ Runner health check passed
echo.

REM Check ngrok
echo [5/5] Checking ngrok setup...
echo.
echo ⚠️  Cannot auto-check ngrok from this script
echo.
echo To verify ngrok manually:
echo    1. Open another terminal
echo    2. Run: ngrok http 4000
echo    3. Copy the HTTPS URL (looks like: https://abc123.ngrok.io)
echo    4. Paste it in Project ME Settings
echo.
echo ngrok dashboard: http://localhost:4040
echo.

echo ========================================
echo Diagnostic Summary
echo ========================================
echo.
echo If you saw all ✓ marks above:
echo    1. Start ngrok: ngrok http 4000
echo    2. Copy the ngrok HTTPS URL
echo    3. Paste it in Settings tab (without trailing slash)
echo    4. Click Test, then Save
echo.
echo If you saw any ❌ marks:
echo    - Fix those issues first
echo    - Then run this script again
echo.

:end
echo Press any key to exit...
pause >nul

