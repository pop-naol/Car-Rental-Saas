import prisma from '../lib/prisma'

export class AnalyticsService {
  // Dashboard metrics for Company Manager
  static async getDashboardMetrics(companyId: string) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Total fleet count
    const totalFleet = await prisma.vehicle.count({
      where: {
        company_id: companyId,
        deleted_at: null,
      },
    })

    // Active rentals count
    const activeRentals = await prisma.rental.count({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
      },
    })

    // Revenue metrics
    const revenueToday = await prisma.revenue.aggregate({
      where: {
        company_id: companyId,
        date: { gte: todayStart },
      },
      _sum: { amount: true },
    })

    const revenueMonth = await prisma.revenue.aggregate({
      where: {
        company_id: companyId,
        date: { gte: monthStart },
      },
      _sum: { amount: true },
    })

    const revenueYear = await prisma.revenue.aggregate({
      where: {
        company_id: companyId,
        date: { gte: yearStart },
      },
      _sum: { amount: true },
    })

    // Fleet utilization
    const utilization = totalFleet > 0 ? (activeRentals / totalFleet) * 100 : 0

    // Overdue rentals
    const overdueRentals = await prisma.rental.count({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        end_date: { lt: now },
      },
    })

    return {
      totalFleet,
      activeRentals,
      revenueToday: Number(revenueToday._sum.amount || 0),
      revenueMonth: Number(revenueMonth._sum.amount || 0),
      revenueYear: Number(revenueYear._sum.amount || 0),
      fleetUtilization: Math.round(utilization * 100) / 100,
      overdueRentals,
    }
  }

  // Global dashboard for Super Admin
  static async getGlobalDashboard() {
    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            vehicles: true,
            users: true,
            branches: true,
          },
        },
      },
    })

    const totalRevenue = await prisma.revenue.aggregate({
      _sum: { amount: true },
    })

    const totalExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
    })

    return {
      totalCompanies: companies.length,
      activeCompanies: companies.filter((c) => c.is_active).length,
      totalRevenue: Number(totalRevenue._sum.amount || 0),
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      profit: Number(totalRevenue._sum.amount || 0) - Number(totalExpenses._sum.amount || 0),
      companies: companies.map((c) => ({
        id: c.id,
        name: c.name,
        isActive: c.is_active,
        vehicleCount: c._count.vehicles,
        userCount: c._count.users,
        branchCount: c._count.branches,
      })),
    }
  }

  // Average rental duration
  static async getAverageRentalDuration(companyId: string) {
    const rentals = await prisma.rental.findMany({
      where: {
        company_id: companyId,
        actual_return_date: { not: null },
      },
      select: {
        start_date: true,
        actual_return_date: true,
      },
    })

    if (rentals.length === 0) return 0

    const totalDays = rentals.reduce((sum, rental) => {
      const days = Math.ceil(
        (rental.actual_return_date!.getTime() - rental.start_date.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return sum + days
    }, 0)

    return Math.round((totalDays / rentals.length) * 100) / 100
  }

  // Revenue growth rate
  static async getRevenueGrowthRate(companyId: string) {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

    const currentMonth = await prisma.revenue.aggregate({
      where: {
        company_id: companyId,
        date: { gte: currentMonthStart },
      },
      _sum: { amount: true },
    })

    const lastMonth = await prisma.revenue.aggregate({
      where: {
        company_id: companyId,
        date: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { amount: true },
    })

    const current = Number(currentMonth._sum.amount || 0)
    const last = Number(lastMonth._sum.amount || 0)

    if (last === 0) return current > 0 ? 100 : 0

    const growth = ((current - last) / last) * 100
    return Math.round(growth * 100) / 100
  }

  // Vehicle ROI
  static async getVehicleROI(vehicleId: string) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      select: { purchase_cost: true },
    })

    if (!vehicle || !vehicle.purchase_cost) return null

    const revenue = await prisma.revenue.aggregate({
      where: {
        rental_id: {
          in: (
            await prisma.rental.findMany({
              where: { vehicle_id: vehicleId },
              select: { id: true },
            })
          ).map((r) => r.id),
        },
      },
      _sum: { amount: true },
    })

    const expenses = await prisma.expense.aggregate({
      where: { vehicle_id: vehicleId },
      _sum: { amount: true },
    })

    const totalRevenue = Number(revenue._sum.amount || 0)
    const totalExpenses = Number(expenses._sum.amount || 0)
    const purchaseCost = Number(vehicle.purchase_cost)

    const profit = totalRevenue - totalExpenses
    const roi = purchaseCost > 0 ? (profit / purchaseCost) * 100 : 0

    return {
      vehicleId,
      purchaseCost,
      totalRevenue,
      totalExpenses,
      profit,
      roi: Math.round(roi * 100) / 100,
    }
  }
}
