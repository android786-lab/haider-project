import express from 'express'
import { body } from 'express-validator'
import { validate } from '../middlewares/validate.js'
import { predict } from '../controllers/aiController.js'

const aiRouter = express.Router()

aiRouter.post(
  '/predict',
  [
    body('symptoms').trim().isLength({ min: 3, max: 2000 }),
    body('age').optional().isInt({ min: 1, max: 120 }),
    body('duration_days').optional().isInt({ min: 0, max: 3650 }),
  ],
  validate,
  predict
)

export default aiRouter
