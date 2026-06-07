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
  createDoctor,
  updateDoctor,
  deleteDoctor,
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
import {
  listPendingAdmins,
  approveAdmin,
  rejectAdmin,
} from '../controllers/adminApprovalController.js'

// ── Admin router ───────────────────────────────────────────
const adminNewRouter = express.Router()
adminNewRouter.use(authenticate)
adminNewRouter.use(authorizeRoles('admin', 'super_admin'))

adminNewRouter.get('/doctors', listDoctorsAdmin)

adminNewRouter.post(
  '/doctors',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('speciality').optional().isString(),
    body('degree').optional().isString(),
    body('experience').optional().isString(),
    body('about').optional().isString(),
    body('fees').optional().isNumeric(),
    body('treatment').optional().isIn(['allopathic', 'homeopathic', 'herbal']),
    body('phone').optional().isString(),
  ],
  validate,
  createDoctor
)

adminNewRouter.put(
  '/doctors/:id',
  [param('id').isUUID()],
  validate,
  updateDoctor
)

adminNewRouter.delete(
  '/doctors/:id',
  [param('id').isUUID()],
  validate,
  deleteDoctor
)

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

superAdminRouter.get('/admin-requests', listPendingAdmins)

superAdminRouter.put(
  '/admin-requests/:id/approve',
  [param('id').isUUID()],
  validate,
  approveAdmin
)

superAdminRouter.put(
  '/admin-requests/:id/reject',
  [param('id').isUUID(), body('reason').optional().isString()],
  validate,
  rejectAdmin
)

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
