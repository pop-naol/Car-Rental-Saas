import { Router, Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { z } from 'zod'

const router = Router()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['SUPER_ADMIN', 'COMPANY_MANAGER', 'EMPLOYEE', 'DRIVER', 'CUSTOMER']),
  companyId: z.string().uuid().optional(),
  branchId: z.string().uuid().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// POST /auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)

    const user = await AuthService.register(data)

    return res.status(201).json({
      message: 'User registered successfully',
      user,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      })
    }

    if (error instanceof Error) {
      if (error.message === 'USER_ALREADY_EXISTS') {
        return res.status(409).json({
          error: {
            code: 'USER_ALREADY_EXISTS',
            message: 'A user with this email already exists',
          },
        })
      }
    }

    console.error('Registration error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
      },
    })
  }
})

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body)

    const ipAddress =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'

    const result = await AuthService.login({
      ...data,
      ipAddress,
      userAgent,
    })

    return res.json(result)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
        },
      })
    }

    if (error instanceof Error) {
      if (error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
          },
        })
      }

      if (error.message === 'COMPANY_SUSPENDED') {
        return res.status(403).json({
          error: {
            code: 'COMPANY_SUSPENDED',
            message: 'Your company account has been suspended',
          },
        })
      }

      if (error.message === 'USER_INACTIVE') {
        return res.status(403).json({
          error: {
            code: 'USER_INACTIVE',
            message: 'Your account has been deactivated',
          },
        })
      }
    }

    console.error('Login error:', error)
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login',
      },
    })
  }
})

export default router

