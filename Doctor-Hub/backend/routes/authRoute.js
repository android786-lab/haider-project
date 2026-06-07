import express from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { forgotPassword, login, me, register, resetPassword } from '../controllers/authController.js'
import { registerAdmin } from '../controllers/adminApprovalController.js'

const authRouter = express.Router()

authRouter.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register
)

authRouter.post(
  '/register-admin',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().isString(),
  ],
  validate,
  registerAdmin
)

authRouter.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
)

authRouter.get('/me', authenticate, me)

authRouter.post(
  '/forgot-password',
  [body('email').trim().isEmail().withMessage('Valid email is required')],
  validate,
  forgotPassword
)

authRouter.post(
  '/reset-password',
  [
    body('token').trim().notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  resetPassword
)

export default authRouter

