import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Clock, AlertCircle } from "lucide-react"

export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { view, status } = await searchParams

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }

  if (view === "upcoming") {
    where.followUpDate = { gte: today }
    where.status = "PLANNED"
  } else if (view === "overdue") {
    where.followUpDate = { lt: today }
    where.status = "PLANNED"
  } else if (status) {
    where.status = status
  }

  const followUps = await prisma.followUp.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { followUpDate: "asc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-Up Management</h1>
          <p className="text-sm text-slate-500">Track planned calls, meetings, reminders and overdue items</p>
        </div>
        <Link href="/followups/new">
          <Button className="flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Schedule Follow-Up
          </Button>
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center gap-2">
        <Link
          href="/followups"
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${!view && !status ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All Activities
        </Link>
        <Link
          href="/followups?view=upcoming"
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${view === "upcoming" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          <Clock className="h-3.5 w-3.5" /> Upcoming
        </Link>
        <Link
          href="/followups?view=overdue"
          className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 ${view === "overdue" ? "bg-rose-600 text-white" : "bg-rose-50 text-rose-700 hover:bg-rose-100"}`}
        >
          <AlertCircle className="h-3.5 w-3.5" /> Overdue
        </Link>
        <div className="h-4 w-[1px] bg-slate-200 mx-1" />
        {["PLANNED", "COMPLETED", "MISSED", "CANCELLED"].map((st) => (
          <Link
            key={st}
            href={`/followups?status=${st}`}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${status === st ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {st}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Scheduled Date</th>
                <th className="px-4 py-3 font-medium">Related Entity</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Assigned To</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followUps.map((fu) => {
                const isOverdue = new Date(fu.followUpDate) < today && fu.status === "PLANNED"
                return (
                  <tr key={fu.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">{fu.subject}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {fu.type}
                      </span>
                    </td>
                    <td className={`px-4 py-3 font-medium ${isOverdue ? "text-rose-600 font-bold" : "text-slate-700"}`}>
                      {new Date(fu.followUpDate).toLocaleDateString()}
                      {isOverdue && <span className="ml-1 text-[10px] uppercase tracking-wider">(Overdue)</span>}
                    </td>
                    <td className="px-4 py-3">
                      {fu.customer && (
                        <Link href={`/customers/${fu.customer.id}`} className="text-blue-600 hover:underline block">
                          Customer: {fu.customer.name}
                        </Link>
                      )}
                      {fu.lead && (
                        <Link href={`/leads/${fu.lead.id}`} className="text-indigo-600 hover:underline block">
                          Lead: {fu.lead.name}
                        </Link>
                      )}
                      {fu.opportunity && (
                        <Link href={`/opportunities/${fu.opportunity.id}`} className="text-purple-600 hover:underline block">
                          Deal: {fu.opportunity.name}
                        </Link>
                      )}
                      {!fu.customer && !fu.lead && !fu.opportunity && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          fu.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-700"
                            : fu.status === "MISSED" || isOverdue
                            ? "bg-rose-100 text-rose-700"
                            : fu.status === "CANCELLED"
                            ? "bg-slate-100 text-slate-500"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {fu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{fu.assignedTo?.name || "Unassigned"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/followups/${fu.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit / Status
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {followUps.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No follow-ups recorded matching this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
