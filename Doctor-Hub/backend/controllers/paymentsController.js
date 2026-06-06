import {
  listPendingPayments,
  rejectPayment,
  submitPayment,
  uploadScreenshot,
  verifyPayment,
} from '../services/paymentService.js'
import { triggerAppointmentNotification } from '../services/whatsappService.js'

export async function createPayment(req, res) {
  try {
    const { userId, role } = req.auth
    if (role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can upload payment proof' })
    }

    const { appointment_id } = req.body
    if (!appointment_id) {
      return res.status(400).json({ success: false, message: 'appointment_id is required' })
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment screenshot is required' })
    }

    const screenshotUrl = await uploadScreenshot(req.file.path)
    const data = await submitPayment({
      appointmentId: appointment_id,
      patientId: userId,
      screenshotUrl,
    })

    return res.status(201).json({
      success: true,
      message: 'Payment proof submitted. Awaiting assistant verification.',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function listPending(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await listPendingPayments({ userId, role })
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function verifyPaymentHandler(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await verifyPayment({ paymentId: req.params.id, verifierId: userId, role })
    if (data?.appointment_id) {
      triggerAppointmentNotification({
        appointmentId: data.appointment_id,
        template: 'appointment_confirmed',
      })
    }
    return res.json({
      success: true,
      message: 'Payment verified and appointment confirmed',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function rejectPaymentHandler(req, res) {
  try {
    const { userId, role } = req.auth
    const { reason } = req.body
    const data = await rejectPayment({
      paymentId: req.params.id,
      verifierId: userId,
      role,
      reason,
    })
    if (data?.appointment_id) {
      triggerAppointmentNotification({
        appointmentId: data.appointment_id,
        template: 'payment_rejected',
        extra: { reason },
      })
    }
    return res.json({
      success: true,
      message: 'Payment rejected. Patient may re-upload proof.',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
