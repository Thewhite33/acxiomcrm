import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function Badge({ label, style }: { label: string; style: string }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}

const leadStatusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-green-100 text-green-700",
  UNQUALIFIED: "bg-gray-100 text-gray-600",
  CONVERTED: "bg-purple-100 text-purple-700",
  LOST: "bg-red-100 text-red-700",
}

const followUpStatusStyles: Record<string, string> = {
  PLANNED: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  MISSED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
}

const oppStageStyles: Record<string, string> = {
  QUALIFICATION: "bg-blue-100 text-blue-700",
  PROPOSAL: "bg-yellow-100 text-yellow-700",
  NEGOTIATION: "bg-orange-100 text-orange-700",
  WON: "bg-green-100 text-green-700",
  LOST: "bg-red-100 text-red-700",
}

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { name: true } },
      leads: { include: { assignedTo: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      followUps: { include: { assignedTo: { select: { name: true } } }, orderBy: { followUpDate: "asc" } },
      opportunities: { include: { owner: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  })

  if (!customer) notFound()

  const statusColor: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-600",
    PROSPECT: "bg-blue-100 text-blue-700",
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/customers" className="text-gray-500 hover:text-gray-700 text-sm">← Customers</Link>
          <h1 className="text-2xl font-semibold text-gray-800">{customer.name}</h1>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColor[customer.status]}`}>
            {customer.status}
          </span>
        </div>
        <Link href={`/customers/${id}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 col-span-2">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Customer Info</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <dt className="text-gray-500">Email</dt><dd className="text-gray-800">{customer.email}</dd>
            <dt className="text-gray-500">Phone</dt><dd className="text-gray-800">{customer.phone ?? "—"}</dd>
            <dt className="text-gray-500">Address</dt><dd className="text-gray-800">{customer.address ?? "—"}</dd>
            <dt className="text-gray-500">Assigned To</dt><dd className="text-gray-800">{customer.assignedTo?.name ?? "—"}</dd>
            <dt className="text-gray-500">Created</dt><dd className="text-gray-800">{new Date(customer.createdAt).toLocaleDateString()}</dd>
          </dl>
          {customer.notes && (
            <div className="mt-4">
              <p className="text-gray-500 text-sm mb-1">Notes</p>
              <p className="text-gray-700 text-sm">{customer.notes}</p>
            </div>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Leads</span><span className="font-medium">{customer.leads.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Follow-Ups</span><span className="font-medium">{customer.followUps.length}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Opportunities</span><span className="font-medium">{customer.opportunities.length}</span></div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Leads</h2>
            <Link href={`/leads/new?customerId=${id}`} className="text-blue-600 text-sm hover:underline">+ Add Lead</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Assigned To</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customer.leads.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No leads.</td></tr>
              )}
              {customer.leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Link href={`/leads/${l.id}/edit`} className="text-blue-600 hover:underline">{l.name}</Link></td>
                  <td className="px-4 py-3"><Badge label={l.status} style={leadStatusStyles[l.status]} /></td>
                  <td className="px-4 py-3 text-gray-600">{l.priority}</td>
                  <td className="px-4 py-3 text-gray-600">{l.assignedTo?.name ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Opportunities</h2>
            <Link href={`/opportunities/new?customerId=${id}`} className="text-blue-600 text-sm hover:underline">+ Add Opportunity</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Stage</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Amount</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Close Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customer.opportunities.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No opportunities.</td></tr>
              )}
              {customer.opportunities.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Link href={`/opportunities/${o.id}/edit`} className="text-blue-600 hover:underline">{o.name}</Link></td>
                  <td className="px-4 py-3"><Badge label={o.stage} style={oppStageStyles[o.stage]} /></td>
                  <td className="px-4 py-3 text-gray-600">${o.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(o.expectedCloseDate).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-semibold text-gray-700">Follow-Ups</h2>
            <Link href={`/followups/new?customerId=${id}`} className="text-blue-600 text-sm hover:underline">+ Add Follow-Up</Link>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Subject</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customer.followUps.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">No follow-ups.</td></tr>
              )}
              {customer.followUps.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-800">{f.subject}</td>
                  <td className="px-4 py-3 text-gray-600">{f.type}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(f.followUpDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><Badge label={f.status} style={followUpStatusStyles[f.status]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
