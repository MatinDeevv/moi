@echo off
REM Deploy script: Push to GitHub and start runner
REM Usage: deploy.bat "commit message"

echo ========================================
echo Project ME - Deploy and Run
echo ========================================

REM Check if commit message provided
if "%~1"=="" (
    set COMMIT_MSG=Auto deploy
) else (
    set COMMIT_MSG=%~1
)

echo.
echo [1/4] Adding all changes...
git add -A

echo.
echo [2/4] Committing with message: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

echo.
echo [3/4] Pushing to GitHub...
git push origin main

echo.
echo [4/4] Starting runner.py...
echo.
echo ========================================
echo Runner starting on http://localhost:4000
echo Press Ctrl+C to stop
echo ========================================
echo.

REM Activate venv and run
call .venv\Scripts\activate.bat
python runner.py

