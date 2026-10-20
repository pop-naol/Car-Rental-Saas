import { Router, Request, Response } from 'express'
import { CompanyService } from '../services/company.service'
import { authenticate } from '../middleware/auth'
import { requireRole } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

// All company routes require authentication
router.use(authenticate)

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1),
  subscriptionTier: z.string().optional(),
})

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  subscriptionTier: z.string().optional(),
})

// POST /companies - Create company (Super Admin only)
router.post('/', requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const data = createCompanySchema.parse(req.body)
    const company = await CompanyService.createCompany(data, req.user!.userId)

    return res.status(201).json({
      message: 'Company created successfully',
      company,
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

    console.error('Create company error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating company',
      },
    })
  }
})

// GET /companies - List all companies (Super Admin only)
router.get('/', requireRole('SUPER_ADMIN'), async (_req: Request, res: Response) => {
  try {
    const companies = await CompanyService.getAllCompanies()
    return res.json({ companies })
  } catch (error) {
    console.error('Get companies error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching companies',
      },
    })
  }
})

// GET /companies/:id - Get company by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    // Super Admin can view any company, others can only view their own
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own company',
        },
      })
    }

    const company = await CompanyService.getCompanyById(id)
    return res.json({ company })
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      })
    }

    console.error('Get company error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching company',
      },
    })
  }
})

// PATCH /companies/:id - Update company (Super Admin only)
router.patch('/:id', requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateCompanySchema.parse(req.body)

    const company = await CompanyService.updateCompany(id, data, req.user!.userId)

    return res.json({
      message: 'Company updated successfully',
      company,
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

    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      })
    }

    console.error('Update company error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating company',
      },
    })
  }
})

// PATCH /companies/:id/suspend - Suspend company (Super Admin only)
router.patch('/:id/suspend', requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const company = await CompanyService.suspendCompany(id, req.user!.userId)

    return res.json({
      message: 'Company suspended successfully',
      company,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      })
    }

    console.error('Suspend company error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while suspending company',
      },
    })
  }
})

// PATCH /companies/:id/activate - Activate company (Super Admin only)
router.patch('/:id/activate', requireRole('SUPER_ADMIN'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const company = await CompanyService.activateCompany(id, req.user!.userId)

    return res.json({
      message: 'Company activated successfully',
      company,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'COMPANY_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'COMPANY_NOT_FOUND',
          message: 'Company not found',
        },
      })
    }

    console.error('Activate company error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while activating company',
      },
    })
  }
})

export default router

