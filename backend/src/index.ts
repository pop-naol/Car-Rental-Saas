import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import path from 'path'
import { config } from './config'
import { apiLimiter, authLimiter } from './middleware/rateLimit'
import authRoutes from './routes/auth.routes'
import companyRoutes from './routes/company.routes'
import branchRoutes from './routes/branch.routes'
import vehicleRoutes from './routes/vehicle.routes'
import customerRoutes from './routes/customer.routes'
import driverRoutes from './routes/driver.routes'
import bookingRoutes from './routes/booking.routes'
import rentalRoutes from './routes/rental.routes'
import financialRoutes from './routes/financial.routes'
import maintenanceRoutes from './routes/maintenance.routes'
import analyticsRoutes from './routes/analytics.routes'
import employeeRoutes from './routes/employee.routes'
import notificationRoutes from './routes/notification.routes'
import documentRoutes from './routes/document.routes'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({ origin: config.cors.origin, credentials: true }))

// Body parsing middleware
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true, limit: '5mb' }))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'Car Rental Management SaaS API',
    version: '1.0.0',
    status: 'running',
  })
})

// API Routes
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/companies', apiLimiter, companyRoutes)
app.use('/api/branches', apiLimiter, branchRoutes)
app.use('/api/vehicles', apiLimiter, vehicleRoutes)
app.use('/api/customers', apiLimiter, customerRoutes)
app.use('/api/drivers', apiLimiter, driverRoutes)
app.use('/api/bookings', apiLimiter, bookingRoutes)
app.use('/api/rentals', apiLimiter, rentalRoutes)
app.use('/api/financial', apiLimiter, financialRoutes)
app.use('/api/maintenance', apiLimiter, maintenanceRoutes)
app.use('/api/analytics', apiLimiter, analyticsRoutes)
app.use('/api/employees', apiLimiter, employeeRoutes)
app.use('/api/notifications', apiLimiter, notificationRoutes)
app.use('/api/documents', apiLimiter, documentRoutes)

// Start server
const PORT = config.server.port

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${config.server.nodeEnv}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`)
  console.log(`🏢 Company endpoints: http://localhost:${PORT}/api/companies`)
  console.log(`🏪 Branch endpoints: http://localhost:${PORT}/api/branches`)
  console.log(`🚗 Vehicle endpoints: http://localhost:${PORT}/api/vehicles`)
  console.log(`👤 Customer endpoints: http://localhost:${PORT}/api/customers`)
  console.log(`🚙 Driver endpoints: http://localhost:${PORT}/api/drivers`)
  console.log(`📅 Booking endpoints: http://localhost:${PORT}/api/bookings`)
  console.log(`🚘 Rental endpoints: http://localhost:${PORT}/api/rentals`)
  console.log(`💰 Financial endpoints: http://localhost:${PORT}/api/financial`)
  console.log(`🔧 Maintenance endpoints: http://localhost:${PORT}/api/maintenance`)
  console.log(`📊 Analytics endpoints: http://localhost:${PORT}/api/analytics`)
  console.log(`👥 Employee endpoints: http://localhost:${PORT}/api/employees`)
  console.log(`🔔 Notification endpoints: http://localhost:${PORT}/api/notifications`)
  console.log(`📄 Document endpoints: http://localhost:${PORT}/api/documents`)
})

export default app
