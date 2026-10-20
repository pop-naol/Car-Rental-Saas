import { Router, Request, Response } from 'express'
import { RentalService } from '../services/rental.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const startRentalSchema = z.object({
  bookingId: z.string().uuid(),
  startOdometer: z.coerce.number().int().nonnegative(),
  startFuel: z.coerce.number().min(0).max(100),
  contractUrl: z.string().url().optional(),
})

const endRentalSchema = z.object({
  endOdometer: z.number().int().nonnegative(),
  endFuel: z.number().min(0).max(100),
  damageNotes: z.string().optional(),
  damageCost: z.number().nonnegative().optional(),
})

// POST /rentals/start - Start rental from confirmed booking
router.post(
  '/start',
  requirePermission('rental:create'),
  async (req: Request, res: Response) => {
    try {
      const data = startRentalSchema.parse(req.body)

      const rental = await RentalService.startRental(
        data,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.status(201).json({
        message: 'Rental started successfully',
        rental,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        })
      }

      if (error instanceof Error) {
        if (error.message === 'BOOKING_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'BOOKING_NOT_FOUND',
              message: 'Booking not found',
            },
          })
        }

        if (error.message === 'BOOKING_NOT_CONFIRMED') {
          return res.status(400).json({
            error: {
              code: 'BOOKING_NOT_CONFIRMED',
              message: 'Only confirmed bookings can be started',
            },
          })
        }

        if (error.message === 'INVALID_ODOMETER') {
          return res.status(400).json({
            error: {
              code: 'INVALID_ODOMETER',
              message: 'Start odometer cannot be less than current vehicle odometer',
            },
          })
        }
      }

      console.error('Start rental error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while starting rental',
        },
      })
    }
  }
)

// POST /rentals/:id/end - End rental
router.post(
  '/:id/end',
  requirePermission('rental:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const data = endRentalSchema.parse(req.body)

      const rental = await RentalService.endRental(
        id,
        data,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.json({
        message: 'Rental ended successfully',
        rental,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input data',
            details: error.errors,
          },
        })
      }

      if (error instanceof Error) {
        if (error.message === 'RENTAL_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'RENTAL_NOT_FOUND',
              message: 'Rental not found',
            },
          })
        }

        if (error.message === 'RENTAL_NOT_ACTIVE') {
          return res.status(400).json({
            error: {
              code: 'RENTAL_NOT_ACTIVE',
              message: 'Only active rentals can be ended',
            },
          })
        }

        if (error.message === 'INVALID_ODOMETER') {
          return res.status(400).json({
            error: {
              code: 'INVALID_ODOMETER',
              message: 'End odometer cannot be less than start odometer',
            },
          })
        }
      }

      console.error('End rental error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while ending rental',
        },
      })
    }
  }
)

// GET /rentals - List rentals
router.get('/', requirePermission('rental:read'), async (req: Request, res: Response) => {
  try {
    const { customerId, vehicleId, status } = req.query

    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const isDriver = req.user!.role === 'DRIVER'
    const rentals = await RentalService.getRentals({
      companyId,
      customerId: customerId as string | undefined,
      vehicleId: vehicleId as string | undefined,
      status: status as string | undefined,
      driverId: isDriver ? req.user!.userId : undefined,
    })

    return res.json({ rentals })
  } catch (error) {
    console.error('Get rentals error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching rentals',
      },
    })
  }
})

// GET /rentals/active - Get active rentals
router.get('/active', requirePermission('rental:read'), async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId!

    const rentals = await RentalService.getActiveRentals(companyId)

    return res.json({ rentals })
  } catch (error) {
    console.error('Get active rentals error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching active rentals',
      },
    })
  }
})

// GET /rentals/overdue - Get overdue rentals
router.get('/overdue', requirePermission('rental:read'), async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId!

    const rentals = await RentalService.getOverdueRentals(companyId)

    return res.json({ rentals })
  } catch (error) {
    console.error('Get overdue rentals error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching overdue rentals',
      },
    })
  }
})

// GET /rentals/:id - Get rental by ID
router.get('/:id', requirePermission('rental:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const rental = await RentalService.getRentalById(id)

    if (req.user!.role === 'DRIVER' && rental.driver_id !== req.user!.userId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view rentals assigned to you',
        },
      })
    }

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== rental.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view rentals from your own company',
        },
      })
    }

    return res.json({ rental })
  } catch (error) {
    if (error instanceof Error && error.message === 'RENTAL_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'RENTAL_NOT_FOUND',
          message: 'Rental not found',
        },
      })
    }

    console.error('Get rental error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching rental',
      },
    })
  }
})

export default router


