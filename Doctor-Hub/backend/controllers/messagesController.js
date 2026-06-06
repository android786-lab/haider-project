import { listThreadMessages, listThreads, sendMessage } from '../services/messageService.js'

export async function getMessages(req, res) {
  try {
    const { userId, role } = req.auth
    const { patient_id, doctor_id } = req.query

    if (patient_id && doctor_id) {
      const data = await listThreadMessages({
        userId,
        role,
        patientId: patient_id,
        doctorId: doctor_id,
      })
      return res.json({ success: true, data })
    }

    const threads = await listThreads({ userId, role })
    return res.json({ success: true, data: threads, threads: true })
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message })
  }
}

export async function postMessage(req, res) {
  try {
    const { userId, role } = req.auth
    const { patient_id, doctor_id, body, appointment_id } = req.body

    const data = await sendMessage({
      userId,
      role,
      patientId: patient_id,
      doctorId: doctor_id,
      body,
      appointmentId: appointment_id,
    })

    return res.status(201).json({
      success: true,
      message: 'Message sent',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
