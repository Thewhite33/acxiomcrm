import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Calendar, DollarSign, Target, User } from "lucide-react"

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const opp = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: true,
      owner: { select: { id: true, name: true, email: true } },
      followUps: {
        orderBy: { followUpDate: "desc" },
        include: { assignedTo: { select: { name: true } } },
      },
    },
  })

  if (!opp) notFound()

  if (session.user.role === "SALES_EXECUTIVE" && opp.ownerId && opp.ownerId !== session.user.id) {
    redirect("/opportunities")
  }

  const weightedValue = (opp.amount * opp.probability) / 100

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/opportunities">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Opportunities
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{opp.name}</h1>
        </div>
        <Link href={`/opportunities/${opp.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-1" /> Edit Deal
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Deal Metrics</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Deal Amount</span>
                <span className="text-slate-900 font-extrabold text-lg mt-0.5 block">
                  ${opp.amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Win Probability</span>
                <span className="text-slate-900 font-extrabold text-lg mt-0.5 block">
                  {opp.probability}%
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Weighted Pipeline Value</span>
                <span className="text-emerald-600 font-extrabold text-lg mt-0.5 block">
                  {weightedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Expected Close Date</span>
                <span className="text-slate-900 font-medium text-sm mt-0.5 block">
                  {new Date(opp.expectedCloseDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Customer</span>
                <Link href={`/customers/${opp.customer.id}`} className="text-blue-600 font-semibold hover:underline mt-0.5 block">
                  {opp.customer.name}
                </Link>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Opportunity Owner</span>
                <span className="text-slate-900 font-medium mt-0.5 block">
                  {opp.owner?.name || "Unassigned"}
                </span>
              </div>
            </div>

            {opp.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 block uppercase font-medium mb-1">Deal Notes</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{opp.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900">Scheduled Follow-Ups</h2>
              <Link href={`/followups/new?opportunityId=${opp.id}`}>
                <Button size="sm" variant="outline">
                  <Calendar className="h-3.5 w-3.5 mr-1" /> Add Follow-Up
                </Button>
              </Link>
            </div>

            {opp.followUps.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No follow-ups recorded for this deal yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {opp.followUps.map((fu) => (
                  <div key={fu.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{fu.subject}</p>
                      <p className="text-xs text-slate-500">
                        {fu.type} • {new Date(fu.followUpDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700">
                      {fu.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Pipeline Stage</h3>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {opp.stage}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
              <div>Created: {new Date(opp.createdAt).toLocaleDateString()}</div>
              <div>Last Updated: {new Date(opp.updatedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
