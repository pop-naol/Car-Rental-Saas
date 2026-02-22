# 🚀 How to Run - Simple Guide

## Quick Start (Easiest Way)

### Windows Users

1. **Double-click** `start.bat`
2. Wait for both servers to start
3. Open browser: http://localhost:3000
4. Login with: `admin@carrental.com` / `Admin123!@#`

To stop: Double-click `stop.bat`

### Mac/Linux Users

1. **Run** `./start.sh` (make executable first: `chmod +x start.sh`)
2. Wait for both servers to start
3. Open browser: http://localhost:3000
4. Login with: `admin@carrental.com` / `Admin123!@#`

To stop: Run `./stop.sh`

---

## Manual Start (Step by Step)

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd packages/backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Setup Database

**Option A: Using Docker**
```bash
# From project root
docker-compose up -d
```

**Option B: Using Local MySQL**
```sql
-- In MySQL
CREATE DATABASE car_rental_dev;
```

### Step 3: Configure Environment

**Backend** (`packages/backend/.env`):
```env
DATABASE_URL="mysql://root:@localhost:3306/car_rental_dev"
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"
NODE_ENV="development"
PORT=5000
CORS_ORIGIN="http://localhost:3000"
```

**Frontend** (`packages/frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### Step 4: Run Migrations

```bash
cd packages/backend
npx prisma generate
npx prisma migrate dev
```

### Step 5: Start Backend

```bash
cd packages/backend
npm run dev
```

**You should see:**
```
🚀 Server running on port 5000
📝 Environment: development
🔗 Health check: http://localhost:5000/health
```

### Step 6: Start Frontend (New Terminal)

```bash
cd packages/frontend
npm run dev
```

**You should see:**
```
▲ Next.js 14.x.x
- Local:   http://localhost:3000
- Ready in X.Xs
```

### Step 7: Create Admin User

**Using curl:**
```bash
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

**Or use the test-api.http file in VS Code with REST Client extension**

### Step 8: Access Application

Open browser: **http://localhost:3000**

Login with:
- **Email:** admin@carrental.com
- **Password:** Admin123!@#

---

## What You'll See

### 1. Login Page
![Login](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Login+Page)
- Beautiful gradient background
- Email and password fields
- Demo credentials shown

### 2. Dashboard
![Dashboard](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Dashboard)
- 4 metric cards (Fleet, Rentals, Revenue, Overdue)
- Revenue trend chart
- Fleet utilization chart
- Quick action buttons

### 3. Vehicles Page
![Vehicles](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Vehicles+Page)
- Grid view of vehicles
- Search and filters
- Status badges
- Edit/Delete actions

### 4. Bookings Page
![Bookings](https://via.placeholder.com/800x400/0ea5e9/ffffff?text=Bookings+Page)
- Table view of bookings
- Customer and vehicle info
- Confirm/Cancel actions
- Status filters

---

## Ports Used

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend | 5000 | http://localhost:5000 |
| MySQL | 3306 | localhost:3306 |
| Redis | 6379 | localhost:6379 |
| Prisma Studio | 5555 | http://localhost:5555 |

---

## Common Issues

### ❌ Port Already in Use

**Backend (Port 5000):**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

**Frontend (Port 3000):**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### ❌ Database Connection Error

1. Check MySQL is running
2. Verify DATABASE_URL in `.env`
3. Check database exists: `SHOW DATABASES;`

### ❌ Module Not Found

```bash
# Backend
cd packages/backend
rm -rf node_modules
npm install

# Frontend
cd packages/frontend
rm -rf node_modules .next
npm install
```

---

## Testing the Application

### 1. Test Backend Health
```bash
curl http://localhost:5000/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2026-02-12T..."}
```

### 2. Test Login
1. Go to http://localhost:3000
2. Enter credentials
3. Click "Sign in"
4. Should redirect to dashboard

### 3. Test Dashboard
- View metrics
- Check charts load
- Click quick actions

### 4. Test Vehicles
- Click "Vehicles" in sidebar
- View vehicle list
- Try search
- Try filters

### 5. Test Bookings
- Click "Bookings" in sidebar
- View booking list
- Try status filter
- Click confirm/cancel

---

## Development Workflow

### Typical Session

1. **Start Backend** (Terminal 1)
   ```bash
   cd packages/backend
   npm run dev
   ```

2. **Start Frontend** (Terminal 2)
   ```bash
   cd packages/frontend
   npm run dev
   ```

3. **Open Browser**
   - http://localhost:3000

4. **Make Changes**
   - Both servers auto-reload on file changes

5. **View Logs**
   - Backend: Terminal 1
   - Frontend: Terminal 2
   - Browser: F12 (Developer Tools)

---

## Useful Commands

### Backend
```bash
cd packages/backend

npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Run migrations
```

### Frontend
```bash
cd packages/frontend

npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run linter
```

### Database
```bash
cd packages/backend

npx prisma studio        # GUI at http://localhost:5555
npx prisma generate      # Generate client
npx prisma migrate dev   # Run migrations
npx prisma db push       # Push schema changes
```

---

## Next Steps

After getting it running:

1. ✅ **Explore the Dashboard**
   - View metrics
   - Check charts

2. ✅ **Browse Vehicles**
   - View vehicle list
   - Try filters

3. ✅ **Check Bookings**
   - View bookings
   - Try actions

4. 📚 **Read Documentation**
   - `API_DOCUMENTATION.md` - API reference
   - `QUICK_START_GUIDE.md` - Detailed guide
   - `DEPLOYMENT_GUIDE.md` - Production deployment

5. 🛠️ **Start Developing**
   - Add new features
   - Customize UI
   - Extend functionality

---

## Getting Help

### Check Logs
- **Backend:** Terminal where `npm run dev` is running
- **Frontend:** Terminal + Browser console (F12)
- **Database:** Prisma Studio (http://localhost:5555)

### Common Solutions
1. Restart servers
2. Clear node_modules and reinstall
3. Check environment variables
4. Verify database connection
5. Check port availability

### Documentation
- `QUICK_START_GUIDE.md` - Comprehensive guide
- `API_DOCUMENTATION.md` - API reference
- `FRONTEND_SUMMARY.md` - Frontend details
- `PROJECT_COMPLETE_STATUS.md` - Project status

---

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] MySQL running
- [ ] Dependencies installed
- [ ] Database created
- [ ] Environment configured
- [ ] Migrations run
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 3000)
- [ ] Admin user created
- [ ] Can login
- [ ] Dashboard loads

---

**🎉 You're all set!** Start exploring the application!

**Need help?** Check `QUICK_START_GUIDE.md` for detailed troubleshooting.

---

*Last Updated: February 12, 2026*
