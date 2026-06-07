import express from 'express'
import { body, param } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  bookAppointment,
  getLiveAppointments,
  listAppointments,
  getAppointment,
  patchAppointmentStatus,
  cancelAppointmentHandler,
} from '../controllers/appointmentsController.js'

const appointmentsRouter = express.Router()

appointmentsRouter.use(authenticate)

appointmentsRouter.post(
  '/',
  authorizeRoles('patient'),
  [
    body('doctor_id').isUUID(),
    body('slot_date').notEmpty(),
    body('slot_time').notEmpty(),
    body('clinic_id').optional({ nullable: true }).isUUID(),
  ],
  validate,
  bookAppointment
)

appointmentsRouter.get(
  '/live',
  authorizeRoles('patient', 'doctor'),
  getLiveAppointments
)

appointmentsRouter.get(
  '/',
  authorizeRoles('patient', 'doctor', 'assistant', 'admin', 'super_admin'),
  listAppointments
)

appointmentsRouter.get(
  '/:id',
  authorizeRoles('patient', 'doctor', 'assistant', 'admin', 'super_admin'),
  [param('id').isUUID()],
  validate,
  getAppointment
)

appointmentsRouter.patch(
  '/:id/status',
  authorizeRoles('assistant', 'doctor', 'admin', 'super_admin'),
  [
    param('id').isUUID(),
    body('status').isIn([
      'payment_pending',
      'payment_submitted',
      'verified',
      'confirmed',
      'rejected',
      'completed',
      'cancelled',
    ]),
  ],
  validate,
  patchAppointmentStatus
)

appointmentsRouter.post(
  '/:id/cancel',
  authorizeRoles('patient', 'doctor', 'admin', 'super_admin'),
  [param('id').isUUID()],
  validate,
  cancelAppointmentHandler
)

export default appointmentsRouter
