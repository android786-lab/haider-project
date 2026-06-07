import { useEffect, useState } from 'react'

import { Link } from 'react-router-dom'

import { Calendar, Plus, Stethoscope, Clock, MapPin, MessageCircle } from 'lucide-react'

import api from '../../lib/api'

import PageHeader from '../../components/shared/PageHeader'

import StatusBadge from '../../components/shared/StatusBadge'

import EmptyState from '../../components/shared/EmptyState'

import { Card, CardContent } from '../../components/ui/Card'

import Button from '../../components/ui/Button'

import Badge from '../../components/ui/Badge'

import { mapPatientAppointment, normalizeAppointmentList } from '../../lib/appointmentMappers'



const PatientAppointments = () => {

  const [appointments, setAppointments] = useState([])

  const [loading, setLoading] = useState(true)



  useEffect(() => {
    Promise.all([
      api.get('/api/patient/appointments'),
      api.get('/api/appointments/live'),
    ])
      .then(([apptRes, liveRes]) => {
        const liveIds = new Set((liveRes.data?.live || []).map((a) => a.id))
        if (apptRes.data.success) {
          setAppointments(
            normalizeAppointmentList(apptRes.data).map((row) =>
              mapPatientAppointment(row, { isLive: liveIds.has(row.id) })
            )
          )
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])



  return (

    <div className="page-container">

      <PageHeader

        title="My Appointments"

        description="Track upcoming visits, payment status, and consultation fees (PKR)"

        action={

          <Link to="/patient/doctors">

            <Button size="sm">

              <Plus className="w-4 h-4" /> Book New

            </Button>

          </Link>

        }

      />



      {!loading && appointments.length > 0 && (

        <p className="text-sm text-slate-500 mb-4">

          {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} on your record

        </p>

      )}



      {loading ? (

        <div className="space-y-4">

          {[...Array(3)].map((_, i) => (

            <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-surface-border" />

          ))}

        </div>

      ) : appointments.length === 0 ? (

        <Card>

          <EmptyState

            icon={Calendar}

            title="No appointments yet"

            description="Browse doctors and book your first appointment."

            action={

              <Link to="/patient/doctors">

                <Button>Find a doctor</Button>

              </Link>

            }

          />

        </Card>

      ) : (

        <div className="space-y-4">

          {appointments.map((appt) => (

            <Card key={appt.id} className="overflow-hidden border-surface-border shadow-sm hover:shadow-md transition-shadow">

              <CardContent className="p-0">

                <div className="flex flex-col sm:flex-row">

                  <div className="sm:w-28 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center py-6 sm:py-0">

                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center">

                      <Stethoscope className="w-7 h-7 text-white" />

                    </div>

                  </div>



                  <div className="flex-1 p-5">

                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2 mb-1">

                          <h3 className="font-bold text-slate-900 text-lg">Dr. {appt.doctorName}</h3>

                          <Badge variant="primary" className="capitalize">{appt.treatmentType}</Badge>

                        </div>

                        <p className="text-sm text-primary-600 font-medium">{appt.specialization}</p>



                        <div className="mt-3 space-y-1.5 text-sm text-slate-600">

                          <p className="inline-flex items-center gap-2">

                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />

                            <span className="font-medium text-slate-800">{appt.date}</span>

                            <span className="text-slate-400">at</span>

                            <span className="font-medium text-slate-800">{appt.timeSlot}</span>

                          </p>

                          <p className="inline-flex items-start gap-2">

                            <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />

                            <span>{appt.clinicName}{appt.clinicAddress ? ` — ${appt.clinicAddress}` : ''}</span>

                          </p>

                          {appt.createdAt && (

                            <p className="inline-flex items-center gap-2 text-xs text-slate-400">

                              <Clock className="w-3.5 h-3.5" />

                              Booked {new Date(appt.createdAt).toLocaleDateString('en-PK')}

                            </p>

                          )}

                        </div>

                      </div>



                      <div className="lg:text-right shrink-0">

                        <p className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">Consultation Fee</p>

                        <p className="text-xl font-bold text-slate-900">{appt.feeLabel}</p>

                      </div>

                    </div>



                    <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-surface-border">
                      <StatusBadge status={appt.status} />
                      {appt.paymentStatus !== appt.status && (
                        <StatusBadge status={appt.paymentStatus} />
                      )}
                      {appt.isLive && <Badge variant="success">Live now</Badge>}
                      {appt.chatEnabled && appt.doctor_id && (
                        <Link to={`/patient/messages?doctor_id=${appt.doctor_id}`}>
                          <Button size="sm" variant="outline">
                            <MessageCircle className="w-3.5 h-3.5" /> Chat
                          </Button>
                        </Link>
                      )}
                    </div>

                  </div>

                </div>

              </CardContent>

            </Card>

          ))}

        </div>

      )}

    </div>

  )

}



export default PatientAppointments

