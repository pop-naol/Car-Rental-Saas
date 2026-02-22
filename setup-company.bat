@echo off
echo Setting up company and branch...

echo.
echo Step 1: Creating company...
curl -X POST http://localhost:5000/api/companies ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer %1" ^
  -d "{\"name\":\"Demo Car Rentals\",\"subscriptionTier\":\"premium\"}"

echo.
echo.
echo Step 2: Creating branch...
echo Please copy the company ID from above and run:
echo curl -X POST http://localhost:5000/api/branches -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_TOKEN" -d "{\"companyId\":\"COMPANY_ID\",\"name\":\"Main Branch\",\"address\":\"123 Main St\",\"phone\":\"+1-555-0100\",\"email\":\"main@demo.com\"}"

pause
