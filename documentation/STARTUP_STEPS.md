# 🚀 Step-by-Step Startup Guide

## ✅ What You've Done So Far

- ✅ Backend dependencies installed
- ✅ Frontend dependencies installed  
- ✅ Prisma generated and migrated
- ✅ Syntax error fixed

## 🎯 Next Steps

### Step 1: Start Backend Server

Open **PowerShell/Command Prompt** and run:

```powershell
cd "D:\Projects\Car Renetal Kiro\packages\backend"
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 5000
📝 Environment: development
🔗 Health check: http://localhost:5000/health
🔐 Auth endpoints: http://localhost:5000/api/auth
🏢 Company endpoints: http://localhost:5000/api/companies
... (more endpoints)
```

**Keep this terminal open!**

### Step 2: Test Backend (Optional)

Open a **new terminal** and test:

```powershell
curl http://localhost:5000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### Step 3: Start Frontend Server

Open **another PowerShell/Command Prompt** and run:

```powershell
cd "D:\Projects\Car Renetal Kiro\packages\frontend"
npm run dev
```

**Expected Output:**
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- Ready in 2.1s
```

### Step 4: Create Admin User

Open **another terminal** and run:

```powershell
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin@carrental.com\",\"password\":\"Admin123!@#\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"role\":\"SUPER_ADMIN\"}"
```

**Or use the test-api.http file:**
1. Open `test-api.http` in VS Code
2. Install "REST Client" extension
3. Click "Send Request" on the "Register Super Admin" section

### Step 5: Access Application

Open your browser and go to:
**http://localhost:3000**

Login with:
- **Email:** admin@carrental.com
- **Password:** Admin123!@#

---

## 🎯 Quick Commands

### Start Backend
```powershell
cd "D:\Projects\Car Renetal Kiro\packages\backend"
npm run dev
```

### Start Frontend (New Terminal)
```powershell
cd "D:\Projects\Car Renetal Kiro\packages\frontend"
npm run dev
```

### Test Backend Health
```powershell
curl http://localhost:5000/health
```

### Create Admin User
```powershell
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin@carrental.com\",\"password\":\"Admin123!@#\",\"firstName\":\"Super\",\"lastName\":\"Admin\",\"role\":\"SUPER_ADMIN\"}"
```

---

## 🔧 If You Get Errors

### Backend Won't Start
- Check if port 5000 is free: `netstat -ano | findstr :5000`
- If occupied, kill process: `taskkill /PID <PID> /F`

### Frontend Won't Start  
- Check if port 3000 is free: `netstat -ano | findstr :3000`
- If occupied, kill process: `taskkill /PID <PID> /F`

### Database Errors
- Make sure MySQL is running
- Check DATABASE_URL in `.env`
- Verify database exists: `SHOW DATABASES;`

---

## 📱 What You'll See

### 1. Login Page (http://localhost:3000)
- Beautiful blue gradient background
- Email and password fields
- Demo credentials shown at bottom

### 2. Dashboard
- 4 metric cards (Fleet, Rentals, Revenue, Overdue)
- Revenue trend chart
- Fleet utilization chart
- Quick action buttons

### 3. Vehicles Page
- Grid of vehicle cards
- Search and filter options
- Status badges
- Edit/Delete buttons

### 4. Bookings Page
- Table of bookings
- Customer and vehicle info
- Confirm/Cancel actions
- Status filters

---

## 🎉 Success!

Once you see the dashboard, you have successfully:
- ✅ Backend API running (150+ endpoints)
- ✅ Frontend app running (React/Next.js)
- ✅ Database connected (MySQL)
- ✅ Authentication working
- ✅ Multi-tenant system active

**You can now:**
- Browse vehicles
- View bookings
- See dashboard metrics
- Explore the API

---

## 🚀 Next Steps

1. **Explore the app** - Click around and see what's built
2. **Check the API** - Use `test-api.http` to test endpoints
3. **Add data** - Create vehicles, customers, bookings
4. **Customize** - Modify the code to fit your needs

---

**Need help?** Check `QUICK_START_GUIDE.md` for detailed troubleshooting!