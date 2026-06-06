import {
  listAssistants,
  createAssistant,
  updateAssistant,
} from '../services/assistantService.js'

export async function getAssistants(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await listAssistants({
      userId,
      role,
      doctorIdQuery: req.query.doctor_id,
    })
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function postAssistant(req, res) {
  try {
    const { name, email, password, phone, doctor_id, clinic_id } = req.body
    const data = await createAssistant({
      name,
      email,
      password,
      phone,
      doctorId: doctor_id,
      clinicId: clinic_id,
    })
    return res.status(201).json({
      success: true,
      message: 'Assistant account created',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function patchAssistant(req, res) {
  try {
    const { doctor_id, clinic_id, name, phone, is_active } = req.body
    const data = await updateAssistant({
      assistantUserId: req.params.id,
      doctorId: doctor_id,
      clinicId: clinic_id,
      name,
      phone,
      isActive: is_active,
    })
    return res.json({
      success: true,
      message: 'Assistant updated',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}
