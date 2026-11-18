import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function OpportunityReportPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { stage } = await searchParams

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.ownerId = session.user.id
  }
  if (stage) {
    where.stage = stage
  }

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: { customer: true, owner: true },
    orderBy: { createdAt: "desc" },
  })

  const totalPipeline = opportunities
    .filter((o) => o.stage !== "WON" && o.stage !== "LOST")
    .reduce((sum, o) => sum + o.amount, 0)

  const totalWeighted = opportunities
    .filter((o) => o.stage !== "WON" && o.stage !== "LOST")
    .reduce((sum, o) => sum + (o.amount * o.probability) / 100, 0)

  const wonAmount = opportunities
    .filter((o) => o.stage === "WON")
    .reduce((sum, o) => sum + o.amount, 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

  const stages = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]

  const exportData = opportunities.map((o) => ({
    "Opportunity Name": o.name,
    "Customer": o.customer.name,
    "Stage": o.stage,
    "Amount ($)": o.amount,
    "Probability (%)": o.probability,
    "Weighted Value ($)": Math.round((o.amount * o.probability) / 100),
    "Expected Close Date": o.expectedCloseDate.toISOString().split("T")[0],
    "Owner": o.owner?.name || "Unassigned",
    "Created Date": o.createdAt.toISOString().split("T")[0],
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Opportunity Report</h1>
            <p className="text-sm text-slate-500">Pipeline forecasting, stage velocity, and win/loss analytics</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`opportunity_report_${new Date().toISOString().split("T")[0]}`}
            sheetName="Opportunities"
            label="Download Excel"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Pipeline</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{fmt(totalPipeline)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted Forecast</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{fmt(totalWeighted)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Won Revenue</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{fmt(wonAmount)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <form method="GET" className="flex flex-wrap items-center gap-2">
          <select
            name="stage"
            defaultValue={stage || ""}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs bg-white text-slate-800"
          >
            <option value="">All Stages</option>
            {stages.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-slate-900 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-slate-800"
          >
            Apply Filter
          </button>
          {stage && (
            <Link href="/reports/opportunities" className="px-3 py-1.5 text-xs border border-slate-300 rounded text-slate-600 hover:bg-slate-50">
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
                <th className="px-3 py-2.5 font-medium">Deal Name</th>
                <th className="px-3 py-2.5 font-medium">Customer</th>
                <th className="px-3 py-2.5 font-medium">Stage</th>
                <th className="px-3 py-2.5 font-medium text-right">Amount</th>
                <th className="px-3 py-2.5 font-medium text-right">Probability</th>
                <th className="px-3 py-2.5 font-medium text-right">Weighted Value</th>
                <th className="px-3 py-2.5 font-medium">Close Date</th>
                <th className="px-3 py-2.5 font-medium">Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-6 text-center text-slate-400">
                    No opportunities found matching filter criteria.
                  </td>
                </tr>
              ) : (
                opportunities.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{o.name}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-700">{o.customer.name}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        o.stage === "WON" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        o.stage === "LOST" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}>
                        {o.stage}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-900">{fmt(o.amount)}</td>
                    <td className="px-3 py-2.5 text-right">{o.probability}%</td>
                    <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                      {fmt((o.amount * o.probability) / 100)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">
                      {o.expectedCloseDate.toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-3 py-2.5">{o.owner?.name ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500">{opportunities.length} opportunity record(s)</p>
    </div>
  )
}
