"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface UserOption {
  id: string
  name: string
}

interface LeadFormProps {
  initialData?: {
    id?: string
    name: string
    email: string
    phone?: string | null
    companyName?: string | null
    source?: string | null
    status: string
    priority: string
    expectedValue?: number | null
    notes?: string | null
    assignedToId?: string | null
  }
  users: UserOption[]
  currentUserId?: string
  currentUserRole?: string
}

export function LeadForm({ initialData, users, currentUserId, currentUserRole }: LeadFormProps) {
  const router = useRouter()
  const isEdit = !!initialData?.id
  const isSalesExec = currentUserRole === "SALES_EXECUTIVE"

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    companyName: initialData?.companyName || "",
    source: initialData?.source || "",
    status: initialData?.status || "NEW",
    priority: initialData?.priority || "MEDIUM",
    expectedValue: initialData?.expectedValue ? String(initialData.expectedValue) : "",
    notes: initialData?.notes || "",
    assignedToId: initialData?.assignedToId || (isSalesExec ? currentUserId || "" : ""),
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Lead name is mandatory.")
      return
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Enter a valid email address.")
      return
    }

    if (formData.phone && formData.phone.replace(/[^0-9]/g, "").length < 10) {
      setError("Enter a valid phone number (at least 10 digits).")
      return
    }

    if (formData.expectedValue && Number(formData.expectedValue) < 0) {
      setError("Expected value cannot be negative.")
      return
    }

    setLoading(true)

    try {
      const url = isEdit ? `/api/leads/${initialData.id}` : "/api/leads"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          expectedValue: formData.expectedValue ? parseFloat(formData.expectedValue) : null,
          assignedToId: isSalesExec ? currentUserId || formData.assignedToId || null : formData.assignedToId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save lead")
        setLoading(false)
        return
      }

      router.push("/leads")
      router.refresh()
    } catch {
      setError("Network or server failure. Please retry.")
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
            Full Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Phone Number
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 555-0199"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Company Name
          </label>
          <input
            type="text"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Acme Corp"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Status
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="NEW">New</option>
            <option value="CONTACTED">Contacted</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="UNQUALIFIED">Unqualified</option>
            <option value="CONVERTED">Converted</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Priority
          </label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Source
          </label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Website, Referral..."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Expected Value (₹)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.expectedValue}
            onChange={(e) => setFormData({ ...formData, expectedValue: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="5000"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Assigned Sales Executive
          </label>
          {isSalesExec ? (
            <div className="border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-700 font-medium">
              {assignedUserName}
              <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                Sales Executives can only work on their own records.
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
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          Notes / Remarks
        </label>
        <textarea
          rows={3}
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Detailed prospect notes, conversations..."
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Lead" : "Save Lead"}
        </Button>
        <Link href="/leads">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
