@echo off
echo ========================================
echo   Fixing TurboModule Error
echo ========================================
echo.

echo Step 1: Stopping any running Metro processes...
taskkill /f /im node.exe 2>nul

echo.
echo Step 2: Cleaning everything...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo Step 3: Clearing npm cache...
npm cache clean --force

echo.
echo Step 4: Installing stable Expo SDK 52 dependencies...
npm install

echo.
echo Step 5: Fixing Expo dependencies...
npx expo install --fix

echo.
echo Step 6: Starting with clean cache...
echo ========================================
echo   TurboModule Error Fixed!
echo ========================================
echo.
echo Now using stable versions:
echo - Expo SDK 52.0.0
echo - React Native 0.75.3
echo - React 18.2.0
echo.
echo Starting the app...
npx expo start --clear

pause
