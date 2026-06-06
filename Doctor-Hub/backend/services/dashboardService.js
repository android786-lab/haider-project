import { requireSupabase } from '../config/supabaseClient.js'
import { listAppointmentsForUser } from './appointmentService.js'
import { listPendingPayments } from './paymentService.js'

function countByStatus(appointments) {
  const counts = {
    payment_pending: 0,
    payment_submitted: 0,
    verified: 0,
    confirmed: 0,
    rejected: 0,
    completed: 0,
    cancelled: 0,
  }
  for (const a of appointments) {
    if (counts[a.status] !== undefined) counts[a.status] += 1
  }
  return counts
}

async function patientDashboard(userId) {
  const supabase = requireSupabase()
  const appointments = await listAppointmentsForUser({ userId, role: 'patient' })
  const statusCounts = countByStatus(appointments)

  const [{ count: historyCount }, { count: rxCount }] = await Promise.all([
    supabase
      .from('medical_history')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', userId),
    supabase
      .from('prescriptions')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', userId),
  ])

  return {
    role: 'patient',
    stats: {
      totalAppointments: appointments.length,
      needsPayment: statusCounts.payment_pending + statusCounts.rejected,
      awaitingVerification: statusCounts.payment_submitted,
      upcoming: statusCounts.confirmed + statusCounts.verified,
      completed: statusCounts.completed,
      cancelled: statusCounts.cancelled,
      historyRecords: historyCount || 0,
      prescriptions: rxCount || 0,
      statusCounts,
    },
    recentAppointments: appointments.slice(0, 5),
  }
}

async function doctorDashboard(userId) {
  const appointments = await listAppointmentsForUser({ userId, role: 'doctor' })
  const statusCounts = countByStatus(appointments)

  let earnings = 0
  const patientSet = new Set()
  for (const a of appointments) {
    patientSet.add(a.patient_id)
    if (['completed', 'confirmed', 'verified'].includes(a.status)) {
      earnings += Number(a.amount) || 0
    }
  }

  return {
    role: 'doctor',
    stats: {
      earnings,
      appointments: appointments.length,
      patients: patientSet.size,
      statusCounts,
    },
    recentAppointments: appointments.slice(0, 5),
    dashData: {
      earnings,
      appointments: appointments.length,
      patients: patientSet.size,
      latestAppointments: appointments.slice(0, 5),
    },
  }
}

async function assistantDashboard(userId) {
  const appointments = await listAppointmentsForUser({ userId, role: 'assistant' })
  const statusCounts = countByStatus(appointments)
  const pending = await listPendingPayments({ userId, role: 'assistant' })

  const upcoming = appointments.filter((a) =>
    ['confirmed', 'verified'].includes(a.status)
  ).length

  return {
    role: 'assistant',
    stats: {
      pendingPayments: pending.length,
      appointments: appointments.length,
      upcoming,
      statusCounts,
    },
    recentAppointments: appointments.slice(0, 5),
    recentPendingPayments: pending.slice(0, 5),
  }
}

async function adminDashboard(userId, role) {
  const supabase = requireSupabase()

  const [
    { count: doctorCount },
    { count: patientCount },
    { count: assistantCount },
    { count: appointmentCount },
    appointments,
    pending,
  ] = await Promise.all([
    supabase.from('doctors').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'patient'),
    supabase.from('assistants').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    listAppointmentsForUser({ userId, role }),
    listPendingPayments({ userId, role }),
  ])

  const statusCounts = countByStatus(appointments)

  return {
    role,
    stats: {
      doctors: doctorCount || 0,
      patients: patientCount || 0,
      assistants: assistantCount || 0,
      appointments: appointmentCount || 0,
      pendingPayments: pending.length,
      statusCounts,
    },
    recentAppointments: appointments.slice(0, 5),
    recentPendingPayments: pending.slice(0, 5),
    dashData: {
      doctors: doctorCount || 0,
      patients: patientCount || 0,
      appointments: appointmentCount || 0,
      latestAppointments: appointments.slice(0, 5),
    },
  }
}

export async function getDashboard({ userId, role }) {
  switch (role) {
    case 'patient':
      return patientDashboard(userId)
    case 'doctor':
      return doctorDashboard(userId)
    case 'assistant':
      return assistantDashboard(userId)
    case 'admin':
    case 'super_admin':
      return adminDashboard(userId, role)
    default:
      throw new Error('Dashboard not available for this role')
  }
}
