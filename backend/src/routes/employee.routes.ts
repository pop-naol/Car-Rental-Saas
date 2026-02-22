import { Router, Request, Response } from 'express'
import { EmployeeService } from '../services/employee.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const createEmployeeSchema = z.object({
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['EMPLOYEE', 'COMPANY_MANAGER']),
})

const updateEmployeeSchema = z.object({
  branchId: z.string().uuid().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['EMPLOYEE', 'COMPANY_MANAGER']).optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8),
})

// POST /employees - Create employee
router.post('/', requirePermission('employee:create'), async (req: Request, res: Response) => {
  try {
    const data = createEmployeeSchema.parse(req.body)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only create employees for your own company',
        },
      })
    }

    const employee = await EmployeeService.createEmployee(data, req.user!.userId)

    res.status(201).json({
      message: 'Employee created successfully',
      employee,
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

    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        error: {
          code: 'EMAIL_ALREADY_EXISTS',
          message: 'Email already exists',
        },
      })
    }

    if (error instanceof Error && error.message === 'INSUFFICIENT_PRIVILEGES') {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Only Super Admin can create Company Managers',
        },
      })
    }

    console.error('Create employee error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while creating employee',
      },
    })
  }
})

// GET /employees - List employees
router.get('/', requirePermission('employee:read'), async (req: Request, res: Response) => {
  try {
    const { branchId, role } = req.query
    const companyId =
      req.user!.role === 'SUPER_ADMIN'
        ? (req.query.companyId as string | undefined)
        : req.user!.companyId

    const employees = await EmployeeService.getEmployees(companyId, {
      branchId: branchId as string | undefined,
      role: role as string | undefined,
    })

    res.json({ employees })
  } catch (error) {
    console.error('Get employees error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching employees',
      },
    })
  }
})

// GET /employees/:id - Get employee by ID
router.get('/:id', requirePermission('employee:read'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const employee = await EmployeeService.getEmployeeById(id)

    if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== employee.company_id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view employees from your own company',
        },
      })
    }

    res.json({ employee })
  } catch (error) {
    if (error instanceof Error && error.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'EMPLOYEE_NOT_FOUND',
          message: 'Employee not found',
        },
      })
    }

    console.error('Get employee error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching employee',
      },
    })
  }
})

// PATCH /employees/:id - Update employee
router.patch('/:id', requirePermission('employee:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data = updateEmployeeSchema.parse(req.body)

    const employee = await EmployeeService.updateEmployee(
      id,
      data,
      req.user!.userId,
      req.user!.companyId!
    )

    res.json({
      message: 'Employee updated successfully',
      employee,
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

    if (error instanceof Error && error.message === 'EMPLOYEE_NOT_FOUND') {
      return res.status(404).json({
        error: {
          code: 'EMPLOYEE_NOT_FOUND',
          message: 'Employee not found',
        },
      })
    }

    if (error instanceof Error && error.message === 'INSUFFICIENT_PRIVILEGES') {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PRIVILEGES',
          message: 'Only Super Admin can promote to Company Manager',
        },
      })
    }

    console.error('Update employee error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while updating employee',
      },
    })
  }
})

// PATCH /employees/:id/activate - Activate employee
router.patch('/:id/activate', requirePermission('employee:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await EmployeeService.activateEmployee(id, req.user!.userId, req.user!.companyId!)

    res.json(result)
  } catch (error) {
    console.error('Activate employee error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while activating employee',
      },
    })
  }
})

// PATCH /employees/:id/deactivate - Deactivate employee
router.patch('/:id/deactivate', requirePermission('employee:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await EmployeeService.deactivateEmployee(id, req.user!.userId, req.user!.companyId!)

    res.json(result)
  } catch (error) {
    console.error('Deactivate employee error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deactivating employee',
      },
    })
  }
})

// POST /employees/:id/reset-password - Reset employee password
router.post('/:id/reset-password', requirePermission('employee:update'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { newPassword } = resetPasswordSchema.parse(req.body)

    const result = await EmployeeService.resetPassword(
      id,
      newPassword,
      req.user!.userId,
      req.user!.companyId!
    )

    res.json(result)
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

    console.error('Reset password error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while resetting password',
      },
    })
  }
})

// DELETE /employees/:id - Delete employee
router.delete('/:id', requirePermission('employee:delete'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const result = await EmployeeService.deleteEmployee(id, req.user!.userId, req.user!.companyId!)

    res.json(result)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'EMPLOYEE_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'EMPLOYEE_NOT_FOUND',
            message: 'Employee not found',
          },
        })
      }

      if (error.message === 'FORBIDDEN') {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete employees from your own company',
          },
        })
      }
    }

    console.error('Delete employee error:', error)
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while deleting employee',
      },
    })
  }
})

export default router
