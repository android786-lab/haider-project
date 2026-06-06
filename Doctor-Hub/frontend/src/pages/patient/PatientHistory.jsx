import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'

const PatientHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/patient/history')
      .then(({ data }) => { if (data.success) setHistory(data.history) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Medical History"
        description="Read-only records — cannot be deleted"
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
            description="Your visit records will appear here after consultations."
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
                      <span className="text-xs text-slate-400">Read only</span>
                    </div>
                    <p className="text-sm text-primary-600 mt-1">Dr. {record.doctorName} — {record.specialization}</p>
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

export default PatientHistory
