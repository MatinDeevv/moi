@echo off
REM Project ME - Start API Server

echo.
echo ===================================
echo  Starting Project ME API Server
echo ===================================
echo.

cd /d "%~dp0"

REM Activate virtual environment if it exists
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
    echo Virtual environment activated
    echo.
)

REM Start API server
echo Starting FastAPI server on http://localhost:8000
echo API docs available at http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py --api

pause

