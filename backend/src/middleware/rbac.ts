import { Request, Response, NextFunction } from 'express'

type Permission = string

// Permission matrix for all roles
export const PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: ['*', 'analytics:global'], // All permissions including global analytics

  COMPANY_MANAGER: [
    'company:read',
    'company:update',
    'branch:*',
    'vehicle:*',
    'booking:*',
    'rental:*',
    'customer:*',
    'driver:*',
    'employee:*',
    'financial:*',
    'reports:*',
    'analytics:read',
    'notification:*',
    'document:*',
  ],

  EMPLOYEE: [
    'booking:read',
    'booking:create',
    'booking:update',
    'rental:read',
    'rental:create',
    'rental:update',
    'customer:read',
    'customer:create',
    'driver:read',
    'vehicle:read',
    'document:read',
    'document:create',
  ],

  DRIVER: [
    'driver:read',
    'booking:read',
    'rental:read',
    'notification:read',
    'profile:read',
    'profile:update',
  ],

  CUSTOMER: ['booking:read', 'booking:create', 'profile:read', 'profile:update'],
}

function hasPermission(role: string, requiredPermission: Permission): boolean {
  const rolePermissions = PERMISSIONS[role] || []

  // Check for wildcard permission
  if (rolePermissions.includes('*')) {
    return true
  }

  // Check for exact permission match
  if (rolePermissions.includes(requiredPermission)) {
    return true
  }

  // Check for wildcard resource permission (e.g., 'vehicle:*')
  const [resource] = requiredPermission.split(':')
  if (rolePermissions.includes(`${resource}:*`)) {
    return true
  }

  return false
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      })
    }

    const { role } = req.user

    // Check if user has at least one of the required permissions
    const hasRequiredPermission = permissions.some(permission =>
      hasPermission(role, permission)
    )

    if (!hasRequiredPermission) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          required: permissions,
        },
      })
    }

    return next()
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient role',
          required: roles,
        },
      })
    }

    return next()
  }
}

