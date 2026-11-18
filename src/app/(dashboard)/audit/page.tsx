import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ExcelExportButton } from "@/components/ui/excel-export-button"

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; action?: string; search?: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { module: modFilter, action: actFilter, search } = await searchParams

  const where: Record<string, unknown> = {}
  if (modFilter) where.module = modFilter
  if (actFilter) where.action = actFilter
  if (search) {
    where.OR = [
      { result: { contains: search, mode: "insensitive" } },
      { recordId: { contains: search, mode: "insensitive" } },
    ]
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const exportData = logs.map((log) => ({
    "Timestamp": log.createdAt.toISOString(),
    "User": log.user ? `${log.user.name} (${log.user.email})` : "System",
    "Module": log.module,
    "Action": log.action,
    "Record ID": log.recordId || "—",
    "Result / Description": log.result || "—",
  }))

  const modules = ["AUTH", "CUSTOMER", "LEAD", "OPPORTUNITY", "FOLLOWUP", "ACTIVITY", "USER"]
  const actions = [
    "LOGIN_SUCCESS",
    "LOGIN_FAILURE",
    "LOGOUT",
    "CREATE",
    "UPDATE",
    "DELETE",
    "ROLE_CHANGE",
    "PASSWORD_CHANGE",
    "STATUS_CHANGE",
    "CONVERT",
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Business Audit Trail</h1>
          <p className="text-sm text-slate-500">Append-oriented tamper-resistant audit logs of all critical operations</p>
        </div>
        <div className="flex items-center gap-2">
          <ExcelExportButton
            data={exportData}
            filename={`audit_logs_${new Date().toISOString().split("T")[0]}`}
            sheetName="AuditLogs"
            label="Export Excel"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs flex flex-wrap items-center gap-3">
        <form method="GET" className="flex flex-wrap items-center gap-2 w-full">
          <input
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="Search result or record ID..."
            className="border border-slate-300 rounded px-3 py-1.5 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            name="module"
            defaultValue={modFilter || ""}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Modules</option>
            {modules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            name="action"
            defaultValue={actFilter || ""}
            className="border border-slate-300 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All Actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <Button type="submit" variant="outline" size="sm">
            Filter Logs
          </Button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Record ID</th>
                <th className="px-4 py-3 font-medium">Result / Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {log.user ? `${log.user.name} (${log.user.email})` : "System / Anonymous"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                      {log.module}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        log.action.includes("FAILURE") || log.action === "DELETE"
                          ? "bg-rose-100 text-rose-700"
                          : log.action.includes("SUCCESS") || log.action === "CREATE" || log.action === "CONVERT"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                    {log.recordId || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.result}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No audit records found.
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
