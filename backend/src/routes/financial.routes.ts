import { Router, Request, Response } from 'express'
import { FinancialService } from '../services/financial.service'
import { authenticate } from '../middleware/auth'
import { requirePermission } from '../middleware/rbac'
import { z } from 'zod'

const router = Router()

router.use(authenticate)

const createExpenseSchema = z.object({
  companyId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
  amount: z.number().positive(),
  type: z.string().min(1),
  description: z.string().min(1),
  date: z.string().datetime(),
})

const createInvoiceSchema = z.object({
  companyId: z.string().uuid(),
  rentalId: z.string().uuid(),
  subtotal: z.number().positive(),
  taxAmount: z.number().nonnegative(),
  totalAmount: z.number().positive(),
})

const markPaidSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE', 'ONLINE']),
})

// POST /financial/expenses - Create expense
router.post(
  '/expenses',
  requirePermission('financial:create'),
  async (req: Request, res: Response) => {
    try {
      const data = createExpenseSchema.parse(req.body)

      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only create expenses for your own company',
          },
        })
      }

      const expense = await FinancialService.createExpense(
        {
          ...data,
          date: new Date(data.date),
        },
        req.user!.userId
      )

      return res.status(201).json({
        message: 'Expense created successfully',
        expense,
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

      console.error('Create expense error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating expense',
        },
      })
    }
  }
)

// GET /financial/expenses - List expenses
router.get(
  '/expenses',
  requirePermission('financial:read'),
  async (req: Request, res: Response) => {
    try {
      const { vehicleId, type, startDate, endDate } = req.query

      const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

      const expenses = await FinancialService.getExpenses({
        companyId,
        vehicleId: vehicleId as string | undefined,
        type: type as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      })

      return res.json({ expenses })
    } catch (error) {
      console.error('Get expenses error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching expenses',
        },
      })
    }
  }
)

// POST /financial/invoices - Create invoice
router.post(
  '/invoices',
  requirePermission('financial:create'),
  async (req: Request, res: Response) => {
    try {
      const data = createInvoiceSchema.parse(req.body)

      if (req.user!.role !== 'SUPER_ADMIN' && req.user!.companyId !== data.companyId) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only create invoices for your own company',
          },
        })
      }

      const invoice = await FinancialService.createInvoice(
        {
          companyId: data.companyId,
          rentalId: data.rentalId,
          subtotal: data.subtotal,
          taxAmount: data.taxAmount,
          totalAmount: data.totalAmount,
        },
        req.user!.userId
      )

      return res.status(201).json({
        message: 'Invoice created successfully',
        invoice,
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

      console.error('Create invoice error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while creating invoice',
        },
      })
    }
  }
)

// GET /financial/transactions - List all financial transactions
router.get(
  '/transactions',
  requirePermission('financial:read'),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query
      const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

      const transactions = await FinancialService.getTransactions({
        companyId,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      })

      return res.json({ transactions })
    } catch (error) {
      console.error('Get transactions error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching transactions',
        },
      })
    }
  }
)

// GET /financial/invoices - List invoices
router.get(
  '/invoices',
  requirePermission('financial:read'),
  async (req: Request, res: Response) => {
    try {
      const { customerId, status } = req.query

      const companyId = req.user!.role === 'SUPER_ADMIN' ? undefined : req.user!.companyId

      const invoices = await FinancialService.getInvoices({
        companyId,
        customerId: customerId as string | undefined,
        status: status as string | undefined,
      })

      return res.json({ invoices })
    } catch (error) {
      console.error('Get invoices error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while fetching invoices',
        },
      })
    }
  }
)

// PATCH /financial/invoices/:id/mark-paid - Mark invoice as paid
router.patch(
  '/invoices/:id/mark-paid',
  requirePermission('financial:update'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      const { paymentMethod } = markPaidSchema.parse(req.body)

      const invoice = await FinancialService.markInvoicePaid(
        id,
        paymentMethod,
        req.user!.userId,
        req.user!.companyId!
      )

      return res.json({
        message: 'Invoice marked as paid successfully',
        invoice,
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

      if (error instanceof Error && error.message === 'INVOICE_NOT_FOUND') {
        return res.status(404).json({
          error: {
            code: 'INVOICE_NOT_FOUND',
            message: 'Invoice not found',
          },
        })
      }

      console.error('Mark invoice paid error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while marking invoice as paid',
        },
      })
    }
  }
)

// GET /financial/reports/daily - Get daily report
router.get(
  '/reports/daily',
  requirePermission('financial:read'),
  async (req: Request, res: Response) => {
    try {
      const { date } = req.query

      if (!date) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date parameter is required',
          },
        })
      }

      const companyId = req.user!.companyId!

      const report = await FinancialService.getDailyReport(companyId, new Date(date as string))

      return res.json({ report })
    } catch (error) {
      console.error('Get daily report error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating daily report',
        },
      })
    }
  }
)

// GET /financial/reports/monthly - Get monthly report
router.get(
  '/reports/monthly',
  requirePermission('financial:read'),
  async (req: Request, res: Response) => {
    try {
      const { year, month } = req.query

      if (!year || !month) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Year and month parameters are required',
          },
        })
      }

      const companyId = req.user!.companyId!

      const report = await FinancialService.getMonthlyReport(
        companyId,
        parseInt(year as string),
        parseInt(month as string)
      )

      return res.json({ report })
    } catch (error) {
      console.error('Get monthly report error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating monthly report',
        },
      })
    }
  }
)

// GET /financial/reports/profit-loss - Get profit & loss report
router.get(
  '/reports/profit-loss',
  requirePermission('financial:read'),
  async (req: Request, res: Response) => {
    try {
      const { startDate, endDate, vehicleId } = req.query

      if (!startDate || !endDate) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate parameters are required',
          },
        })
      }

      const companyId = req.user!.companyId!

      const report = await FinancialService.getProfitLossReport({
        companyId,
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        vehicleId: vehicleId as string | undefined,
      })

      return res.json({ report })
    } catch (error) {
      console.error('Get profit & loss report error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating profit & loss report',
        },
      })
    }
  }
)

// GET /financial/reports/revenue-by-branch - Get revenue by branch
router.get(
  '/reports/revenue-by-branch',
  requirePermission('financial:read'),
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

      const report = await FinancialService.getRevenueByBranch(
        companyId,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      return res.json({ report })
    } catch (error) {
      console.error('Get revenue by branch error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating revenue by branch report',
        },
      })
    }
  }
)

// GET /financial/reports/revenue-by-vehicle - Get revenue by vehicle
router.get(
  '/reports/revenue-by-vehicle',
  requirePermission('financial:read'),
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

      const report = await FinancialService.getRevenueByVehicle(
        companyId,
        new Date(startDate as string),
        new Date(endDate as string)
      )

      return res.json({ report })
    } catch (error) {
      console.error('Get revenue by vehicle error:', error)
      return res.status(500).json({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while generating revenue by vehicle report',
        },
      })
    }
  }
)

export default router


