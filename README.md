# Car Rental SaaS

A full-stack car rental management platform designed to help rental businesses manage vehicles, customers, drivers, reservations, rental operations, and financial records across multiple companies and branches.

## Overview

Car Rental SaaS is a business management application with a Next.js frontend and an Express API. It uses a relational database to organize operational data and includes role-based access control and security-related middleware.

The project is organized as a monorepo with separate frontend and backend workspaces.

## Features

### Business Management
- Multi-company and multi-branch data model
- Vehicle fleet management
- Customer and driver records
- Booking and rental workflows
- Vehicle maintenance records
- Employee management

### Financial Management
- Rental cost tracking
- Revenue and expense records
- Invoice records and payment-status tracking
- Financial reporting data

*The presence of financial records does not imply integration with an external payment gateway.*

### Dashboard and Operations
- Analytics API and dashboard dependencies
- Notification management
- Document records and upload support
- Audit logging
- Role-based access control (RBAC)

## Technology Stack

### Frontend
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Zustand
- Axios
- React Hook Form
- Zod
- Recharts

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- JWT authentication
- Helmet
- CORS
- Zod validation
- Express rate limiting
- Redis configuration

### Database and Development Tools
- MySQL 8
- Redis 7
- Docker Compose
- npm workspaces

## Project Structure

```text
Car-Rental-Saas/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── routes/
│       ├── services/
│       ├── middleware/
│       └── utils/
├── frontend/
├── docker-compose.yml
├── package.json
└── README.md
```

## Prerequisites

Install the following before starting:

- Node.js 20 or later
- npm
- Docker Desktop with Docker Compose, or compatible local MySQL and Redis services

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pop-naol/Car-Rental-Saas.git
cd Car-Rental-Saas
```

### 2. Install dependencies

From the repository root:

```bash
npm install
```

### 3. Start MySQL and Redis

Start the configured development services:

```bash
docker compose up -d
```

The current Docker Compose configuration exposes:

- MySQL on port `3308`
- Redis on port `6379`

These are development settings. Change credentials and ports appropriately for your environment.

### 4. Configure the backend environment

Create your local environment file:

```bash
cp backend/.env.example backend/.env
```

On Windows Command Prompt, you can use:

```bat
copy backend\.env.example backend\.env
```

Configure the values in `backend/.env` to match your local services.

For the supplied Docker Compose configuration, the database connection should use the MySQL service credentials and port:

```env
DATABASE_URL="mysql://carrentaluser:carrentalpass@localhost:3308/car_rental_dev"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="replace-with-a-strong-local-secret"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
PORT=5000
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
```

These are local development examples. Keep real secrets out of source control and never use example credentials in production.

Ensure the frontend's API URL is configured to point to the backend server.

### 5. Apply database migrations

From the repository root:

```bash
npm run prisma:generate --workspace=backend
npm run prisma:migrate --workspace=backend
```

If the repository's migrations are not yet present or synchronized with the schema, review the Prisma schema and migration history before applying database changes.

### 6. Seed development data

```bash
npm run seed --workspace=backend
```

Review the seed script and change any development-only credentials before using the application beyond a local test environment.

### 7. Start the application

From the repository root:

```bash
npm run dev
```

The root development script starts the frontend and backend concurrently.

With the example configuration above:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Backend health check: http://localhost:5000/health

Verify the configured ports and API URL if your local environment differs.

## Available Scripts

From the repository root:

| Command | Purpose |
|---|---|
| `npm run dev` | Start frontend and backend |
| `npm run build` | Run workspace build scripts |
| `npm test` | Run workspace test scripts |
| `npm run lint` | Run workspace lint scripts |
| `npm run docker:up` | Start Docker services |
| `npm run docker:down` | Stop Docker services |

Backend-specific commands can be run using the `--workspace=backend` npm option.

## Security Considerations

The codebase includes security-related components such as JWT authentication, role-based access control, Helmet, CORS configuration, request validation, and rate limiting.

These components should be reviewed and tested before production use. A dependency or configuration alone does not guarantee that the application is secure.

Before deployment:

- Use strong, unique secrets.
- Configure production CORS origins explicitly.
- Protect sensitive customer and driver data.
- Verify authorization and company-level data isolation.
- Review file upload validation and storage permissions.
- Test authentication, input validation, and error handling.
- Configure backups and production database access controls.

## Current Project Status

This repository contains the application source code, database schema, development configuration, and setup scripts.

Feature availability, production readiness, and end-to-end behavior should be verified through testing before being represented as fully validated.

## License

MIT
