import { requireSupabase } from '../config/supabaseClient.js'
import { fetchDoctorById, fetchDoctors } from '../services/doctorService.js'

export async function listDoctors(req, res) {
  try {
    const { disease, treatment_type, available, q } = req.query
    const doctors = await fetchDoctors({ disease, treatment_type, available, q })
    return res.json({ success: true, data: doctors, doctors }) // doctors key for legacy UI
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function getDoctor(req, res) {
  try {
    const doctor = await fetchDoctorById(req.params.id)
    return res.json({ success: true, data: doctor })
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }
}

export async function getDoctorSchedules(req, res) {
  try {
    const doctor = await fetchDoctorById(req.params.id)
    const activeClinics = (doctor.clinics || []).filter((c) => c.is_active !== false)

    return res.json({
      success: true,
      data: {
        doctor_id: doctor.id,
        slots_booked: doctor.slots_booked,
        clinics: activeClinics,
        // Default weekly hours if clinic schedule empty (10:00–21:00)
        default_hours: { start: '10:00', end: '21:00', slot_minutes: 30 },
      },
    })
  } catch (err) {
    return res.status(404).json({ success: false, message: 'Doctor not found' })
  }
}
