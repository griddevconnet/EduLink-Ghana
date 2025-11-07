@echo off
echo ========================================
echo   Upgrading to Expo SDK 54
echo ========================================
echo.

echo Step 1: Stopping any running processes...
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
echo Step 4: Installing Expo SDK 54 dependencies...
npm install --legacy-peer-deps

echo.
echo Step 5: Fixing Expo dependencies...
npx expo install --fix

echo.
echo Step 6: Starting with clean cache...
echo ========================================
echo   Expo SDK 54 Upgrade Complete!
echo ========================================
echo.
echo Now using:
echo - Expo SDK 54.0.0
echo - React Native 0.76.3 (stable)
echo - React 18.3.1
echo - New Architecture: DISABLED (to avoid TurboModule issues)
echo.
echo Starting the app...
npx expo start --clear

pause
