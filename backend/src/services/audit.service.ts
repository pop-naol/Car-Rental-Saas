import prisma from '../lib/prisma'
import { Request } from 'express'
import { Prisma } from '@prisma/client'

interface AuditLogData {
  userId: string
  companyId?: string
  action: string
  entityType: string
  entityId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  ipAddress: string
  userAgent: string
}

export class AuditService {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          user_id: data.userId,
          company_id: data.companyId,
          action: data.action,
          entity_type: data.entityType,
          entity_id: data.entityId,
          old_values: data.oldValues ?? Prisma.JsonNull,
          new_values: data.newValues ?? Prisma.JsonNull,
          ip_address: data.ipAddress,
          user_agent: data.userAgent,
        },
      })
    } catch (error) {
      // Log error but don't fail the request
      console.error('Failed to create audit log:', error)
    }
  }

  static async logFromRequest(
    req: Request,
    action: string,
    entityType: string,
    entityId: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>
  ): Promise<void> {
    if (!req.user) return

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'

    const userAgent = req.headers['user-agent'] || 'unknown'

    await this.log({
      userId: req.user.userId,
      companyId: req.user.companyId,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
    })
  }

  static async logLogin(
    userId: string,
    email: string,
    success: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        entity_type: 'User',
        entity_id: userId,
        new_values: { email },
        ip_address: ipAddress,
        user_agent: userAgent,
      },
    })
  }
}
