import prisma from '../lib/prisma'
import { AuditService } from './audit.service'

interface CreateMaintenanceLogInput {
  companyId: string
  vehicleId: string
  type: string
  description: string
  cost: number
  date: Date
  performedBy?: string
  nextMaintenanceDate?: Date
  nextMaintenanceOdometer?: number
}

interface UpdateMaintenanceLogInput {
  type?: string
  description?: string
  cost?: number
  date?: Date
  performedBy?: string
  nextMaintenanceDate?: Date
  nextMaintenanceOdometer?: number
}

export class MaintenanceService {
  static async createMaintenanceLog(data: CreateMaintenanceLogInput, userId: string) {
    // Verify vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: data.vehicleId },
    })

    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND')
    }

    const maintenanceLog = await prisma.maintenanceLog.create({
      data: {
        company_id: data.companyId,
        vehicle_id: data.vehicleId,
        type: data.type,
        description: data.description,
        cost: data.cost,
        date: data.date,
        performed_by: data.performedBy,
        next_maintenance_date: data.nextMaintenanceDate,
        next_maintenance_odometer: data.nextMaintenanceOdometer,
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
          },
        },
      },
    })

    // Create expense record for maintenance
    await prisma.expense.create({
      data: {
        company_id: data.companyId,
        vehicle_id: data.vehicleId,
        amount: data.cost,
        type: 'MAINTENANCE',
        description: `${data.type}: ${data.description}`,
        date: data.date,
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'MaintenanceLog',
      entityId: maintenanceLog.id,
      newValues: maintenanceLog,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return maintenanceLog
  }

  static async getMaintenanceLogs(filters?: {
    companyId?: string
    vehicleId?: string
    type?: string
    startDate?: Date
    endDate?: Date
  }) {
    const where: any = {}

    if (filters?.companyId) {
      where.company_id = filters.companyId
    }

    if (filters?.vehicleId) {
      where.vehicle_id = filters.vehicleId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {}
      if (filters.startDate) {
        where.date.gte = filters.startDate
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate
      }
    }

    return prisma.maintenanceLog.findMany({
      where,
      include: {
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            plate_number: true,
            current_odometer: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
  }

  static async getMaintenanceLogById(id: string) {
    const maintenanceLog = await prisma.maintenanceLog.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    })

    if (!maintenanceLog) {
      throw new Error('MAINTENANCE_LOG_NOT_FOUND')
    }

    return maintenanceLog
  }

  static async updateMaintenanceLog(
    id: string,
    data: UpdateMaintenanceLogInput,
    userId: string,
    companyId: string
  ) {
    const oldLog = await prisma.maintenanceLog.findUnique({
      where: { id },
    })

    if (!oldLog) {
      throw new Error('MAINTENANCE_LOG_NOT_FOUND')
    }

    const maintenanceLog = await prisma.maintenanceLog.update({
      where: { id },
      data: {
        type: data.type,
        description: data.description,
        cost: data.cost,
        date: data.date,
        performed_by: data.performedBy,
        next_maintenance_date: data.nextMaintenanceDate,
        next_maintenance_odometer: data.nextMaintenanceOdometer,
      },
      include: {
        vehicle: true,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE',
      entityType: 'MaintenanceLog',
      entityId: maintenanceLog.id,
      oldValues: oldLog,
      newValues: maintenanceLog,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return maintenanceLog
  }

  static async deleteMaintenanceLog(id: string, userId: string, companyId: string) {
    const maintenanceLog = await prisma.maintenanceLog.findUnique({
      where: { id },
    })

    if (!maintenanceLog) {
      throw new Error('MAINTENANCE_LOG_NOT_FOUND')
    }

    await prisma.maintenanceLog.delete({
      where: { id },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'DELETE',
      entityType: 'MaintenanceLog',
      entityId: maintenanceLog.id,
      oldValues: maintenanceLog,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Maintenance log deleted successfully' }
  }

  static async getUpcomingMaintenance(companyId: string) {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(now.getDate() + 30)

    // Get by date
    const byDate = await prisma.maintenanceLog.findMany({
      where: {
        company_id: companyId,
        next_maintenance_date: {
          gte: now,
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
            current_odometer: true,
          },
        },
      },
      orderBy: {
        next_maintenance_date: 'asc',
      },
    })

    // Get by odometer (within 500 miles)
    const byOdometer = await prisma.maintenanceLog.findMany({
      where: {
        company_id: companyId,
        next_maintenance_odometer: {
          not: null,
        },
      },
      include: {
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
            current_odometer: true,
          },
        },
      },
    })

    const odometerDue = byOdometer.filter((log) => {
      if (!log.next_maintenance_odometer) return false
      const remaining = log.next_maintenance_odometer - log.vehicle.current_odometer
      return remaining <= 500 && remaining > 0
    })

    return {
      byDate,
      byOdometer: odometerDue,
    }
  }

  static async getMaintenanceHistory(vehicleId: string) {
    const logs = await prisma.maintenanceLog.findMany({
      where: {
        vehicle_id: vehicleId,
      },
      orderBy: {
        date: 'desc',
      },
    })

    const totalCost = logs.reduce((sum, log) => sum + Number(log.cost), 0)
    const maintenanceCount = logs.length

    return {
      logs,
      summary: {
        totalCost,
        maintenanceCount,
        averageCost: maintenanceCount > 0 ? totalCost / maintenanceCount : 0,
      },
    }
  }

  static async getMaintenanceCostByVehicle(companyId: string, startDate: Date, endDate: Date) {
    const logs = await prisma.maintenanceLog.findMany({
      where: {
        company_id: companyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
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

    const costByVehicle: { [key: string]: { vehicle: any; totalCost: number; count: number } } =
      {}

    for (const log of logs) {
      const vehicleId = log.vehicle_id
      if (!costByVehicle[vehicleId]) {
        costByVehicle[vehicleId] = {
          vehicle: log.vehicle,
          totalCost: 0,
          count: 0,
        }
      }
      costByVehicle[vehicleId].totalCost += Number(log.cost)
      costByVehicle[vehicleId].count += 1
    }

    return Object.entries(costByVehicle)
      .map(([vehicleId, data]) => ({
        vehicleId,
        vehicle: data.vehicle,
        totalCost: data.totalCost,
        maintenanceCount: data.count,
        averageCost: data.totalCost / data.count,
      }))
      .sort((a, b) => b.totalCost - a.totalCost)
  }
}
