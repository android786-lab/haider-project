import express from 'express'
import { body, param, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  getPrescriptions,
  createPrescription,
  downloadPrescriptionPdf,
} from '../controllers/prescriptionsController.js'

const prescriptionsRouter = express.Router()

prescriptionsRouter.use(authenticate)

prescriptionsRouter.get(
  '/:id/pdf',
  authorizeRoles('patient', 'doctor', 'admin', 'super_admin'),
  [param('id').isUUID()],
  validate,
  downloadPrescriptionPdf
)

prescriptionsRouter.get(
  '/',
  authorizeRoles('patient', 'doctor', 'admin', 'super_admin'),
  [query('patient_id').optional().isUUID()],
  validate,
  getPrescriptions
)

prescriptionsRouter.post(
  '/',
  authorizeRoles('doctor'),
  [
    body('patient_id').isUUID(),
    body('appointment_id').optional().isUUID(),
    body('notes').optional().isString(),
    body('medicines').exists(),
  ],
  validate,
  createPrescription
)

export default prescriptionsRouter
