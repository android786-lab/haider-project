import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { getCorsOrigins } from './envValidate.js'

const isProd = process.env.NODE_ENV === 'production'

export const helmetMiddleware = helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: isProd ? undefined : false,
})

export function buildCorsOptions() {
  const allowed = getCorsOrigins()

  if (!isProd && allowed.length === 0) {
    return { origin: true, credentials: true }
  }

  return {
    origin(origin, callback) {
      if (!origin || allowed.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  }
}

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
})

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 50,   // 10 per 15 min in production (brute-force protection)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again in 15 minutes.' },
  skipSuccessfulRequests: false,
})

export const notificationRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 30 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many notification requests' },
})

export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 15 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests, please try again later' },
})

export const uploadRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 40 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many uploads, please try again later' },
})
