import {
  addPrescription,
  getPrescriptionById,
  listPrescriptions,
} from '../services/prescriptionService.js'
import { buildPrescriptionPdf } from '../services/prescriptionPdfService.js'

export async function getPrescriptions(req, res) {
  try {
    const { userId, role } = req.auth
    const data = await listPrescriptions({
      userId,
      role,
      patientIdQuery: req.query.patient_id,
    })
    return res.json({ success: true, data, prescriptions: data })
  } catch (err) {
    return res.status(403).json({ success: false, message: err.message })
  }
}

export async function createPrescription(req, res) {
  try {
    const { userId, role } = req.auth
    if (role !== 'doctor') {
      return res.status(403).json({ success: false, message: 'Only doctors can add prescriptions' })
    }

    let medicines = req.body.medicines
    if (typeof medicines === 'string') {
      medicines = JSON.parse(medicines)
    }

    const data = await addPrescription({
      doctorId: userId,
      patientId: req.body.patient_id,
      appointmentId: req.body.appointment_id,
      medicines,
      notes: req.body.notes,
    })

    return res.status(201).json({
      success: true,
      message: 'Prescription saved permanently (cannot be edited or removed by patient)',
      data,
    })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function downloadPrescriptionPdf(req, res) {
  try {
    const { userId, role } = req.auth
    const prescription = await getPrescriptionById({
      id: req.params.id,
      userId,
      role,
    })

    const pdfBuffer = await buildPrescriptionPdf(prescription)
    const filename = `doctorhub-prescription-${req.params.id.slice(0, 8)}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    return res.send(pdfBuffer)
  } catch (err) {
    const status = err.message === 'Forbidden' ? 403 : err.message === 'Prescription not found' ? 404 : 400
    return res.status(status).json({ success: false, message: err.message })
  }
}
