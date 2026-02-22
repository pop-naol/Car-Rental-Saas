import prisma from '../lib/prisma'
import { AuditService } from './audit.service'
import { VehicleStatus } from '@prisma/client'

interface CreateVehicleInput {
  companyId: string
  branchId: string
  vin: string
  plateNumber: string
  brand: string
  model: string
  year: number
  fuelType: string
  transmission: string
  dailyRate: number
  weeklyRate: number
  monthlyRate: number
  currentOdometer?: number
  currentFuel?: number
  purchaseCost?: number
}

interface UpdateVehicleInput {
  branchId?: string
  plateNumber?: string
  brand?: string
  model?: string
  year?: number
  fuelType?: string
  transmission?: string
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  currentOdometer?: number
  currentFuel?: number
  purchaseCost?: number
}

export class VehicleService {
  static async createVehicle(data: CreateVehicleInput, userId: string) {
    // Check VIN uniqueness
    const existingVin = await prisma.vehicle.findUnique({
      where: { vin: data.vin },
    })

    if (existingVin) {
      throw new Error('VIN_ALREADY_EXISTS')
    }

    // Check plate number uniqueness within company
    const existingPlate = await prisma.vehicle.findFirst({
      where: {
        company_id: data.companyId,
        plate_number: data.plateNumber,
        deleted_at: null,
      },
    })

    if (existingPlate) {
      throw new Error('PLATE_NUMBER_ALREADY_EXISTS')
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        company_id: data.companyId,
        branch_id: data.branchId,
        vin: data.vin,
        plate_number: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        fuel_type: data.fuelType,
        transmission: data.transmission,
        daily_rate: data.dailyRate,
        weekly_rate: data.weeklyRate,
        monthly_rate: data.monthlyRate,
        current_odometer: data.currentOdometer || 0,
        current_fuel: data.currentFuel || 100,
        purchase_cost: data.purchaseCost,
        status: 'AVAILABLE',
      },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      newValues: vehicle,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return vehicle
  }

  static async getVehicles(filters?: {
    companyId?: string
    branchId?: string
    status?: VehicleStatus
    search?: string
  }) {
    const where: any = {
      deleted_at: null,
    }

    if (filters?.companyId) {
      where.company_id = filters.companyId
    }

    if (filters?.branchId) {
      where.branch_id = filters.branchId
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { vin: { contains: filters.search } },
        { plate_number: { contains: filters.search } },
        { brand: { contains: filters.search } },
        { model: { contains: filters.search } },
      ]
    }

    return prisma.vehicle.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            rentals: true,
            maintenance_logs: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getVehicleById(id: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
      include: {
        branch: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        maintenance_logs: {
          orderBy: {
            date: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            rentals: true,
          },
        },
      },
    })

    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND')
    }

    return vehicle
  }

  static async updateVehicle(
    id: string,
    data: UpdateVehicleInput,
    userId: string,
    companyId: string
  ) {
    const oldVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    })

    if (!oldVehicle) {
      throw new Error('VEHICLE_NOT_FOUND')
    }

    // Check plate number uniqueness if being updated
    if (data.plateNumber && data.plateNumber !== oldVehicle.plate_number) {
      const existingPlate = await prisma.vehicle.findFirst({
        where: {
          company_id: companyId,
          plate_number: data.plateNumber,
          id: { not: id },
          deleted_at: null,
        },
      })

      if (existingPlate) {
        throw new Error('PLATE_NUMBER_ALREADY_EXISTS')
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        branch_id: data.branchId,
        plate_number: data.plateNumber,
        brand: data.brand,
        model: data.model,
        year: data.year,
        fuel_type: data.fuelType,
        transmission: data.transmission,
        daily_rate: data.dailyRate,
        weekly_rate: data.weeklyRate,
        monthly_rate: data.monthlyRate,
        current_odometer: data.currentOdometer,
        current_fuel: data.currentFuel,
        purchase_cost: data.purchaseCost,
      },
      include: {
        branch: true,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      oldValues: oldVehicle,
      newValues: vehicle,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return vehicle
  }

  static async updateVehicleStatus(
    id: string,
    status: VehicleStatus,
    userId: string,
    companyId: string
  ) {
    const oldVehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    })

    if (!oldVehicle) {
      throw new Error('VEHICLE_NOT_FOUND')
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: { status },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE_STATUS',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      oldValues: { status: oldVehicle.status },
      newValues: { status },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return vehicle
  }

  static async transferVehicle(
    id: string,
    toBranchId: string,
    userId: string,
    companyId: string
  ) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    })

    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND')
    }

    // Verify target branch belongs to same company
    const targetBranch = await prisma.branch.findFirst({
      where: {
        id: toBranchId,
        company_id: companyId,
      },
    })

    if (!targetBranch) {
      throw new Error('BRANCH_NOT_FOUND')
    }

    const oldBranchId = vehicle.branch_id

    const updatedVehicle = await prisma.vehicle.update({
      where: { id },
      data: { branch_id: toBranchId },
      include: {
        branch: true,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'TRANSFER',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      oldValues: { branch_id: oldBranchId },
      newValues: { branch_id: toBranchId },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedVehicle
  }

  static async deleteVehicle(id: string, userId: string, companyId: string) {
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    })

    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND')
    }

    // Check for active bookings or rentals
    const activeBookings = await prisma.booking.count({
      where: {
        vehicle_id: id,
        status: { in: ['CONFIRMED', 'ACTIVE'] },
      },
    })

    if (activeBookings > 0) {
      throw new Error('VEHICLE_HAS_ACTIVE_BOOKINGS')
    }

    // Soft delete
    const deletedVehicle = await prisma.vehicle.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        status: 'OUT_OF_SERVICE',
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'DELETE',
      entityType: 'Vehicle',
      entityId: vehicle.id,
      oldValues: vehicle,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return deletedVehicle
  }

  static async calculateVehicleProfit(vehicleId: string, startDate: Date, endDate: Date) {
    // Get all revenue for this vehicle
    const revenue = await prisma.revenue.aggregate({
      where: {
        rental_id: {
          in: (
            await prisma.rental.findMany({
              where: {
                vehicle_id: vehicleId,
                created_at: {
                  gte: startDate,
                  lte: endDate,
                },
              },
              select: { id: true },
            })
          ).map(r => r.id),
        },
      },
      _sum: {
        amount: true,
      },
    })

    // Get all expenses for this vehicle
    const expenses = await prisma.expense.aggregate({
      where: {
        vehicle_id: vehicleId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    })

    const totalRevenue = revenue._sum.amount || 0
    const totalExpenses = expenses._sum.amount || 0
    const profit = Number(totalRevenue) - Number(totalExpenses)

    return {
      vehicleId,
      startDate,
      endDate,
      totalRevenue,
      totalExpenses,
      profit,
    }
  }
}
