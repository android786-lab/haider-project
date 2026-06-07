import { Link } from 'react-router-dom'

import {

  ArrowRight,

  Calendar,

  Shield,

  Users,

  HeartPulse,

  MessageCircle,

  Stethoscope,

  UserRound,

  BriefcaseMedical,

  ShieldCheck,

} from 'lucide-react'

import Button from '../components/ui/Button'

import { Card, CardContent } from '../components/ui/Card'



const FEATURES = [

  { icon: Calendar, title: 'Smart Booking', desc: 'Find verified doctors and book slots in minutes.' },

  { icon: MessageCircle, title: 'Live Consultation Chat', desc: 'Message your doctor when your appointment starts.' },

  { icon: Shield, title: 'Secure Records', desc: 'Medical history and prescriptions — safe and read-only.' },

  { icon: HeartPulse, title: 'End-to-End Care', desc: 'Booking, payment proof, consultation, and prescriptions.' },

]



const STEPS = [

  { step: '01', title: 'Register & Book', desc: 'Patients create an account and book a doctor.' },

  { step: '02', title: 'Submit Payment', desc: 'Upload payment screenshot for assistant verification.' },

  { step: '03', title: 'Consult & Chat', desc: 'At appointment time, both sides get notified to chat.' },

]



const ROLE_CARDS = [

  {

    icon: UserRound,

    title: 'Patient',

    desc: 'Book doctors, track appointments, chat during consultations.',

    primary: { to: '/register', label: 'Register Free' },

    secondary: { to: '/login', label: 'Patient Login' },

    color: 'from-primary-500 to-primary-700',

  },

  {

    icon: BriefcaseMedical,

    title: 'Doctor & Assistant',

    desc: 'Manage schedule, patients, payments, and live chat.',

    primary: { to: '/login', label: 'Staff Login' },

    color: 'from-sky-500 to-sky-700',

  },

  {

    icon: ShieldCheck,

    title: 'Admin',

    desc: 'Manage doctors, assistants, approvals, and platform analytics.',

    primary: { to: '/admin/login', label: 'Admin Login' },

    secondary: { to: '/admin/register', label: 'Request Admin Access' },

    color: 'from-slate-700 to-slate-900',

  },

]



const Home = () => (

  <>

    <section className="relative overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-sky-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">

        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div>

            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 mb-6">

              <Stethoscope className="w-3.5 h-3.5" />

              Pakistan&apos;s Digital Healthcare Hub

            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">

              Healthcare that connects{' '}

              <span className="text-primary-600">patients & doctors</span>

            </h1>

            <p className="text-lg text-slate-600 mt-6 leading-relaxed max-w-xl">

              Doctor Hub is a complete platform for appointments, PKR payments, live consultation chat,

              medical records, and prescriptions — all in one professional system.

            </p>

            <div className="flex flex-wrap gap-4 mt-10">

              <Link to="/register">

                <Button size="lg">

                  Get Started as Patient

                  <ArrowRight className="w-4 h-4" />

                </Button>

              </Link>

              <Link to="/login">

                <Button variant="outline" size="lg">Staff Login</Button>

              </Link>

            </div>

          </div>



          <Card className="border-0 shadow-elevated bg-white/80 backdrop-blur">

            <CardContent className="pt-8 pb-8">

              <h2 className="text-xl font-bold text-slate-900 mb-2">Choose how you want to sign in</h2>

              <p className="text-sm text-slate-500 mb-6">Each role has its own secure portal.</p>

              <div className="space-y-3">

                {ROLE_CARDS.map((role) => (

                  <div key={role.title} className="flex items-center gap-4 p-4 rounded-2xl border border-surface-border hover:border-primary-200 transition-colors">

                    <div className={`p-3 rounded-xl bg-gradient-to-br ${role.color} text-white shrink-0`}>

                      <role.icon className="w-5 h-5" />

                    </div>

                    <div className="flex-1 min-w-0">

                      <p className="font-semibold text-slate-900">{role.title}</p>

                      <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>

                    </div>

                    <Link to={role.primary.to}>

                      <Button size="sm">{role.primary.label}</Button>

                    </Link>

                  </div>

                ))}

              </div>

            </CardContent>

          </Card>

        </div>

      </div>

    </section>



    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">

      <div className="text-center max-w-2xl mx-auto mb-10">

        <h2 className="text-3xl font-bold text-slate-900">Built for every role</h2>

        <p className="text-slate-600 mt-3">One platform — separate secure portals for patients, clinical staff, and administrators.</p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {ROLE_CARDS.map(({ icon: Icon, title, desc, primary, secondary, color }) => (

          <Card key={title} className="hover:shadow-elevated transition-all border-surface-border overflow-hidden">

            <div className={`h-2 bg-gradient-to-r ${color}`} />

            <CardContent className="pt-6">

              <div className={`p-3 rounded-xl bg-gradient-to-br ${color} text-white w-fit mb-4`}>

                <Icon className="w-5 h-5" />

              </div>

              <h3 className="font-bold text-slate-900 text-lg">{title}</h3>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>

              <div className="flex flex-wrap gap-2 mt-5">

                <Link to={primary.to}><Button size="sm">{primary.label}</Button></Link>

                {secondary && (

                  <Link to={secondary.to}><Button size="sm" variant="outline">{secondary.label}</Button></Link>

                )}

              </div>

            </CardContent>

          </Card>

        ))}

      </div>

    </section>



    <section className="bg-slate-900 text-white py-16">

      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        <div className="grid lg:grid-cols-2 gap-12 items-center">

          <div>

            <h2 className="text-3xl font-bold">How it works</h2>

            <p className="text-slate-300 mt-3">From booking to live consultation chat — a simple, secure flow.</p>

          </div>

          <div className="space-y-4">

            {STEPS.map((item) => (

              <div key={item.step} className="flex gap-4 items-start bg-white/5 rounded-2xl p-4 border border-white/10">

                <span className="text-2xl font-black text-primary-400 shrink-0">{item.step}</span>

                <div>

                  <p className="font-semibold">{item.title}</p>

                  <p className="text-sm text-slate-300 mt-1">{item.desc}</p>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </section>



    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">

      <div className="text-center mb-12">

        <h2 className="text-3xl font-bold text-slate-900">Why Doctor Hub?</h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {FEATURES.map(({ icon: Icon, title, desc }) => (

          <Card key={title} className="hover:shadow-elevated transition-all border-0 shadow-card">

            <CardContent className="pt-6">

              <div className="p-3 rounded-xl bg-primary-50 text-primary-600 w-fit mb-4">

                <Icon className="w-5 h-5" />

              </div>

              <h3 className="font-semibold text-slate-900">{title}</h3>

              <p className="text-sm text-slate-500 mt-2 leading-relaxed">{desc}</p>

            </CardContent>

          </Card>

        ))}

      </div>

    </section>



    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">

      <Card className="bg-gradient-to-r from-primary-600 to-primary-700 border-0 text-white overflow-hidden">

        <CardContent className="py-12 text-center">

          <h2 className="text-3xl font-bold">Ready to get started?</h2>

          <p className="text-primary-100 mt-3 max-w-xl mx-auto">

            Join Doctor Hub today — patients register free, staff and admins use their dedicated login portals.

          </p>

          <div className="flex flex-wrap justify-center gap-4 mt-8">

            <Link to="/register"><Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">Patient Register</Button></Link>

            <Link to="/login"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Staff Login</Button></Link>

            <Link to="/admin/login"><Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">Admin Login</Button></Link>

          </div>

        </CardContent>

      </Card>

    </section>

  </>

)



export default Home

