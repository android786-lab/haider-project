import { assets } from '../assets/assets'
import { MapPin, Phone, Mail, Briefcase } from 'lucide-react'
import PageHeader from '../components/shared/PageHeader'
import { Card, CardContent } from '../components/ui/Card'
import Button from '../components/ui/Button'

const Contact = () => (
  <div className="page-container">
    <PageHeader title="Contact Us" description="We'd love to hear from you." />

    <div className="grid lg:grid-cols-2 gap-10 items-start">
      <img className="w-full rounded-2xl shadow-elevated" src={assets.contact_image} alt="Contact Doctor Hub" />
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-5">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600"><MapPin className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold text-slate-900">Our Office</p>
                <p className="text-sm text-slate-500 mt-1">Jinnah Road, Suite 350<br />Vehari, Pakistan</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600"><Phone className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold text-slate-900">Phone</p>
                <p className="text-sm text-slate-500 mt-1">+92-3023465721</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600"><Mail className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <p className="text-sm text-slate-500 mt-1">hamzaweb3565@gmail.com</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600"><Briefcase className="w-5 h-5" /></div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">Careers at Doctor Hub</p>
                <p className="text-sm text-slate-500 mt-1">Learn more about our teams and job openings.</p>
                <Button variant="outline" size="sm" className="mt-4">Explore Jobs</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
)

export default Contact
