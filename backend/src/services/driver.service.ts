import prisma from '../lib/prisma'
import { AuditService } from './audit.service'
import fs from 'fs/promises'
import path from 'path'
import { hashPassword } from '../utils/password'

interface CreateDriverInput {
  companyId: string
  firstName: string
  lastName: string
  phone: string
  licenseNumber: string
  licenseExpiry: Date
  email: string
  password: string
  dateOfBirth?: Date
  address?: string
  photoUrl?: string
  status?: 'ACTIVE' | 'ON_TRIP' | 'INACTIVE'
}

interface UpdateDriverInput {
  firstName?: string
  lastName?: string
  phone?: string
  licenseNumber?: string
  licenseExpiry?: Date
  email?: string
  password?: string
  dateOfBirth?: string
  address?: string
  photoUrl?: string
  status?: 'ACTIVE' | 'ON_TRIP' | 'INACTIVE'
  isActive?: boolean
}

interface RateDriverInput {
  rentalId: string
  rating: number
  onTime: boolean
}

export class DriverService {
  private static readonly DRIVER_PHOTO_ENTITY_TYPE = 'DRIVER'
  private static readonly DRIVER_PHOTO_TYPE = 'PROFILE_PHOTO'
  private static readonly DRIVER_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'drivers')

  private static getExtensionFromMime(mime: string): string {
    if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg'
    if (mime === 'image/png') return 'png'
    if (mime === 'image/webp') return 'webp'
    return 'jpg'
  }

  private static async persistPhotoIfDataUrl(driverId: string, photoUrl: string): Promise<string> {
    if (!photoUrl.startsWith('data:image/')) return photoUrl

    const match = photoUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
    if (!match) return photoUrl

    const mime = match[1].toLowerCase()
    const base64 = match[2]
    const extension = this.getExtensionFromMime(mime)

    await fs.mkdir(this.DRIVER_UPLOAD_DIR, { recursive: true })

    const filename = `${driverId}.${extension}`
    const fullPath = path.join(this.DRIVER_UPLOAD_DIR, filename)
    const buffer = Buffer.from(base64, 'base64')

    await fs.writeFile(fullPath, buffer)
    return `/uploads/drivers/${filename}`
  }

  private static normalizePhotoUrl(value: string): string {
    const normalized = value.replace(/\\/g, '/')
    const uploadsIndex = normalized.indexOf('/uploads/')
    if (uploadsIndex >= 0) {
      return normalized.substring(uploadsIndex)
    }
    const altUploadsIndex = normalized.indexOf('uploads/')
    if (altUploadsIndex >= 0) {
      return `/${normalized.substring(altUploadsIndex)}`
    }
    if (normalized.startsWith('http://') || normalized.startsWith('https://')) return normalized
    if (normalized.startsWith('/uploads')) return normalized
    if (normalized.startsWith('uploads/')) return `/${normalized}`
    return normalized
  }

  private static async upsertDriverPhoto(
    companyId: string,
    driverId: string,
    photoUrl: string | undefined,
    uploadedBy: string
  ) {
    if (photoUrl === undefined) return

    const existingPhotos = await prisma.document.findMany({
      where: {
        company_id: companyId,
        entity_type: this.DRIVER_PHOTO_ENTITY_TYPE,
        entity_id: driverId,
        type: this.DRIVER_PHOTO_TYPE,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    if (!photoUrl) {
      if (existingPhotos.length > 0) {
        await prisma.document.deleteMany({
          where: {
            id: {
              in: existingPhotos.map((doc) => doc.id),
            },
          },
        })
      }
      return
    }

    const storedPhotoUrl = await this.persistPhotoIfDataUrl(driverId, photoUrl)

    const latestPhoto = existingPhotos[0]
    if (latestPhoto) {
      await prisma.document.update({
        where: { id: latestPhoto.id },
        data: {
          file_url: storedPhotoUrl,
          file_name: 'driver-profile-photo.jpg',
          uploaded_by: uploadedBy,
        },
      })

      if (existingPhotos.length > 1) {
        await prisma.document.deleteMany({
          where: {
            id: {
              in: existingPhotos.slice(1).map((doc) => doc.id),
            },
          },
        })
      }
      return
    }

    await prisma.document.create({
      data: {
        company_id: companyId,
        entity_type: this.DRIVER_PHOTO_ENTITY_TYPE,
        entity_id: driverId,
        type: this.DRIVER_PHOTO_TYPE,
        file_url: storedPhotoUrl,
        file_name: 'driver-profile-photo.jpg',
        uploaded_by: uploadedBy,
      },
    })
  }

  private static async attachPhotosToDrivers<T extends { id: string }>(drivers: T[]) {
    if (drivers.length === 0) return []

    const photos = await prisma.document.findMany({
      where: {
        entity_type: this.DRIVER_PHOTO_ENTITY_TYPE,
        type: this.DRIVER_PHOTO_TYPE,
        entity_id: {
          in: drivers.map((driver) => driver.id),
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    const photoByDriverId = new Map<string, string>()
    for (const photo of photos) {
      if (!photoByDriverId.has(photo.entity_id)) {
        photoByDriverId.set(photo.entity_id, photo.file_url)
      }
    }

    return drivers.map((driver) => ({
      ...driver,
      photo_url: photoByDriverId.get(driver.id)
        ? this.normalizePhotoUrl(photoByDriverId.get(driver.id) as string)
        : null,
    }))
  }

  private static async attachPhotoToDriver<T extends { id: string }>(driver: T) {
    const photo = await prisma.document.findFirst({
      where: {
        entity_type: this.DRIVER_PHOTO_ENTITY_TYPE,
        type: this.DRIVER_PHOTO_TYPE,
        entity_id: driver.id,
      },
      orderBy: {
        created_at: 'desc',
      },
    })

    return {
      ...driver,
      photo_url: photo?.file_url ? this.normalizePhotoUrl(photo.file_url) : null,
    }
  }

  private static async attachStatusToDrivers<T extends { id: string; is_active: boolean }>(
    drivers: T[]
  ) {
    if (drivers.length === 0) return []

    const activeRentals = await prisma.rental.groupBy({
      by: ['driver_id'],
      where: {
        driver_id: {
          in: drivers.map((driver) => driver.id),
        },
        status: 'ACTIVE',
      },
    })

    const activeTripDriverIds = new Set(
      activeRentals.map((rental) => rental.driver_id).filter(Boolean) as string[]
    )

    const driverUsers = await prisma.user.findMany({
      where: {
        id: {
          in: drivers.map((driver) => driver.id),
        },
      },
      select: {
        id: true,
        email: true,
      },
    })

    const userById = new Map(driverUsers.map((user) => [user.id, user]))

    return drivers.map((driver) => ({
      ...driver,
      email: userById.get(driver.id)?.email || null,
      status: !driver.is_active ? 'INACTIVE' : activeTripDriverIds.has(driver.id) ? 'ON_TRIP' : 'ACTIVE',
    }))
  }

  private static async attachStatusToDriver<T extends { id: string; is_active: boolean }>(driver: T) {
    const activeRental = await prisma.rental.findFirst({
      where: {
        driver_id: driver.id,
        status: 'ACTIVE',
      },
      select: {
        id: true,
      },
    })

    const user = await prisma.user.findUnique({
      where: {
        id: driver.id,
      },
      select: {
        email: true,
      },
    })

    return {
      ...driver,
      email: user?.email || null,
      status: !driver.is_active ? 'INACTIVE' : activeRental ? 'ON_TRIP' : 'ACTIVE',
    }
  }

  static async createDriver(data: CreateDriverInput, userId: string) {
    // Check license number uniqueness within company
    const existingLicense = await prisma.driver.findFirst({
      where: {
        company_id: data.companyId,
        license_number: data.licenseNumber,
      },
    })

    if (existingLicense) {
      throw new Error('LICENSE_ALREADY_EXISTS')
    }

    // Validate license expiry is in the future
    if (new Date(data.licenseExpiry) <= new Date()) {
      throw new Error('LICENSE_EXPIRED')
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: data.email,
      },
    })

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }

    const hashedPassword = await hashPassword(data.password)

    const driver = await prisma.$transaction(async (tx) => {
      const createdDriver = await tx.driver.create({
        data: {
          company_id: data.companyId,
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          license_number: data.licenseNumber,
          license_expiry: data.licenseExpiry,
          is_active: data.status === 'INACTIVE' ? false : true,
          total_trips: 0,
          average_rating: 0,
          incidents_count: 0,
          performance_score: 0,
        },
      })

      await tx.user.create({
        data: {
          id: createdDriver.id,
          company_id: data.companyId,
          email: data.email,
          password: hashedPassword,
          first_name: data.firstName,
          last_name: data.lastName,
          role: 'DRIVER',
          is_active: data.status === 'INACTIVE' ? false : true,
        },
      })

      return createdDriver
    })

    await this.upsertDriverPhoto(data.companyId, driver.id, data.photoUrl, userId)

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Driver',
      entityId: driver.id,
      newValues: driver,
      ipAddress: 'system',
      userAgent: 'system',
    })

    const withPhoto = await this.attachPhotoToDriver(driver)
    return this.attachStatusToDriver(withPhoto)
  }

  static async getDrivers(filters?: {
    companyId?: string
    isActive?: boolean
    search?: string
  }) {
    const where: any = {
      deleted_at: null, // Exclude soft-deleted drivers
    }

    if (filters?.companyId) {
      where.company_id = filters.companyId
    }

    if (filters?.isActive !== undefined) {
      where.is_active = filters.isActive
    }

    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search } },
        { last_name: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { license_number: { contains: filters.search } },
      ]
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        _count: {
          select: {
            rentals: true,
          },
        },
      },
      orderBy: {
        performance_score: 'desc',
      },
    })

    const withPhotos = await this.attachPhotosToDrivers(drivers)
    return this.attachStatusToDrivers(withPhotos)
  }

  static async getDriverById(id: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        rentals: {
          orderBy: {
            created_at: 'desc',
          },
          take: 10,
          include: {
            vehicle: {
              select: {
                brand: true,
                model: true,
                plate_number: true,
              },
            },
            customer: {
              select: {
                first_name: true,
                last_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            rentals: true,
          },
        },
      },
    })

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND')
    }

    const withPhoto = await this.attachPhotoToDriver(driver)
    return this.attachStatusToDriver(withPhoto)
  }

  static async updateDriver(
    id: string,
    data: UpdateDriverInput,
    userId: string,
    companyId: string
  ) {
    const oldDriver = await prisma.driver.findUnique({
      where: { id },
    })

    if (!oldDriver) {
      throw new Error('DRIVER_NOT_FOUND')
    }

    // Check license number uniqueness if being updated
    if (data.licenseNumber && data.licenseNumber !== oldDriver.license_number) {
      const existingLicense = await prisma.driver.findFirst({
        where: {
          company_id: companyId,
          license_number: data.licenseNumber,
          id: { not: id },
        },
      })

      if (existingLicense) {
        throw new Error('LICENSE_ALREADY_EXISTS')
      }
    }

    // Validate license expiry if being updated
    if (data.licenseExpiry && new Date(data.licenseExpiry) <= new Date()) {
      throw new Error('LICENSE_EXPIRED')
    }

    if (data.email) {
      const emailOwner = await prisma.user.findUnique({
        where: {
          email: data.email,
        },
      })

      if (emailOwner && emailOwner.id !== id) {
        throw new Error('EMAIL_ALREADY_EXISTS')
      }
    }

    const nextIsActive =
      data.status !== undefined
        ? data.status === 'INACTIVE'
          ? false
          : true
        : data.isActive !== undefined
          ? data.isActive
          : oldDriver.is_active

    const driver = await prisma.$transaction(async (tx) => {
      const updatedDriver = await tx.driver.update({
        where: { id },
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          phone: data.phone,
          license_number: data.licenseNumber,
          license_expiry: data.licenseExpiry,
          is_active: nextIsActive,
        },
      })

      const existingUser = await tx.user.findUnique({
        where: { id },
      })

      const userData: any = {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        is_active: nextIsActive,
      }

      if (data.password) {
        userData.password = await hashPassword(data.password)
      }

      if (existingUser) {
        await tx.user.update({
          where: { id },
          data: userData,
        })
      } else if (data.email && data.password) {
        await tx.user.create({
          data: {
            id,
            company_id: companyId,
            email: data.email,
            password: await hashPassword(data.password),
            first_name: data.firstName || updatedDriver.first_name,
            last_name: data.lastName || updatedDriver.last_name,
            role: 'DRIVER',
            is_active: nextIsActive,
          },
        })
      }

      return updatedDriver
    })

    await this.upsertDriverPhoto(companyId, driver.id, data.photoUrl, userId)

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE',
      entityType: 'Driver',
      entityId: driver.id,
      oldValues: oldDriver,
      newValues: driver,
      ipAddress: 'system',
      userAgent: 'system',
    })

    const withPhoto = await this.attachPhotoToDriver(driver)
    return this.attachStatusToDriver(withPhoto)
  }

  static async rateDriver(
    driverId: string,
    data: RateDriverInput,
    userId: string,
    companyId: string
  ) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    })

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND')
    }

    // Validate rating is between 1 and 5
    if (data.rating < 1 || data.rating > 5) {
      throw new Error('INVALID_RATING')
    }

    // Verify rental exists and belongs to this driver
    const rental = await prisma.rental.findFirst({
      where: {
        id: data.rentalId,
        driver_id: driverId,
      },
    })

    if (!rental) {
      throw new Error('RENTAL_NOT_FOUND')
    }

    // Calculate new average rating
    const totalTrips = driver.total_trips + 1
    const currentTotal = Number(driver.average_rating) * driver.total_trips
    const newAverageRating = (currentTotal + data.rating) / totalTrips

    // Calculate on-time percentage (simplified)
    const onTimeCount = data.onTime ? 1 : 0
    const onTimePercentage = (onTimeCount / totalTrips) * 100

    // Calculate performance score: (Trips × 0.4) + (Rating × 0.3) + (OnTime% × 0.3)
    const performanceScore =
      totalTrips * 0.4 + newAverageRating * 0.3 + onTimePercentage * 0.3

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        total_trips: totalTrips,
        average_rating: newAverageRating,
        performance_score: performanceScore,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'RATE_DRIVER',
      entityType: 'Driver',
      entityId: driver.id,
      oldValues: {
        total_trips: driver.total_trips,
        average_rating: driver.average_rating,
        performance_score: driver.performance_score,
      },
      newValues: {
        total_trips: totalTrips,
        average_rating: newAverageRating,
        performance_score: performanceScore,
        rating: data.rating,
        onTime: data.onTime,
      },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedDriver
  }

  static async recordIncident(driverId: string, userId: string, companyId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    })

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND')
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        incidents_count: driver.incidents_count + 1,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'RECORD_INCIDENT',
      entityType: 'Driver',
      entityId: driver.id,
      oldValues: { incidents_count: driver.incidents_count },
      newValues: { incidents_count: driver.incidents_count + 1 },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedDriver
  }

  static async getDriverPerformanceRanking(companyId: string) {
    return prisma.driver.findMany({
      where: {
        company_id: companyId,
        is_active: true,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        total_trips: true,
        average_rating: true,
        incidents_count: true,
        performance_score: true,
      },
      orderBy: {
        performance_score: 'desc',
      },
      take: 20,
    })
  }

  static async canDrive(driverId: string): Promise<{ canDrive: boolean; reason?: string }> {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
    })

    if (!driver) {
      return { canDrive: false, reason: 'DRIVER_NOT_FOUND' }
    }

    if (!driver.is_active) {
      return { canDrive: false, reason: 'DRIVER_INACTIVE' }
    }

    if (new Date(driver.license_expiry) <= new Date()) {
      return { canDrive: false, reason: 'LICENSE_EXPIRED' }
    }

    return { canDrive: true }
  }

  // Soft delete driver
  static async deleteDriver(id: string, userId: string, companyId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
    })

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND')
    }

    if (driver.deleted_at) {
      throw new Error('DRIVER_ALREADY_DELETED')
    }

    const updatedDriver = await prisma.$transaction(async (tx) => {
      const updated = await tx.driver.update({
        where: { id },
        data: { deleted_at: new Date(), is_active: false },
      })

      await tx.user.updateMany({
        where: { id },
        data: {
          is_active: false,
        },
      })

      return updated
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'DELETE',
      entityType: 'Driver',
      entityId: id,
      oldValues: driver,
      newValues: updatedDriver,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Driver deleted successfully' }
  }

  // Restore soft-deleted driver
  static async restoreDriver(id: string, userId: string, companyId: string) {
    const driver = await prisma.driver.findUnique({
      where: { id },
    })

    if (!driver) {
      throw new Error('DRIVER_NOT_FOUND')
    }

    if (!driver.deleted_at) {
      throw new Error('DRIVER_NOT_DELETED')
    }

    const updatedDriver = await prisma.$transaction(async (tx) => {
      const updated = await tx.driver.update({
        where: { id },
        data: { deleted_at: null },
      })

      await tx.user.updateMany({
        where: { id },
        data: {
          is_active: updated.is_active,
        },
      })

      return updated
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'RESTORE',
      entityType: 'Driver',
      entityId: id,
      oldValues: driver,
      newValues: updatedDriver,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Driver restored successfully', driver: updatedDriver }
  }
}
