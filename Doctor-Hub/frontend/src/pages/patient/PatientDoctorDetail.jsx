import { useEffect, useState } from 'react'

import { Link, useNavigate, useParams } from 'react-router-dom'

import { ArrowLeft, Star, MapPin, Clock, BadgeCheck, GraduationCap, Stethoscope } from 'lucide-react'

import api from '../../lib/api'

import BookingWizard from '../../components/patient/BookingWizard'

import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'

import Button from '../../components/ui/Button'

import Badge from '../../components/ui/Badge'

import { mapDoctorForPatient } from '../../lib/doctorMappers'



const PatientDoctorDetail = () => {

  const { id } = useParams()

  const navigate = useNavigate()

  const [doctor, setDoctor] = useState(null)

  const [loading, setLoading] = useState(true)

  const [showBooking, setShowBooking] = useState(false)



  useEffect(() => {

    Promise.all([

      api.get(`/api/doctors/${id}`),

      api.get(`/api/doctors/${id}/schedules`),

    ])

      .then(([doctorRes, scheduleRes]) => {

        const rawDoctor = doctorRes.data?.doctor || doctorRes.data?.data

        const schedules = scheduleRes.data?.data?.schedules || []

        if (doctorRes.data?.success && rawDoctor) {

          setDoctor(mapDoctorForPatient(rawDoctor, { schedules }))

        }

      })

      .catch(console.error)

      .finally(() => setLoading(false))

  }, [id])



  if (loading) {

    return (

      <div className="page-container space-y-4">

        <div className="h-8 w-40 bg-white rounded-xl animate-pulse" />

        <div className="h-56 bg-white rounded-2xl animate-pulse border border-surface-border" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          <div className="h-48 bg-white rounded-2xl animate-pulse" />

          <div className="h-48 bg-white rounded-2xl animate-pulse" />

        </div>

      </div>

    )

  }



  if (!doctor) {

    return (

      <div className="page-container">

        <Card className="text-center py-12">

          <CardContent>

            <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-4" />

            <p className="text-slate-600 font-medium">Doctor not found.</p>

            <p className="text-sm text-slate-500 mt-1">This doctor may no longer be available.</p>

            <Link to="/patient/doctors" className="inline-flex items-center gap-1 text-primary-600 text-sm mt-4 font-medium hover:underline">

              <ArrowLeft className="w-4 h-4" /> Back to doctors

            </Link>

          </CardContent>

        </Card>

      </div>

    )

  }



  return (

    <div className="page-container">

      <Link to="/patient/doctors" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4 font-medium">

        <ArrowLeft className="w-4 h-4" /> Back to doctors

      </Link>



      <Card className="overflow-hidden border-surface-border shadow-sm">

        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8 text-white">

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">

            <div className="flex gap-4">

              <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">

                <Stethoscope className="w-10 h-10" />

              </div>

              <div>

                <div className="flex flex-wrap items-center gap-2 mb-1">

                  <h1 className="text-2xl sm:text-3xl font-bold">Dr. {doctor.name}</h1>

                  {doctor.available && (

                    <Badge className="bg-white/20 text-white border-white/30">

                      <BadgeCheck className="w-3.5 h-3.5 mr-1" />

                      Verified

                    </Badge>

                  )}

                </div>

                <p className="text-primary-100 font-medium text-lg">{doctor.specialization}</p>

                <div className="flex flex-wrap gap-3 mt-3 text-sm text-primary-50">

                  <span className="inline-flex items-center gap-1 capitalize">

                    <GraduationCap className="w-4 h-4" /> {doctor.degree}

                  </span>

                  <span>{doctor.experience}</span>

                  <span className="inline-flex items-center gap-1">

                    <Star className="w-4 h-4 fill-amber-300 text-amber-300" /> {doctor.rating}

                  </span>

                  <span className="capitalize">{doctor.treatmentType}</span>

                </div>

              </div>

            </div>

            <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 text-center sm:text-right shrink-0">

              <p className="text-xs uppercase tracking-wide text-primary-100">Consultation Fee</p>

              <p className="text-3xl font-bold mt-1">{doctor.feeLabel}</p>

            </div>

          </div>

        </div>



        <CardContent className="pt-6">

          {doctor.bio && (

            <p className="text-slate-600 text-sm leading-relaxed mb-6">{doctor.bio}</p>

          )}



          {doctor.diseases?.length > 0 && (

            <div className="mb-6">

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Treats</p>

              <div className="flex flex-wrap gap-2">

                {doctor.diseases.map((d) => (

                  <span key={d} className="text-xs bg-primary-50 text-primary-700 px-3 py-1 rounded-full font-medium">{d}</span>

                ))}

              </div>

            </div>

          )}



          <Button onClick={() => setShowBooking(true)} size="lg" className="w-full sm:w-auto">

            Book Appointment — {doctor.feeLabel}

          </Button>

        </CardContent>

      </Card>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

        <Card>

          <CardHeader>

            <CardTitle className="flex items-center gap-2 text-base">

              <MapPin className="w-5 h-5 text-primary-600" /> Clinics

            </CardTitle>

          </CardHeader>

          <CardContent className="pt-0">

            {doctor.clinics?.length ? doctor.clinics.map((clinic) => (

              <div key={clinic.id || clinic.clinicName} className="border-b border-surface-border last:border-0 py-3 first:pt-0">

                <p className="font-medium text-slate-800">{clinic.clinicName}</p>

                <p className="text-sm text-slate-500">{clinic.address}{clinic.city ? `, ${clinic.city}` : ''}</p>

                <p className="text-xs text-slate-400 mt-1 inline-flex items-center gap-1">

                  <Clock className="w-3 h-3" /> {clinic.startTime} – {clinic.endTime}

                </p>

              </div>

            )) : <p className="text-slate-500 text-sm">General consultation available.</p>}

          </CardContent>

        </Card>



        <Card>

          <CardHeader>

            <CardTitle className="flex items-center gap-2 text-base">

              <Clock className="w-5 h-5 text-primary-600" /> Available Slots

            </CardTitle>

          </CardHeader>

          <CardContent className="pt-0">

            {doctor.schedules?.length ? doctor.schedules.slice(0, 5).map((s) => (

              <div key={s.date} className="border-b border-surface-border last:border-0 py-3 first:pt-0">

                <p className="font-medium text-slate-800 text-sm">

                  {new Date(s.date).toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}

                </p>

                <div className="flex flex-wrap gap-1.5 mt-2">

                  {s.availableSlots?.slice(0, 6).map((slot) => (

                    <span key={slot} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium">{slot}</span>

                  ))}

                  {s.availableSlots?.length > 6 && (

                    <span className="text-xs text-slate-400 px-1">+{s.availableSlots.length - 6} more</span>

                  )}

                </div>

              </div>

            )) : <p className="text-slate-500 text-sm">No slots listed yet. Book to see available times.</p>}

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

