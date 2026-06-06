import express from 'express'
import { body, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { getMessages, postMessage } from '../controllers/messagesController.js'

const messagesRouter = express.Router()

messagesRouter.use(authenticate)
messagesRouter.use(authorizeRoles('patient', 'doctor'))

messagesRouter.get(
  '/',
  [
    query('patient_id').optional().isUUID(),
    query('doctor_id').optional().isUUID(),
  ],
  validate,
  getMessages
)

messagesRouter.post(
  '/',
  [
    body('body').trim().notEmpty().isLength({ max: 4000 }),
    body('patient_id').optional().isUUID(),
    body('doctor_id').optional().isUUID(),
    body('appointment_id').optional().isUUID(),
  ],
  validate,
  postMessage
)

export default messagesRouter
