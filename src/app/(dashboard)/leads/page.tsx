import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

const statusStyles: Record<string, string> = {
  NEW: "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-green-100 text-green-700",
  UNQUALIFIED: "bg-gray-100 text-gray-600",
  CONVERTED: "bg-purple-100 text-purple-700",
  LOST: "bg-red-100 text-red-700",
}

const priorityStyles: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { status, search } = await searchParams

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") where.assignedToId = session.user.id
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const leads = await prisma.lead.findMany({
    where,
    include: { assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  const exportData = leads.map((l) => ({
    "Name": l.name,
    "Email": l.email,
    "Phone": l.phone || "—",
    "Company": l.companyName || "—",
    "Source": l.source || "—",
    "Status": l.status,
    "Priority": l.priority,
    "Expected Value": l.expectedValue ? `$${l.expectedValue.toLocaleString()}` : "—",
    "Assigned To": l.assignedTo?.name || "Unassigned",
    "Created Date": l.createdAt.toISOString().split("T")[0],
  }))

  const statuses = ["NEW", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED", "LOST"]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Leads</h1>
          <p className="text-xs text-gray-500 mt-0.5">Prospect pipeline, source qualification, and conversion tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`leads_${new Date().toISOString().split("T")[0]}`}
            sheetName="Leads"
            label="Export Excel"
          />
          <Link href="/leads/new">
            <Button>New Lead</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-2">
          <form method="GET" className="flex gap-2 flex-wrap">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="border border-gray-300 rounded px-3 py-2 text-sm w-56"
            />
            <select name="status" defaultValue={status} className="border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button type="submit" variant="outline">Filter</Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Priority</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Source</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No leads found.</td></tr>
              )}
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{l.name}</td>
                  <td className="px-4 py-3 text-gray-600">{l.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusStyles[l.status]}`}>{l.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${priorityStyles[l.priority]}`}>{l.priority}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{l.source ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{l.assignedTo?.name ?? "—"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link href={`/leads/${l.id}`} className="text-blue-600 hover:underline text-sm font-medium">View</Link>
                    <Link href={`/leads/${l.id}/edit`} className="text-gray-600 hover:underline text-sm">Edit</Link>
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
