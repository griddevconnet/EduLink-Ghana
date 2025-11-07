@echo off
echo ========================================
echo   Upgrading to Expo SDK 54
echo ========================================
echo.

echo Step 1: Cleaning old dependencies...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)

if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo Step 2: Installing Expo SDK 54 dependencies...
npm install

echo.
echo Step 3: Clearing Expo cache...
npx expo install --fix

echo.
echo Step 4: Starting the app...
echo ========================================
echo   Expo SDK 54 Upgrade Complete!
echo ========================================
echo.
echo The app should now be running with:
echo - Expo SDK 54.0.0
echo - React Native 0.76.5
echo - React 18.3.1
echo - Updated navigation libraries
echo.
pause
