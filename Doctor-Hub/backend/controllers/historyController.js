import { addHistory, listHistory, uploadHistoryFiles } from '../services/historyService.js'

export async function getHistory(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await listHistory({
      userId,
      role,
      patientIdQuery: req.query.patient_id,
    })
    return res.json({ success: true, data, history: data })
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message })
  }
}

export async function createHistory(req, res) {
  try {
    const { userId, role } = req.auth
    const { title, details, patient_id, doctor_id, appointment_id } = req.body

    let attachmentUrls = []
    if (req.files?.length) {
      attachmentUrls = await uploadHistoryFiles(req.files)
    }

    const data = await addHistory({
      userId,
      role,
      title,
      details,
      patientId: patient_id,
      doctorIdShare: doctor_id,
      appointmentId: appointment_id,
      attachmentUrls,
    })

    return res.status(201).json({
      success: true,
      message: 'Medical history record added (permanent, cannot be edited)',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
