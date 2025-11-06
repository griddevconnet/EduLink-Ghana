@echo off
echo ========================================
echo   Starting EduLink Backend
echo ========================================
echo.

cd backend

if not exist ".env" (
    echo [ERROR] .env file not found!
    echo.
    echo Please create backend\.env first:
    echo   1. Copy .env.example to .env
    echo   2. Add your MongoDB URI
    echo   3. Add JWT_SECRET
    echo.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting backend server on port 5000...
echo.
echo Press Ctrl+C to stop
echo.

call npm start
