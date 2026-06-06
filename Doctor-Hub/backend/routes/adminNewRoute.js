/**
 * adminNewRoute.js
 * JWT-based admin + superadmin routes (replaces legacy env-based adminRoute).
 *
 * Admin:
 *   GET  /api/admin/doctors
 *   PUT  /api/admin/doctors/:id/verify
 *   PUT  /api/admin/doctors/:id/unverify
 *   GET  /api/admin/patients
 *   GET  /api/admin/appointments   ?status= &date= &doctor_id= &patient_id=
 *   GET  /api/admin/payments       ?status=
 *   GET  /api/admin/analytics
 *
 * Super Admin only:
 *   GET    /api/superadmin/admins
 *   POST   /api/superadmin/admins
 *   DELETE /api/superadmin/users/:id
 */
import express from 'express'
import { body, param, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  listDoctorsAdmin,
  verifyDoctor,
  unverifyDoctor,
  listPatients,
  listAppointmentsAdmin,
  listPaymentsAdmin,
  getAnalytics,
  listAdmins,
  listUsers,
  promoteToAdmin,
  demoteAdmin,
  deleteUser,
} from '../controllers/adminNewController.js'

// ── Admin router ───────────────────────────────────────────
const adminNewRouter = express.Router()
adminNewRouter.use(authenticate)
adminNewRouter.use(authorizeRoles('admin', 'super_admin'))

adminNewRouter.get('/doctors', listDoctorsAdmin)

adminNewRouter.put(
  '/doctors/:id/verify',
  [param('id').isUUID()],
  validate,
  verifyDoctor
)

adminNewRouter.put(
  '/doctors/:id/unverify',
  [param('id').isUUID()],
  validate,
  unverifyDoctor
)

adminNewRouter.get(
  '/patients',
  [query('q').optional().isString()],
  validate,
  listPatients
)

adminNewRouter.get(
  '/appointments',
  [
    query('status').optional().isString(),
    query('date').optional().isString(),
    query('doctor_id').optional().isUUID(),
    query('patient_id').optional().isUUID(),
  ],
  validate,
  listAppointmentsAdmin
)

adminNewRouter.get(
  '/payments',
  [query('status').optional().isIn(['submitted', 'verified', 'rejected'])],
  validate,
  listPaymentsAdmin
)

adminNewRouter.get('/analytics', getAnalytics)

// ── Super Admin router ─────────────────────────────────────
const superAdminRouter = express.Router()
superAdminRouter.use(authenticate)
superAdminRouter.use(authorizeRoles('super_admin'))

superAdminRouter.get('/admins', listAdmins)
superAdminRouter.get('/users', listUsers)

superAdminRouter.post(
  '/admins',
  [
    body('user_id').optional().isUUID().withMessage('user_id must be a valid UUID'),
    body('email').optional().isEmail(),
    body('role').optional().isIn(['admin', 'super_admin', 'superadmin']),
  ],
  validate,
  promoteToAdmin
)

superAdminRouter.put(
  '/admins/:id/demote',
  [param('id').isUUID()],
  validate,
  demoteAdmin
)

superAdminRouter.delete(
  '/users/:id',
  [param('id').isUUID()],
  validate,
  deleteUser
)

export { adminNewRouter, superAdminRouter }
