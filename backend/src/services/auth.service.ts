import prisma from '../lib/prisma'
import { hashPassword, verifyPassword } from '../utils/password'
import { generateAccessToken, generateRefreshToken } from '../utils/jwt'
import { AuditService } from './audit.service'

interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'COMPANY_MANAGER' | 'EMPLOYEE' | 'DRIVER' | 'CUSTOMER'
  companyId?: string
  branchId?: string
}

interface LoginInput {
  email: string
  password: string
  ipAddress: string
  userAgent: string
}

export class AuthService {
  static async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      throw new Error('USER_ALREADY_EXISTS')
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        first_name: data.firstName,
        last_name: data.lastName,
        role: data.role,
        company_id: data.companyId,
        branch_id: data.branchId,
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        company_id: true,
        branch_id: true,
        created_at: true,
      },
    })

    return user
  }

  static async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        company: true,
      },
    })

    if (!user) {
      // Log failed login attempt
      await AuditService.logLogin('unknown', data.email, false, data.ipAddress, data.userAgent)
      throw new Error('INVALID_CREDENTIALS')
    }

    // Check if company is active (for non-super-admins)
    if (user.role !== 'SUPER_ADMIN' && user.company && !user.company.is_active) {
      throw new Error('COMPANY_SUSPENDED')
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('USER_INACTIVE')
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, user.password)

    if (!isValidPassword) {
      // Log failed login attempt
      await AuditService.logLogin(user.id, data.email, false, data.ipAddress, data.userAgent)
      throw new Error('INVALID_CREDENTIALS')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { last_login: new Date() },
    })

    // Log successful login
    await AuditService.logLogin(user.id, data.email, true, data.ipAddress, data.userAgent)

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      companyId: user.company_id || undefined,
      role: user.role,
      email: user.email,
    }

    const accessToken = generateAccessToken(tokenPayload)
    const refreshToken = generateRefreshToken(tokenPayload)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        branchId: user.branch_id,
      },
      accessToken,
      refreshToken,
    }
  }
}
