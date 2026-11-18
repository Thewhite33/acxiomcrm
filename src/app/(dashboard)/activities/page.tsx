import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { type, status } = await searchParams

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }
  if (type) where.activityType = type
  if (status) where.status = status

  const activities = await prisma.activity.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { activityDate: "desc" },
  })

  const exportData = activities.map((a) => ({
    "Activity Type": a.activityType,
    "Subject": a.subject,
    "Date": a.activityDate.toISOString().split("T")[0],
    "Customer": a.customer?.name || "—",
    "Lead": a.lead?.name || "—",
    "Assigned To": a.assignedTo?.name || "Unassigned",
    "Status": a.status,
    "Description": a.description || "—",
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Activity Management</h1>
          <p className="text-sm text-slate-500">Record and track calls, meetings, emails, and tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`activities_${new Date().toISOString().split("T")[0]}`}
            sheetName="Activities"
            label="Export Excel"
          />
          <Link href="/activities/new">
            <Button className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Log Activity
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center gap-2">
        <Link
          href="/activities"
          className={`px-3 py-1.5 rounded-md text-xs font-semibold ${!type ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
        >
          All
        </Link>
        {["Call", "Meeting", "Email", "Task"].map((t) => (
          <Link
            key={t}
            href={`/activities?type=${t}`}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${type === t ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Related Entity</th>
                <th className="px-4 py-3 font-medium">Assigned User</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.map((act) => (
                <tr key={act.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {act.activityType}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{act.subject}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(act.activityDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {act.customer && (
                      <Link href={`/customers/${act.customer.id}`} className="text-blue-600 hover:underline block">
                        Customer: {act.customer.name}
                      </Link>
                    )}
                    {act.lead && (
                      <Link href={`/leads/${act.lead.id}`} className="text-indigo-600 hover:underline block">
                        Lead: {act.lead.name}
                      </Link>
                    )}
                    {!act.customer && !act.lead && <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{act.assignedTo?.name || "Unassigned"}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                      {act.status}
                    </span>
                  </td>
                </tr>
              ))}
              {activities.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No activities recorded yet.
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
