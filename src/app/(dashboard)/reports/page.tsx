import Link from "next/link"
import { auth } from "@/lib/auth"
import { Users, UserPlus, Calendar, Target, TrendingUp, RefreshCw, Activity, ShieldCheck } from "lucide-react"

export default async function ReportsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  const reports = [
    {
      title: "Customer Directory Report",
      href: "/reports/customers",
      description: "Customer accounts, statuses, company affiliations, and assigned ownership.",
      icon: Users,
    },
    {
      title: "Lead Acquisition Report",
      href: "/reports/leads",
      description: "Track inbound leads by source channel, priority level, and pipeline qualification.",
      icon: UserPlus,
    },
    {
      title: "Follow-Up Action Report",
      href: "/reports/followups",
      description: "Monitor planned tasks, overdue communications, and completed client engagements.",
      icon: Calendar,
    },
    {
      title: "Opportunity Forecast Report",
      href: "/reports/opportunities",
      description: "Analyze active deal stages, forecasted closure dates, and win/loss records.",
      icon: Target,
    },
    {
      title: "Pipeline Velocity Report",
      href: "/reports/pipeline",
      description: "Stage-wise deal distribution, owner performance, and probability-weighted pipeline.",
      icon: TrendingUp,
    },
    {
      title: "Lead Conversion Analytics",
      href: "/reports/conversion",
      description: "Measure qualified conversion rates, transition velocity, and generated accounts.",
      icon: RefreshCw,
    },
    {
      title: "User Engagement Report",
      href: "/reports/activity",
      description: "Employee productivity metrics: logged calls, client meetings, emails, and completed tasks.",
      icon: Activity,
    },
    ...(isAdmin
      ? [
          {
            title: "Security & Audit Trail",
            href: "/audit",
            description: "Immutable compliance log tracking logins, permissions, record changes, and conversions.",
            icon: ShieldCheck,
          },
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reports & Business Intelligence</h1>
        <p className="text-sm text-slate-500">Comprehensive CRM analytics with real-time Excel data export</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => {
          const Icon = r.icon
          return (
            <Link key={r.href} href={r.href}>
              <div className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-xs hover:border-slate-300 transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="h-9 w-9 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 mb-3">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 mb-1">{r.title}</h2>
                  <p className="text-xs text-slate-500 leading-relaxed">{r.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-900 flex items-center justify-between">
                  <span>View Report</span>
                  <span>&rarr;</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
