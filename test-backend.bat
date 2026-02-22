@echo off
echo Testing backend compilation...
cd backend
echo.
echo Checking TypeScript compilation...
npx tsc --noEmit
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend compiles successfully!
    echo.
    echo Now you can run: npm run dev
) else (
    echo ❌ Backend has compilation errors
)
echo.
pause
