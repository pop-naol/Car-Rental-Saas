# Car Rental SaaS

A full-stack SaaS platform for car rental management — multi-company, multi-branch, with bookings, fleet, drivers, financials, and analytics.

## Tech Stack

**Frontend**
- Next.js 15, React 18, TypeScript
- Tailwind CSS, Zustand, Recharts
- Axios, React Hook Form, Zod

**Backend**
- Node.js, Express, TypeScript
- Prisma ORM, PostgreSQL
- JWT authentication, Redis (rate limiting)
- Helmet, CORS, Zod validation

## Features

- 🏢 Multi-company & multi-branch support
- 🔐 Role-based access control (RBAC)
- 🚗 Vehicle fleet management
- 👤 Customer & driver management
- 📋 Booking & rental workflows
- 📄 Document uploads
- 💰 Financial tracking & reporting
- 📊 Analytics dashboard
- 🔔 Notifications system
- 🛡️ Audit logging

## Project Structure

```
car-rental-saas/
├── frontend/        # Next.js app
├── backend/         # Express API
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   └── prisma/      # Database schema & migrations
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL
- Redis

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/pop-naol/Car-Rental-Saas.git
   cd Car-Rental-Saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your DB and JWT settings
   ```

4. **Run database migrations**
   ```bash
   cd backend
   npx prisma migrate dev
   npm run seed
   ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```

   Or use Docker:
   ```bash
   docker-compose up -d
   ```

The frontend runs on [http://localhost:3000](http://localhost:3000) and the backend API on [http://localhost:5000](http://localhost:5000).

## License

MIT
