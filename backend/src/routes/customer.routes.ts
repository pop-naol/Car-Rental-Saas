import { Router, Request, Response } from 'express'
import { CustomerService } from '../services/customer.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const createCustomerSchema = z.object({
  companyId: z.string().uuid(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  licenseNumber: z.string().min(1),
  licenseExpiry: z.string().datetime(),
  dateOfBirth: z.string().datetime(),
  idNumber: z.string().optional(),
})

const updateCustomerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  licenseNumber: z.string().min(1).optional(),
  licenseExpiry: z.string().datetime().optional(),
  dateOfBirth: z.string().datetime().optional(),
  idNumber: z.string().optional(),
  isBlacklisted: z.boolean().optional(),
  loyaltyLevel: z.string().optional(),
  riskScore: z.number().min(0).max(100).optional(),
})

const updateLoyaltySchema = z.object({
  loyaltyLevel: z.enum(['STANDARD', 'SILVER', 'GOLD', 'PLATINUM']),
})

// POST /customers - Create customer
router.post('/', requirePermission('customer:create'), async (req: Request, res: Response) => {
  try {
    const data = createCustomerSchema.parse(req.body)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create customers for your own company',
        },
      })
    }

    const customer = await CustomerService.createCustomer(
      {
        ...data,
        licenseExpiry: new Date(data.licenseExpiry),
        dateOfBirth: new Date(data.dateOfBirth),
      },
      req.user!.userId
    )

    res.status(201).json({
      message: 'Customer created successfully',
      customer,
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
      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A customer with this email already exists',
          },
        })
      }

      if (error.message === 'LICENSE_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'LICENSE_ALREADY_EXISTS',
            message: 'A customer with this license number already exists',
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
    }

    console.error('Create customer error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating customer',
      },
    })
  }
})

// GET /customers - List customers
router.get('/', requirePermission('customer:read'), async (req: Request, res: Response) => {
  try {
    const { isBlacklisted, loyaltyLevel, search } = req.query

    const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

    const customers = await CustomerService.getCustomers({
      companyId,
      isBlacklisted: isBlacklisted === 'true' ? true : isBlacklisted === 'false' ? false : undefined,
      loyaltyLevel: loyaltyLevel as string | undefined,
      search: search as string | undefined,
    })

    res.json({ customers })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching customers',
      },
    })
  }
})

// GET /customers/:id - Get customer by ID
router.get('/:id', requirePermission('customer:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const customer = await CustomerService.getCustomerById(id)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== customer.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view customers from your own company',
        },
      })
    }

    res.json({ customer })
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      })
    }

    console.error('Get customer error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching customer',
      },
    })
  }
})

// PATCH /customers/:id - Update customer
router.patch('/:id', requirePermission('customer:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateCustomerSchema.parse(req.body)

    const customer = await CustomerService.updateCustomer(
      id,
      {
        ...data,
        licenseExpiry: data.licenseExpiry ? new Date(data.licenseExpiry) : undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
      req.user!.userId,
      req.user!.companyId!
    )

    res.json({
      message: 'Customer updated successfully',
      customer,
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
      if (error.message === 'CUSTOMER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        })
      }

      if (error.message === 'EMAIL_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'A customer with this email already exists',
          },
        })
      }

      if (error.message === 'LICENSE_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'LICENSE_ALREADY_EXISTS',
            message: 'A customer with this license number already exists',
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
    }

    console.error('Update customer error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating customer',
      },
    })
  }
})

// PATCH /customers/:id/blacklist - Blacklist customer
router.patch(
  '/:id/blacklist',
  requirePermission('customer:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const customer = await CustomerService.blacklistCustomer(
        id,
        req.user!.userId,
        req.user!.companyId!
      )

      res.json({
        message: 'Customer blacklisted successfully',
        customer,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        })
      }

      console.error('Blacklist customer error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while blacklisting customer',
        },
      })
    }
  }
)

// PATCH /customers/:id/remove-blacklist - Remove blacklist
router.patch(
  '/:id/remove-blacklist',
  requirePermission('customer:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const customer = await CustomerService.removeBlacklist(
        id,
        req.user!.userId,
        req.user!.companyId!
      )

      res.json({
        message: 'Customer removed from blacklist successfully',
        customer,
      })
    } catch (error) {
      if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        })
      }

      console.error('Remove blacklist error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while removing blacklist',
        },
      })
    }
  }
)

// PATCH /customers/:id/loyalty - Update loyalty level
router.patch(
  '/:id/loyalty',
  requirePermission('customer:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { loyaltyLevel } = updateLoyaltySchema.parse(req.body)

      const customer = await CustomerService.updateLoyaltyLevel(
        id,
        loyaltyLevel,
        req.user!.userId,
        req.user!.companyId!
      )

      res.json({
        message: 'Customer loyalty level updated successfully',
        customer,
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

      if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'CUSTOMER_NOT_FOUND',
            message: 'Customer not found',
          },
        })
      }

      console.error('Update loyalty level error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while updating loyalty level',
        },
      })
    }
  }
)

// GET /customers/:id/can-rent - Check if customer can rent
router.get(
  '/:id/can-rent',
  requirePermission('customer:read'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const result = await CustomerService.canRent(id)

      res.json(result)
    } catch (error) {
      console.error('Check can rent error:', error)
      res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while checking rental eligibility',
        },
      })
    }
  }
)

// DELETE /customers/:id - Soft delete customer
router.delete('/:id', requirePermission('customer:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await CustomerService.deleteCustomer(id, req.user!.userId, req.user!.companyId!)

    res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'CUSTOMER_ALREADY_DELETED') {
      return res.status(400).json({
        error: {
          code: 'CUSTOMER_ALREADY_DELETED',
          message: 'Customer is already deleted',
        },
      })
    }

    console.error('Delete customer error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting customer',
      },
    })
  }
})

// POST /customers/:id/restore - Restore soft-deleted customer
router.post('/:id/restore', requirePermission('customer:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await CustomerService.restoreCustomer(id, req.user!.userId, req.user!.companyId!)

    res.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'CUSTOMER_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'CUSTOMER_NOT_DELETED') {
      return res.status(400).json({
        error: {
          code: 'CUSTOMER_NOT_DELETED',
          message: 'Customer is not deleted',
        },
      })
    }

    console.error('Restore customer error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while restoring customer',
      },
    })
  }
})

export default router
