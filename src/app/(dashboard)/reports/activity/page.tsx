import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function UserActivityReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }

  const activities = await prisma.activity.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true, role: true } },
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
    },
    orderBy: { activityDate: "desc" },
  })

  const callsCount = activities.filter((a) => a.activityType === "Call" || a.activityType === "CALL").length
  const meetingsCount = activities.filter((a) => a.activityType === "Meeting" || a.activityType === "MEETING").length
  const emailsCount = activities.filter((a) => a.activityType === "Email" || a.activityType === "EMAIL").length
  const tasksCount = activities.filter((a) => a.activityType === "Task" || a.activityType === "TASK").length

  const exportData = activities.map((a) => ({
    "Employee": a.assignedTo?.name || "Unassigned",
    "Role": a.assignedTo?.role || "—",
    "Activity Type": a.activityType,
    "Subject": a.subject,
    "Description": a.description || "—",
    "Customer": a.customer?.name || "—",
    "Lead": a.lead?.name || "—",
    "Logged Date": a.activityDate.toISOString().split("T")[0],
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/reports">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Reports
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">User Activity Report</h1>
            <p className="text-sm text-slate-500">Employee engagement metrics, calls, meetings, emails, and completed tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`user_activity_report_${new Date().toISOString().split("T")[0]}`}
            sheetName="Activities"
            label="Download Excel"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calls Logged</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{callsCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Meetings Held</p>
          <p className="text-2xl font-extrabold text-indigo-600 mt-1">{meetingsCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Emails Sent</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{emailsCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tasks & Notes</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{tasksCount + (activities.length - (callsCount + meetingsCount + emailsCount + tasksCount))}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 font-medium">Employee</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Subject</th>
                <th className="px-3 py-2.5 font-medium">Related Entity</th>
                <th className="px-3 py-2.5 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    No logged user activities found.
                  </td>
                </tr>
              ) : (
                activities.map((a) => {
                  const related = a.customer?.name
                    ? `Customer: ${a.customer.name}`
                    : a.lead?.name
                    ? `Lead: ${a.lead.name}`
                    : "—"

                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{a.assignedTo?.name || "Unassigned"}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {a.activityType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-800">{a.subject}</td>
                      <td className="px-3 py-2.5 text-slate-600">{related}</td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {a.activityDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">{activities.length} activity record(s)</p>
    </div>
  )
}
