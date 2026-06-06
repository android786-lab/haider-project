export function buildMessage(template, ctx) {
  const {
    patientName,
    doctorName,
    slotDate,
    slotTime,
    amount,
    reason,
  } = ctx

  switch (template) {
    case 'appointment_booked':
      return `Doctor Hub: Hi ${patientName}, your appointment with Dr. ${doctorName} on ${slotDate} at ${slotTime} is reserved. Please upload payment proof in the app (fee: ${amount}).`
    case 'payment_submitted':
      return `Doctor Hub: Payment proof received for your appointment with Dr. ${doctorName} on ${slotDate}. An assistant will verify shortly.`
    case 'appointment_confirmed':
      return `Doctor Hub: Your appointment with Dr. ${doctorName} on ${slotDate} at ${slotTime} is confirmed. You can join the video call from My Appointments when ready.`
    case 'payment_rejected':
      return `Doctor Hub: Payment for Dr. ${doctorName} on ${slotDate} was not accepted. Reason: ${reason || 'Please re-upload a clear screenshot.'}`
    case 'appointment_cancelled':
      return `Doctor Hub: Your appointment with Dr. ${doctorName} on ${slotDate} has been cancelled.`
    default:
      return ctx.customMessage || 'Doctor Hub: You have an update on your appointment.'
  }
}

export const ALLOWED_TEMPLATES = [
  'appointment_booked',
  'payment_submitted',
  'appointment_confirmed',
  'payment_rejected',
  'appointment_cancelled',
  'custom',
]
