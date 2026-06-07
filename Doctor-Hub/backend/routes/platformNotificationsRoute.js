import express from 'express'
import { param } from 'express-validator'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  getMyNotifications,
  readNotification,
  readAllNotifications,
} from '../controllers/adminApprovalController.js'

const platformNotificationsRouter = express.Router()

platformNotificationsRouter.use(authenticate)

platformNotificationsRouter.get('/', getMyNotifications)

platformNotificationsRouter.patch(
  '/:id/read',
  [param('id').isUUID()],
  validate,
  readNotification
)

platformNotificationsRouter.post('/read-all', readAllNotifications)

export default platformNotificationsRouter
