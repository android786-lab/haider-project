import express from 'express'
import { body, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { postWhatsApp, getWhatsAppLog } from '../controllers/notificationsController.js'

const notificationsRouter = express.Router()

notificationsRouter.use(authenticate)

notificationsRouter.get(
  '/whatsapp',
  authorizeRoles('assistant', 'admin', 'super_admin'),
  [query('appointment_id').optional().isUUID(), query('limit').optional().isInt({ min: 1, max: 100 })],
  validate,
  getWhatsAppLog
)

notificationsRouter.post(
  '/whatsapp',
  authorizeRoles('assistant', 'admin', 'super_admin'),
  [
    body('phone').optional().isString(),
    body('message').optional().trim().isLength({ max: 1600 }),
    body('appointment_id').optional().isUUID(),
    body('template').optional().isString(),
  ],
  validate,
  postWhatsApp
)

export default notificationsRouter
