import express from 'express'
import { authenticate } from '../middlewares/auth.js'
import { fetchDashboard } from '../controllers/dashboardController.js'

const dashboardRouter = express.Router()

dashboardRouter.get('/', authenticate, fetchDashboard)

export default dashboardRouter
