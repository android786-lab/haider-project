import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { requireSupabase } from '../config/supabaseClient.js'
import { fetchDoctors } from '../services/doctorService.js'
import { listAppointmentsForUser } from '../services/appointmentService.js'

// Doctor login
const loginDoctor = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const { email, password } = req.body

        // Look up user by email with doctor role
        const { data: user, error: userErr } = await supabase
            .from('users').select('id, password_hash, role, is_active').eq('email', email).single()

        if (userErr || !user || user.role !== 'doctor' || !user.is_active) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, user.password_hash)
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' })
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET)
        res.json({ success: true, token })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get doctor's appointments (enriched with patient/doctor snapshots)
const appointmentsDoctor = async (req, res) => {
    try {
        const docId = req.user.id
        const appointments = await listAppointmentsForUser({ userId: docId, role: 'doctor' })
        res.json({ success: true, appointments, data: appointments })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Cancel appointment (doctor)
const appointmentCancel = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const docId = req.user.id
        const { appointmentId } = req.body

        const { data: appointment, error: fetchErr } = await supabase
            .from('appointments').select('*').eq('id', appointmentId).single()
        if (fetchErr || !appointment || appointment.doctor_id !== docId) {
            return res.status(403).json({ success: false, message: 'Invalid doctor or appointment' })
        }

        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
        res.json({ success: true, message: 'Appointment Cancelled' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Complete appointment
const appointmentComplete = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const docId = req.user.id
        const { appointmentId } = req.body

        const { data: appointment, error: fetchErr } = await supabase
            .from('appointments').select('*').eq('id', appointmentId).single()
        if (fetchErr || !appointment || appointment.doctor_id !== docId) {
            return res.status(403).json({ success: false, message: 'Invalid doctor or appointment' })
        }

        await supabase.from('appointments').update({ status: 'completed' }).eq('id', appointmentId)
        res.json({ success: true, message: 'Appointment Completed' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// List all doctors (public) — legacy route; uses Doctor Hub schema
const doctorList = async (req, res) => {
    try {
        const doctors = await fetchDoctors({
            disease: req.query.disease,
            treatment_type: req.query.treatment_type,
            available: req.query.available,
            q: req.query.q,
        })
        res.json({ success: true, doctors, data: doctors })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Toggle availability
const changeAvailability = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const { docId } = req.body
        if (!docId) return res.status(400).json({ success: false, message: 'Doctor ID missing' })

        const { data: doctor, error: fetchErr } = await supabase
            .from('doctors').select('available').eq('user_id', docId).single()
        if (fetchErr || !doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

        await supabase.from('doctors').update({ available: !doctor.available }).eq('user_id', docId)
        res.json({ success: true, message: 'Availability changed successfully' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Get doctor profile
const doctorProfile = async (req, res) => {
    try {
        const { fetchDoctorById } = await import('../services/doctorService.js')
        const docId = req.user.id
        const profile = await fetchDoctorById(docId)
        res.json({ success: true, profileData: profile })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Update doctor profile
const updateDoctorProfile = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const docId = req.user.id
        const { fees, address, available, about } = req.body

        const { error } = await supabase
            .from('doctors').update({ fees, address, available, about }).eq('user_id', docId)
        if (error) throw error
        res.json({ success: true, message: 'Profile Updated' })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

// Doctor dashboard
const doctorDashboard = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const docId = req.user.id
        const { data: appointments, error } = await supabase
            .from('appointments').select('*').eq('doctor_id', docId)
        if (error) throw error

        let earnings = 0
        const patientSet = new Set()
        appointments.forEach(a => {
            if (a.status === 'completed') earnings += (a.amount || 0)
            patientSet.add(a.patient_id)
        })

        const today = new Date().toISOString().slice(0, 10)
        const todayAppointments = appointments.filter((a) => a.slot_date === today).length
        const pendingPayments = appointments.filter((a) =>
          ['payment_pending', 'payment_submitted'].includes(a.status)
        ).length

        const stats = {
          totalAppointments: appointments.length,
          todayAppointments,
          totalPatients: patientSet.size,
          pendingPayments,
          earnings,
        }

        res.json({
            success: true,
            stats,
            dashData: {
                earnings,
                appointments: appointments.length,
                patients: patientSet.size,
                latestAppointments: [...appointments].reverse().slice(0, 5)
            }
        })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

export {
    loginDoctor, appointmentsDoctor, appointmentCancel, appointmentComplete,
    doctorList, changeAvailability, doctorProfile, updateDoctorProfile, doctorDashboard
}
