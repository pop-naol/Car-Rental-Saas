@echo off
REM Car Rental Management SaaS - Stop Script (Windows)
REM This script stops both backend and frontend servers

echo.
echo ========================================
echo  Stopping Car Rental Management SaaS
echo ========================================
echo.

REM Kill Node.js processes on ports 5000 and 3000
echo [INFO] Stopping backend server (port 5000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Backend stopped
    )
)

echo [INFO] Stopping frontend server (port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] Frontend stopped
    )
)

echo.
echo ========================================
echo  All Services Stopped!
echo ========================================
echo.
pause
