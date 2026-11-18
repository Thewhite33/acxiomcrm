import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function FollowUpReportPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { tab } = await searchParams
  const activeTab = tab || "all"
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }

  if (activeTab === "upcoming") {
    where.status = "PLANNED"
    where.followUpDate = { gte: today }
  } else if (activeTab === "overdue") {
    where.status = "PLANNED"
    where.followUpDate = { lt: today }
  } else if (activeTab === "completed") {
    where.status = "COMPLETED"
  } else if (activeTab === "cancelled") {
    where.status = "CANCELLED"
  }

  const followups = await prisma.followUp.findMany({
    where,
    include: {
      assignedTo: true,
      customer: true,
      lead: true,
      opportunity: true,
    },
    orderBy: { followUpDate: "asc" },
  })

  const exportData = followups.map((f) => ({
    "Subject": f.subject,
    "Type": f.type,
    "Status": f.status,
    "Follow-Up Date": f.followUpDate.toISOString().split("T")[0],
    "Assigned To": f.assignedTo?.name || "Unassigned",
    "Customer": f.customer?.name || "—",
    "Lead": f.lead?.name || "—",
    "Opportunity": f.opportunity?.name || "—",
    "Notes": f.notes || "—",
    "Created Date": f.createdAt.toISOString().split("T")[0],
  }))

  const tabs = [
    { key: "all", label: "All Follow-Ups" },
    { key: "upcoming", label: "Upcoming" },
    { key: "overdue", label: "Overdue" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ]

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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Follow-Up Report</h1>
            <p className="text-sm text-slate-500">Scheduled communications, overdue action items, and completed tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`followup_report_${new Date().toISOString().split("T")[0]}`}
            sheetName="FollowUps"
            label="Download Excel"
          />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/reports/followups?tab=${t.key}`}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors whitespace-nowrap ${
              activeTab === t.key
                ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 font-medium">Subject</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Due Date</th>
                <th className="px-3 py-2.5 font-medium">Assigned To</th>
                <th className="px-3 py-2.5 font-medium">Related Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {followups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    No follow-ups found for this category.
                  </td>
                </tr>
              ) : (
                followups.map((f) => {
                  const isPast = new Date(f.followUpDate) < today && f.status === "PLANNED"
                  const relatedEntity = f.customer?.name
                    ? `Customer: ${f.customer.name}`
                    : f.lead?.name
                    ? `Lead: ${f.lead.name}`
                    : f.opportunity?.name
                    ? `Opp: ${f.opportunity.name}`
                    : "—"

                  return (
                    <tr key={f.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-900">{f.subject}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {f.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          f.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPast
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {isPast ? "OVERDUE" : f.status}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 ${isPast ? "text-rose-600 font-semibold" : "text-slate-600"}`}>
                        {f.followUpDate.toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2.5">{f.assignedTo?.name ?? "—"}</td>
                      <td className="px-3 py-2.5 text-slate-600">{relatedEntity}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">{followups.length} follow-up record(s)</p>
    </div>
  )
}
