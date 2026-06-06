import jwt from 'jsonwebtoken'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' })
  }

  const token = authHeader.slice('Bearer '.length)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.auth = { userId: decoded.userId, role: decoded.role }
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    const role = req.auth?.role
    if (!role) return res.status(401).json({ success: false, message: 'Not authenticated' })
    if (!roles.includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    return next()
  }
}

