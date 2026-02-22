import prisma from '../lib/prisma'
import { AuditService } from './audit.service'

interface CreateCustomerInput {
  companyId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  licenseNumber: string
  licenseExpiry: Date
  dateOfBirth: Date
  idNumber?: string
}

interface UpdateCustomerInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  address?: string
  licenseNumber?: string
  licenseExpiry?: Date
  dateOfBirth?: Date
  idNumber?: string
  isBlacklisted?: boolean
  loyaltyLevel?: string
  riskScore?: number
}

export class CustomerService {
  static async createCustomer(data: CreateCustomerInput, userId: string) {
    // Check email uniqueness within company (excluding soft-deleted)
    const existingEmail = await prisma.customer.findFirst({
      where: {
        company_id: data.companyId,
        email: data.email,
        deleted_at: null,
      },
    })

    if (existingEmail) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }

    // Check license number uniqueness within company (excluding soft-deleted)
    const existingLicense = await prisma.customer.findFirst({
      where: {
        company_id: data.companyId,
        license_number: data.licenseNumber,
        deleted_at: null,
      },
    })

    if (existingLicense) {
      throw new Error('LICENSE_ALREADY_EXISTS')
    }

    // Validate license expiry is in the future
    if (new Date(data.licenseExpiry) <= new Date()) {
      throw new Error('LICENSE_EXPIRED')
    }

    const customer = await prisma.customer.create({
      data: {
        company_id: data.companyId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        license_number: data.licenseNumber,
        license_expiry: data.licenseExpiry,
        date_of_birth: data.dateOfBirth,
        id_number: data.idNumber,
        is_blacklisted: false,
        loyalty_level: 'STANDARD',
        risk_score: 50,
        total_spending: 0,
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      newValues: customer,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return customer
  }

  static async getCustomers(filters?: {
    companyId?: string
    isBlacklisted?: boolean
    loyaltyLevel?: string
    search?: string
  }) {
    const where: any = {
      deleted_at: null, // Exclude soft-deleted customers
    }

    if (filters?.companyId) {
      where.company_id = filters.companyId
    }

    if (filters?.isBlacklisted !== undefined) {
      where.is_blacklisted = filters.isBlacklisted
    }

    if (filters?.loyaltyLevel) {
      where.loyalty_level = filters.loyaltyLevel
    }

    if (filters?.search) {
      where.OR = [
        { first_name: { contains: filters.search } },
        { last_name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { phone: { contains: filters.search } },
        { license_number: { contains: filters.search } },
      ]
    }

    return prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            bookings: true,
            rentals: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getCustomerById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        bookings: {
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
          },
        },
        _count: {
          select: {
            bookings: true,
            rentals: true,
          },
        },
      },
    })

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    return customer
  }

  static async updateCustomer(
    id: string,
    data: UpdateCustomerInput,
    userId: string,
    companyId: string
  ) {
    const oldCustomer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!oldCustomer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    // Check email uniqueness if being updated
    if (data.email && data.email !== oldCustomer.email) {
      const existingEmail = await prisma.customer.findFirst({
        where: {
          company_id: companyId,
          email: data.email,
          id: { not: id },
        },
      })

      if (existingEmail) {
        throw new Error('EMAIL_ALREADY_EXISTS')
      }
    }

    // Check license number uniqueness if being updated
    if (data.licenseNumber && data.licenseNumber !== oldCustomer.license_number) {
      const existingLicense = await prisma.customer.findFirst({
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

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        license_number: data.licenseNumber,
        license_expiry: data.licenseExpiry,
        date_of_birth: data.dateOfBirth,
        id_number: data.idNumber,
        is_blacklisted: data.isBlacklisted,
        loyalty_level: data.loyaltyLevel,
        risk_score: data.riskScore,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: customer.id,
      oldValues: oldCustomer,
      newValues: customer,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return customer
  }

  static async blacklistCustomer(id: string, userId: string, companyId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { is_blacklisted: true },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'BLACKLIST',
      entityType: 'Customer',
      entityId: customer.id,
      oldValues: { is_blacklisted: false },
      newValues: { is_blacklisted: true },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedCustomer
  }

  static async removeBlacklist(id: string, userId: string, companyId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { is_blacklisted: false },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'REMOVE_BLACKLIST',
      entityType: 'Customer',
      entityId: customer.id,
      oldValues: { is_blacklisted: true },
      newValues: { is_blacklisted: false },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedCustomer
  }

  static async updateLoyaltyLevel(
    id: string,
    loyaltyLevel: string,
    userId: string,
    companyId: string
  ) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { loyalty_level: loyaltyLevel },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE_LOYALTY',
      entityType: 'Customer',
      entityId: customer.id,
      oldValues: { loyalty_level: customer.loyalty_level },
      newValues: { loyalty_level: loyaltyLevel },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return updatedCustomer
  }

  static async canRent(customerId: string): Promise<{ canRent: boolean; reason?: string }> {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    })

    if (!customer) {
      return { canRent: false, reason: 'CUSTOMER_NOT_FOUND' }
    }

    if (customer.is_blacklisted) {
      return { canRent: false, reason: 'CUSTOMER_BLACKLISTED' }
    }

    if (new Date(customer.license_expiry) <= new Date()) {
      return { canRent: false, reason: 'LICENSE_EXPIRED' }
    }

    return { canRent: true }
  }

  // Soft delete customer
  static async deleteCustomer(id: string, userId: string, companyId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    if (customer.deleted_at) {
      throw new Error('CUSTOMER_ALREADY_DELETED')
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { deleted_at: new Date() },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: id,
      oldValues: customer,
      newValues: updatedCustomer,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Customer deleted successfully' }
  }

  // Restore soft-deleted customer
  static async restoreCustomer(id: string, userId: string, companyId: string) {
    const customer = await prisma.customer.findUnique({
      where: { id },
    })

    if (!customer) {
      throw new Error('CUSTOMER_NOT_FOUND')
    }

    if (!customer.deleted_at) {
      throw new Error('CUSTOMER_NOT_DELETED')
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: { deleted_at: null },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'RESTORE',
      entityType: 'Customer',
      entityId: id,
      oldValues: customer,
      newValues: updatedCustomer,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Customer restored successfully', customer: updatedCustomer }
  }
}