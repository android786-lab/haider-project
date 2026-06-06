import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, Shield, Users, HeartPulse } from 'lucide-react'
import Button from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

const FEATURES = [
  { icon: Calendar, title: 'Smart Scheduling', desc: 'Book appointments with verified doctors in minutes.' },
  { icon: Shield, title: 'Secure Records', desc: 'Medical history protected with immutable audit trails.' },
  { icon: Users, title: 'Multi-Role Platform', desc: 'Patients, doctors, assistants, and admins — one system.' },
  { icon: HeartPulse, title: 'End-to-End Care', desc: 'From booking to prescription — complete workflow.' },
]

const Home = () => (
  <>
    <section className="relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
        <div className="max-w-3xl">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 mb-6">
            Healthcare Platform
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Your health journey,{' '}
            <span className="text-primary-600">simplified</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 mt-6 leading-relaxed max-w-2xl">
            Doctor Hub connects patients with trusted healthcare professionals — manage appointments,
            medical records, and payments in one professional platform.
          </p>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link to="/register">
              <Button size="lg">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>

    <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <Card key={title} className="hover:shadow-elevated transition-all duration-300 border-0 shadow-card">
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
  </>
)

export default Home
