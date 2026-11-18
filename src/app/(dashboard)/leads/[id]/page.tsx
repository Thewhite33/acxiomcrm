import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Edit, Calendar, Phone, Mail, Building, Tag } from "lucide-react"
import { ConvertLeadButton } from "../_components/convert-dialog"

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      followUps: {
        orderBy: { followUpDate: "desc" },
        include: { assignedTo: { select: { name: true } } },
      },
    },
  })

  if (!lead) notFound()

  if (session.user.role === "SALES_EXECUTIVE" && lead.assignedToId && lead.assignedToId !== session.user.id) {
    redirect("/leads")
  }

  const isQualified = lead.status === "QUALIFIED"
  const isConverted = lead.status === "CONVERTED"

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/leads">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Leads
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{lead.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/leads/${lead.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-1" /> Edit Lead
            </Button>
          </Link>
          {isQualified && !isConverted && (
            <ConvertLeadButton
              leadId={lead.id}
              leadName={lead.name}
              expectedValue={lead.expectedValue}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Lead Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Email</span>
                <span className="text-slate-900 font-medium flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-slate-400" /> {lead.email}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Phone</span>
                <span className="text-slate-900 font-medium flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" /> {lead.phone || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Company</span>
                <span className="text-slate-900 font-medium flex items-center gap-1.5 mt-0.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" /> {lead.companyName || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Source</span>
                <span className="text-slate-900 font-medium flex items-center gap-1.5 mt-0.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" /> {lead.source || "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Expected Value</span>
                <span className="text-slate-900 font-medium mt-0.5 block">
                  {lead.expectedValue ? `$${lead.expectedValue.toLocaleString()}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-medium">Assigned Sales Executive</span>
                <span className="text-slate-900 font-medium mt-0.5 block">
                  {lead.assignedTo?.name || "Unassigned"}
                </span>
              </div>
            </div>

            {lead.notes && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 block uppercase font-medium mb-1">Notes</span>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{lead.notes}</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h2 className="text-base font-bold text-slate-900">Follow-Up History</h2>
              <Link href={`/followups/new?leadId=${lead.id}`}>
                <Button size="sm" variant="outline">
                  <Calendar className="h-3.5 w-3.5 mr-1" /> Schedule Follow-Up
                </Button>
              </Link>
            </div>

            {lead.followUps.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">No follow-ups recorded for this lead yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-sm">
                {lead.followUps.map((fu) => (
                  <div key={fu.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{fu.subject}</p>
                      <p className="text-xs text-slate-500">
                        {fu.type} • {new Date(fu.followUpDate).toLocaleDateString()} • Assigned: {fu.assignedTo?.name || "Unassigned"}
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
            <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Status & Lifecycle</h3>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Current Status</span>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                {lead.status}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block mb-1">Priority</span>
              <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-100 text-slate-800">
                {lead.priority}
              </span>
            </div>
            {isConverted && lead.customer && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500 block mb-1">Converted Customer</span>
                <Link href={`/customers/${lead.customer.id}`} className="text-blue-600 font-semibold text-sm hover:underline">
                  {lead.customer.name} &rarr;
                </Link>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-400">
              Created: {new Date(lead.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
