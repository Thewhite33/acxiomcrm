import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Building2, Users, TrendingUp, Calendar, CheckCircle2, XCircle, DollarSign, Activity } from "lucide-react"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id
  const role = session.user.role || "SALES_EXECUTIVE"
  const isAdmin = role === "ADMIN"

  const customerWhere = role === "SALES_EXECUTIVE" ? { assignedToId: userId } : {}
  const leadWhere = role === "SALES_EXECUTIVE" ? { assignedToId: userId } : {}
  const oppWhere = role === "SALES_EXECUTIVE" ? { ownerId: userId } : {}
  const followUpWhere = role === "SALES_EXECUTIVE" ? { assignedToId: userId } : {}

  const [
    totalCustomers,
    totalLeads,
    openLeads,
    totalOpportunities,
    openOpportunities,
    wonOpportunities,
    lostOpportunities,
    pipelineAgg,
    leadStatusCounts,
    oppStageCounts,
    recentAuditLogs,
    upcomingFollowUps,
  ] = await Promise.all([
    prisma.customer.count({ where: customerWhere }),
    prisma.lead.count({ where: leadWhere }),
    prisma.lead.count({
      where: { ...leadWhere, status: { notIn: ["CONVERTED", "LOST"] } },
    }),
    prisma.opportunity.count({ where: oppWhere }),
    prisma.opportunity.count({
      where: { ...oppWhere, stage: { notIn: ["WON", "LOST"] } },
    }),
    prisma.opportunity.count({
      where: { ...oppWhere, stage: "WON" },
    }),
    prisma.opportunity.count({
      where: { ...oppWhere, stage: "LOST" },
    }),
    prisma.opportunity.aggregate({
      where: { ...oppWhere, stage: { notIn: ["WON", "LOST"] } },
      _sum: { amount: true },
    }),
    prisma.lead.groupBy({
      by: ["status"],
      where: leadWhere,
      _count: { status: true },
    }),
    prisma.opportunity.groupBy({
      by: ["stage"],
      where: oppWhere,
      _count: { stage: true },
      _sum: { amount: true },
    }),
    isAdmin
      ? prisma.auditLog.findMany({
          take: 6,
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    !isAdmin
      ? prisma.followUp.findMany({
          where: { ...followUpWhere, status: "PLANNED" },
          take: 6,
          orderBy: { followUpDate: "asc" },
          include: {
            customer: { select: { id: true, name: true } },
            lead: { select: { id: true, name: true } },
            assignedTo: { select: { name: true } },
          },
        })
      : Promise.resolve([]),
  ])

  const totalPipelineValue = pipelineAgg._sum.amount ?? 0

  const kpis = [
    { title: "Total Customers", value: totalCustomers, icon: Building2, color: "text-blue-600 bg-blue-50" },
    { title: "Total Leads", value: totalLeads, icon: Users, color: "text-indigo-600 bg-indigo-50" },
    { title: "Open Leads", value: openLeads, icon: Activity, color: "text-cyan-600 bg-cyan-50" },
    { title: "Total Opportunities", value: totalOpportunities, icon: TrendingUp, color: "text-purple-600 bg-purple-50" },
    { title: "Open Opportunities", value: openOpportunities, icon: Calendar, color: "text-amber-600 bg-amber-50" },
    { title: "Won Opportunities", value: wonOpportunities, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
    { title: "Lost Opportunities", value: lostOpportunities, icon: XCircle, color: "text-rose-600 bg-rose-50" },
    {
      title: "Total Pipeline Value",
      value: `₹${totalPipelineValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-emerald-600 bg-emerald-50",
    },
  ]

  const statusMap = leadStatusCounts.reduce((acc, curr) => {
    acc[curr.status] = curr._count.status
    return acc
  }, {} as Record<string, number>)

  const stagesList = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]
  const stageMap = oppStageCounts.reduce((acc, curr) => {
    acc[curr.stage] = { count: curr._count.stage, amount: curr._sum.amount || 0 }
    return acc
  }, {} as Record<string, { count: number; amount: number }>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">Real-time CRM metrics and sales pipeline</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.title} className="bg-white border border-slate-200 rounded-lg p-5 flex items-center justify-between shadow-xs">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpi.value}</p>
              </div>
              {/* <div className={`p-3 rounded-lg ${kpi.color}`}>
                <Icon className="h-5 w-5" />
              </div> */}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Lead Status Breakdown</h2>
          <div className="space-y-3">
            {[
              { label: "New", key: "NEW", color: "bg-blue-500" },
              { label: "Contacted", key: "CONTACTED", color: "bg-yellow-500" },
              { label: "Qualified", key: "QUALIFIED", color: "bg-emerald-500" },
              { label: "Unqualified", key: "UNQUALIFIED", color: "bg-slate-400" },
              { label: "Converted", key: "CONVERTED", color: "bg-purple-500" },
              { label: "Lost", key: "LOST", color: "bg-rose-500" },
            ].map((s) => {
              const count = statusMap[s.key] || 0
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span>{s.label}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${s.color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Opportunity Pipeline by Stage</h2>
          <div className="space-y-3">
            {stagesList.map((stage) => {
              const data = stageMap[stage] || { count: 0, amount: 0 }
              const pct = totalOpportunities > 0 ? Math.round((data.count / totalOpportunities) * 100) : 0
              return (
                <div key={stage}>
                  <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                    <span className="capitalize">{stage.toLowerCase()}</span>
                    <span>{data.count} deals (${data.amount.toLocaleString()})</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {isAdmin ? (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Security & Business Audit Trail</h2>
            <Link href="/audit" className="text-xs text-blue-600 font-semibold hover:underline">
              View All Audit Logs &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-medium">User</th>
                  <th className="px-4 py-2 font-medium">Action</th>
                  <th className="px-4 py-2 font-medium">Module</th>
                  <th className="px-4 py-2 font-medium">Result</th>
                  <th className="px-4 py-2 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAuditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-medium text-slate-900">{log.user?.name || "System"}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{log.module}</td>
                    <td className="px-4 py-2.5">{log.result}</td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {recentAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No recent activity recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Upcoming Follow-Ups & Action Items</h2>
            <Link href="/followups" className="text-xs text-blue-600 font-semibold hover:underline">
              View All Follow-Ups &rarr;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2 font-medium">Subject</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 font-medium">Related Contact / Lead</th>
                  <th className="px-4 py-2 font-medium">Scheduled Date</th>
                  <th className="px-4 py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingFollowUps.map((fu) => (
                  <tr key={fu.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-900">{fu.subject}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {fu.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {fu.customer?.name || fu.lead?.name || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {new Date(fu.followUpDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <Link href={`/followups/${fu.id}/edit`} className="text-xs text-blue-600 font-medium hover:underline">
                        Update Status
                      </Link>
                    </td>
                  </tr>
                ))}
                {upcomingFollowUps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                      No upcoming follow-ups scheduled
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
