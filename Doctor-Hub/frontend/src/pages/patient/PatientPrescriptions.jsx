import { useEffect, useState } from 'react'
import { Pill } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'

const PatientPrescriptions = () => {
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/patient/prescriptions')
      .then(({ data }) => { if (data.success) setPrescriptions(data.prescriptions) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Prescriptions"
        description="Read-only — prescriptions cannot be edited after creation"
      />

      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : prescriptions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Pill}
            title="No prescriptions yet"
            description="Prescriptions from your doctor will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <Card key={rx.id}>
              <CardContent className="pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">Dr. {rx.doctorName}</p>
                    <p className="text-sm text-slate-500">Visit: {rx.visitDate}</p>
                  </div>
                  <Badge variant="default">Read only</Badge>
                </div>
                {rx.diagnosis && (
                  <p className="text-sm text-slate-600 mt-2"><span className="font-medium">Diagnosis:</span> {rx.diagnosis}</p>
                )}
                <div className="mt-3">
                  <p className="text-xs font-medium text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Pill className="w-3 h-3" /> Medicines
                  </p>
                  <div className="space-y-1">
                    {(rx.medicines || []).map((med, i) => (
                      <div key={i} className="text-sm bg-slate-50 rounded-xl px-3 py-2">
                        {typeof med === 'string' ? med : `${med.name}${med.dosage ? ` — ${med.dosage}` : ''}${med.duration ? ` (${med.duration})` : ''}`}
                      </div>
                    ))}
                  </div>
                </div>
                {rx.instructions && (
                  <p className="text-sm text-slate-600 mt-3"><span className="font-medium">Instructions:</span> {rx.instructions}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default PatientPrescriptions
