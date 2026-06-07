import { useEffect, useState } from 'react'

import { Search, Stethoscope, Users } from 'lucide-react'

import api from '../../lib/api'

import DoctorCard from '../../components/patient/DoctorCard'

import PageHeader from '../../components/shared/PageHeader'

import EmptyState from '../../components/shared/EmptyState'

import { Card, CardContent } from '../../components/ui/Card'

import Button from '../../components/ui/Button'

import Input from '../../components/ui/Input'

import Select from '../../components/ui/Select'

import { mapDoctorForPatient, normalizeDoctorList } from '../../lib/doctorMappers'



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

    if (search.trim()) params.set('q', search.trim())

    if (type) params.set('treatment_type', type)

    params.set('available', 'true')



    api.get(`/api/doctors?${params}`)

      .then(({ data }) => {

        if (data.success) {

          setDoctors(normalizeDoctorList(data).map((d) => mapDoctorForPatient(d)))

        }

      })

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

        description="Browse verified doctors and book appointments — fees shown in PKR"

      />



      <Card className="mb-6 shadow-sm">

        <CardContent className="pt-5">

          <div className="flex flex-col lg:flex-row gap-3">

            <form onSubmit={handleSearch} className="flex-1 flex gap-2">

              <div className="relative flex-1">

                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <Input

                  value={search}

                  onChange={(e) => setSearch(e.target.value)}

                  placeholder="Search by name, specialty, or disease..."

                  className="pl-10"

                />

              </div>

              <Button type="submit">

                Search

              </Button>

            </form>

            <Select value={type} onChange={(e) => setType(e.target.value)} className="lg:w-52">

              {TREATMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}

            </Select>

          </div>

        </CardContent>

      </Card>



      {!loading && doctors.length > 0 && (

        <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">

          <Users className="w-4 h-4" />

          <span>{doctors.length} verified doctor{doctors.length !== 1 ? 's' : ''} available</span>

        </div>

      )}



      {loading ? (

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {[...Array(6)].map((_, i) => <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-surface-border" />)}

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

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">

          {doctors.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}

        </div>

      )}

    </div>

  )

}



export default PatientFindDoctor

