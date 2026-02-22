import prisma from '../lib/prisma'
import { AuditService } from './audit.service'

interface CreateExpenseInput {
  companyId: string
  vehicleId?: string
  amount: number
  type: string
  description: string
  date: Date
}

interface CreateInvoiceInput {
  companyId: string
  rentalId: string
  subtotal: number
  taxAmount: number
  totalAmount: number
}

interface FinancialReportFilters {
  companyId: string
  startDate: Date
  endDate: Date
  vehicleId?: string
}

export class FinancialService {
  static async createExpense(data: CreateExpenseInput, userId: string) {
    const expense = await prisma.expense.create({
      data: {
        company_id: data.companyId,
        vehicle_id: data.vehicleId,
        amount: data.amount,
        type: data.type,
        description: data.description,
        date: data.date,
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Expense',
      entityId: expense.id,
      newValues: expense,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return expense
  }

  static async getExpenses(filters?: {
    companyId?: string
    vehicleId?: string
    type?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = {}

    if (filters?.companyId) where.company_id = filters.companyId
    if (filters?.vehicleId) where.vehicle_id = filters.vehicleId
    if (filters?.type) where.type = filters.type
    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) where.date.gte = filters.startDate
      if (filters.endDate) where.date.lte = filters.endDate
    }

    return prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
    })
  }

  static async createInvoice(data: CreateInvoiceInput, userId: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: data.rentalId },
    })
    if (!rental) throw new Error('RENTAL_NOT_FOUND')

    const invoice = await prisma.invoice.create({
      data: {
        company_id: data.companyId,
        rental_id: data.rentalId,
        invoice_number: `INV-${Date.now()}`,
        subtotal: data.subtotal,
        tax_amount: data.taxAmount,
        total_amount: data.totalAmount,
        payment_status: 'PENDING',
      },
      include: {
        rental: {
          select: {
            id: true,
            customer_id: true,
            start_date: true,
            end_date: true,
          },
        },
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      newValues: invoice,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return invoice
  }

  static async getInvoices(filters?: {
    companyId?: string
    customerId?: string
    status?: string
  }) {
    const where: any = {}
    if (filters?.companyId) where.company_id = filters.companyId
    if (filters?.status) where.payment_status = filters.status

    if (filters?.customerId) {
      where.rental = {
        customer_id: filters.customerId,
      }
    }

    return prisma.invoice.findMany({
      where,
      include: {
        rental: {
          select: {
            id: true,
            customer_id: true,
            vehicle_id: true,
            start_date: true,
            end_date: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async markInvoicePaid(
    invoiceId: string,
    paymentMethod: string,
    userId: string,
    companyId: string
  ) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    })

    if (!invoice) throw new Error('INVOICE_NOT_FOUND')

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        payment_status: 'PAID',
        paid_at: new Date(),
        payment_method: paymentMethod,
      },
    })

    if (invoice.payment_status !== 'PAID') {
      await prisma.revenue.create({
        data: {
          company_id: invoice.company_id,
          rental_id: invoice.rental_id,
          type: 'INVOICE_PAYMENT',
          amount: invoice.total_amount,
          date: new Date(),
          description: `Payment received for invoice ${invoice.invoice_number}`,
        },
      })
    }

    await AuditService.log({
      userId,
      companyId,
      action: 'MARK_PAID',
      entityType: 'Invoice',
      entityId: invoice.id,
      oldValues: { payment_status: invoice.payment_status },
      newValues: { payment_status: 'PAID', payment_method: paymentMethod },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedInvoice
  }

  static async getTransactions(filters?: {
    companyId?: string
    startDate?: Date
    endDate?: Date
  }) {
    const revenueWhere: any = {}
    const expenseWhere: any = {}
    const invoiceWhere: any = {}

    if (filters?.companyId) {
      revenueWhere.company_id = filters.companyId
      expenseWhere.company_id = filters.companyId
      invoiceWhere.company_id = filters.companyId
    }

    if (filters?.startDate || filters?.endDate) {
      revenueWhere.date = {}
      expenseWhere.date = {}
      invoiceWhere.created_at = {}
      if (filters.startDate) {
        revenueWhere.date.gte = filters.startDate
        expenseWhere.date.gte = filters.startDate
        invoiceWhere.created_at.gte = filters.startDate
      }
      if (filters.endDate) {
        revenueWhere.date.lte = filters.endDate
        expenseWhere.date.lte = filters.endDate
        invoiceWhere.created_at.lte = filters.endDate
      }
    }

    const [revenues, expenses, invoices] = await Promise.all([
      prisma.revenue.findMany({ where: revenueWhere }),
      prisma.expense.findMany({ where: expenseWhere }),
      prisma.invoice.findMany({ where: invoiceWhere }),
    ])

    const normalized = [
      ...revenues.map((item) => ({
        id: `REV-${item.id}`,
        date: item.date,
        source: 'REVENUE',
        type: item.type,
        direction: 'IN',
        amount: Number(item.amount),
        description: item.description || '',
      })),
      ...expenses.map((item) => ({
        id: `EXP-${item.id}`,
        date: item.date,
        source: 'EXPENSE',
        type: item.type,
        direction: 'OUT',
        amount: Number(item.amount),
        description: item.description || '',
      })),
      ...invoices.map((item) => ({
        id: `INV-${item.id}`,
        date: item.created_at,
        source: 'INVOICE',
        type: item.payment_status,
        direction: 'IN',
        amount: Number(item.total_amount),
        description: `Invoice ${item.invoice_number}`,
      })),
    ]

    return normalized.sort((a, b) => b.date.getTime() - a.date.getTime())
  }

  static async getDailyReport(companyId: string, date: Date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const [revenue, expenses] = await Promise.all([
      prisma.revenue.aggregate({
        where: {
          company_id: companyId,
          date: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          company_id: companyId,
          date: { gte: startOfDay, lte: endOfDay },
        },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = Number(revenue._sum.amount || 0)
    const totalExpenses = Number(expenses._sum.amount || 0)

    return {
      date,
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
    }
  }

  static async getMonthlyReport(companyId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const [revenue, expenses] = await Promise.all([
      prisma.revenue.aggregate({
        where: {
          company_id: companyId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          company_id: companyId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = Number(revenue._sum.amount || 0)
    const totalExpenses = Number(expenses._sum.amount || 0)

    const expensesByType = await prisma.expense.groupBy({
      by: ['type'],
      where: {
        company_id: companyId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    })

    return {
      year,
      month,
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      expensesByType,
    }
  }

  static async getProfitLossReport(filters: FinancialReportFilters) {
    const [revenue, expenses] = await Promise.all([
      prisma.revenue.aggregate({
        where: {
          company_id: filters.companyId,
          date: { gte: filters.startDate, lte: filters.endDate },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: {
          company_id: filters.companyId,
          vehicle_id: filters.vehicleId,
          date: { gte: filters.startDate, lte: filters.endDate },
        },
        _sum: { amount: true },
      }),
    ])

    const totalRevenue = Number(revenue._sum.amount || 0)
    const totalExpenses = Number(expenses._sum.amount || 0)
    const netProfit = totalRevenue - totalExpenses

    return {
      startDate: filters.startDate,
      endDate: filters.endDate,
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    }
  }

  static async getRevenueByBranch(companyId: string, startDate: Date, endDate: Date) {
    const revenues = await prisma.revenue.findMany({
      where: {
        company_id: companyId,
        date: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        type: true,
      },
    })

    const total = revenues.reduce((sum, item) => sum + Number(item.amount), 0)
    return [{ branchId: 'ALL', branchName: 'All Branches', revenue: total }]
  }

  static async getRevenueByVehicle(companyId: string, startDate: Date, endDate: Date) {
    const rentals = await prisma.rental.findMany({
      where: {
        company_id: companyId,
        end_date: { gte: startDate, lte: endDate },
      },
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            plate_number: true,
          },
        },
      },
    })

    const grouped: Record<string, { vehicleInfo: string; revenue: number; trips: number }> = {}

    for (const rental of rentals) {
      const vehicleId = rental.vehicle_id
      const vehicleInfo = `${rental.vehicle.brand} ${rental.vehicle.model} (${rental.vehicle.plate_number})`
      if (!grouped[vehicleId]) {
        grouped[vehicleId] = { vehicleInfo, revenue: 0, trips: 0 }
      }
      grouped[vehicleId].revenue += Number(rental.total_cost)
      grouped[vehicleId].trips += 1
    }

    return Object.entries(grouped)
      .map(([vehicleId, item]) => ({
        vehicleId,
        vehicleInfo: item.vehicleInfo,
        revenue: item.revenue,
        trips: item.trips,
        averagePerTrip: item.trips > 0 ? item.revenue / item.trips : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }
}
