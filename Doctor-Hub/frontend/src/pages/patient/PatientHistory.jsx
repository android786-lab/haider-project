import { useEffect, useState } from 'react'

import { FileText, Stethoscope, Paperclip } from 'lucide-react'

import api from '../../lib/api'

import PageHeader from '../../components/shared/PageHeader'

import EmptyState from '../../components/shared/EmptyState'

import { Card, CardContent } from '../../components/ui/Card'

import Badge from '../../components/ui/Badge'

import { mapPatientHistoryRecord, normalizeHistoryList } from '../../lib/patientRecordsMappers'



const PatientHistory = () => {

  const [history, setHistory] = useState([])

  const [loading, setLoading] = useState(true)



  useEffect(() => {

    api.get('/api/patient/history')

      .then(({ data }) => {

        if (data.success) {

          setHistory(normalizeHistoryList(data).map(mapPatientHistoryRecord))

        }

      })

      .catch(console.error)

      .finally(() => setLoading(false))

  }, [])



  return (

    <div className="page-container">

      <PageHeader

        title="Medical History"

        description="Permanent visit records from your doctors — read only"

      />



      {loading ? (

        <div className="space-y-4">

          {[...Array(3)].map((_, i) => (

            <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-surface-border" />

          ))}

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

          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-primary-200" />

          <div className="space-y-6">

            {history.map((record) => (

              <div key={record.id} className="relative pl-10">

                <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary-600 border-2 border-white shadow-sm" />

                <Card className="border-surface-border shadow-sm">

                  <CardContent className="pt-5">

                    <div className="flex flex-wrap items-start justify-between gap-3">

                      <div>

                        <p className="font-bold text-slate-900">{record.visitDate}</p>

                        <p className="text-sm text-primary-600 mt-1 inline-flex items-center gap-1.5">

                          <Stethoscope className="w-3.5 h-3.5" />

                          Dr. {record.doctorName} — {record.specialization}

                        </p>

                      </div>

                      <Badge variant={record.recordType === 'patient_report' ? 'info' : 'primary'}>

                        {record.recordType === 'patient_report' ? 'Your report' : 'Doctor note'}

                      </Badge>

                    </div>



                    {record.symptoms && (

                      <div className="mt-4 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">

                        <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Symptoms</p>

                        <p className="text-sm text-slate-700 mt-1">{record.symptoms}</p>

                      </div>

                    )}

                    {record.diagnosis && (

                      <div className="mt-3">

                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnosis / Title</p>

                        <p className="text-sm text-slate-800 mt-1 font-medium">{record.diagnosis}</p>

                      </div>

                    )}

                    {record.notes && record.notes !== record.symptoms && (

                      <div className="mt-3">

                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</p>

                        <p className="text-sm text-slate-700 mt-1 leading-relaxed">{record.notes}</p>

                      </div>

                    )}

                    {record.attachments?.length > 0 && (

                      <div className="mt-3 flex flex-wrap gap-2">

                        {record.attachments.map((file, i) => (

                          <a

                            key={i}

                            href={file.url || file}

                            target="_blank"

                            rel="noreferrer"

                            className="inline-flex items-center gap-1 text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full hover:bg-primary-100"

                          >

                            <Paperclip className="w-3 h-3" />

                            {file.name || `Attachment ${i + 1}`}

                          </a>

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



export default PatientHistory

