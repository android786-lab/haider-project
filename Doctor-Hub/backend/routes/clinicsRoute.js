import express from 'express'
import { body, query } from 'express-validator'
import { authenticate, authorizeRoles } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { listClinics, getClinic, createClinic, updateClinic } from '../controllers/clinicsController.js'

const clinicsRouter = express.Router()

clinicsRouter.get(
  '/',
  [query('doctor_id').optional().isUUID(), query('active').optional().isIn(['true', 'false'])],
  validate,
  listClinics
)

clinicsRouter.get('/:id', getClinic)

clinicsRouter.post(
  '/',
  authenticate,
  authorizeRoles('doctor', 'admin', 'super_admin'),
  [
    body('name').trim().notEmpty(),
    body('doctor_id').optional().isUUID(),
    body('address').optional().isObject(),
    body('phone').optional().isString(),
    body('schedule').optional().isObject(),
  ],
  validate,
  createClinic
)

clinicsRouter.patch(
  '/:id',
  authenticate,
  authorizeRoles('doctor', 'admin', 'super_admin'),
  [
    body('name').optional().trim().notEmpty(),
    body('address').optional().isObject(),
    body('phone').optional().isString(),
    body('schedule').optional().isObject(),
    body('is_active').optional().isBoolean(),
  ],
  validate,
  updateClinic
)

export default clinicsRouter
