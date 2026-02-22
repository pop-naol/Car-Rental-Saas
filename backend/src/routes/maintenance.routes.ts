import { Router, Request, Response } from 'express'
import { MaintenanceService } from '../services/maintenance.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const createMaintenanceSchema = z.object({
  companyId: z.string().uuid(),
  vehicleId: z.string().uuid(),
  type: z.string().min(1),
  description: z.string().min(1),
  cost: z.number().positive(),
  date: z.string().datetime(),
  performedBy: z.string().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  nextMaintenanceOdometer: z.number().int().positive().optional(),
})

const updateMaintenanceSchema = z.object({
  type: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  cost: z.number().positive().optional(),
  date: z.string().datetime().optional(),
  performedBy: z.string().optional(),
  nextMaintenanceDate: z.string().datetime().optional(),
  nextMaintenanceOdometer: z.number().int().positive().optional(),
})

// POST /maintenance - Create maintenance log
router.post('/', requirePermission('vehicle:update'), async (req: Request, res: Response) => {
  try {
    const data = createMaintenanceSchema.parse(req.body)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create maintenance logs for your own company',
        },
      })
    }

    const maintenanceLog = await MaintenanceService.createMaintenanceLog(
      {
        ...data,
        date: new Date(data.date),
        nextMaintenanceDate: data.nextMaintenanceDate
          ? new Date(data.nextMaintenanceDate)
          : undefined,
      },
      req.user!.userId
    )

    res.status(201).json({
      message: 'Maintenance log created successfully',
      maintenanceLog,
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

    console.error('Create maintenance log error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating maintenance log',
      },
    })
  }
})

// GET /maintenance - List maintenance logs
router.get('/', requirePermission('vehicle:read'), async (req: Request, res: Response) => {
  try {
    const { vehicleId, type, startDate, endDate } = req.query

    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const maintenanceLogs = await MaintenanceService.getMaintenanceLogs({
      companyId,
      vehicleId: vehicleId as string | undefined,
      type: type as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    })

    res.json({ maintenanceLogs })
  } catch (error) {
    console.error('Get maintenance logs error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching maintenance logs',
      },
    })
  }
})

// GET /maintenance/upcoming - Get upcoming maintenance
router.get(
  '/upcoming',
  requirePermission('vehicle:read'),
  async (req: Request, res: Response) => {
    try {
      const companyId = req.user!.companyId!

      const upcoming = await MaintenanceService.getUpcomingMaintenance(companyId)

      res.json({ upcoming })
    } catch (error) {
      console.error('Get upcoming maintenance error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching upcoming maintenance',
        },
      })
    }
  }
)

// GET /maintenance/vehicle/:vehicleId/history - Get vehicle maintenance history
router.get(
  '/vehicle/:vehicleId/history',
  requirePermission('vehicle:read'),
  async (req: Request, res: Response) => {
    try {
      const { vehicleId } = req.params

      const history = await MaintenanceService.getMaintenanceHistory(vehicleId)

      res.json({ history })
    } catch (error) {
      console.error('Get maintenance history error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching maintenance history',
        },
      })
    }
  }
)

// GET /maintenance/cost-by-vehicle - Get maintenance cost by vehicle
router.get(
  '/cost-by-vehicle',
  requirePermission('vehicle:read'),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate parameters are required',
          },
        })
      }

      const companyId = req.user!.companyId!

      const report = await MaintenanceService.getMaintenanceCostByVehicle(
        companyId,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      res.json({ report })
    } catch (error) {
      console.error('Get maintenance cost by vehicle error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching maintenance cost report',
        },
      })
    }
  }
)

// GET /maintenance/:id - Get maintenance log by ID
router.get('/:id', requirePermission('vehicle:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const maintenanceLog = await MaintenanceService.getMaintenanceLogById(id)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== maintenanceLog.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view maintenance logs from your own company',
        },
      })
    }

    res.json({ maintenanceLog })
  } catch (error) {
    if (error instanceof Error && error.message === 'MAINTENANCE_LOG_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'MAINTENANCE_LOG_NOT_FOUND',
          message: 'Maintenance log not found',
        },
      })
    }

    console.error('Get maintenance log error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching maintenance log',
      },
    })
  }
})

// PATCH /maintenance/:id - Update maintenance log
router.patch('/:id', requirePermission('vehicle:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateMaintenanceSchema.parse(req.body)

    const maintenanceLog = await MaintenanceService.updateMaintenanceLog(
      id,
      {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        nextMaintenanceDate: data.nextMaintenanceDate
          ? new Date(data.nextMaintenanceDate)
          : undefined,
      },
      req.user!.userId,
      req.user!.companyId!
    )

    res.json({
      message: 'Maintenance log updated successfully',
      maintenanceLog,
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

    if (error instanceof Error && error.message === 'MAINTENANCE_LOG_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'MAINTENANCE_LOG_NOT_FOUND',
          message: 'Maintenance log not found',
        },
      })
    }

    console.error('Update maintenance log error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating maintenance log',
      },
    })
  }
})

// DELETE /maintenance/:id - Delete maintenance log
router.delete('/:id', requirePermission('vehicle:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const result = await MaintenanceService.deleteMaintenanceLog(
      id,
      req.user!.userId,
      req.user!.companyId!
    )

    res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'MAINTENANCE_LOG_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'MAINTENANCE_LOG_NOT_FOUND',
          message: 'Maintenance log not found',
        },
      })
    }

    console.error('Delete maintenance log error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting maintenance log',
        },
    })
  }
})

export default router
