import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function PipelineReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.ownerId = session.user.id
  }

  const [opportunities, stageGroups, ownerGroups] = await Promise.all([
    prisma.opportunity.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        owner: { select: { name: true } },
      },
    }),
    prisma.opportunity.groupBy({
      by: ["stage"],
      where,
      _count: { stage: true },
      _sum: { amount: true },
    }),
    prisma.opportunity.groupBy({
      by: ["ownerId"],
      where,
      _count: { ownerId: true },
      _sum: { amount: true },
    }),
  ])

  const totalAmount = opportunities.reduce((acc, curr) => acc + curr.amount, 0)
  const weightedAmount = opportunities.reduce(
    (acc, curr) => acc + (curr.amount * curr.probability) / 100,
    0
  )
  const wonAmount = opportunities
    .filter((o) => o.stage === "WON")
    .reduce((acc, curr) => acc + curr.amount, 0)
  const lostAmount = opportunities
    .filter((o) => o.stage === "LOST")
    .reduce((acc, curr) => acc + curr.amount, 0)

  const ownerIds = ownerGroups.map((og) => og.ownerId).filter(Boolean) as string[]
  const users = await prisma.user.findMany({
    where: { id: { in: ownerIds } },
    select: { id: true, name: true },
  })
  const userMap = users.reduce((acc, u) => {
    acc[u.id] = u.name
    return acc
  }, {} as Record<string, string>)

  const exportData = opportunities.map((o) => ({
    "Deal Name": o.name,
    "Customer": o.customer.name,
    "Stage": o.stage,
    "Deal Value ($)": o.amount,
    "Probability (%)": o.probability,
    "Weighted Value ($)": Math.round((o.amount * o.probability) / 100),
    "Owner": o.owner?.name || "Unassigned",
    "Close Date": o.expectedCloseDate.toISOString().split("T")[0],
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
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pipeline Performance Report</h1>
            <p className="text-sm text-slate-500">Stage breakdown, probability weighting, and sales velocity</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`pipeline_report_${new Date().toISOString().split("T")[0]}`}
            sheetName="Pipeline"
            label="Download Excel"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">${totalAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Weighted Value</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">
            ${weightedAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Won Revenue</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">${wonAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lost Revenue</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">${lostAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Stage Distribution</h2>
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 font-medium">Stage</th>
                <th className="px-3 py-2 font-medium text-center">Deals</th>
                <th className="px-3 py-2 font-medium text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stageGroups.map((sg) => (
                <tr key={sg.stage}>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{sg.stage}</td>
                  <td className="px-3 py-2.5 text-center">{sg._count.stage}</td>
                  <td className="px-3 py-2.5 text-right font-medium">
                    ${(sg._sum.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Pipeline by Owner</h2>
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium text-center">Deals</th>
                <th className="px-3 py-2 font-medium text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ownerGroups.map((og) => (
                <tr key={og.ownerId || "unassigned"}>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">
                    {og.ownerId ? userMap[og.ownerId] || "Unknown" : "Unassigned"}
                  </td>
                  <td className="px-3 py-2.5 text-center">{og._count.ownerId}</td>
                  <td className="px-3 py-2.5 text-right font-medium">
                    ${(og._sum.amount || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
