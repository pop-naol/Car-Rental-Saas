import { Router, Request, Response } from 'express'
import { VehicleService } from '../services/vehicle.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'
import { VehicleStatus } from '@prisma/client'

const router = Router()

// All vehicle routes require authentication
router.use(authenticate)

// Validation schemas
const createVehicleSchema = z.object({
  companyId: z.string().uuid(),
  branchId: z.string().uuid(),
  vin: z.string().min(17).max(17),
  plateNumber: z.string().min(1),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  fuelType: z.string().min(1),
  transmission: z.string().min(1),
  dailyRate: z.number().positive(),
  weeklyRate: z.number().positive(),
  monthlyRate: z.number().positive(),
  currentOdometer: z.number().nonnegative().optional(),
  currentFuel: z.number().min(0).max(100).optional(),
  purchaseCost: z.number().positive().optional(),
})

const updateVehicleSchema = z.object({
  branchId: z.string().uuid().optional(),
  plateNumber: z.string().min(1).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  fuelType: z.string().min(1).optional(),
  transmission: z.string().min(1).optional(),
  dailyRate: z.number().positive().optional(),
  weeklyRate: z.number().positive().optional(),
  monthlyRate: z.number().positive().optional(),
  currentOdometer: z.number().nonnegative().optional(),
  currentFuel: z.number().min(0).max(100).optional(),
  purchaseCost: z.number().positive().optional(),
})

const updateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE']),
})

const transferVehicleSchema = z.object({
  toBranchId: z.string().uuid(),
})

// POST /vehicles - Create vehicle
router.post('/', requirePermission('vehicle:create'), async (req: Request, res: Response) => {
  try {
    const data = createVehicleSchema.parse(req.body)

    // Ensure user can only create vehicles for their company (unless Super Admin)
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create vehicles for your own company',
        },
      })
    }

    const vehicle = await VehicleService.createVehicle(data, req.user!.userId)

    return res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
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
      if (error.message === 'VIN_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'VIN_ALREADY_EXISTS',
            message: 'A vehicle with this VIN already exists',
          },
        })
      }

      if (error.message === 'PLATE_NUMBER_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'PLATE_NUMBER_ALREADY_EXISTS',
            message: 'A vehicle with this plate number already exists in your company',
          },
        })
      }
    }

    console.error('Create vehicle error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating vehicle',
      },
    })
  }
})

// GET /vehicles - List vehicles
router.get('/', requirePermission('vehicle:read'), async (req: Request, res: Response) => {
  try {
    const { branchId, status, search } = req.query

    // Super Admin can see all vehicles, others see only their company's vehicles
    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const vehicles = await VehicleService.getVehicles({
      companyId,
      branchId: branchId as string | undefined,
      status: status as VehicleStatus | undefined,
      search: search as string | undefined,
    })

    return res.json({ vehicles })
  } catch (error) {
    console.error('Get vehicles error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching vehicles',
      },
    })
  }
})

// GET /vehicles/:id - Get vehicle by ID
router.get('/:id', requirePermission('vehicle:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const vehicle = await VehicleService.getVehicleById(id)

    // Check if user has access to this vehicle
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== vehicle.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view vehicles from your own company',
        },
      })
    }

    return res.json({ vehicle })
  } catch (error) {
    if (error instanceof Error && error.message === 'VEHICLE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found',
        },
      })
    }

    console.error('Get vehicle error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching vehicle',
      },
    })
  }
})

// PATCH /vehicles/:id - Update vehicle
router.patch('/:id', requirePermission('vehicle:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateVehicleSchema.parse(req.body)

    const vehicle = await VehicleService.updateVehicle(
      id,
      data,
      req.user!.userId,
      req.user!.companyId!
    )

    return res.json({
      message: 'Vehicle updated successfully',
      vehicle,
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
      if (error.message === 'VEHICLE_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found',
          },
        })
      }

      if (error.message === 'PLATE_NUMBER_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'PLATE_NUMBER_ALREADY_EXISTS',
            message: 'A vehicle with this plate number already exists in your company',
          },
        })
      }
    }

    console.error('Update vehicle error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating vehicle',
      },
    })
  }
})

// PATCH /vehicles/:id/status - Update vehicle status
router.patch(
  '/:id/status',
  requirePermission('vehicle:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { status } = updateStatusSchema.parse(req.body)

      const vehicle = await VehicleService.updateVehicleStatus(
        id,
        status,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.json({
        message: 'Vehicle status updated successfully',
        vehicle,
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

      if (error instanceof Error && error.message === 'VEHICLE_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found',
          },
        })
      }

      console.error('Update vehicle status error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating vehicle status',
        },
      })
    }
  }
)

// POST /vehicles/:id/transfer - Transfer vehicle to another branch
router.post(
  '/:id/transfer',
  requirePermission('vehicle:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { toBranchId } = transferVehicleSchema.parse(req.body)

      const vehicle = await VehicleService.transferVehicle(
        id,
        toBranchId,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.json({
        message: 'Vehicle transferred successfully',
        vehicle,
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
        if (error.message === 'VEHICLE_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'VEHICLE_NOT_FOUND',
              message: 'Vehicle not found',
            },
          })
        }

        if (error.message === 'BRANCH_NOT_FOUND') {
          return res.status(404).json({
            error: {
              code: 'BRANCH_NOT_FOUND',
              message: 'Target branch not found',
            },
          })
        }
      }

      console.error('Transfer vehicle error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while transferring vehicle',
        },
      })
    }
  }
)

// DELETE /vehicles/:id - Delete vehicle (soft delete)
router.delete('/:id', requirePermission('vehicle:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const vehicle = await VehicleService.deleteVehicle(id, req.user!.userId, req.user!.companyId!)

    return res.json({
      message: 'Vehicle deleted successfully',
      vehicle,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'VEHICLE_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'VEHICLE_NOT_FOUND',
            message: 'Vehicle not found',
          },
        })
      }

      if (error.message === 'VEHICLE_HAS_ACTIVE_BOOKINGS') {
        return res.status(409).json({
          error: {
            code: 'VEHICLE_HAS_ACTIVE_BOOKINGS',
            message: 'Cannot delete vehicle with active bookings',
          },
        })
      }
    }

    console.error('Delete vehicle error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting vehicle',
      },
    })
  }
})

// GET /vehicles/:id/profit - Calculate vehicle profit
router.get(
  '/:id/profit',
  requirePermission('vehicle:read'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate query parameters are required',
          },
        })
      }

      const profit = await VehicleService.calculateVehicleProfit(
        id,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      return res.json({ profit })
    } catch (error) {
      console.error('Calculate vehicle profit error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while calculating vehicle profit',
        },
      })
    }
  }
)

export default router


