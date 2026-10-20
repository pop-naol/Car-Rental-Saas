import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { tenantContext } from '../lib/prisma'

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
        },
      })
    }

    const token = authHeader.substring(7)
    const payload = verifyToken(token)

    req.user = payload

    // Set tenant context for Prisma middleware
    return tenantContext.run(
      {
        companyId: payload.companyId,
        userId: payload.userId,
        role: payload.role,
      },
      () => {
        next()
      }
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'TOKEN_EXPIRED') {
        return res.status(401).json({
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Access token has expired',
          },
        })
      }
    }

    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid access token',
      },
    })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next()
  }

  try {
    const token = authHeader.substring(7)
    const payload = verifyToken(token)
    req.user = payload

    return tenantContext.run(
      {
        companyId: payload.companyId,
        userId: payload.userId,
        role: payload.role,
      },
      () => {
        next()
      }
    )
  } catch {
    // Invalid token, but continue without auth
    return next()
  }
}

