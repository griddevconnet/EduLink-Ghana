@echo off
echo ========================================
echo   Pushing EduLink to GitHub
echo ========================================
echo.

echo Repository: https://github.com/griddevconnet/EduLink-Ghana
echo.

echo Clearing cached credentials...
cmdkey /delete:LegacyGeneric:target=git:https://github.com 2>nul
cmdkey /delete:git:https://github.com 2>nul

echo.
echo Pushing to GitHub...
echo.
echo When prompted:
echo   Username: griddevconnect
echo   Password: [paste your token]
echo.

git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub!
    echo ========================================
    echo.
    echo Visit: https://github.com/griddevconnet/EduLink-Ghana
    echo.
) else (
    echo ========================================
    echo   Push failed. Please check:
    echo ========================================
    echo   1. Token is correct
    echo   2. Username is: griddevconnect
    echo   3. Repository exists on GitHub
    echo.
)

pause
