import express from 'express'
import { body, param, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import {
  getAssistants,
  postAssistant,
  patchAssistant,
} from '../controllers/assistantsController.js'

const assistantsRouter = express.Router()

assistantsRouter.use(authenticate)

assistantsRouter.get(
  '/',
  authorizeRoles('admin', 'super_admin', 'doctor'),
  [query('doctor_id').optional().isUUID()],
  validate,
  getAssistants
)

assistantsRouter.post(
  '/',
  authorizeRoles('admin', 'super_admin'),
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('phone').optional().isString(),
    body('doctor_id').optional({ nullable: true }).isUUID(),
    body('clinic_id').optional({ nullable: true }).isUUID(),
  ],
  validate,
  postAssistant
)

assistantsRouter.patch(
  '/:id',
  authorizeRoles('admin', 'super_admin'),
  [
    param('id').isUUID(),
    body('name').optional().trim().notEmpty(),
    body('phone').optional().isString(),
    body('is_active').optional().isBoolean(),
    body('doctor_id').optional({ nullable: true }).isUUID(),
    body('clinic_id').optional({ nullable: true }).isUUID(),
  ],
  validate,
  patchAssistant
)

export default assistantsRouter
