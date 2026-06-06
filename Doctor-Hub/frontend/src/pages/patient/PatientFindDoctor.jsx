import { useEffect, useState } from 'react'
import { Search, Stethoscope } from 'lucide-react'
import api from '../../lib/api'
import DoctorCard from '../../components/patient/DoctorCard'
import PageHeader from '../../components/shared/PageHeader'
import EmptyState from '../../components/shared/EmptyState'
import { Card, CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'

const TREATMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'allopathic', label: 'Allopathic' },
  { value: 'homeopathic', label: 'Homeopathic' },
  { value: 'herbal', label: 'Herbal' },
]

const PatientFindDoctor = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')

  const fetchDoctors = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (type) params.set('type', type)

    api.get(`/api/doctors?${params}`)
      .then(({ data }) => { if (data.success) setDoctors(data.doctors) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDoctors() }, [type])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchDoctors()
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Find Doctor"
        description="Search verified doctors by name, specialty, or treatment type"
      />

      <Card className="mb-6">
        <CardContent className="pt-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or disease..."
                className="flex-1"
              />
              <Button type="submit">
                <Search className="w-4 h-4" />
                Search
              </Button>
            </form>
            <Select value={type} onChange={(e) => setType(e.target.value)} className="sm:w-48">
              {TREATMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : doctors.length === 0 ? (
        <Card>
          <EmptyState
            icon={Stethoscope}
            title="No doctors found"
            description="Try adjusting your search or filter criteria."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}
        </div>
      )}
    </div>
  )
}

export default PatientFindDoctor
