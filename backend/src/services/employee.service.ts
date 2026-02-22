import prisma from '../lib/prisma'
import { hashPassword } from '../utils/password'
import { AuditService } from './audit.service'

interface CreateEmployeeInput {
  companyId: string
  branchId?: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'EMPLOYEE' | 'COMPANY_MANAGER'
}

interface UpdateEmployeeInput {
  branchId?: string
  firstName?: string
  lastName?: string
  role?: 'EMPLOYEE' | 'COMPANY_MANAGER'
}

export class EmployeeService {
  static async createEmployee(data: CreateEmployeeInput, createdBy: string) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error('EMAIL_ALREADY_EXISTS')
    }

    // Prevent privilege escalation - only Super Admin can create Company Managers
    if (data.role === 'COMPANY_MANAGER') {
      const creator = await prisma.user.findUnique({
        where: { id: createdBy },
      })

      if (creator?.role !== 'SUPER_ADMIN') {
        throw new Error('INSUFFICIENT_PRIVILEGES')
      }
    }

    const hashedPassword = await hashPassword(data.password)

    const employee = await prisma.user.create({
      data: {
        company_id: data.companyId,
        branch_id: data.branchId,
        email: data.email,
        password: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
      },
    })

    await AuditService.log({
      userId: createdBy,
      companyId: data.companyId,
      action: 'CREATE',
      entityType: 'User',
      entityId: employee.id,
      newValues: { ...employee, password: '[REDACTED]' },
      ipAddress: 'system',
      userAgent: 'system',
    })

    const { password, ...employeeWithoutPassword } = employee
    return employeeWithoutPassword
  }

  static async getEmployees(companyId?: string, filters?: { branchId?: string; role?: string }) {
    const where: any = {
      company_id: companyId,
      branch_id: filters?.branchId,
      role: {
        in: ['EMPLOYEE', 'COMPANY_MANAGER'],
      },
    }

    if (filters?.role && ['EMPLOYEE', 'COMPANY_MANAGER'].includes(filters.role)) {
      where.role = filters.role
    }

    return prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        branch_id: true,
        is_active: true,
        last_login: true,
        created_at: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    })
  }

  static async getEmployeeById(id: string) {
    const employee = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        company_id: true,
        branch_id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        last_login: true,
        created_at: true,
        updated_at: true,
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!employee) {
      throw new Error('EMPLOYEE_NOT_FOUND')
    }

    return employee
  }

  static async updateEmployee(
    id: string,
    data: UpdateEmployeeInput,
    updatedBy: string,
    companyId: string
  ) {
    const oldEmployee = await prisma.user.findUnique({
      where: { id },
    })

    if (!oldEmployee) {
      throw new Error('EMPLOYEE_NOT_FOUND')
    }

    // Prevent privilege escalation
    if (data.role === 'COMPANY_MANAGER') {
      const updater = await prisma.user.findUnique({
        where: { id: updatedBy },
      })

      if (updater?.role !== 'SUPER_ADMIN') {
        throw new Error('INSUFFICIENT_PRIVILEGES')
      }
    }

    const employee = await prisma.user.update({
      where: { id },
      data: {
        branch_id: data.branchId,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        branch_id: true,
        is_active: true,
      },
    })

    await AuditService.log({
      userId: updatedBy,
      companyId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: employee.id,
      oldValues: { ...oldEmployee, password: '[REDACTED]' },
      newValues: employee,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return employee
  }

  static async activateEmployee(id: string, activatedBy: string, companyId: string) {
    const employee = await prisma.user.update({
      where: { id },
      data: { is_active: true },
    })

    await AuditService.log({
      userId: activatedBy,
      companyId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: employee.id,
      oldValues: { is_active: false },
      newValues: { is_active: true },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Employee activated successfully' }
  }

  static async deactivateEmployee(id: string, deactivatedBy: string, companyId: string) {
    const employee = await prisma.user.update({
      where: { id },
      data: { is_active: false },
    })

    await AuditService.log({
      userId: deactivatedBy,
      companyId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: employee.id,
      oldValues: { is_active: true },
      newValues: { is_active: false },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Employee deactivated successfully' }
  }

  static async resetPassword(id: string, newPassword: string, resetBy: string, companyId: string) {
    const hashedPassword = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    })

    await AuditService.log({
      userId: resetBy,
      companyId,
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      oldValues: { password: '[REDACTED]' },
      newValues: { password: '[REDACTED]' },
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Password reset successfully' }
  }

  static async deleteEmployee(id: string, deletedBy: string, companyId: string) {
    const employee = await prisma.user.findUnique({
      where: { id },
    })

    if (!employee) {
      throw new Error('EMPLOYEE_NOT_FOUND')
    }

    if (employee.company_id !== companyId) {
      throw new Error('FORBIDDEN')
    }

    await prisma.user.update({
      where: { id },
      data: {
        is_active: false,
      },
    })

    await AuditService.log({
      userId: deletedBy,
      companyId,
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      oldValues: employee,
      ipAddress: 'system',
      userAgent: 'system',
    })

    return { message: 'Employee deleted successfully' }
  }
}
