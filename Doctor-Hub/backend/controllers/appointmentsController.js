import {
  cancelAppointment,
  createAppointment,
  getAppointmentById,
  listAppointmentsForUser,
  updateAppointmentStatus,
} from '../services/appointmentService.js'
import { triggerAppointmentNotification } from '../services/whatsappService.js'
import { listLiveAppointmentsForUser } from '../services/appointmentLiveService.js'

export async function bookAppointment(req, res) {
  try {
    const { userId, role } = req.auth
    if (role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Only patients can book appointments' })
    }

    const { doctor_id, slot_date, slot_time, clinic_id } = req.body
    const data = await createAppointment({
      patientId: userId,
      doctorId: doctor_id,
      slotDate: slot_date,
      slotTime: slot_time,
      clinicId: clinic_id,
    })

    triggerAppointmentNotification({
      appointmentId: data.id,
      template: 'appointment_booked',
    })

    return res.status(201).json({
      success: true,
      message: 'Appointment booked. Upload payment proof to continue.',
      data,
      appointment: data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function getLiveAppointments(req, res) {
  try {
    const { userId, role } = req.auth
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }
    const data = await listLiveAppointmentsForUser({ userId, role })
    const live = data.filter((a) => a.isLive)
    return res.json({ success: true, data, appointments: data, live })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function listAppointments(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await listAppointmentsForUser({ userId, role })
    return res.json({ success: true, data, appointments: data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function getAppointment(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await getAppointmentById(req.params.id)

    const allowed =
      role === 'admin' ||
      role === 'super_admin' ||
      (role === 'patient' && data.patient_id === userId) ||
      (role === 'doctor' && data.doctor_id === userId) ||
      role === 'assistant'

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Forbidden' })
    }

    return res.json({ success: true, data })
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Appointment not found' })
  }
}

export async function patchAppointmentStatus(req, res) {
  try {
    const { userId, role } = req.auth
    const { status } = req.body

    const data = await updateAppointmentStatus({
      appointmentId: req.params.id,
      userId,
      role,
      status,
    })

    return res.json({ success: true, message: 'Status updated', data })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function cancelAppointmentHandler(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await cancelAppointment({
      appointmentId: req.params.id,
      userId,
      role,
    })
    return res.json({ success: true, message: 'Appointment cancelled', data })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
