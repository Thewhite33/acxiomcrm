"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Option {
  id: string
  name: string
}

interface ActivityFormProps {
  customers: Option[]
  leads: Option[]
  users: Option[]
  currentUserId?: string
  currentUserRole?: string
}

export function ActivityForm({
  customers,
  leads,
  users,
  currentUserId,
  currentUserRole,
}: ActivityFormProps) {
  const router = useRouter()
  const isSalesExec = currentUserRole === "SALES_EXECUTIVE"

  const [formData, setFormData] = useState({
    activityType: "Call",
    subject: "",
    description: "",
    activityDate: new Date().toISOString().split("T")[0],
    status: "COMPLETED",
    assignedToId: isSalesExec ? currentUserId || "" : "",
    customerId: "",
    leadId: "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!formData.subject.trim()) {
      setError("Subject is required.")
      return
    }

    setLoading(true)

    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedToId: isSalesExec ? currentUserId || formData.assignedToId || null : formData.assignedToId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to log activity")
        setLoading(false)
        return
      }

      router.push("/activities")
      router.refresh()
    } catch {
      setError("An unexpected error occurred.")
      setLoading(false)
    }
  }

  const assignedUserName = users.find((u) => u.id === (formData.assignedToId || currentUserId))?.name || "Assigned to You"

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Activity Type *
          </label>
          <select
            value={formData.activityType}
            onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="Call">Call</option>
            <option value="Meeting">Meeting</option>
            <option value="Email">Email</option>
            <option value="Task">Task</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Date *
          </label>
          <input
            type="date"
            required
            value={formData.activityDate}
            onChange={(e) => setFormData({ ...formData, activityDate: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          Subject *
        </label>
        <input
          type="text"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Client discovery session, Contract review..."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Customer
          </label>
          <select
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">None</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Lead
          </label>
          <select
            value={formData.leadId}
            onChange={(e) => setFormData({ ...formData, leadId: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">None</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Assigned User
          </label>
          {isSalesExec ? (
            <div className="border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-700 font-medium">
              {assignedUserName}
              <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                Sales Executives can only record their own activities.
              </span>
            </div>
          ) : (
            <select
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Current User</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          Description / Discussion Details
        </label>
        <textarea
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Details of the interaction, questions asked, next steps..."
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="submit" disabled={loading}>
          {loading ? "Logging..." : "Log Activity"}
        </Button>
        <Link href="/activities">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
