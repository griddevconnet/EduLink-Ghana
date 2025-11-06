@echo off
echo ========================================
echo   EduLink Ghana - Quick Test Setup
echo ========================================
echo.

echo This script will help you set up EduLink for testing.
echo.
echo Prerequisites:
echo   - Node.js 18+ installed
echo   - Python 3.9+ installed
echo   - MongoDB (local or Atlas account)
echo.

pause

echo.
echo Step 1: Checking if .env files exist...
echo.

if not exist "backend\.env" (
    echo [!] backend\.env not found
    echo Creating from template...
    copy backend\.env.example backend\.env
    echo.
    echo *** IMPORTANT ***
    echo Please edit backend\.env and add your MongoDB URI
    echo Minimum required:
    echo   MONGODB_URI=mongodb://localhost:27017/edulink
    echo   JWT_SECRET=your-secret-key-here
    echo.
    pause
) else (
    echo [OK] backend\.env exists
)

if not exist "ai-service\.env" (
    echo [!] ai-service\.env not found
    echo Creating from template...
    copy ai-service\.env.example ai-service\.env
    echo.
    echo *** IMPORTANT ***
    echo Please edit ai-service\.env and add your MongoDB URI
    echo Minimum required:
    echo   MONGODB_URI=mongodb://localhost:27017/edulink
    echo.
    pause
) else (
    echo [OK] ai-service\.env exists
)

echo.
echo Step 2: Installing dependencies...
echo.

echo Installing backend dependencies...
cd backend
call npm install
cd ..

echo.
echo Installing AI service dependencies...
cd ai-service
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
call venv\Scripts\deactivate
cd ..

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo To start testing:
echo.
echo 1. Start Backend (Terminal 1):
echo    cd backend
echo    npm start
echo.
echo 2. Start AI Service (Terminal 2):
echo    cd ai-service
echo    venv\Scripts\activate
echo    python app.py
echo.
echo 3. Run Tests (Terminal 3):
echo    powershell -ExecutionPolicy Bypass -File test-api.ps1
echo.
echo Or use the quick start scripts:
echo    start-backend.bat
echo    start-ai-service.bat
echo.
echo Documentation:
echo    TEST_SETUP.md - Detailed testing guide
echo    QUICKSTART.md - Quick start guide
echo    API_DOCUMENTATION.md - All endpoints
echo.

pause
