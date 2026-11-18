import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, Search } from "lucide-react"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

const stageStyles: Record<string, string> = {
  QUALIFICATION: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-yellow-100 text-yellow-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
}

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ stage?: string; search?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { stage, search } = await searchParams

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.ownerId = session.user.id
  }
  if (stage) where.stage = stage
  if (search) {
    where.name = { contains: search, mode: "insensitive" }
  }

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const exportData = opportunities.map((o) => ({
    "Opportunity Name": o.name,
    "Customer": o.customer.name,
    "Stage": o.stage,
    "Amount (₹)": o.amount,
    "Probability (%)": o.probability,
    "Weighted Value ($)": Math.round((o.amount * o.probability) / 100),
    "Expected Close Date": o.expectedCloseDate.toISOString().split("T")[0],
    "Owner": o.owner?.name || "Unassigned",
    "Created Date": o.createdAt.toISOString().split("T")[0],
  }))

  const stages = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Opportunities</h1>
          <p className="text-sm text-slate-500">Track and forecast deals across your pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`opportunities_${new Date().toISOString().split("T")[0]}`}
            sheetName="Opportunities"
            label="Export Excel"
          />
          <Link href="/opportunities/new">
            <Button className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> New Opportunity
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form method="GET" className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search || ""}
              placeholder="Search opportunity name..."
              className="border border-slate-300 rounded-md pl-9 pr-3 py-1.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button type="submit" variant="outline" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <Link
            href="/opportunities"
            className={`px-3 py-1.5 rounded font-medium ${!stage ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            All
          </Link>
          {stages.map((st) => (
            <Link
              key={st}
              href={`/opportunities?stage=${st}`}
              className={`px-3 py-1.5 rounded font-medium capitalize ${stage === st ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            >
              {st.toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Opportunity Name</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium text-center">Prob (%)</th>
                <th className="px-4 py-3 font-medium text-right">Weighted Value</th>
                <th className="px-4 py-3 font-medium">Expected Close</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {opportunities.map((opp) => {
                const weighted = (opp.amount * opp.probability) / 100
                return (
                  <tr key={opp.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <Link href={`/opportunities/${opp.id}`} className="hover:text-blue-600">
                        {opp.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/customers/${opp.customer.id}`} className="text-blue-600 hover:underline">
                        {opp.customer.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${stageStyles[opp.stage] || "bg-slate-100"}`}>
                        {opp.stage}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 text-right">
                      ${opp.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">{opp.probability}%</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 text-right">
                      ${weighted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(opp.expectedCloseDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{opp.owner?.name || "Unassigned"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/opportunities/${opp.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                        <Link href={`/opportunities/${opp.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {opportunities.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                    No opportunities found matching your criteria.
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
