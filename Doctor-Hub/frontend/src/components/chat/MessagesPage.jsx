import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MessageCircle, Send, Circle } from 'lucide-react'
import api from '../../lib/api'
import PageHeader from '../shared/PageHeader'
import EmptyState from '../shared/EmptyState'
import { Card, CardContent } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Badge from '../ui/Badge'
import { useAuth } from '../../context/AuthContext'

const POLL_MS = 5000

const MessagesPage = ({ role }) => {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const [threads, setThreads] = useState([])
  const [messages, setMessages] = useState([])
  const [activeThread, setActiveThread] = useState(null)
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const fetchThreads = () => {
    api.get('/api/messages')
      .then(({ data }) => {
        if (data.success) setThreads(data.data || [])
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  const fetchMessages = (thread) => {
    if (!thread) return
    const params = new URLSearchParams({
      patient_id: thread.patient_id,
      doctor_id: thread.doctor_id,
    })
    api.get(`/api/messages?${params}`)
      .then(({ data }) => {
        if (data.success) setMessages(data.data || [])
      })
      .catch(console.error)
  }

  useEffect(() => { fetchThreads() }, [])

  useEffect(() => {
    if (!threads.length) return
    const doctorId = searchParams.get('doctor_id')
    const patientId = searchParams.get('patient_id')
    const match = threads.find((t) => {
      if (role === 'patient' && doctorId) return t.doctor_id === doctorId
      if (role === 'doctor' && patientId) return t.patient_id === patientId
      return false
    })
    if (match && !activeThread) setActiveThread(match)
  }, [threads, searchParams, role, activeThread])

  useEffect(() => {
    if (!activeThread) return
    fetchMessages(activeThread)
    const interval = setInterval(() => fetchMessages(activeThread), POLL_MS)
    return () => clearInterval(interval)
  }, [activeThread])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!draft.trim() || !activeThread) return
    setSending(true)
    try {
      const payload = {
        body: draft.trim(),
        patient_id: activeThread.patient_id,
        doctor_id: activeThread.doctor_id,
        appointment_id: activeThread.appointment_id || undefined,
      }
      const { data } = await api.post('/api/messages', payload)
      if (data.success) {
        setDraft('')
        fetchMessages(activeThread)
        fetchThreads()
      }
    } catch {
      // toast via interceptor
    } finally {
      setSending(false)
    }
  }

  const partnerName = role === 'patient'
    ? activeThread?.doctor_name
    : activeThread?.patient_name

  return (
    <div className="page-container">
      <PageHeader
        title="Messages"
        description="Chat with your doctor or patient during and after confirmed appointments"
      />

      {loading ? (
        <div className="h-96 bg-white rounded-2xl animate-pulse border border-surface-border" />
      ) : threads.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageCircle}
            title="No conversations yet"
            description="Book an appointment and submit payment to start chatting with your doctor."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[32rem]">
          <Card className="lg:col-span-1 border-surface-border overflow-hidden">
            <CardContent className="p-0 divide-y divide-surface-border max-h-[32rem] overflow-y-auto">
              {threads.map((thread) => {
                const label = role === 'patient' ? thread.doctor_name : thread.patient_name
                const active = activeThread?.patient_id === thread.patient_id
                  && activeThread?.doctor_id === thread.doctor_id
                return (
                  <button
                    key={`${thread.patient_id}:${thread.doctor_id}`}
                    type="button"
                    onClick={() => setActiveThread(thread)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${active ? 'bg-primary-50' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 truncate">
                        {role === 'patient' ? `Dr. ${label}` : label}
                      </p>
                      {thread.is_live && (
                        <Badge variant="success" className="shrink-0 text-[10px]">
                          <Circle className="w-2 h-2 fill-current mr-1" /> Live
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {thread.last_message || 'No messages yet'}
                    </p>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 border-surface-border flex flex-col min-h-[32rem]">
            {!activeThread ? (
              <CardContent className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Select a conversation to start chatting
              </CardContent>
            ) : (
              <>
                <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      {role === 'patient' ? `Dr. ${partnerName}` : partnerName}
                    </p>
                    {activeThread.is_live && (
                      <p className="text-xs text-emerald-600 font-medium mt-0.5">Appointment is live — chat now</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50 min-h-[20rem] max-h-[24rem]">
                  {messages.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Send the first message</p>
                  ) : (
                    messages.map((msg) => {
                      const mine = msg.sender_id === user?.id
                      return (
                        <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-primary-600 text-white' : 'bg-white border border-surface-border text-slate-800'}`}>
                            <p>{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${mine ? 'text-primary-100' : 'text-slate-400'}`}>
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={sendMessage} className="p-4 border-t border-surface-border flex gap-2">
                  <Input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button type="submit" disabled={sending || !draft.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

export default MessagesPage
