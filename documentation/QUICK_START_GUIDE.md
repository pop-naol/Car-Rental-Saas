# 🚀 Quick Start Guide - Car Rental Management SaaS

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **MySQL** 8+ ([Download](https://dev.mysql.com/downloads/))
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)

---

## Step 1: Install Dependencies

### Install Root Dependencies
```bash
# From project root
npm install
```

### Install Backend Dependencies
```bash
cd packages/backend
npm install
```

### Install Frontend Dependencies
```bash
cd packages/frontend
npm install
```

---

## Step 2: Setup Database

### Option A: Using Docker (Recommended)

```bash
# From project root
docker-compose up -d

# This will start:
# - MySQL on port 3306
# - Redis on port 6379
```

### Option B: Using Local MySQL

1. **Start MySQL** (if not running)
   ```bash
   # Windows: Start MySQL service from Services
   # Mac: brew services start mysql
   # Linux: sudo systemctl start mysql
   ```

2. **Create Database**
   ```bash
   mysql -u root -p
   ```
   ```sql
   CREATE DATABASE car_rental_dev;
   EXIT;
   ```

---

## Step 3: Configure Environment Variables

### Backend Configuration

```bash
cd packages/backend

# Copy example env file
cp .env.example .env

# Edit .env file with your settings
```

**packages/backend/.env**
```env
# Database
DATABASE_URL="mysql://root:@localhost:3306/car_rental_dev"

# JWT Secrets (change these in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this-in-production"

# Server
NODE_ENV="development"
PORT=5000

# CORS
CORS_ORIGIN="http://localhost:3000"
```

### Frontend Configuration

```bash
cd packages/frontend

# Create .env.local file
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local
```

---

## Step 4: Run Database Migrations

```bash
cd packages/backend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# This will:
# - Create all database tables
# - Set up relationships
# - Apply indexes
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Applied migration(s)
```

---

## Step 5: Start the Backend

```bash
cd packages/backend

# Development mode (with auto-reload)
npm run dev

# You should see:
# 🚀 Server running on port 5000
# 📝 Environment: development
# 🔗 Health check: http://localhost:5000/health
```

**Test Backend:**
```bash
# Open browser or use curl
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2026-02-12T..."}
```

---

## Step 6: Start the Frontend

**Open a NEW terminal window** (keep backend running)

```bash
cd packages/frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# You should see:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
# - Ready in X.Xs
```

---

## Step 7: Access the Application

### Open Your Browser

**Frontend:** http://localhost:3000

**Backend API:** http://localhost:5000

### Login with Demo Credentials

```
Email: admin@carrental.com
Password: Admin123!@#
```

**Note:** You need to create this user first (see Step 8)

---

## Step 8: Create Initial User

### Option A: Using API (Recommended)

```bash
# Use curl or Postman
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@carrental.com",
    "password": "Admin123!@#",
    "firstName": "Super",
    "lastName": "Admin",
    "role": "SUPER_ADMIN"
  }'
```

### Option B: Using test-api.http

1. Install **REST Client** extension in VS Code
2. Open `test-api.http`
3. Click "Send Request" on the "Register Super Admin" section

### Option C: Using Prisma Studio

```bash
cd packages/backend
npx prisma studio

# Opens browser at http://localhost:5555
# Manually create user in the User table
```

---

## Step 9: Verify Everything Works

### Check Backend Health
```bash
curl http://localhost:5000/health
```

### Check Frontend
1. Open http://localhost:3000
2. Should redirect to login page
3. Login with credentials
4. Should see dashboard

### Check Database
```bash
cd packages/backend
npx prisma studio

# Opens database GUI at http://localhost:5555
```

---

## 🎯 Quick Commands Reference

### Backend Commands
```bash
cd packages/backend

# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server

# Database
npx prisma generate      # Generate Prisma client
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes

# Testing
npm test                 # Run tests (when implemented)
```

### Frontend Commands
```bash
cd packages/frontend

# Development
npm run dev              # Start dev server (port 3000)
npm run build            # Build for production
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript
```

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** Port 5000 already in use
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**Problem:** Database connection error
- Check MySQL is running
- Verify DATABASE_URL in .env
- Check database exists: `SHOW DATABASES;`

**Problem:** Prisma errors
```bash
# Reset and regenerate
cd packages/backend
rm -rf node_modules
npm install
npx prisma generate
```

### Frontend Won't Start

**Problem:** Port 3000 already in use
```bash
# Change port in package.json
"dev": "next dev -p 3001"
```

**Problem:** API connection error
- Check backend is running on port 5000
- Verify NEXT_PUBLIC_API_URL in .env.local
- Check CORS settings in backend

**Problem:** Module not found
```bash
cd packages/frontend
rm -rf node_modules .next
npm install
```

### Database Issues

**Problem:** Migration failed
```bash
cd packages/backend

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or manually drop and recreate
mysql -u root -p
DROP DATABASE car_rental_dev;
CREATE DATABASE car_rental_dev;
EXIT;

# Then run migrations again
npx prisma migrate dev
```

**Problem:** Can't connect to MySQL
- Check MySQL service is running
- Verify credentials in DATABASE_URL
- Try connecting with MySQL client

---

## 📱 Testing the Application

### 1. Test Authentication
- Go to http://localhost:3000
- Login with admin credentials
- Should see dashboard

### 2. Test Dashboard
- View metrics cards
- Check charts load
- Verify data from API

### 3. Test Vehicles
- Click "Vehicles" in sidebar
- Should see vehicle list
- Try search and filters

### 4. Test Bookings
- Click "Bookings" in sidebar
- Should see booking list
- Try status filters

### 5. Test API Directly
```bash
# Get auth token first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@carrental.com","password":"Admin123!@#"}'

# Use token in subsequent requests
curl http://localhost:5000/api/vehicles \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🔧 Development Workflow

### Typical Development Session

1. **Start Backend**
   ```bash
   cd packages/backend
   npm run dev
   ```

2. **Start Frontend** (new terminal)
   ```bash
   cd packages/frontend
   npm run dev
   ```

3. **Open Browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database GUI: http://localhost:5555 (if running prisma studio)

4. **Make Changes**
   - Backend: Auto-reloads on file changes
   - Frontend: Auto-reloads on file changes
   - Database: Run migrations for schema changes

5. **Test Changes**
   - Use browser for frontend
   - Use curl/Postman for API
   - Use Prisma Studio for database

---

## 🚀 Production Deployment

### Build for Production

**Backend:**
```bash
cd packages/backend
npm run build
npm start
```

**Frontend:**
```bash
cd packages/frontend
npm run build
npm start
```

### Environment Variables

Update .env files with production values:
- Change JWT secrets
- Use production database URL
- Set NODE_ENV=production
- Configure CORS for production domain

---

## 📊 Monitoring

### Check Application Status

**Backend Health:**
```bash
curl http://localhost:5000/health
```

**Frontend:**
- Open http://localhost:3000
- Should load without errors

**Database:**
```bash
cd packages/backend
npx prisma studio
```

### View Logs

**Backend:**
- Logs appear in terminal where `npm run dev` is running
- Check for errors or warnings

**Frontend:**
- Logs appear in terminal
- Also check browser console (F12)

---

## 🎓 Next Steps

After getting everything running:

1. **Explore the API**
   - Open `API_DOCUMENTATION.md`
   - Try different endpoints
   - Use `test-api.http` for examples

2. **Customize**
   - Add your company data
   - Create vehicles
   - Add customers
   - Make bookings

3. **Develop**
   - Add new features
   - Customize UI
   - Extend functionality

4. **Deploy**
   - Follow `DEPLOYMENT_GUIDE.md`
   - Set up production environment
   - Configure monitoring

---

## 📚 Additional Resources

- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Backend README**: `packages/backend/README.md`
- **Frontend README**: `packages/frontend/README.md`
- **Project Status**: `PROJECT_COMPLETE_STATUS.md`

---

## 🆘 Getting Help

### Common Issues
1. Check this guide's troubleshooting section
2. Review error messages carefully
3. Check logs in terminal
4. Verify all prerequisites are installed

### Resources
- Backend logs: Terminal where backend is running
- Frontend logs: Terminal + Browser console (F12)
- Database: Prisma Studio (http://localhost:5555)
- API tests: `test-api.http` file

---

## ✅ Success Checklist

- [ ] Node.js 18+ installed
- [ ] MySQL running
- [ ] Dependencies installed (root, backend, frontend)
- [ ] Database created
- [ ] Environment variables configured
- [ ] Migrations run successfully
- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Initial user created
- [ ] Can login to application
- [ ] Dashboard loads with data

---

**🎉 Congratulations!** You now have the Car Rental Management SaaS running locally!

**Next:** Start exploring the application and building new features!

---

*Last Updated: February 12, 2026*
