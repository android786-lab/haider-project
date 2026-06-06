import express from 'express'
import { param, body } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { postVideoRoom, getVideoRoomHandler } from '../controllers/consultationsController.js'

const consultationsRouter = express.Router()

consultationsRouter.use(authenticate)
consultationsRouter.use(authorizeRoles('patient', 'doctor'))

consultationsRouter.get(
  '/:appointmentId/video-room',
  [param('appointmentId').isUUID()],
  validate,
  getVideoRoomHandler
)

consultationsRouter.post(
  '/:appointmentId/video-room',
  [
    param('appointmentId').isUUID(),
    body('display_name').optional().trim().isLength({ max: 80 }),
  ],
  validate,
  postVideoRoom
)

export default consultationsRouter
