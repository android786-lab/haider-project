import express from 'express'
import { body, query } from 'express-validator'
import upload from '../middlewares/multer.js'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { getHistory, createHistory } from '../controllers/historyController.js'

const historyRouter = express.Router()

historyRouter.use(authenticate)

historyRouter.get(
  '/',
  authorizeRoles('patient', 'doctor', 'admin', 'super_admin'),
  [query('patient_id').optional().isUUID()],
  validate,
  getHistory
)

historyRouter.post(
  '/',
  authorizeRoles('patient', 'doctor'),
  upload.array('attachments', 5),
  [
    body('title').trim().notEmpty(),
    body('details').optional().isString(),
    body('patient_id').optional().isUUID(),
    body('doctor_id').optional().isUUID(),
    body('appointment_id').optional().isUUID(),
  ],
  validate,
  createHistory
)

export default historyRouter
