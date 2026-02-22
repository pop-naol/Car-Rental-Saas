@echo off
echo Fixing frontend issues...

cd "frontend"

echo Removing .next directory...
if exist ".next" rmdir /s /q ".next"

echo Removing node_modules...
if exist "node_modules" rmdir /s /q "node_modules"

echo Installing dependencies...
npm install

echo Starting development server...
npm run dev

pause
