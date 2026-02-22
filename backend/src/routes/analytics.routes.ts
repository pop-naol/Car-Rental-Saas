import { Router, Request, Response } from 'express'
import { AnalyticsService } from '../services/analytics.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'

const router = Router()

router.use(authenticate)

// GET /analytics/dashboard - Get dashboard metrics
router.get('/dashboard', requirePermission('analytics:read'), async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId!
    const metrics = await AnalyticsService.getDashboardMetrics(companyId)
    res.json({ metrics })
  } catch (error) {
    console.error('Get dashboard metrics error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching dashboard metrics',
      },
    })
  }
})

// GET /analytics/dashboard/global - Get global dashboard (Super Admin only)
router.get('/dashboard/global', requirePermission('analytics:global'), async (req: Request, res: Response) => {
  try {
    const dashboard = await AnalyticsService.getGlobalDashboard()
    res.json({ dashboard })
  } catch (error) {
    console.error('Get global dashboard error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching global dashboard',
      },
    })
  }
})

// GET /analytics/average-rental-duration - Get average rental duration
router.get('/average-rental-duration', requirePermission('analytics:read'), async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId!
    const averageDuration = await AnalyticsService.getAverageRentalDuration(companyId)
    res.json({ averageDuration })
  } catch (error) {
    console.error('Get average rental duration error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while calculating average rental duration',
      },
    })
  }
})

// GET /analytics/revenue-growth - Get revenue growth rate
router.get('/revenue-growth', requirePermission('analytics:read'), async (req: Request, res: Response) => {
  try {
    const companyId = req.user!.companyId!
    const growthRate = await AnalyticsService.getRevenueGrowthRate(companyId)
    res.json({ growthRate })
  } catch (error) {
    console.error('Get revenue growth rate error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while calculating revenue growth rate',
      },
    })
  }
})

// GET /analytics/vehicle-roi/:vehicleId - Get vehicle ROI
router.get('/vehicle-roi/:vehicleId', requirePermission('analytics:read'), async (req: Request, res: Response) => {
  try {
    const { vehicleId } = req.params
    const roi = await AnalyticsService.getVehicleROI(vehicleId)

    if (!roi) {
      return res.status(404).json({
        error: {
          code: 'VEHICLE_NOT_FOUND',
          message: 'Vehicle not found or purchase cost not set',
        },
      })
    }

    res.json({ roi })
  } catch (error) {
    console.error('Get vehicle ROI error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while calculating vehicle ROI',
      },
    })
  }
})

export default router
