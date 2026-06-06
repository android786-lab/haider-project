/**
 * authMiddleware.js
 * JWT verification — attaches req.user = { id, role } to every protected request.
 * Named per project spec; delegates to the shared authenticate() in auth.js.
 */
import jwt from 'jsonwebtoken'

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authorization token missing' })
  }

  const token = authHeader.slice('Bearer '.length)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    // Attach as req.user (spec) AND req.auth (existing code compatibility)
    req.user = { id: decoded.userId, role: decoded.role }
    req.auth = { userId: decoded.userId, role: decoded.role }
    return next()
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' })
  }
}

export default authMiddleware
