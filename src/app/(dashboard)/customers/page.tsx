import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-600",
    PROSPECT: "bg-blue-100 text-blue-700",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  )
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { search, status } = await searchParams

  const where: Record<string, unknown> = {}
  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  }
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    include: { assignedTo: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  const exportData = customers.map((c) => ({
    "Name": c.name,
    "Email": c.email,
    "Phone": c.phone || "—",
    "Company": c.companyName || "—",
    "Status": c.status,
    "Assigned To": c.assignedTo?.name || "Unassigned",
    "Created Date": c.createdAt.toISOString().split("T")[0],
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage customer accounts, interactions, and assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`customers_${new Date().toISOString().split("T")[0]}`}
            sheetName="Customers"
            label="Export Excel"
          />
          <Link href="/customers/new">
            <Button>New Customer</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <form method="GET" className="flex gap-2">
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="border border-gray-300 rounded px-3 py-2 w-64 text-sm"
            />
            <select name="status" defaultValue={status} className="border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PROSPECT">Prospect</option>
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
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Phone</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Assigned To</th>
                <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">No customers found.</td>
                </tr>
              )}
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-gray-600">{c.assignedTo?.name ?? "—"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Link href={`/customers/${c.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                    <Link href={`/customers/${c.id}/edit`} className="text-gray-600 hover:underline text-sm">Edit</Link>
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
