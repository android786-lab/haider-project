import {
  sendManualNotification,
  listNotifications,
} from '../services/whatsappService.js'

export async function postWhatsApp(req, res) {
  try {
    const { phone, message, appointment_id, template } = req.body
    const data = await sendManualNotification({
      phone,
      message,
      appointmentId: appointment_id,
      template,
      userId: req.auth.userId,
    })
    return res.status(201).json({
      success: true,
      message: data.demo_mode
        ? 'Notification logged (demo mode — configure Twilio to send real WhatsApp messages)'
        : data.status === 'sent'
          ? 'WhatsApp message sent'
          : 'Notification recorded with errors',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function getWhatsAppLog(req, res) {
  try {
    const data = await listNotifications({
      appointmentId: req.query.appointment_id,
      limit: Number(req.query.limit) || 50,
    })
    return res.json({ success: true, data })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
