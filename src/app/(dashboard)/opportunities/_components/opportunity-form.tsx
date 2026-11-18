"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface CustomerOption {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string
}

interface OpportunityFormProps {
  initialData?: {
    id?: string
    name: string
    customerId: string
    stage: string
    amount: number
    probability: number
    expectedCloseDate: string | Date
    source?: string | null
    notes?: string | null
    ownerId?: string | null
  }
  customers: CustomerOption[]
  users: UserOption[]
  currentUserId?: string
  currentUserRole?: string
}

export function OpportunityForm({
  initialData,
  customers,
  users,
  currentUserId,
  currentUserRole,
}: OpportunityFormProps) {
  const router = useRouter()
  const isEdit = !!initialData?.id
  const isSalesExec = currentUserRole === "SALES_EXECUTIVE"

  const defaultDate = initialData?.expectedCloseDate
    ? new Date(initialData.expectedCloseDate).toISOString().split("T")[0]
    : ""

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    customerId: initialData?.customerId || (customers[0]?.id || ""),
    stage: initialData?.stage || "QUALIFICATION",
    amount: initialData?.amount ? String(initialData.amount) : "",
    probability: initialData?.probability !== undefined ? String(initialData.probability) : "50",
    expectedCloseDate: defaultDate,
    source: initialData?.source || "",
    notes: initialData?.notes || "",
    ownerId: initialData?.ownerId || (isSalesExec ? currentUserId || "" : ""),
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const weightedValue =
    formData.amount && formData.probability
      ? (parseFloat(formData.amount) * parseFloat(formData.probability)) / 100
      : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Opportunity name is required.")
      return
    }

    if (!formData.customerId) {
      setError("Customer must be selected.")
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than zero.")
      return
    }

    const prob = parseFloat(formData.probability)
    if (isNaN(prob) || prob < 0 || prob > 100) {
      setError("Probability must be between 0 and 100.")
      return
    }

    if (!formData.expectedCloseDate) {
      setError("Expected close date is required.")
      return
    }

    const activeStages = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION"]
    const closeDate = new Date(formData.expectedCloseDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (activeStages.includes(formData.stage) && closeDate < today) {
      setError("Expected close date cannot be in the past for active opportunities.")
      return
    }

    setLoading(true)

    try {
      const url = isEdit ? `/api/opportunities/${initialData.id}` : "/api/opportunities"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          probability: parseFloat(formData.probability),
          expectedCloseDate: formData.expectedCloseDate,
          ownerId: isSalesExec ? currentUserId || formData.ownerId || null : formData.ownerId || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save opportunity")
        setLoading(false)
        return
      }

      router.push("/opportunities")
      router.refresh()
    } catch {
      setError("An unexpected network or server error occurred.")
      setLoading(false)
    }
  }

  const assignedOwnerName = users.find((u) => u.id === (formData.ownerId || currentUserId))?.name || "Assigned to You"

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
            Opportunity Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enterprise Cloud Expansion"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Customer *
          </label>
          <select
            required
            value={formData.customerId}
            onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select a Customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Stage *
          </label>
          <select
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="QUALIFICATION">Qualification</option>
            <option value="PROPOSAL">Proposal</option>
            <option value="NEGOTIATION">Negotiation</option>
            <option value="WON">Closed Won</option>
            <option value="LOST">Closed Lost</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Amount (₹) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="25000"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Probability (%) *
          </label>
          <input
            type="number"
            min="0"
            max="100"
            required
            value={formData.probability}
            onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 flex justify-between items-center">
        <span>Derived Weighted Pipeline:</span>
        <span className="font-bold text-slate-900">₹{weightedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Expected Close Date *
          </label>
          <input
            type="date"
            required
            value={formData.expectedCloseDate}
            onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Assigned Owner
          </label>
          {isSalesExec ? (
            <div className="border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-700 font-medium">
              {assignedOwnerName}
              <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                Sales Executives can only work on their own deals.
              </span>
            </div>
          ) : (
            <select
              value={formData.ownerId}
              onChange={(e) => setFormData({ ...formData, ownerId: e.target.value })}
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

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Lead Source
          </label>
          <input
            type="text"
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Inbound Demo, Event..."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Internal Strategy & Notes
          </label>
          <textarea
            rows={3}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Competitive landscape, budget holder..."
          />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update Opportunity" : "Save Opportunity"}
        </Button>
        <Link href="/opportunities">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
