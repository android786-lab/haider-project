import express from 'express'
import { query } from 'express-validator'
import { listDoctors, getDoctor, getDoctorSchedules } from '../controllers/doctorsController.js'
import { validate } from '../middlewares/validate.js'

const doctorsRouter = express.Router()

doctorsRouter.get(
  '/',
  [
    query('treatment_type').optional().isIn(['allopathic', 'homeopathic', 'herbal']),
    query('available').optional().isIn(['true', 'false']),
    query('disease').optional().isString(),
    query('q').optional().isString(),
  ],
  validate,
  listDoctors
)

doctorsRouter.get('/:id/schedules', getDoctorSchedules)
doctorsRouter.get('/:id', getDoctor)

export default doctorsRouter
