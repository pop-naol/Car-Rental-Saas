import prisma from '../lib/prisma'
import { AuditService } from './audit.service'

interface CreateBranchInput {
  companyId: string
  name: string
  address: string
  phone: string
  email: string
}

interface UpdateBranchInput {
  name?: string
  address?: string
  phone?: string
  email?: string
  isActive?: boolean
}

export class BranchService {
  static async createBranch(data: CreateBranchInput, userId: string) {
    const branch = await prisma.branch.create({
      data: {
        company_id: data.companyId,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        is_active: true,
      },
    })

    await AuditService.log({
      userId,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'Branch',
      entityId: branch.id,
      newValues: branch,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return branch
  }

  static async getBranches(companyId?: string) {
    return prisma.branch.findMany({
      where: companyId ? { company_id: companyId } : undefined,
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            vehicles: true,
            employees: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getBranchById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        company: true,
        _count: {
          select: {
            vehicles: true,
            employees: true,
          },
        },
      },
    })

    if (!branch) {
      throw new Error('BRANCH_NOT_FOUND')
    }

    return branch
  }

  static async updateBranch(id: string, data: UpdateBranchInput, userId: string, companyId: string) {
    const oldBranch = await prisma.branch.findUnique({ where: { id } })

    if (!oldBranch) {
      throw new Error('BRANCH_NOT_FOUND')
    }

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        is_active: data.isActive,
      },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'UPDATE',
      entityType: 'Branch',
      entityId: branch.id,
      oldValues: oldBranch,
      newValues: branch,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return branch
  }

  static async deleteBranch(id: string, userId: string, companyId: string) {
    const branch = await prisma.branch.findUnique({
      where: { id },
    })

    if (!branch) {
      throw new Error('BRANCH_NOT_FOUND')
    }

    if (branch.company_id !== companyId) {
      throw new Error('FORBIDDEN')
    }

    // Check if branch has active rentals
    const activeRentals = await prisma.rental.count({
      where: {
        vehicle: {
          branch_id: id,
        },
        status: 'ACTIVE',
      },
    })

    if (activeRentals > 0) {
      throw new Error('BRANCH_HAS_ACTIVE_RENTALS')
    }

    const vehicleCount = await prisma.vehicle.count({
      where: { branch_id: id },
    })
    const employeeCount = await prisma.user.count({
      where: { branch_id: id },
    })

    if (vehicleCount > 0 || employeeCount > 0) {
      throw new Error('BRANCH_HAS_DEPENDENCIES')
    }

    const deletedBranch = await prisma.branch.delete({
      where: { id: branch.id },
    })

    await AuditService.log({
      userId,
      companyId,
      action: 'DELETE',
      entityType: 'Branch',
      entityId: deletedBranch.id,
      oldValues: branch,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return deletedBranch
  }
}
