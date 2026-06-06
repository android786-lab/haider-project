import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { requireSupabase } from '../config/supabaseClient.js'

const DEFAULT_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPAAAADwCAYAAAA+VemSAAAACXBIWXMAABCcAAAQnAEmzTo0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADASURBVHgB7cExAQAAAMKg9U9tCy+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAeAMBuAABHgAAAABJRU5ErkJggg=='

function signToken({ userId, role }) {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '7d' })
}

function toDbRole(role) {
  if (role === 'superadmin') return 'super_admin'
  return role
}

function toClientRole(role) {
  if (role === 'super_admin') return 'superadmin'
  return role
}

function formatUser(user) {
  if (!user) return null
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: toClientRole(user.role),
    image: user.image,
    phone: user.phone,
    isActive: user.is_active,
    createdAt: user.created_at,
  }
}

const ALLOWED_REGISTER_ROLES = ['patient', 'doctor', 'assistant', 'admin', 'superadmin']

export async function register(req, res) {
  try {
    const supabase = requireSupabase()
    const { name, email, password, role: rawRole = 'patient', doctorId } = req.body

    if (!ALLOWED_REGISTER_ROLES.includes(rawRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' })
    }

    const role = toDbRole(rawRole)

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        role,
        image: DEFAULT_IMAGE,
        phone: '',
        address: { line1: '', line2: '' },
        gender: '',
        dob: '',
      })
      .select('id, role, email, name, image, phone, is_active, created_at')
      .single()

    if (error) throw error

    if (role === 'patient') {
      const { error: patientErr } = await supabase.from('patients').insert({ user_id: user.id })
      if (patientErr) throw patientErr
    } else if (role === 'doctor') {
      const { error: doctorErr } = await supabase.from('doctors').insert({
        user_id: user.id,
        speciality: '',
        degree: '',
        experience: '',
        about: '',
        fees: 0,
        treatment: 'allopathic',
        diseases: [],
        address: { line1: '', line2: '' },
        available: false,
      })
      if (doctorErr) throw doctorErr
    } else if (role === 'assistant') {
      if (!doctorId) {
        return res.status(400).json({ success: false, message: 'doctorId is required for assistants' })
      }
      const { error: assistantErr } = await supabase.from('assistants').insert({
        user_id: user.id,
        doctor_id: doctorId,
      })
      if (assistantErr) throw assistantErr
    }

    const token = signToken({ userId: user.id, role: user.role })
    return res.json({ success: true, token, user: formatUser(user) })
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message })
  }
}

export async function login(req, res) {
  try {
    const supabase = requireSupabase()
    const { email, password } = req.body

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash, is_active')
      .eq('email', email)
      .single()

    if (error || !user) return res.status(401).json({ success: false, message: 'Invalid credentials' })
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account disabled' })

    const isMatch = await bcrypt.compare(password, user.password_hash)
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' })

    const token = signToken({ userId: user.id, role: user.role })
    const { data: profile } = await supabase
      .from('users')
      .select('id, name, email, role, image, phone, is_active, created_at')
      .eq('id', user.id)
      .single()
    return res.json({ success: true, token, user: formatUser(profile || user) })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function me(req, res) {
  try {
    const supabase = requireSupabase()
    const { userId } = req.auth
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, role, image, phone, address, gender, dob, is_active, created_at')
      .eq('id', userId)
      .single()
    if (error) throw error
    return res.json({ success: true, user: formatUser(user), data: user })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function forgotPassword(req, res) {
  try {
    const supabase = requireSupabase()
    const { email } = req.body

    const { data: user } = await supabase.from('users').select('id').eq('email', email).maybeSingle()

    // Do not leak whether an email exists
    if (!user) {
      return res.json({ success: true, message: 'If the email exists, a reset link will be sent.' })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    const { error } = await supabase
      .from('users')
      .update({ reset_token_hash: tokenHash, reset_token_expires_at: expiresAt })
      .eq('id', user.id)
    if (error) throw error

    // Resource-flexible: no email provider required right now.
    // Return token for demo/testing; later we can email it.
    return res.json({
      success: true,
      message: 'Password reset token generated (demo mode).',
      reset_token: rawToken,
      expires_at: expiresAt,
    })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

export async function resetPassword(req, res) {
  try {
    const supabase = requireSupabase()
    const { token, newPassword } = req.body
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_token_hash, reset_token_expires_at')
      .eq('reset_token_hash', tokenHash)
      .maybeSingle()

    if (error) throw error
    if (!user) return res.status(400).json({ success: false, message: 'Invalid token' })
    if (!user.reset_token_expires_at || new Date(user.reset_token_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ success: false, message: 'Token expired' })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    const { error: updErr } = await supabase
      .from('users')
      .update({ password_hash: passwordHash, reset_token_hash: null, reset_token_expires_at: null })
      .eq('id', user.id)
    if (updErr) throw updErr

    return res.json({ success: true, message: 'Password updated' })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

