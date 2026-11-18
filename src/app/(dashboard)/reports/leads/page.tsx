import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function LeadReportPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { status } = await searchParams

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }
  if (status) {
    where.status = status
  }

  const leads = await prisma.lead.findMany({
    where,
    include: { assignedTo: true, customer: true },
    orderBy: { createdAt: "desc" },
  })

  const exportData = leads.map((l) => ({
    "Lead Name": l.name,
    "Email": l.email,
    "Phone": l.phone || "—",
    "Company": l.companyName || "—",
    "Source": l.source || "—",
    "Status": l.status,
    "Priority": l.priority,
    "Expected Value": l.expectedValue ? `$${l.expectedValue.toLocaleString()}` : "—",
    "Assigned To": l.assignedTo?.name || "Unassigned",
    "Converted Customer": l.customer?.name || "—",
    "Converted Date": l.convertedAt ? l.convertedAt.toISOString().split("T")[0] : "—",
    "Created Date": l.createdAt.toISOString().split("T")[0],
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Report</h1>
            <p className="text-sm text-slate-500">Lead status, sources, conversion tracking, and priority levels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`lead_report_${new Date().toISOString().split("T")[0]}`}
            sheetName="Leads"
            label="Download Excel"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <select
            name="status"
            defaultValue={status || ""}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800"
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
          <button
            type="submit"
            className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-800"
          >
            Apply Filter
          </button>
          {status && (
            <Link href="/reports/leads" className="px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-50">
              Clear
            </Link>
          )}
        </form>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 font-medium">Lead Name</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Source</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Priority</th>
                <th className="px-3 py-2.5 font-medium">Assigned To</th>
                <th className="px-3 py-2.5 font-medium">Converted Customer</th>
                <th className="px-3 py-2.5 font-medium">Created Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    No leads found matching filter criteria.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{l.name}</td>
                    <td className="px-3 py-2.5">{l.email}</td>
                    <td className="px-3 py-2.5">{l.source ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        l.status === "QUALIFIED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        l.status === "CONVERTED" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        l.status === "LOST" || l.status === "UNQUALIFIED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{l.priority}</td>
                    <td className="px-3 py-2.5">{l.assignedTo?.name ?? "—"}</td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {l.customer ? (
                        <span className="text-blue-600 font-medium">{l.customer.name}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {l.createdAt.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">{leads.length} lead record(s)</p>
    </div>
  )
}
