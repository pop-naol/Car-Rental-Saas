import { Request, Response, NextFunction } from 'express'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 5 * 60 * 1000)

export function rateLimit(options: {
  windowMs: number // Time window in milliseconds
  max: number // Max requests per window
  message?: string
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as identifier
    const identifier = req.ip || req.socket.remoteAddress || 'unknown'
    const key = `${identifier}:${req.path}`
    const now = Date.now()

    // Initialize or get existing entry
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      }
      return next()
    }

    // Increment count
    store[key].count++

    // Check if limit exceeded
    if (store[key].count > options.max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000)

      res.set('Retry-After', retryAfter.toString())
      res.set('X-RateLimit-Limit', options.max.toString())
      res.set('X-RateLimit-Remaining', '0')
      res.set('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString())

      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests, please try again later',
          retryAfter,
        },
      })
    }

    // Set rate limit headers
    res.set('X-RateLimit-Limit', options.max.toString())
    res.set('X-RateLimit-Remaining', (options.max - store[key].count).toString())
    res.set('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString())

    next()
  }
}

// Preset rate limiters
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many API requests, please try again later',
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  message: 'Too many authentication attempts, please try again later',
})

export const strictLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: 'Too many requests, please slow down',
})

