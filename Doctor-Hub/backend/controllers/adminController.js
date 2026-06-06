import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import validator from 'validator'
import { v2 as cloudinary } from 'cloudinary'
import { requireSupabase } from '../config/supabaseClient.js'

// Admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(email + password, process.env.JWT_SECRET)
            return res.json({ success: true, token })
        }
        res.json({ success: false, message: 'Invalid credentials' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Add doctor
const addDoctor = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const { name, email, password, speciality, degree, experience, about, fees, address, treatment } = req.body
        const imageFile = req.file

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.status(400).json({ success: false, message: 'Missing Details' })
        }
        if (!validator.isEmail(email)) {
            return res.status(400).json({ success: false, message: 'Please enter a valid email' })
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: 'Please enter a strong password' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        let imageUrl = ''
        if (imageFile) {
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
            imageUrl = imageUpload.secure_url
        }

        // 1. Create user record
        const { data: newUser, error: userErr } = await supabase.from('users').insert({
            name,
            email,
            password_hash: hashedPassword,
            role: 'doctor',
            image: imageUrl,
        }).select('id').single()

        if (userErr) throw userErr

        // 2. Create doctor profile linked to user
        const parsedAddress = typeof address === 'string' ? JSON.parse(address) : address
        const { error: docErr } = await supabase.from('doctors').insert({
            user_id: newUser.id,
            treatment: treatment || 'allopathic',
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: parsedAddress,
            available: true,
            slots_booked: {},
        })

        if (docErr) throw docErr
        res.json({ success: true, message: 'Doctor Added' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ success: false, message: error.message })
    }
}

// Cancel appointment (admin)
const appointmentCancel = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const { appointmentId } = req.body

        const { data: appointment, error: fetchErr } = await supabase
            .from('appointments').select('*').eq('id', appointmentId).single()
        if (fetchErr) throw fetchErr

        await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)

        // Release doctor slot
        const { doctor_id, slot_date, slot_time } = appointment
        const { data: doctor, error: docErr } = await supabase
            .from('doctors').select('slots_booked').eq('user_id', doctor_id).single()
        if (docErr) throw docErr

        const slots_booked = doctor.slots_booked || {}
        const dateKey = slot_date
        if (slots_booked[dateKey]) {
            slots_booked[dateKey] = slots_booked[dateKey].filter(t => t !== slot_time)
        }
        await supabase.from('doctors').update({ slots_booked }).eq('user_id', doctor_id)

        res.json({ success: true, message: 'Appointment Cancelled' })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// All doctors
const allDoctors = async (req, res) => {
    try {
        const { fetchDoctors } = await import('../services/doctorService.js')
        const doctors = await fetchDoctors({})
        res.json({ success: true, doctors })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// All appointments
const appointmentsAdmin = async (req, res) => {
    try {
        const supabase = requireSupabase()
        const { data: appointments, error } = await supabase.from('appointments').select('*')
        if (error) throw error
        res.json({ success: true, appointments })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

// Admin dashboard (legacy env login — prefer GET /api/dashboard with JWT admin)
const adminDashboard = async (req, res) => {
    try {
        const { getDashboard } = await import('../services/dashboardService.js')
        const data = await getDashboard({ userId: null, role: 'admin' })
        res.json({
            success: true,
            data,
            dashData: data.dashData,
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export { loginAdmin, addDoctor, allDoctors, appointmentsAdmin, appointmentCancel, adminDashboard }
