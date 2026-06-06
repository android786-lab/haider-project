import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pill, ArrowRight } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'

const DoctorPrescriptions = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/doctor/patients')
      .then(({ data }) => { if (data.success) setPatients(data.patients) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-container">
      <PageHeader
        title="Prescriptions"
        description="Select a patient to view their history and prescriptions"
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : patients.length === 0 ? (
        <Card>
          <EmptyState
            icon={Pill}
            title="No patients yet"
            description="Prescriptions are created from confirmed appointments."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {patients.map((p) => (
            <Link key={p.patientId} to={`/doctor/patients/${p.patientId}/history`}>
              <Card className="hover:shadow-elevated transition-shadow duration-300 h-full">
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-slate-900">{p.name}</h3>
                  <p className="text-sm text-slate-500">{p.email}</p>
                  <p className="text-sm text-primary-600 mt-3 font-medium inline-flex items-center gap-1">
                    View history & prescriptions <ArrowRight className="w-4 h-4" />
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default DoctorPrescriptions
