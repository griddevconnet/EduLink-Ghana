@echo off
echo ========================================
echo   Fixing Babel Preset Issue
echo ========================================
echo.

echo Step 1: Clearing npm cache...
npm cache clean --force

echo.
echo Step 2: Removing node_modules and package-lock.json...
if exist node_modules (
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del package-lock.json
)

echo.
echo Step 3: Installing dependencies with babel-preset-expo...
npm install

echo.
echo Step 4: Installing Expo CLI dependencies...
npx expo install --fix

echo.
echo Step 5: Clearing Metro cache...
npx expo start --clear

echo.
echo ========================================
echo   Babel Issue Fixed!
echo ========================================
echo.
echo If you still see issues, try:
echo 1. npx expo install babel-preset-expo
echo 2. npx expo start --clear --reset-cache
echo.
pause
