import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Star, MapPin, Clock } from 'lucide-react'
import api from '../../lib/api'
import BookingWizard from '../../components/patient/BookingWizard'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const PatientDoctorDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showBooking, setShowBooking] = useState(false)

  useEffect(() => {
    api.get(`/api/doctors/${id}`)
      .then(({ data }) => { if (data.success) setDoctor(data.doctor) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="page-container"><div className="h-96 bg-white rounded-2xl animate-pulse" /></div>
  }

  if (!doctor) {
    return (
      <div className="page-container text-center">
        <p className="text-slate-500">Doctor not found.</p>
        <Link to="/patient/doctors" className="text-primary-600 text-sm mt-2 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
    )
  }

  return (
    <div className="page-container">
      <Link to="/patient/doctors" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to doctors
      </Link>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dr. {doctor.name}</h1>
              <p className="text-primary-600 font-medium mt-1">{doctor.specialization}</p>
              <div className="flex gap-2 mt-2 text-sm text-slate-500">
                <span className="capitalize">{doctor.treatmentType}</span>
                <span>·</span>
                <span>{doctor.experience} years experience</span>
                <span>·</span>
                <span className="text-amber-600 font-medium inline-flex items-center gap-0.5">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> {doctor.rating}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">${doctor.fee}</p>
              <p className="text-xs text-slate-500">consultation fee</p>
            </div>
          </div>

          {doctor.bio && <p className="text-slate-600 text-sm mt-4 leading-relaxed">{doctor.bio}</p>}

          <Button onClick={() => setShowBooking(true)} className="mt-6">
            Book Appointment
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary-600" /> Clinics
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {doctor.clinics?.length ? doctor.clinics.map((clinic) => (
              <div key={clinic.id} className="border-b border-surface-border last:border-0 py-3">
                <p className="font-medium text-slate-800">{clinic.clinicName}</p>
                <p className="text-sm text-slate-500">{clinic.address}, {clinic.city}</p>
                <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {clinic.startTime} – {clinic.endTime}
                </p>
                {clinic.availableDays?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {clinic.availableDays.map((d) => (
                      <span key={d} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                  </div>
                )}
              </div>
            )) : <p className="text-slate-500 text-sm">No clinics listed.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" /> Available Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {doctor.schedules?.length ? doctor.schedules.slice(0, 7).map((s) => (
              <div key={s.date} className="border-b border-surface-border last:border-0 py-3">
                <p className="font-medium text-slate-800 text-sm">{s.date}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.availableSlots?.map((slot) => (
                    <span key={slot} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">{slot}</span>
                  ))}
                </div>
              </div>
            )) : <p className="text-slate-500 text-sm">No available slots.</p>}
          </CardContent>
        </Card>
      </div>

      {showBooking && (
        <BookingWizard
          doctor={doctor}
          onClose={() => setShowBooking(false)}
          onComplete={() => { setShowBooking(false); navigate('/patient/appointments') }}
        />
      )}
    </div>
  )
}

export default PatientDoctorDetail
