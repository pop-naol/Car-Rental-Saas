@echo off
echo Testing authentication...

echo.
echo 1. Testing backend health...
curl -s http://localhost:5000/health

echo.
echo.
echo 2. Creating admin user...
curl -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@carrental.com\",\"password\":\"Admin123!@#\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"role\":\"SUPER_ADMIN\"}"

echo.
echo.
echo 3. Testing login...
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@carrental.com\",\"password\":\"Admin123!@#\"}"

echo.
echo.
echo Test completed.
pause