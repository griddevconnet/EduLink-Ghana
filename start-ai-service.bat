@echo off
echo ========================================
echo   Starting EduLink AI Service
echo ========================================
echo.

cd ai-service

if not exist ".env" (
    echo [ERROR] .env file not found!
    echo.
    echo Please create ai-service\.env first:
    echo   1. Copy .env.example to .env
    echo   2. Add your MongoDB URI
    echo.
    pause
    exit /b 1
)

if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    echo.
)

echo Activating virtual environment...
call venv\Scripts\activate

if not exist "venv\Lib\site-packages\flask" (
    echo Installing dependencies...
    pip install -r requirements.txt
    echo.
)

echo Starting AI service on port 5001...
echo.
echo Press Ctrl+C to stop
echo.

python app.py
