import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import StatusBadge from '../../components/shared/StatusBadge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { mapDoctorAppointment } from '../../lib/doctorPortalMappers'

const DoctorAppointmentDetail = () => {
  const { appointmentId } = useParams()
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/doctor/appointments/${appointmentId}`)
      .then(({ data }) => {
        if (data.success) {
          const raw = data.appointment || data.data
          const mapped = mapDoctorAppointment(raw)
          setAppointment({
            ...mapped,
            patientId: raw.patientId || raw.patient_id,
            medicalHistory: raw.medicalHistory,
          })
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [appointmentId])

  if (loading) return <div className="page-container"><div className="h-64 bg-white rounded-2xl animate-pulse" /></div>
  if (!appointment) return <div className="page-container text-slate-500">Appointment not found.</div>

  const canAddRecord = ['confirmed', 'completed'].includes(appointment.status)
  const hasHistory = !!appointment.medicalHistory
  const hasPrescription = appointment.medicalHistory?.hasPrescription

  return (
    <div className="page-container">
      <Link to="/doctor/appointments" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to appointments
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{appointment.patientName}</h1>
              <p className="text-sm text-slate-500">{appointment.patientEmail}</p>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-slate-500">Date:</span> <span className="font-medium">{appointment.date}</span></div>
            <div><span className="text-slate-500">Time:</span> <span className="font-medium">{appointment.timeSlot}</span></div>
            <div><span className="text-slate-500">Payment:</span> <StatusBadge status={appointment.paymentStatus} /></div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to={`/doctor/patients/${appointment.patientId}/history`}>
              <Button variant="secondary">View Patient History</Button>
            </Link>

            {canAddRecord && !hasHistory && (
              <Link to={`/doctor/appointments/${appointmentId}/medical-record`}>
                <Button>Add Medical Record</Button>
              </Link>
            )}

            {hasHistory && !hasPrescription && (
              <Link to={`/doctor/appointments/${appointmentId}/prescription?historyId=${appointment.medicalHistory.id}`}>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Add Prescription</Button>
              </Link>
            )}
          </div>

          {hasHistory && (
            <Card className="mt-6 bg-slate-50 border-0 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Medical Record</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {appointment.medicalHistory.diagnosis && (
                  <p className="text-sm text-slate-700"><span className="font-medium">Diagnosis:</span> {appointment.medicalHistory.diagnosis}</p>
                )}
                {appointment.medicalHistory.symptoms && (
                  <p className="text-sm text-slate-700 mt-1"><span className="font-medium">Symptoms:</span> {appointment.medicalHistory.symptoms}</p>
                )}
                {hasPrescription && (
                  <p className="text-sm text-emerald-600 mt-2 font-medium inline-flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Prescription added
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {!canAddRecord && (
            <p className="mt-4 text-sm text-slate-500">
              Medical records can only be added for confirmed or completed appointments.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DoctorAppointmentDetail
