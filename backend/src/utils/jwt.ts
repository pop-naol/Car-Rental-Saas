import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { config } from '../config'

export interface TokenPayload {
  userId: string
  companyId?: string
  role: string
  email: string
}

export function generateAccessToken(payload: TokenPayload): string {
  const expiresIn = config.jwt.accessExpiry as SignOptions['expiresIn']
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn,
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  const expiresIn = config.jwt.refreshExpiry as SignOptions['expiresIn']
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn,
  })
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwt.secret) as TokenPayload
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('TOKEN_EXPIRED')
    }
    throw new Error('INVALID_TOKEN')
  }
}
