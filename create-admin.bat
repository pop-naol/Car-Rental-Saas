@echo off
echo Creating admin user...

curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@carrental.com\",\"password\":\"Admin123!@#\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"role\":\"SUPER_ADMIN\"}"

echo.
echo Admin user creation completed.
pause