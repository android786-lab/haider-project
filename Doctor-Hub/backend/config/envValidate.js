const INSECURE_JWT_PLACEHOLDERS = [
  'change_me',
  'your_jwt_secret',
  'secret',
  'jwt_secret',
]

export function validateEnv() {
  const isProd = process.env.NODE_ENV === 'production'
  const warnings = []
  const errors = []

  if (!process.env.JWT_SECRET) {
    errors.push('JWT_SECRET is required')
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters')
  } else if (
    isProd &&
    INSECURE_JWT_PLACEHOLDERS.some((p) =>
      process.env.JWT_SECRET.toLowerCase().includes(p)
    )
  ) {
    errors.push('JWT_SECRET looks like a placeholder — set a strong random value')
  }

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    errors.push('SUPABASE_URL and SUPABASE_KEY are required')
  }

  const corsOrigins = getCorsOrigins()
  if (isProd && corsOrigins.length === 0) {
    warnings.push(
      'CORS_ORIGINS (or FRONTEND_URL + ADMIN_URL) not set — browser clients may be blocked'
    )
  }

  for (const w of warnings) console.warn(`[env] ${w}`)
  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`)
  }
}

export function getCorsOrigins() {
  if (process.env.CORS_ORIGINS) {
    return process.env.CORS_ORIGINS.split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  return [process.env.FRONTEND_URL, process.env.ADMIN_URL].filter(Boolean)
}
