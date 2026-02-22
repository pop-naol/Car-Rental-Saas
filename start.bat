@echo off
REM Car Rental Management SaaS - Startup Script (Windows)
REM This script starts both backend and frontend servers

echo.
echo ========================================
echo  Car Rental Management SaaS
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found: 
node --version
echo.

REM Start Backend
echo ========================================
echo  Starting Backend Server
echo ========================================
cd backend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing backend dependencies...
    call npm install
)

REM Check if .env exists
if not exist ".env" (
    echo [WARN] .env file not found. Copying from .env.example...
    copy .env.example .env
    echo [WARN] Please update .env with your database credentials!
)

REM Start backend
echo [INFO] Starting backend on port 5000...
start "Backend Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

cd ..\..

REM Start Frontend
echo.
echo ========================================
echo  Starting Frontend Server
echo ========================================
cd frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing frontend dependencies...
    call npm install
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo [INFO] Creating .env.local...
    echo NEXT_PUBLIC_API_URL=http://localhost:5000 > .env.local
)

REM Start frontend
echo [INFO] Starting frontend on port 3000...
start "Frontend Server" cmd /k "npm run dev"

cd ..\..

echo.
echo ========================================
echo  All Services Started!
echo ========================================
echo.
echo [INFO] Access the application:
echo    Frontend: http://localhost:3000
echo    Backend:  http://localhost:5000
echo    Health:   http://localhost:5000/health
echo.
echo [INFO] Demo Credentials:
echo    Email:    admin@carrental.com
echo    Password: Admin123!@#
echo.
echo [INFO] Two command windows have opened:
echo    - Backend Server (port 5000)
echo    - Frontend Server (port 3000)
echo.
echo [INFO] To stop servers, close the command windows
echo        or run: stop.bat
echo.
pause
