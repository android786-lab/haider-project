import express from 'express'

import cors from 'cors'

import 'dotenv/config'

import connectCloudinary from './config/cloudinary.js'

import { validateEnv } from './config/envValidate.js'

import {

  helmetMiddleware,

  buildCorsOptions,

  apiRateLimiter,

  authRateLimiter,

  uploadRateLimiter,

  aiRateLimiter,

  notificationRateLimiter,

} from './config/security.js'

import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js'

import adminRouter from './routes/adminRoute.js'

import doctorRouter from './routes/doctorRoute.js'

import userRouter from './routes/userRoute.js'

import healthRouter from './routes/healthRoute.js'

import authRouter from './routes/authRoute.js'

import doctorsRouter from './routes/doctorsRoute.js'

import clinicsRouter from './routes/clinicsRoute.js'

import appointmentsRouter from './routes/appointmentsRoute.js'

import paymentsRouter from './routes/paymentsRoute.js'

import historyRouter from './routes/historyRoute.js'

import prescriptionsRouter from './routes/prescriptionsRoute.js'

import dashboardRouter from './routes/dashboardRoute.js'

import assistantsRouter from './routes/assistantsRoute.js'

import messagesRouter from './routes/messagesRoute.js'
import aiRouter from './routes/aiRoute.js'
import consultationsRouter from './routes/consultationsRoute.js'
import notificationsRouter from './routes/notificationsRoute.js'
import patientRouter from './routes/patientRoute.js'
import assistantRouter from './routes/assistantRoute.js'
import { adminNewRouter, superAdminRouter } from './routes/adminNewRoute.js'
import doctorMedicalRouter from './routes/doctorMedicalRoute.js'



try {

  validateEnv()

} catch (err) {

  console.error(err.message)

  if (process.env.NODE_ENV === 'production') process.exit(1)

}



const app = express()

const port = process.env.PORT || 4000



if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') {

  app.set('trust proxy', 1)

}



try {

  connectCloudinary()

} catch (err) {

  console.error('Cloudinary init failed:', err.message)

}



app.use(helmetMiddleware)

app.use(cors(buildCorsOptions()))

app.use(express.json({ limit: '1mb' }))

app.use(express.urlencoded({ extended: true, limit: '1mb' }))



app.use('/health', healthRouter)



app.use('/api/auth', authRateLimiter, authRouter)

app.use('/api/payments', uploadRateLimiter, paymentsRouter)

app.use('/api/history', uploadRateLimiter, historyRouter)



app.use('/api', apiRateLimiter)

app.use('/api/admin', adminRouter)

app.use('/api/doctor', doctorRouter)

app.use('/api/user', userRouter)

app.use('/api/doctors', doctorsRouter)

app.use('/api/clinics', clinicsRouter)

app.use('/api/appointments', appointmentsRouter)

app.use('/api/prescriptions', prescriptionsRouter)

app.use('/api/dashboard', dashboardRouter)

app.use('/api/assistants', assistantsRouter)

app.use('/api/messages', messagesRouter)
app.use('/api/ai', aiRateLimiter, aiRouter)
app.use('/api/consultations', consultationsRouter)
app.use('/api/notifications', notificationRateLimiter, notificationsRouter)
app.use('/api/patient', patientRouter)
app.use('/api/assistant', assistantRouter)
app.use('/api/admin', adminNewRouter)
app.use('/api/superadmin', superAdminRouter)
app.use('/api/doctor', doctorMedicalRouter)



app.get('/', (_req, res) => res.json({ status: 'ok', message: 'API Working' }))



app.use(notFoundHandler)

app.use(errorHandler)



if (process.env.VERCEL !== '1') {

  app.listen(port, () => console.log(`Server started on PORT:${port}`))

}



export default app


