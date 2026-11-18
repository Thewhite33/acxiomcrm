import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Users, Building2, TrendingUp, Calendar, ShieldCheck, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="border-b bg-white border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
            A
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">AcxiomCRM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button>Register</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-6 text-center max-w-4xl mx-auto">
          <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-100 rounded-full">
            Enterprise Sales Management
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-5">
            Modern CRM for Agile Sales Teams
          </h1>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            AcxiomCRM unifies customer management, lead conversion, pipeline forecasting, and activity tracking in a secure, role-based platform.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline">
                Live Demo
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 px-6 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Key Highlights</h2>
          <p className="text-center text-slate-500 mb-10 text-sm">Engineered for clarity, speed, and governance.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-xs flex items-start gap-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Strict Validation</h3>
                <p className="text-sm text-slate-600">Client and server-side validation on email, phone, opportunity value, and planned dates.</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-xs flex items-start gap-4">
              <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Role-Based Access</h3>
                <p className="text-sm text-slate-600">Scoped permissions for Admin, Manager, and Sales Executives with account lockout security.</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-lg border border-slate-200 shadow-xs flex items-start gap-4">
              <TrendingUp className="h-6 w-6 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Audited Operations</h3>
                <p className="text-sm text-slate-600">Append-only audit trail capturing logins, status transitions, and data modifications.</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center mb-8">Core Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <Users className="h-6 w-6 text-blue-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Lead Management</h3>
              <p className="text-xs text-slate-500">Capture, qualify, assign to executives, and convert seamlessly to customers.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <Building2 className="h-6 w-6 text-emerald-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Customer 360</h3>
              <p className="text-xs text-slate-500">Maintain contact master data with status tracking and full interaction history.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <TrendingUp className="h-6 w-6 text-purple-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Opportunity Pipeline</h3>
              <p className="text-xs text-slate-500">Multi-stage pipeline tracking with weighted values and expected closing dates.</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-lg p-5">
              <Calendar className="h-6 w-6 text-amber-600 mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Follow-Up Scheduling</h3>
              <p className="text-xs text-slate-500">Schedule calls, meetings, and emails with alerts for upcoming and overdue items.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        AcxiomCRM &copy; 2026. All rights reserved.
      </footer>
    </div>
  )
}
