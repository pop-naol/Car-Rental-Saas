import prisma from '../lib/prisma'
import { AuditService } from './audit.service'

interface StartRentalInput {
  bookingId: string
  startOdometer: number
  startFuel: number
  contractUrl?: string
}

interface EndRentalInput {
  endOdometer: number
  endFuel: number
  damageNotes?: string
  damageCost?: number
}

export class RentalService {
  private static async attachCreatedByToRentals<T extends { id: string }>(rentals: T[]) {
    if (rentals.length === 0) return []

    const createLogs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'Rental',
        action: 'START_RENTAL',
        entity_id: {
          in: rentals.map((item) => item.id),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    const creatorByRentalId = new Map<string, (typeof createLogs)[number]['user']>()
    for (const log of createLogs) {
      if (!creatorByRentalId.has(log.entity_id)) {
        creatorByRentalId.set(log.entity_id, log.user)
      }
    }

    return rentals.map((rental) => ({
      ...rental,
      created_by: creatorByRentalId.get(rental.id) || null,
    }))
  }

  static async startRental(data: StartRentalInput, userId: string, companyId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        vehicle: true,
        customer: true,
      },
    })

    if (!booking) throw new Error('BOOKING_NOT_FOUND')
    if (booking.status !== 'CONFIRMED') throw new Error('BOOKING_NOT_CONFIRMED')

    if (data.startOdometer < booking.vehicle.current_odometer) {
      throw new Error('INVALID_ODOMETER')
    }

    const baseCost = Number(booking.estimated_cost)

    const rental = await prisma.rental.create({
      data: {
        company_id: companyId,
        booking_id: data.bookingId,
        customer_id: booking.customer_id,
        vehicle_id: booking.vehicle_id,
        driver_id: booking.driver_id,
        start_date: new Date(),
        end_date: booking.end_date,
        start_odometer: data.startOdometer,
        start_fuel: data.startFuel,
        base_cost: baseCost,
        total_cost: baseCost,
        status: 'ACTIVE',
      },
      include: {
        booking: true,
        customer: true,
        vehicle: true,
        driver: true,
      },
    })

    await prisma.booking.update({
      where: { id: data.bookingId },
      data: { status: 'ACTIVE' },
    })

    await prisma.vehicle.update({
      where: { id: booking.vehicle_id },
      data: {
        status: 'RENTED',
        current_odometer: data.startOdometer,
        current_fuel: data.startFuel,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'START_RENTAL',
      entityType: 'Rental',
      entityId: rental.id,
      newValues: rental,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return rental
  }

  static async endRental(rentalId: string, data: EndRentalInput, userId: string, companyId: string) {
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        booking: { include: { services: true } },
        vehicle: true,
      },
    })

    if (!rental) throw new Error('RENTAL_NOT_FOUND')
    if (rental.status !== 'ACTIVE') throw new Error('RENTAL_NOT_ACTIVE')
    if (data.endOdometer < rental.start_odometer) throw new Error('INVALID_ODOMETER')

    const endDate = new Date()
    const actualDays = Math.max(
      1,
      Math.ceil((endDate.getTime() - rental.start_date.getTime()) / (1000 * 60 * 60 * 24))
    )
    const plannedDays = Math.max(
      1,
      Math.ceil((rental.end_date.getTime() - rental.start_date.getTime()) / (1000 * 60 * 60 * 24))
    )

    const lateDays = Math.max(0, actualDays - plannedDays)
    const lateFee = lateDays * Number(rental.vehicle.daily_rate) * 1.5

    const mileageDriven = data.endOdometer - rental.start_odometer
    const allowedMileage = plannedDays * 100
    const extraMileage = Math.max(0, mileageDriven - allowedMileage)
    const mileageFee = extraMileage * 0.5

    const damageCost = Number(data.damageCost || 0)
    const totalCost = Number(rental.base_cost) + lateFee + mileageFee + damageCost

    const updatedRental = await prisma.rental.update({
      where: { id: rentalId },
      data: {
        actual_return_date: endDate,
        end_odometer: data.endOdometer,
        end_fuel: data.endFuel,
        late_fee: lateFee,
        mileage_fee: mileageFee,
        damage_cost: damageCost,
        total_cost: totalCost,
        status: 'COMPLETED',
      },
      include: {
        booking: true,
        customer: true,
        vehicle: true,
        driver: true,
      },
    })

    await prisma.booking.update({
      where: { id: rental.booking_id },
      data: { status: 'COMPLETED' },
    })

    await prisma.vehicle.update({
      where: { id: rental.vehicle_id },
      data: {
        status: 'AVAILABLE',
        current_odometer: data.endOdometer,
        current_fuel: data.endFuel,
      },
    })

    await prisma.revenue.create({
      data: {
        company_id: companyId,
        rental_id: rentalId,
        type: 'RENTAL',
        amount: totalCost,
        date: endDate,
        description: `Rental completed for ${rental.vehicle.brand} ${rental.vehicle.model}`,
      },
    })

    await prisma.customer.update({
      where: { id: rental.customer_id },
      data: {
        total_spending: {
          increment: totalCost,
        },
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'END_RENTAL',
      entityType: 'Rental',
      entityId: rental.id,
      oldValues: rental,
      newValues: updatedRental,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedRental
  }

  static async getRentals(filters?: {
    companyId?: string
    customerId?: string
    vehicleId?: string
    status?: string
    driverId?: string
  }) {
    const where: any = {}
    if (filters?.companyId) where.company_id = filters.companyId
    if (filters?.customerId) where.customer_id = filters.customerId
    if (filters?.vehicleId) where.vehicle_id = filters.vehicleId
    if (filters?.status) where.status = filters.status
    if (filters?.driverId) where.driver_id = filters.driverId

    const rentals = await prisma.rental.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            id: true,
            brand: true,
            model: true,
            plate_number: true,
            year: true,
          },
        },
        driver: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            phone: true,
          },
        },
        booking: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
            notes: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return this.attachCreatedByToRentals(rentals)
  }

  static async getRentalById(id: string) {
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        booking: { include: { services: true } },
      },
    })

    if (!rental) throw new Error('RENTAL_NOT_FOUND')
    const withCreator = await this.attachCreatedByToRentals([rental])
    return withCreator[0]
  }

  static async getActiveRentals(companyId: string) {
    return prisma.rental.findMany({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
      },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
          },
        },
      },
      orderBy: { end_date: 'asc' },
    })
  }

  static async getOverdueRentals(companyId: string) {
    const now = new Date()
    return prisma.rental.findMany({
      where: {
        company_id: companyId,
        status: 'ACTIVE',
        end_date: { lt: now },
      },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            brand: true,
            model: true,
            plate_number: true,
          },
        },
      },
      orderBy: { end_date: 'asc' },
    })
  }
}
