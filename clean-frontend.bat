@echo off
echo Cleaning frontend...

cd frontend

echo Removing .next directory...
if exist ".next" rmdir /s /q ".next"

echo Reinstalling dependencies...
npm install

echo.
echo Frontend cleaned successfully!
echo Now restart the frontend with: npm run dev
pause
