/**
 * patientsController.js
 * GET /api/doctor/patients — list unique patients who have visited this doctor.
 */
import { requireSupabase } from '../config/supabaseClient.js'

export async function getDoctorPatients(req, res) {
  try {
    const supabase = requireSupabase()
    const doctorId = req.user?.id || req.auth?.userId

    // Get all appointments for this doctor with patient snapshots
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('patient_id, patient_snapshot, status, slot_date, slot_time, amount')
      .eq('doctor_id', doctorId)
      .order('slot_date', { ascending: false })

    if (error) throw error

    // Deduplicate by patient_id, keep latest visit info
    const patientMap = new Map()
    for (const appt of appointments || []) {
      if (!patientMap.has(appt.patient_id)) {
        const snap = appt.patient_snapshot || {}
        patientMap.set(appt.patient_id, {
          patient_id: appt.patient_id,
          name: snap.name || 'Unknown',
          email: snap.email || '',
          image: snap.image || '',
          phone: snap.phone || '',
          gender: snap.gender || '',
          dob: snap.dob || '',
          last_visit: appt.slot_date,
          last_status: appt.status,
          total_appointments: 1,
        })
      } else {
        patientMap.get(appt.patient_id).total_appointments += 1
      }
    }

    const patients = Array.from(patientMap.values())
    return res.json({ success: true, data: patients, total: patients.length })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
