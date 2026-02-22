@echo off
echo Seeding demo company and branch...

cd backend
npm run seed

echo.
echo Demo data seeded successfully!
echo Company: Demo Car Rentals
echo Branch: Main Branch
echo.
echo You can now add vehicles!
pause
