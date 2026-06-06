import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, FileText, Pill } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'

const DoctorPatientHistory = () => {
  const { patientId } = useParams()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/doctor/medical-history/${patientId}`)
      .then(({ data }) => { if (data.success) setHistory(data.history) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [patientId])

  return (
    <div className="page-container">
      <Link to="/doctor/patients" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to patients
      </Link>

      <PageHeader
        title="Patient History"
        description="Timeline of all visits and prescriptions (read-only)"
      />

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : history.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No medical history"
            description="Visit records will appear here after consultations."
          />
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-6">
            {history.map((record) => (
              <div key={record.id} className="relative pl-10">
                <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-white" />
                <Card>
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900">{record.visitDate}</p>
                      <span className="text-xs text-slate-400">Permanent record</span>
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
                          <div key={rx.id} className="bg-slate-50 rounded-xl p-3 mb-2">
                            <div className="space-y-1">
                              {(rx.medicines || []).map((med, i) => (
                                <p key={i} className="text-sm text-slate-800">
                                  <span className="font-medium">{med.name}</span>
                                  {med.dosage && ` — ${med.dosage}`}
                                  {med.frequency && `, ${med.frequency}`}
                                  {med.duration && ` (${med.duration})`}
                                </p>
                              ))}
                            </div>
                            {rx.instructions && (
                              <p className="text-xs text-slate-500 mt-2">{rx.instructions}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-1">Issued {new Date(rx.createdAt).toLocaleDateString()} — cannot be edited</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorPatientHistory
