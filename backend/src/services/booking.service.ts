import prisma from '../lib/prisma'
import { AuditService } from './audit.service'
import { CustomerService } from './customer.service'
import { BookingStatus } from '@prisma/client'
import { NotificationService } from './notification.service'

type PickupLocationType = 'OFFICE' | 'BRANCH_A' | 'CUSTOM'

interface AssignmentLocation {
  pickupLocationType: PickupLocationType
  pickupLocationLabel?: string
  dropoffLocation?: string
  pickupVerified?: boolean
  pickupVerifiedLocation?: string
  dropoffVerified?: boolean
  dropoffVerifiedLocation?: string
  dropoffLocationChanged?: boolean
}

interface BookingNotesPayload {
  plainNotes?: string
  assignment?: AssignmentLocation
}

interface CreateBookingInput {
  companyId: string
  customerId: string
  vehicleId: string
  branchId?: string
  startDate: Date
  endDate: Date
  driverId?: string
  estimatedCost: number
  discountCode?: string
  discountAmount?: number
  notes?: string
  pickupLocationType?: PickupLocationType
  pickupLocationLabel?: string
  dropoffLocation?: string
}

interface UpdateBookingInput {
  startDate?: Date
  endDate?: Date
  driverId?: string
  estimatedCost?: number
  discountCode?: string
  discountAmount?: number
  notes?: string
  pickupLocationType?: PickupLocationType
  pickupLocationLabel?: string
  dropoffLocation?: string
}

interface AddServiceInput {
  serviceType: string
  serviceName: string
  price: number
}

export class BookingService {
  private static readonly MAX_BOOKING_NOTES_LENGTH = 120

  private static asString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined
  }

  private static shorten(value: string | undefined, max: number): string | undefined {
    if (!value) return undefined
    const normalized = value.trim()
    if (!normalized) return undefined
    return normalized.length > max ? normalized.slice(0, max) : normalized
  }

  private static parseNotesPayload(notes?: string | null): BookingNotesPayload {
    if (!notes) return {}

    try {
      const parsed = JSON.parse(notes) as any
      if (parsed && typeof parsed === 'object') {
        // Compact payload support
        if (parsed.a || parsed.n !== undefined) {
          return {
            plainNotes: this.asString(parsed.n),
            assignment: parsed.a
              ? {
                  pickupLocationType: (this.asString(parsed.a.p) as PickupLocationType) || 'OFFICE',
                  pickupLocationLabel: this.asString(parsed.a.pl),
                  dropoffLocation: this.asString(parsed.a.d),
                  pickupVerified: Boolean(parsed.a.pv),
                  pickupVerifiedLocation: this.asString(parsed.a.pvl),
                  dropoffVerified: Boolean(parsed.a.dv),
                  dropoffVerifiedLocation: this.asString(parsed.a.dvl),
                  dropoffLocationChanged: Boolean(parsed.a.dc),
                }
              : undefined,
          }
        }

        return {
          plainNotes: this.asString(parsed.plainNotes),
          assignment: parsed.assignment,
        }
      }
      return { plainNotes: notes }
    } catch {
      return { plainNotes: notes }
    }
  }

  private static buildNotesPayload(
    notes?: string,
    assignment?: AssignmentLocation
  ): string | null {
    const normalizedNotes = this.shorten(notes, 80)
    const normalizedAssignment = assignment
      ? {
          pickupLocationType: (this.asString(assignment.pickupLocationType) as PickupLocationType) || 'OFFICE',
          pickupLocationLabel: this.shorten(this.asString(assignment.pickupLocationLabel), 32),
          dropoffLocation: this.shorten(this.asString(assignment.dropoffLocation), 48),
          pickupVerified: Boolean(assignment.pickupVerified),
          pickupVerifiedLocation: this.shorten(this.asString(assignment.pickupVerifiedLocation), 32),
          dropoffVerified: Boolean(assignment.dropoffVerified),
          dropoffVerifiedLocation: this.shorten(this.asString(assignment.dropoffVerifiedLocation), 48),
          dropoffLocationChanged: Boolean(assignment.dropoffLocationChanged),
        }
      : undefined

    if (!normalizedNotes && !normalizedAssignment) return null

    const compactPayload = {
      n: normalizedNotes,
      a: normalizedAssignment
        ? {
            p: normalizedAssignment.pickupLocationType,
            pl: normalizedAssignment.pickupLocationLabel,
            d: normalizedAssignment.dropoffLocation,
            pv: normalizedAssignment.pickupVerified,
            pvl: normalizedAssignment.pickupVerifiedLocation,
            dv: normalizedAssignment.dropoffVerified,
            dvl: normalizedAssignment.dropoffVerifiedLocation,
            dc: normalizedAssignment.dropoffLocationChanged,
          }
        : undefined,
    }

    const candidates = [
      compactPayload,
      {
        ...compactPayload,
        a: compactPayload.a
          ? {
              p: compactPayload.a.p,
              pl: compactPayload.a.pl,
              d: compactPayload.a.d,
              pv: compactPayload.a.pv,
              dv: compactPayload.a.dv,
              dc: compactPayload.a.dc,
            }
          : undefined,
      },
      {
        ...compactPayload,
        n: undefined,
      },
      {
        n: compactPayload.n,
      },
    ]

    for (const candidate of candidates) {
      const encoded = JSON.stringify(candidate)
      if (encoded.length <= this.MAX_BOOKING_NOTES_LENGTH) {
        return encoded
      }
    }

    // Final fallback: store a truncated plain string only.
    return this.shorten(normalizedNotes || 'Task details saved', this.MAX_BOOKING_NOTES_LENGTH) || null
  }

  private static async updateBookingNotesSafely(bookingId: string, notes: string | null) {
    try {
      return await prisma.booking.update({
        where: { id: bookingId },
        data: { notes },
      })
    } catch (error: any) {
      if (error?.code === 'P2000' && error?.meta?.column_name === 'notes') {
        return prisma.booking.update({
          where: { id: bookingId },
          data: { notes: null },
        })
      }
      throw error
    }
  }

  private static enrichBooking<T extends { notes?: string | null }>(booking: T) {
    const payload = this.parseNotesPayload(booking.notes)
    return {
      ...booking,
      notes: payload.plainNotes || null,
      pickup_location_type: payload.assignment?.pickupLocationType || null,
      pickup_location_label: payload.assignment?.pickupLocationLabel || null,
      pickup_verified: payload.assignment?.pickupVerified || false,
      pickup_verified_location: payload.assignment?.pickupVerifiedLocation || null,
      dropoff_location: payload.assignment?.dropoffLocation || null,
      dropoff_verified: payload.assignment?.dropoffVerified || false,
      dropoff_verified_location: payload.assignment?.dropoffVerifiedLocation || null,
      dropoff_location_changed: payload.assignment?.dropoffLocationChanged || false,
    }
  }

  private static buildDriverTaskMessage(booking: any, assignedBy: string) {
    const customerName = `${booking.customer.first_name} ${booking.customer.last_name}`
    const customerPhone = booking.customer.phone || 'N/A'
    const vehicleName = `${booking.vehicle.brand} ${booking.vehicle.model} (${booking.vehicle.plate_number})`
    const pickup = booking.pickup_location_label || booking.pickup_location_type || 'Not specified'
    const dropoff = booking.dropoff_location || 'Not specified'
    const dropoffStatus = booking.dropoff_verified ? 'Verified' : 'Pending verification'
    const additionalNotes = booking.notes || 'None'

    return `Client: ${customerName} (${customerPhone}) | Car: ${vehicleName} | Pickup: ${pickup} | Drop-off: ${dropoff} (${dropoffStatus}) | Assigned by: ${assignedBy} | Date: ${new Date(booking.start_date).toLocaleString()} | Notes: ${additionalNotes}`
  }

  private static async notifyDriverIfAssigned(
    previousDriverId: string | null | undefined,
    booking: any,
    companyId: string,
    assignedByUserId: string
  ) {
    if (!booking.driver_id) return

    const assignedByUser = await prisma.user.findUnique({
      where: { id: assignedByUserId },
      select: {
        first_name: true,
        last_name: true,
        role: true,
      },
    })

    const assignedBy = assignedByUser
      ? `${assignedByUser.first_name} ${assignedByUser.last_name} (${assignedByUser.role})`
      : 'System'

    const enrichedBooking = this.enrichBooking(booking)
    const message = this.buildDriverTaskMessage(enrichedBooking, assignedBy)

    if (!previousDriverId || previousDriverId !== booking.driver_id) {
      await NotificationService.notifyDriverTaskAssigned({
        companyId,
        driverId: booking.driver_id,
        taskId: booking.id,
        title: 'New Task Assigned',
        message,
      })
      return
    }

    await NotificationService.notifyDriverTaskUpdated({
      companyId,
      driverId: booking.driver_id,
      taskId: booking.id,
      title: 'Task Details Updated',
      message,
    })
  }

  private static async attachCreatedByToBookings<T extends { id: string }>(bookings: T[]) {
    if (bookings.length === 0) return []

    const createLogs = await prisma.auditLog.findMany({
      where: {
        entity_type: 'Booking',
        action: 'CREATE',
        entity_id: {
          in: bookings.map((item) => item.id),
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

    const creatorByBookingId = new Map<string, (typeof createLogs)[number]['user']>()
    for (const log of createLogs) {
      if (!creatorByBookingId.has(log.entity_id)) {
        creatorByBookingId.set(log.entity_id, log.user)
      }
    }

    return bookings.map((booking) => ({
      ...booking,
      created_by: creatorByBookingId.get(booking.id) || null,
    }))
  }

  private static async notifyVerificationToAdminsAndCreator(params: {
    companyId: string
    bookingId: string
    verifiedByUserId: string
    verificationType: 'PICKUP_VERIFIED' | 'DROPOFF_VERIFIED'
    message: string
  }) {
    const createLog = await prisma.auditLog.findFirst({
      where: {
        entity_type: 'Booking',
        entity_id: params.bookingId,
        action: 'CREATE',
      },
      orderBy: {
        created_at: 'asc',
      },
      select: {
        user_id: true,
      },
    })

    const managers = await prisma.user.findMany({
      where: {
        company_id: params.companyId,
        role: 'COMPANY_MANAGER',
        is_active: true,
      },
      select: {
        id: true,
      },
    })

    const targetUserIds = new Set<string>([
      ...managers.map((user) => user.id),
      ...(createLog?.user_id ? [createLog.user_id] : []),
    ])

    targetUserIds.delete(params.verifiedByUserId)

    for (const userId of targetUserIds) {
      try {
        await NotificationService.createNotification({
          companyId: params.companyId,
          userId,
          type: params.verificationType,
          title: params.verificationType === 'PICKUP_VERIFIED' ? 'Pickup Verified' : 'Drop-off Verified',
          message: params.message,
        })
      } catch (error) {
        console.error('Failed to create verification notification:', error)
      }
    }
  }

  static async checkAvailability(
    vehicleId: string,
    startDate: Date,
    endDate: Date,
    excludeBookingId?: string
  ): Promise<{ available: boolean; conflictingBookings?: unknown[] }> {
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        vehicle_id: vehicleId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: { in: ['CONFIRMED', 'ACTIVE'] },
        OR: [
          { AND: [{ start_date: { lte: startDate } }, { end_date: { gte: startDate } }] },
          { AND: [{ start_date: { lte: endDate } }, { end_date: { gte: endDate } }] },
          { AND: [{ start_date: { gte: startDate } }, { end_date: { lte: endDate } }] },
        ],
      },
      include: {
        customer: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    })

    if (conflictingBookings.length > 0) {
      return { available: false, conflictingBookings }
    }

    return { available: true }
  }

  static async createBooking(data: CreateBookingInput, userId: string) {
    const customerCheck = await CustomerService.canRent(data.customerId)
    if (!customerCheck.canRent) {
      throw new Error(customerCheck.reason || 'CUSTOMER_CANNOT_RENT')
    }

    if (data.startDate >= data.endDate) {
      throw new Error('INVALID_DATE_RANGE')
    }

    if (data.startDate < new Date()) {
      throw new Error('START_DATE_IN_PAST')
    }

    const availability = await this.checkAvailability(data.vehicleId, data.startDate, data.endDate)
    if (!availability.available) {
      throw new Error('VEHICLE_NOT_AVAILABLE')
    }

    const vehicle = await prisma.vehicle.findFirst({
      where: {
        id: data.vehicleId,
        status: { in: ['AVAILABLE', 'RESERVED'] },
        deleted_at: null,
      },
    })

    if (!vehicle) {
      throw new Error('VEHICLE_NOT_FOUND_OR_UNAVAILABLE')
    }

    const bookingData = {
      company_id: data.companyId,
      customer_id: data.customerId,
      vehicle_id: data.vehicleId,
      driver_id: data.driverId,
      start_date: data.startDate,
      end_date: data.endDate,
      estimated_cost: data.estimatedCost,
      discount_code: data.discountCode,
      discount_amount: data.discountAmount || 0,
      status: 'PENDING' as const,
      notes: this.buildNotesPayload(data.notes, {
        pickupLocationType: data.pickupLocationType || 'OFFICE',
        pickupLocationLabel: data.pickupLocationLabel,
        dropoffLocation: data.dropoffLocation,
        pickupVerified: false,
        dropoffVerified: false,
        dropoffLocationChanged: false,
      }),
    }

    let booking
    try {
      booking = await prisma.booking.create({
        data: bookingData,
        include: {
          customer: true,
          vehicle: true,
          driver: true,
          services: true,
        },
      })
    } catch (error: any) {
      // Ultimate fallback for environments where notes column is smaller than expected.
      if (error?.code === 'P2000' && error?.meta?.column_name === 'notes') {
        booking = await prisma.booking.create({
          data: {
            ...bookingData,
            notes: null,
          },
          include: {
            customer: true,
            vehicle: true,
            driver: true,
            services: true,
          },
        })
      } else {
        throw error
      }
    }

    await prisma.vehicle.update({
      where: { id: data.vehicleId },
      data: { status: 'RESERVED' },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Booking',
      entityId: booking.id,
      newValues: booking,
      ipAddress: 'system',
      userAgent: 'system',
    })

    try {
      await this.notifyDriverIfAssigned(null, booking, data.companyId, userId)
    } catch (error) {
      console.error('Driver notification failed after booking create:', error)
    }

    return this.enrichBooking(booking)
  }

  static async getBookings(filters?: {
    companyId?: string
    branchId?: string
    customerId?: string
    vehicleId?: string
    status?: BookingStatus
    startDate?: Date
    endDate?: Date
    driverId?: string
  }) {
    const where: any = {}

    if (filters?.companyId) where.company_id = filters.companyId
    if (filters?.customerId) where.customer_id = filters.customerId
    if (filters?.vehicleId) where.vehicle_id = filters.vehicleId
    if (filters?.status) where.status = filters.status
    if (filters?.driverId) where.driver_id = filters.driverId
    if (filters?.branchId) where.vehicle = { branch_id: filters.branchId }

    if (filters?.startDate || filters?.endDate) {
      where.AND = []
      if (filters.startDate) where.AND.push({ start_date: { gte: filters.startDate } })
      if (filters.endDate) where.AND.push({ end_date: { lte: filters.endDate } })
    }

    const bookings = await prisma.booking.findMany({
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
            branch_id: true,
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
        services: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const withCreator = await this.attachCreatedByToBookings(bookings)
    return withCreator.map((booking) => this.enrichBooking(booking))
  }

  static async getBookingById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })

    if (!booking) {
      throw new Error('BOOKING_NOT_FOUND')
    }

    const withCreator = await this.attachCreatedByToBookings([booking])
    return this.enrichBooking(withCreator[0])
  }

  static async updateBooking(id: string, data: UpdateBookingInput, userId: string, companyId: string) {
    const oldBooking = await prisma.booking.findUnique({ where: { id } })
    if (!oldBooking) throw new Error('BOOKING_NOT_FOUND')

    if (!['PENDING', 'CONFIRMED'].includes(oldBooking.status)) {
      throw new Error('BOOKING_CANNOT_BE_MODIFIED')
    }

    if (data.startDate || data.endDate) {
      const startDate = data.startDate || oldBooking.start_date
      const endDate = data.endDate || oldBooking.end_date
      if (startDate >= endDate) throw new Error('INVALID_DATE_RANGE')

      const availability = await this.checkAvailability(oldBooking.vehicle_id, startDate, endDate, id)
      if (!availability.available) throw new Error('VEHICLE_NOT_AVAILABLE')
    }

    const notesPayload = this.buildNotesPayload(
      data.notes !== undefined ? data.notes : this.parseNotesPayload(oldBooking.notes).plainNotes,
      {
        pickupLocationType:
          data.pickupLocationType ||
          this.parseNotesPayload(oldBooking.notes).assignment?.pickupLocationType ||
          'OFFICE',
        pickupLocationLabel:
          data.pickupLocationLabel !== undefined
            ? data.pickupLocationLabel
            : this.parseNotesPayload(oldBooking.notes).assignment?.pickupLocationLabel,
        pickupVerified: this.parseNotesPayload(oldBooking.notes).assignment?.pickupVerified || false,
        pickupVerifiedLocation:
          this.parseNotesPayload(oldBooking.notes).assignment?.pickupVerifiedLocation,
        dropoffLocation:
          data.dropoffLocation !== undefined
            ? data.dropoffLocation
            : this.parseNotesPayload(oldBooking.notes).assignment?.dropoffLocation,
        dropoffVerified: this.parseNotesPayload(oldBooking.notes).assignment?.dropoffVerified || false,
        dropoffVerifiedLocation:
          this.parseNotesPayload(oldBooking.notes).assignment?.dropoffVerifiedLocation,
        dropoffLocationChanged:
          this.parseNotesPayload(oldBooking.notes).assignment?.dropoffLocationChanged || false,
      }
    )

    await this.updateBookingNotesSafely(id, notesPayload)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })
    if (!booking) throw new Error('BOOKING_NOT_FOUND')

    const bookingWithUpdates = await prisma.booking.update({
      where: { id },
      data: {
        start_date: data.startDate,
        end_date: data.endDate,
        driver_id: data.driverId,
        estimated_cost: data.estimatedCost,
        discount_code: data.discountCode,
        discount_amount: data.discountAmount,
      },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE',
      entityType: 'Booking',
      entityId: booking.id,
      oldValues: oldBooking,
      newValues: bookingWithUpdates,
      ipAddress: 'system',
      userAgent: 'system',
    })

    try {
      await this.notifyDriverIfAssigned(oldBooking.driver_id, bookingWithUpdates, companyId, userId)
    } catch (error) {
      console.error('Driver notification failed after booking update:', error)
    }

    return this.enrichBooking(bookingWithUpdates)
  }

  static async confirmBooking(id: string, userId: string, companyId: string) {
    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) throw new Error('BOOKING_NOT_FOUND')
    if (booking.status !== 'PENDING') throw new Error('BOOKING_NOT_PENDING')

    const availability = await this.checkAvailability(booking.vehicle_id, booking.start_date, booking.end_date, id)
    if (!availability.available) throw new Error('VEHICLE_NOT_AVAILABLE')

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'CONFIRM',
      entityType: 'Booking',
      entityId: booking.id,
      oldValues: { status: 'PENDING' },
      newValues: { status: 'CONFIRMED' },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return this.enrichBooking(updatedBooking)
  }

  static async cancelBooking(id: string, userId: string, companyId: string) {
    const booking = await prisma.booking.findUnique({ where: { id } })
    if (!booking) throw new Error('BOOKING_NOT_FOUND')
    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new Error('BOOKING_CANNOT_BE_CANCELLED')
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })

    const otherBookings = await prisma.booking.count({
      where: {
        vehicle_id: booking.vehicle_id,
        id: { not: id },
        status: { in: ['CONFIRMED', 'ACTIVE'] },
      },
    })

    if (otherBookings === 0) {
      await prisma.vehicle.update({
        where: { id: booking.vehicle_id },
        data: { status: 'AVAILABLE' },
      })
    }

    await AuditService.log({
      userId,
      companyId,
      action: 'CANCEL',
      entityType: 'Booking',
      entityId: booking.id,
      oldValues: { status: booking.status },
      newValues: { status: 'CANCELLED' },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return this.enrichBooking(updatedBooking)
  }

  static async addService(bookingId: string, data: AddServiceInput, userId: string, companyId: string) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new Error('BOOKING_NOT_FOUND')

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new Error('BOOKING_CANNOT_BE_MODIFIED')
    }

    const service = await prisma.bookingService.create({
      data: {
        booking_id: bookingId,
        name: `${data.serviceType}: ${data.serviceName}`,
        price: data.price,
      },
    })

    const newEstimatedCost = Number(booking.estimated_cost) + Number(data.price)
    await prisma.booking.update({
      where: { id: bookingId },
      data: { estimated_cost: newEstimatedCost },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'ADD_SERVICE',
      entityType: 'Booking',
      entityId: booking.id,
      newValues: service,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return service
  }

  static async removeService(serviceId: string, userId: string, companyId: string) {
    const service = await prisma.bookingService.findUnique({
      where: { id: serviceId },
      include: { booking: true },
    })
    if (!service) throw new Error('SERVICE_NOT_FOUND')

    if (!['PENDING', 'CONFIRMED'].includes(service.booking.status)) {
      throw new Error('BOOKING_CANNOT_BE_MODIFIED')
    }

    const newEstimatedCost = Number(service.booking.estimated_cost) - Number(service.price)
    await prisma.booking.update({
      where: { id: service.booking_id },
      data: { estimated_cost: newEstimatedCost },
    })

    await prisma.bookingService.delete({ where: { id: serviceId } })

    await AuditService.log({
      userId,
      companyId,
      action: 'REMOVE_SERVICE',
      entityType: 'Booking',
      entityId: service.booking_id,
      oldValues: service,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Service removed successfully' }
  }

  static async getOverdueBookings(companyId: string) {
    const now = new Date()
    return prisma.booking.findMany({
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

  static async verifyPickup(
    bookingId: string,
    driverUserId: string,
    companyId: string,
    location?: string
  ) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new Error('BOOKING_NOT_FOUND')
    if (booking.company_id !== companyId) throw new Error('FORBIDDEN')
    if (booking.driver_id !== driverUserId) throw new Error('FORBIDDEN')

    const parsed = this.parseNotesPayload(booking.notes)
    const fallbackPickup =
      this.asString(parsed.assignment?.pickupLocationLabel) ||
      this.asString(parsed.assignment?.pickupLocationType) ||
      'OFFICE'
    const pickupVerifiedLocation = location?.trim() || fallbackPickup

    const assignment: AssignmentLocation = {
      pickupLocationType: parsed.assignment?.pickupLocationType || 'OFFICE',
      pickupLocationLabel: this.asString(parsed.assignment?.pickupLocationLabel),
      dropoffLocation: this.asString(parsed.assignment?.dropoffLocation),
      pickupVerified: true,
      pickupVerifiedLocation,
      dropoffVerified: parsed.assignment?.dropoffVerified || false,
      dropoffVerifiedLocation: this.asString(parsed.assignment?.dropoffVerifiedLocation),
      dropoffLocationChanged: parsed.assignment?.dropoffLocationChanged || false,
    }

    await this.updateBookingNotesSafely(
      bookingId,
      this.buildNotesPayload(parsed.plainNotes, assignment)
    )

    const updated = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })
    if (!updated) throw new Error('BOOKING_NOT_FOUND')

    await AuditService.log({
      userId: driverUserId,
      companyId,
      action: 'VERIFY_PICKUP',
      entityType: 'Booking',
      entityId: bookingId,
      oldValues: booking,
      newValues: updated,
      ipAddress: 'system',
      userAgent: 'system',
    })

    const driverName = updated.driver
      ? `${updated.driver.first_name} ${updated.driver.last_name}`
      : 'Driver'
    const customerName = `${updated.customer.first_name} ${updated.customer.last_name}`

    await this.notifyVerificationToAdminsAndCreator({
      companyId,
      bookingId,
      verifiedByUserId: driverUserId,
      verificationType: 'PICKUP_VERIFIED',
      message: `${driverName} verified pickup for ${customerName}. Pickup location: ${pickupVerifiedLocation}.`,
    })

    return this.enrichBooking(updated)
  }

  static async verifyDropoff(
    bookingId: string,
    driverUserId: string,
    companyId: string,
    location?: string,
    useAssignedLocation = false
  ) {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) throw new Error('BOOKING_NOT_FOUND')
    if (booking.company_id !== companyId) throw new Error('FORBIDDEN')
    if (booking.driver_id !== driverUserId) throw new Error('FORBIDDEN')

    const parsed = this.parseNotesPayload(booking.notes)
    const assignedDropoffRaw = this.asString(parsed.assignment?.dropoffLocation)
    const assignedDropoff = assignedDropoffRaw?.trim()
    const inputLocation = location?.trim()

    if (!parsed.assignment?.pickupVerified) {
      throw new Error('PICKUP_NOT_VERIFIED')
    }

    let finalDropoff = ''
    let dropoffLocationChanged = false

    if (useAssignedLocation) {
      if (!assignedDropoff) throw new Error('ASSIGNED_DROPOFF_MISSING')
      finalDropoff = assignedDropoff
      dropoffLocationChanged = false
    } else if (inputLocation) {
      finalDropoff = inputLocation
      dropoffLocationChanged = !!assignedDropoff && assignedDropoff.toLowerCase() !== inputLocation.toLowerCase()
    } else if (assignedDropoff) {
      finalDropoff = assignedDropoff
      dropoffLocationChanged = false
    } else {
      throw new Error('DROPOFF_LOCATION_REQUIRED')
    }

    const assignment: AssignmentLocation = {
      pickupLocationType: parsed.assignment?.pickupLocationType || 'OFFICE',
      pickupLocationLabel: this.asString(parsed.assignment?.pickupLocationLabel),
      dropoffLocation: assignedDropoffRaw,
      pickupVerified: parsed.assignment?.pickupVerified || false,
      pickupVerifiedLocation: this.asString(parsed.assignment?.pickupVerifiedLocation),
      dropoffVerified: true,
      dropoffVerifiedLocation: finalDropoff,
      dropoffLocationChanged,
    }

    await this.updateBookingNotesSafely(
      bookingId,
      this.buildNotesPayload(parsed.plainNotes, assignment)
    )

    const updated = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        customer: true,
        vehicle: true,
        driver: true,
        services: true,
      },
    })
    if (!updated) throw new Error('BOOKING_NOT_FOUND')

    await AuditService.log({
      userId: driverUserId,
      companyId,
      action: 'VERIFY_DROPOFF',
      entityType: 'Booking',
      entityId: bookingId,
      oldValues: booking,
      newValues: updated,
      ipAddress: 'system',
      userAgent: 'system',
    })

    const driverName = updated.driver
      ? `${updated.driver.first_name} ${updated.driver.last_name}`
      : 'Driver'
    const customerName = `${updated.customer.first_name} ${updated.customer.last_name}`

    await this.notifyVerificationToAdminsAndCreator({
      companyId,
      bookingId,
      verifiedByUserId: driverUserId,
      verificationType: 'DROPOFF_VERIFIED',
      message: `${driverName} verified drop-off for ${customerName}. Drop-off location: ${finalDropoff}.`,
    })

    return this.enrichBooking(updated)
  }
}
