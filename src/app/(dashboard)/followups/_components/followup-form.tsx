"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Option {
  id: string
  name: string
}

interface FollowUpFormProps {
  initialData?: {
    id?: string
    subject: string
    type?: string | null
    status: string
    followUpDate: string | Date
    notes?: string | null
    assignedToId?: string | null
    customerId?: string | null
    leadId?: string | null
    opportunityId?: string | null
  }
  users: Option[]
  customers: Option[]
  leads: Option[]
  opportunities: Option[]
  preselectedLeadId?: string
  preselectedCustomerId?: string
  preselectedOpportunityId?: string
  currentUserId?: string
  currentUserRole?: string
}

export function FollowUpForm({
  initialData,
  users,
  customers,
  leads,
  opportunities,
  preselectedLeadId,
  preselectedCustomerId,
  preselectedOpportunityId,
  currentUserId,
  currentUserRole,
}: FollowUpFormProps) {
  const router = useRouter()
  const isEdit = !!initialData?.id
  const isSalesExec = currentUserRole === "SALES_EXECUTIVE"

  const defaultDate = initialData?.followUpDate
    ? new Date(initialData.followUpDate).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0]

  const [formData, setFormData] = useState({
    subject: initialData?.subject || "",
    type: initialData?.type || "CALL",
    status: initialData?.status || "PLANNED",
    followUpDate: defaultDate,
    notes: initialData?.notes || "",
    assignedToId: initialData?.assignedToId || (isSalesExec ? currentUserId || "" : ""),
    customerId: initialData?.customerId || preselectedCustomerId || "",
    leadId: initialData?.leadId || preselectedLeadId || "",
    opportunityId: initialData?.opportunityId || preselectedOpportunityId || "",
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!formData.subject.trim()) {
      setError("Subject is mandatory.")
      return
    }

    if (!formData.followUpDate) {
      setError("Follow-up date is required.")
      return
    }

    if (!formData.customerId && !formData.leadId && !formData.opportunityId) {
      setError("Please link this follow-up to at least one Lead, Customer, or Opportunity.")
      return
    }

    setLoading(true)

    try {
      const url = isEdit ? `/api/followups/${initialData.id}` : "/api/followups"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          assignedToId: isSalesExec ? currentUserId || formData.assignedToId || null : formData.assignedToId || null,
          customerId: formData.customerId || null,
          leadId: formData.leadId || null,
          opportunityId: formData.opportunityId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to schedule follow-up")
        setLoading(false)
        return
      }

      router.push("/followups")
      router.refresh()
    } catch {
      setError("An unexpected server error occurred.")
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
            Subject *
          </label>
          <input
            type="text"
            required
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Contract Review Call"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Activity Type *
          </label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="CALL">Call</option>
            <option value="EMAIL">Email</option>
            <option value="MEETING">Meeting</option>
            <option value="TASK">Task / Other</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Follow-Up Date *
          </label>
          <input
            type="date"
            required
            value={formData.followUpDate}
            onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            <option value="PLANNED">Planned</option>
            <option value="COMPLETED">Completed</option>
            <option value="MISSED">Missed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Assigned Sales Executive
          </label>
          {isSalesExec ? (
            <div className="border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-700 font-medium">
              {assignedUserName}
              <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                Sales Executives can only work on their own follow-ups.
              </span>
            </div>
          ) : (
            <select
              value={formData.assignedToId}
              onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
              className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Unassigned</option>
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
            Link to Lead
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
            Link to Customer
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
            Link to Opportunity
          </label>
          <select
            value={formData.opportunityId}
            onChange={(e) => setFormData({ ...formData, opportunityId: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">None</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          Notes / Context
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Meeting agenda, topics to discuss, prerequisites..."
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Follow-Up" : "Schedule Follow-Up"}
        </Button>
        <Link href="/followups">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
