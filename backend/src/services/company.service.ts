import prisma from '../lib/prisma'
import { AuditService } from './audit.service'

interface CreateCompanyInput {
  name: string
  subscriptionTier?: string
}

interface UpdateCompanyInput {
  name?: string
  subscriptionTier?: string
}

export class CompanyService {
  static async createCompany(data: CreateCompanyInput, userId: string) {
    const company = await prisma.company.create({
      data: {
        name: data.name,
        subscription_tier: data.subscriptionTier || 'basic',
        is_active: true,
      },
    })

    await AuditService.log({
      userId,
      companyId: company.id,
      action: 'CREATE',
      entityType: 'Company',
      entityId: company.id,
      newValues: company,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return company
  }

  static async getAllCompanies() {
    return prisma.company.findMany({
      include: {
        _count: {
          select: {
            branches: true,
            users: true,
            vehicles: true,
            customers: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getCompanyById(id: string) {
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        branches: true,
        _count: {
          select: {
            users: true,
            vehicles: true,
            customers: true,
            drivers: true,
          },
        },
      },
    })

    if (!company) {
      throw new Error('COMPANY_NOT_FOUND')
    }

    return company
  }

  static async updateCompany(id: string, data: UpdateCompanyInput, userId: string) {
    const oldCompany = await prisma.company.findUnique({ where: { id } })

    if (!oldCompany) {
      throw new Error('COMPANY_NOT_FOUND')
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        subscription_tier: data.subscriptionTier,
      },
    })

    await AuditService.log({
      userId,
      companyId: company.id,
      action: 'UPDATE',
      entityType: 'Company',
      entityId: company.id,
      oldValues: oldCompany,
      newValues: company,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return company
  }

  static async suspendCompany(id: string, userId: string) {
    const oldCompany = await prisma.company.findUnique({ where: { id } })

    if (!oldCompany) {
      throw new Error('COMPANY_NOT_FOUND')
    }

    const company = await prisma.company.update({
      where: { id },
      data: { is_active: false },
    })

    await AuditService.log({
      userId,
      companyId: company.id,
      action: 'SUSPEND',
      entityType: 'Company',
      entityId: company.id,
      oldValues: { is_active: oldCompany.is_active },
      newValues: { is_active: false },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return company
  }

  static async activateCompany(id: string, userId: string) {
    const oldCompany = await prisma.company.findUnique({ where: { id } })

    if (!oldCompany) {
      throw new Error('COMPANY_NOT_FOUND')
    }

    const company = await prisma.company.update({
      where: { id },
      data: { is_active: true },
    })

    await AuditService.log({
      userId,
      companyId: company.id,
      action: 'ACTIVATE',
      entityType: 'Company',
      entityId: company.id,
      oldValues: { is_active: oldCompany.is_active },
      newValues: { is_active: true },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return company
  }
}
