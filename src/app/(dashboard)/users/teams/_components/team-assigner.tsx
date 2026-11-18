"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserCheck, Shield, Users, Loader2 } from "lucide-react"

interface Manager {
  id: string
  name: string
  email: string
  salesExecutives: {
    id: string
    name: string
    email: string
    isActive: boolean
  }[]
}

interface SalesExec {
  id: string
  name: string
  email: string
  managerId: string | null
  isActive: boolean
}

interface TeamAssignerProps {
  managers: Manager[]
  unassignedExecutives: SalesExec[]
  allExecutives: SalesExec[]
}

export function TeamAssigner({ managers, unassignedExecutives, allExecutives }: TeamAssignerProps) {
  const router = useRouter()
  const [selectedExecId, setSelectedExecId] = useState(unassignedExecutives[0]?.id || allExecutives[0]?.id || "")
  const [selectedManagerId, setSelectedManagerId] = useState(managers[0]?.id || "")
  const [loading, setLoading] = useState(false)
  const [inlineLoadingId, setInlineLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAssign = async (execId: string, managerId: string | null) => {
    setError(null)
    setSuccess(null)
    if (!execId) {
      setError("Please select a sales executive.")
      return
    }

    setInlineLoadingId(execId)
    try {
      const res = await fetch(`/api/users/${execId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerId }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update reporting manager")
      }

      setSuccess("Reporting structure updated successfully.")
      router.refresh()
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setInlineLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-1">Quick Executive Assignment</h3>
        <p className="text-xs text-slate-500 mb-4">
          Directly map any Sales Executive to an active Sales Manager.
        </p>

        {error && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 text-xs font-medium">
            {success}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Sales Executive
            </label>
            <select
              value={selectedExecId}
              onChange={(e) => setSelectedExecId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allExecutives.map((exec) => {
                const curManager = managers.find((m) => m.id === exec.managerId)
                return (
                  <option key={exec.id} value={exec.id}>
                    {exec.name} ({curManager ? `Reports to: ${curManager.name}` : "Unassigned"})
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Assign To Manager
            </label>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">None (Unassigned / Direct to Admin)</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>

          <div className="sm:self-end">
            <Button
              type="button"
              onClick={() => handleAssign(selectedExecId, selectedManagerId || null)}
              disabled={!selectedExecId || inlineLoadingId === selectedExecId}
              className="w-full sm:w-auto h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
            >
              {inlineLoadingId === selectedExecId ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Updating...
                </>
              ) : (
                <>
                  Assign Manager
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-600" />
              Manager Teams ({managers.length})
            </h2>
          </div>

          {managers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400">
              No active Managers found. Create a Manager in Users & Roles first.
            </div>
          ) : (
            managers.map((m) => (
              <div key={m.id} className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{m.name}</h3>
                    <p className="text-xs text-slate-500">{m.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-700">
                    {m.salesExecutives.length} Direct Reports
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {m.salesExecutives.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No sales executives currently assigned to this manager.
                    </div>
                  ) : (
                    m.salesExecutives.map((exec) => (
                      <div key={exec.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{exec.name}</p>
                          <p className="text-[11px] text-slate-500">{exec.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            defaultValue={m.id}
                            onChange={(e) => handleAssign(exec.id, e.target.value || null)}
                            disabled={inlineLoadingId === exec.id}
                            className="border border-slate-300 rounded px-2 py-1 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                          >
                            <option value="">Unassign</option>
                            {managers.map((mgr) => (
                              <option key={mgr.id} value={mgr.id}>
                                {mgr.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              Unassigned Sales Executives ({unassignedExecutives.length})
            </h2>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-3.5 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-800 font-medium">
              Sales executives not assigned to any manager report directly to System Administrators.
            </div>

            <div className="divide-y divide-slate-100">
              {unassignedExecutives.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  All active Sales Executives are currently assigned to managers.
                </div>
              ) : (
                unassignedExecutives.map((exec) => (
                  <div key={exec.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <p className="text-xs font-semibold text-slate-900">{exec.name}</p>
                      <p className="text-[11px] text-slate-500">{exec.email}</p>
                    </div>
                    <div>
                      <select
                        defaultValue=""
                        onChange={(e) => handleAssign(exec.id, e.target.value || null)}
                        disabled={inlineLoadingId === exec.id}
                        className="border border-slate-300 rounded px-2 py-1 text-[11px] bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                      >
                        <option value="" disabled>
                          Select Manager...
                        </option>
                        {managers.map((mgr) => (
                          <option key={mgr.id} value={mgr.id}>
                            Assign to {mgr.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
