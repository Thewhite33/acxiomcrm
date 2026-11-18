import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function ConversionReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      customer: true,
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const totalLeads = leads.length
  const convertedLeads = leads.filter((l) => l.status === "CONVERTED").length
  const qualifiedLeads = leads.filter((l) => l.status === "QUALIFIED").length
  const lostLeads = leads.filter((l) => l.status === "LOST" || l.status === "UNQUALIFIED").length
  const openLeads = leads.filter((l) => l.status === "NEW" || l.status === "CONTACTED").length

  const resolvedLeads = convertedLeads + lostLeads
  const conversionRate = resolvedLeads > 0 ? ((convertedLeads / resolvedLeads) * 100).toFixed(1) : "0.0"
  const overallRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : "0.0"

  const exportData = leads.map((l) => ({
    "Lead Name": l.name,
    "Email": l.email,
    "Status": l.status,
    "Assigned To": l.assignedTo?.name || "Unassigned",
    "Is Converted": l.status === "CONVERTED" ? "YES" : "NO",
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lead Conversion Analytics</h1>
            <p className="text-sm text-slate-500">Lead conversion rate, velocity, and customer transition metrics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`lead_conversion_report_${new Date().toISOString().split("T")[0]}`}
            sheetName="Conversions"
            label="Download Excel"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalLeads}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Converted Leads</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{convertedLeads}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion (Resolved)</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{conversionRate}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Conversion</p>
          <p className="text-2xl font-extrabold text-slate-700 mt-1">{overallRate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 font-semibold text-sm text-slate-800">
          Conversion Log & Lead Outcomes
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5 font-medium">Lead Name</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Assigned Rep</th>
                <th className="px-3 py-2.5 font-medium">Converted Customer</th>
                <th className="px-3 py-2.5 font-medium">Converted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                    No lead conversion data available.
                  </td>
                </tr>
              ) : (
                leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{l.name}</td>
                    <td className="px-3 py-2.5">{l.email}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        l.status === "CONVERTED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : l.status === "LOST" || l.status === "UNQUALIFIED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{l.assignedTo?.name ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      {l.customer ? (
                        <span className="font-semibold text-blue-600">{l.customer.name}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {l.convertedAt
                        ? l.convertedAt.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
