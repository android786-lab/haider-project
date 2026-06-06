import { assets } from '../assets/assets'
import { Target, Zap, MapPin, Heart } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import { Card, CardContent } from '../components/ui/Card'

const WHY_US = [
  { icon: Zap, title: 'Efficiency', desc: 'Streamlined appointment scheduling that fits your busy lifestyle.' },
  { icon: MapPin, title: 'Convenience', desc: 'Access trusted healthcare professionals in your area.' },
  { icon: Heart, title: 'Personalization', desc: 'Tailored care paths and reminders for your health journey.' },
]

const About = () => (
  <div className="page-container">
    <PageHeader title="About Doctor Hub" description="Modern healthcare coordination for patients and providers." />

    <div className="grid lg:grid-cols-2 gap-10 items-center mb-16">
      <img className="w-full rounded-2xl shadow-elevated" src={assets.about_image} alt="About Doctor Hub" />
      <div className="space-y-5 text-slate-600 leading-relaxed">
        <p>
          Doctor Hub is a production-style healthcare consultation platform. Patients find doctors, book appointments,
          share medical history securely, and complete payment verification before confirmation.
        </p>
        <p>
          Doctors manage clinics, schedules, and prescriptions with append-only medical records. Assistants verify
          payments. Admins oversee the entire system.
        </p>
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-50">
          <Target className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-900">Our Vision</p>
            <p className="text-sm mt-1">Transparent, secure healthcare — every record follows rules that protect patients and providers.</p>
          </div>
        </div>
      </div>
    </div>

    <h2 className="text-xl font-bold text-slate-900 mb-6">Why Choose Us</h2>
    <div className="grid sm:grid-cols-3 gap-5">
      {WHY_US.map(({ icon: Icon, title, desc }) => (
        <Card key={title} className="group hover:shadow-elevated hover:border-primary-200 transition-all duration-300">
          <CardContent className="pt-6">
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600 w-fit mb-4 group-hover:bg-primary-600 group-hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-2">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

export default About
