import { useCallback, useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText, Pill, Plus, User } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import PrescriptionFormCard from '../../components/doctor/PrescriptionFormCard'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { mapDoctorHistoryRecord, normalizeDoctorHistory } from '../../lib/doctorPortalMappers'

function formatVisitDate(value) {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString('en-PK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function PrescriptionBlock({ rx }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 mb-2">
      <div className="space-y-1">
        {(rx.medicines || []).map((med, i) => (
          <p key={i} className="text-sm text-slate-800">
            <span className="font-medium">{med.name}</span>
            {med.dosage && ` — ${med.dosage}`}
            {med.dose && !med.dosage && ` — ${med.dose}`}
            {med.frequency && `, ${med.frequency}`}
            {med.duration && ` (${med.duration})`}
          </p>
        ))}
      </div>
      {rx.instructions && <p className="text-xs text-slate-500 mt-2">{rx.instructions}</p>}
      <p className="text-xs text-slate-400 mt-1">
        Issued {formatVisitDate(rx.createdAt)} — cannot be edited
      </p>
    </div>
  )
}

const DoctorPatientHistory = () => {
  const { patientId } = useParams()
  const [searchParams] = useSearchParams()
  const fromPrescriptions = searchParams.get('from') === 'prescriptions'

  const [patient, setPatient] = useState(null)
  const [history, setHistory] = useState([])
  const [allPrescriptions, setAllPrescriptions] = useState([])
  const [latestAppointment, setLatestAppointment] = useState(null)
  const [latestHistoryId, setLatestHistoryId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const loadData = useCallback(() => {
    setLoading(true)
    return api.get(`/api/doctor/medical-history/${patientId}`)
      .then(({ data }) => {
        if (data.success) {
          setPatient(data.patient || null)
          setHistory(normalizeDoctorHistory(data).map(mapDoctorHistoryRecord))
          setAllPrescriptions(data.allPrescriptions || data.prescriptions || [])
          setLatestAppointment(data.latestAppointment || null)
          setLatestHistoryId(data.latestHistoryId || null)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const backLink = fromPrescriptions ? '/doctor/prescriptions' : '/doctor/patients'
  const backLabel = fromPrescriptions ? 'Back to prescriptions' : 'Back to patients'

  const historyRxIds = new Set(
    history.flatMap((record) => (record.prescriptions || []).map((rx) => rx.id))
  )
  const standalonePrescriptions = allPrescriptions.filter((rx) => !historyRxIds.has(rx.id))

  const canAddPrescription = ['confirmed', 'completed', 'verified', 'payment_submitted'].includes(
    latestAppointment?.status
  )

  const handlePrescriptionSaved = () => {
    setShowForm(false)
    loadData()
  }

  return (
    <div className="page-container">
      <Link
        to={backLink}
        className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> {backLabel}
      </Link>

      {loading ? (
        <div className="space-y-4">
          <div className="h-24 bg-white rounded-2xl animate-pulse" />
          {[...Array(2)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {patient && (
            <Card className="mb-6">
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">{patient.name}</h2>
                      <p className="text-sm text-slate-500">{patient.email}</p>
                      {patient.phone && <p className="text-xs text-slate-400 mt-0.5">{patient.phone}</p>}
                    </div>
                  </div>
                  {canAddPrescription && !showForm && (
                    <Button onClick={() => setShowForm(true)}>
                      <Plus className="w-4 h-4" /> Add Prescription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <PageHeader
            title="Medical History & Prescriptions"
            description="View visit records and issue new prescriptions for this patient"
          />

          {showForm && canAddPrescription && (
            <div className="mb-8">
              <PrescriptionFormCard
                patientId={patientId}
                patientName={patient?.name}
                appointmentId={latestAppointment?.id}
                medicalHistoryId={latestHistoryId}
                onSuccess={handlePrescriptionSaved}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {!canAddPrescription && (
            <div className="bg-amber-50 text-amber-800 text-sm px-4 py-3 rounded-xl mb-6">
              New prescriptions can be added once the patient has a confirmed or completed appointment.
            </div>
          )}

          {history.length === 0 && standalonePrescriptions.length === 0 && !showForm ? (
            <Card>
              <EmptyState
                icon={FileText}
                title="No medical history yet"
                description="Visit records will appear here after consultations. You can still add a prescription if the appointment is confirmed."
              />
            </Card>
          ) : (
            <div className="space-y-8">
              {history.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" /> Visit History
                  </h3>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                    <div className="space-y-6">
                      {history.map((record) => (
                        <div key={record.id} className="relative pl-10">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-white" />
                          <Card>
                            <CardContent className="pt-5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-semibold text-slate-900">{formatVisitDate(record.visitDate)}</p>
                                <Badge variant="default">Permanent record</Badge>
                              </div>

                              {record.symptoms && (
                                <div className="mt-3">
                                  <p className="text-xs font-medium text-slate-500 uppercase">Symptoms</p>
                                  <p className="text-sm text-slate-700 mt-0.5">{record.symptoms}</p>
                                </div>
                              )}
                              {record.diagnosis && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-slate-500 uppercase">Diagnosis</p>
                                  <p className="text-sm text-slate-700 mt-0.5">{record.diagnosis}</p>
                                </div>
                              )}
                              {record.notes && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-slate-500 uppercase">Notes</p>
                                  <p className="text-sm text-slate-700 mt-0.5">{record.notes}</p>
                                </div>
                              )}

                              {record.prescriptions?.length > 0 && (
                                <div className="mt-4 border-t border-surface-border pt-4">
                                  <p className="text-xs font-medium text-primary-600 uppercase mb-2 flex items-center gap-1">
                                    <Pill className="w-3 h-3" /> Prescriptions
                                  </p>
                                  {record.prescriptions.map((rx) => (
                                    <PrescriptionBlock key={rx.id} rx={rx} />
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {standalonePrescriptions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Pill className="w-4 h-4 text-primary-600" /> All Prescriptions
                  </h3>
                  <Card>
                    <CardContent className="pt-5">
                      {standalonePrescriptions.map((rx) => (
                        <PrescriptionBlock key={rx.id} rx={rx} />
                      ))}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DoctorPatientHistory
