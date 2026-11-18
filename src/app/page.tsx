
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900">

      {/* Header */}
      <header className="h-16 border-b border-slate-200 px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          AcxiomCRM
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </Link>

          <Link href="/register">
            <Button size="sm">
              Register
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-4xl mx-auto px-6 py-24 md:py-32 text-center">

          <p className="text-sm font-medium text-blue-600 mb-5">
            Enterprise Sales Management
          </p>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Manage Your Sales.
            <br />
            Grow Your Business.
          </h1>

          <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-9 leading-relaxed">
            A centralized platform to manage leads, customers,
            sales activities, opportunities, and team performance.
          </p>

          <div className="flex justify-center gap-3">
            <Link href="/login">
              <Button size="lg" className="px-8">
                Get Started
              </Button>
            </Link>

            <Link href="/login">
              <Button size="lg" variant="outline" className="px-8">
                Live Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Highlights */}
        <section className="border-t border-slate-200 py-16 px-6">
          <div className="max-w-5xl mx-auto">

            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold mb-3">
                Everything You Need to Manage Sales
              </h2>
              <p className="text-sm text-slate-500">
                Simple tools for better visibility, productivity, and control.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

              <div>
                <h3 className="font-semibold mb-2">
                  Lead Management
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Capture, organize, qualify, and assign leads
                  to the right sales executives.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Customer Management
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Maintain customer information, track interactions,
                  and manage relationships.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Sales Pipeline
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Monitor opportunities, track deal progress,
                  and manage expected closures.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Task Management
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Assign tasks, monitor progress, and keep
                  your sales team accountable.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Follow-Up Scheduling
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Schedule calls, meetings, and follow-ups
                  without missing important activities.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">
                  Role-Based Access
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Manage administrators, managers, and sales
                  executives with controlled access.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-slate-50 border-y border-slate-200 py-14 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl font-bold mb-3">
              Built for Secure Sales Operations
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              With role-based permissions, data validation,
              activity tracking, and audit logs, AcxiomCRM
              keeps your sales operations organized and accountable.
            </p>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-6 text-center">
        <p className="text-xs text-slate-500">
          © 2026 AcxiomCRM. All rights reserved.
        </p>
      </footer>

    </div>
  )
}
