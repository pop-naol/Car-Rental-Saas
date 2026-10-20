import { Router, Request, Response } from 'express'
import { DriverService } from '../services/driver.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const createDriverSchema = z.object({
  companyId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_TRIP', 'INACTIVE']).optional(),
})

const updateDriverSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  phone: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  licenseExpiry: z.string().datetime().optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().optional(),
  photoUrl: z.string().optional(),
  status: z.enum(['ACTIVE', 'ON_TRIP', 'INACTIVE']).optional(),
  isActive: z.boolean().optional(),
})

const rateDriverSchema = z.object({
  rentalId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  onTime: z.boolean(),
})

// POST /drivers - Create driver
router.post('/', requirePermission('driver:create'), async (req: Request, res: Response) => {
  try {
    const data = createDriverSchema.parse(req.body)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create drivers for your own company',
        },
      })
    }

    const driver = await DriverService.createDriver(
      {
        ...data,
        licenseExpiry: new Date(data.licenseExpiry),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
      req.user!.userId
    )

    return res.status(201).json({
      message: 'Driver created successfully',
      driver,
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
      if (error.message === 'LICENSE_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'LICENSE_ALREADY_EXISTS',
            message: 'A driver with this license number already exists',
          },
        })
      }

      if (error.message === 'LICENSE_EXPIRED') {
        return res.status(400).json({
          error: {
            code: 'LICENSE_EXPIRED',
            message: 'License expiry date must be in the future',
          },
        })
      }

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A user with this email already exists',
          },
        })
      }
    }

    console.error('Create driver error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating driver',
      },
    })
  }
})

// GET /drivers - List drivers
router.get('/', requirePermission('driver:read'), async (req: Request, res: Response) => {
  try {
    const { isActive, search } = req.query

    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const drivers = await DriverService.getDrivers({
      companyId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string | undefined,
    })

    return res.json({ drivers })
  } catch (error) {
    console.error('Get drivers error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching drivers',
      },
    })
  }
})

// GET /drivers/:id - Get driver by ID
router.get('/:id', requirePermission('driver:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const driver = await DriverService.getDriverById(id)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== driver.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view drivers from your own company',
        },
      })
    }

    return res.json({ driver })
  } catch (error) {
    if (error instanceof Error && error.message === 'DRIVER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'DRIVER_NOT_FOUND',
          message: 'Driver not found',
        },
      })
    }

    console.error('Get driver error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching driver',
      },
    })
  }
})

// PATCH /drivers/:id - Update driver
router.patch('/:id', requirePermission('driver:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateDriverSchema.parse(req.body)

    const driver = await DriverService.updateDriver(
      id,
      {
        ...data,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
      },
      req.user!.userId,
      req.user!.companyId!
    )

    return res.json({
      message: 'Driver updated successfully',
      driver,
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
      if (error.message === 'DRIVER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'DRIVER_NOT_FOUND',
            message: 'Driver not found',
          },
        })
      }

      if (error.message === 'LICENSE_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'LICENSE_ALREADY_EXISTS',
            message: 'A driver with this license number already exists',
          },
        })
      }

      if (error.message === 'LICENSE_EXPIRED') {
        return res.status(400).json({
          error: {
            code: 'LICENSE_EXPIRED',
            message: 'License expiry date must be in the future',
          },
        })
      }

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A user with this email already exists',
          },
        })
      }
    }

    console.error('Update driver error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating driver',
      },
    })
  }
})

// POST /drivers/:id/rate - Rate driver after trip
router.post(
  '/:id/rate',
  requirePermission('driver:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const data = rateDriverSchema.parse(req.body)

      const driver = await DriverService.rateDriver(
        id,
        data,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.json({
        message: 'Driver rated successfully',
        driver,
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
        if (error.message === 'DRIVER_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'DRIVER_NOT_FOUND',
              message: 'Driver not found',
            },
          })
        }

        if (error.message === 'RENTAL_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'RENTAL_NOT_FOUND',
              message: 'Rental not found or does not belong to this driver',
            },
          })
        }

        if (error.message === 'INVALID_RATING') {
          return res.status(400).json({
            error: {
              code: 'INVALID_RATING',
              message: 'Rating must be between 1 and 5',
            },
          })
        }
      }

      console.error('Rate driver error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while rating driver',
        },
      })
    }
  }
)

// POST /drivers/:id/incident - Record incident
router.post(
  '/:id/incident',
  requirePermission('driver:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const driver = await DriverService.recordIncident(id, req.user!.userId, req.user!.companyId!)

      return res.json({
        message: 'Incident recorded successfully',
        driver,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'DRIVER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'DRIVER_NOT_FOUND',
            message: 'Driver not found',
          },
        })
      }

      console.error('Record incident error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while recording incident',
        },
      })
    }
  }
)

// GET /drivers/performance/ranking - Get driver performance ranking
router.get(
  '/performance/ranking',
  requirePermission('driver:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId!

      const ranking = await DriverService.getDriverPerformanceRanking(companyId)

      return res.json({ ranking })
    } catch (error) {
      console.error('Get performance ranking error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching performance ranking',
        },
      })
    }
  }
)

// GET /drivers/:id/can-drive - Check if driver can drive
router.get(
  '/:id/can-drive',
  requirePermission('driver:read'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await DriverService.canDrive(id)

      return res.json(result)
    } catch (error) {
      console.error('Check can drive error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while checking driver eligibility',
        },
      })
    }
  }
)

// DELETE /drivers/:id - Soft delete driver
router.delete('/:id', requirePermission('driver:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await DriverService.deleteDriver(id, req.user!.userId, req.user!.companyId!)

    return res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'DRIVER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'DRIVER_NOT_FOUND',
          message: 'Driver not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'DRIVER_ALREADY_DELETED') {
      return res.status(400).json({
        error: {
          code: 'DRIVER_ALREADY_DELETED',
          message: 'Driver is already deleted',
        },
      })
    }

    console.error('Delete driver error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting driver',
      },
    })
  }
})

// POST /drivers/:id/restore - Restore soft-deleted driver
router.post('/:id/restore', requirePermission('driver:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await DriverService.restoreDriver(id, req.user!.userId, req.user!.companyId!)

    return res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'DRIVER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'DRIVER_NOT_FOUND',
          message: 'Driver not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'DRIVER_NOT_DELETED') {
      return res.status(400).json({
        error: {
          code: 'DRIVER_NOT_DELETED',
          message: 'Driver is not deleted',
        },
      })
    }

    console.error('Restore driver error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while restoring driver',
      },
    })
  }
})

export default router


