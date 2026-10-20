import { Router, Request, Response } from 'express'
import { BranchService } from '../services/branch.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

// All branch routes require authentication
router.use(authenticate)

// Validation schemas
const createBranchSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
})

const updateBranchSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isActive: z.boolean().optional(),
})

// POST /branches - Create branch
router.post('/', requirePermission('branch:create'), async (req: Request, res: Response) => {
  try {
    const data = createBranchSchema.parse(req.body)

    // Ensure user can only create branches for their company (unless Super Admin)
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create branches for your own company',
        },
      })
    }

    const branch = await BranchService.createBranch(data, req.user!.userId)

    return res.status(201).json({
      message: 'Branch created successfully',
      branch,
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

    console.error('Create branch error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating branch',
      },
    })
  }
})

// GET /branches - List branches
router.get('/', requirePermission('branch:read'), async (req: Request, res: Response) => {
  try {
    // Super Admin can see all branches, others see only their company's branches
    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const branches = await BranchService.getBranches(companyId)
    return res.json({ branches })
  } catch (error) {
    console.error('Get branches error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching branches',
      },
    })
  }
})

// GET /branches/:id - Get branch by ID
router.get('/:id', requirePermission('branch:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const branch = await BranchService.getBranchById(id)

    // Check if user has access to this branch
    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== branch.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view branches from your own company',
        },
      })
    }

    return res.json({ branch })
  } catch (error) {
    if (error instanceof Error && error.message === 'BRANCH_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      })
    }

    console.error('Get branch error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching branch',
      },
    })
  }
})

// PATCH /branches/:id - Update branch
router.patch('/:id', requirePermission('branch:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateBranchSchema.parse(req.body)

    const branch = await BranchService.updateBranch(
      id,
      data,
      req.user!.userId,
      req.user!.companyId!
    )

    return res.json({
      message: 'Branch updated successfully',
      branch,
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

    if (error instanceof Error && error.message === 'BRANCH_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'BRANCH_NOT_FOUND',
          message: 'Branch not found',
        },
      })
    }

    console.error('Update branch error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating branch',
      },
    })
  }
})

// DELETE /branches/:id - Delete branch
router.delete('/:id', requirePermission('branch:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const branch = await BranchService.deleteBranch(id, req.user!.userId, req.user!.companyId!)

    return res.json({
      message: 'Branch deleted successfully',
      branch,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'BRANCH_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'BRANCH_NOT_FOUND',
            message: 'Branch not found',
          },
        })
      }

      if (error.message === 'BRANCH_HAS_ACTIVE_RENTALS') {
        return res.status(409).json({
          error: {
            code: 'BRANCH_HAS_ACTIVE_RENTALS',
            message: 'Cannot delete branch with active rentals',
          },
        })
      }

      if (error.message === 'BRANCH_HAS_DEPENDENCIES') {
        return res.status(409).json({
          error: {
            code: 'BRANCH_HAS_DEPENDENCIES',
            message: 'Cannot delete branch with assigned vehicles or employees',
          },
        })
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete branches from your own company',
          },
        })
      }
    }

    console.error('Delete branch error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting branch',
      },
    })
  }
})

export default router

