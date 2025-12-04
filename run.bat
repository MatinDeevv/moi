@echo off
REM Quick runner start script
REM Usage: run.bat

echo ========================================
echo Project ME - Runner
echo Starting on http://localhost:4000
echo Press Ctrl+C to stop
echo ========================================
echo.

call .venv\Scripts\activate.bat
python runner.py

