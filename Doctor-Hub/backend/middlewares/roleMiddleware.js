/**
 * roleMiddleware.js
 * Role-based access control — must be used AFTER authMiddleware.
 *
 * Usage:
 *   router.get('/admin-only', authMiddleware, roleMiddleware('admin', 'super_admin'), handler)
 *
 * Valid roles: patient | doctor | assistant | admin | super_admin
 */
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    const role = req.user?.role || req.auth?.role
    if (!role) {
      return res.status(401).json({ success: false, message: 'Not authenticated' })
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
      })
    }
    return next()
  }
}

export default roleMiddleware
