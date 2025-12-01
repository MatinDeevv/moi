@echo off
REM Project ME - Start Web UI

echo.
echo ===================================
echo  Starting Project ME Web UI
echo ===================================
echo.

cd /d "%~dp0\app"

REM Check if node_modules exists
if not exist node_modules (
    echo node_modules not found. Running npm install...
    echo.
    call npm install
    echo.
)

echo Starting Next.js development server...
echo Web UI will be available at http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run dev

pause

