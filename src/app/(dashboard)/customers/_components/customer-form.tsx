"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface User {
  id: string
  name: string
}

interface CustomerFormProps {
  customerId?: string
  initialData?: {
    name: string
    email: string
    phone: string
    address: string
    status: string
    assignedToId: string
    notes: string
  }
  users?: User[]
  currentUserId?: string
  currentUserRole?: string
}

export default function CustomerForm({
  customerId,
  initialData,
  users: initialUsers = [],
  currentUserId,
  currentUserRole,
}: CustomerFormProps) {
  const router = useRouter()
  const isEdit = !!customerId
  const isSalesExec = currentUserRole === "SALES_EXECUTIVE"

  const [form, setForm] = useState({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    address: initialData?.address ?? "",
    status: initialData?.status ?? "PROSPECT",
    assignedToId: initialData?.assignedToId ?? (isSalesExec ? currentUserId ?? "" : ""),
    notes: initialData?.notes ?? "",
  })
  const [users, setUsers] = useState<User[]>(Array.isArray(initialUsers) ? initialUsers : [])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")

  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) return

    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setUsers(data)
        }
      })
      .catch(() => {})
  }, [initialUsers])

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = "Name is required"
    if (!form.email.trim()) errs.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format"
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError("")
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)

    const payload = {
      ...form,
      assignedToId: isSalesExec ? currentUserId || form.assignedToId || null : form.assignedToId || null,
      phone: form.phone || null,
      address: form.address || null,
      notes: form.notes || null,
    }

    try {
      const res = await fetch(isEdit ? `/api/customers/${customerId}` : "/api/customers", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setServerError(data.error ?? "Failed to save customer")
        setLoading(false)
        return
      }

      router.push("/customers")
      router.refresh()
    } catch {
      setServerError("An unexpected error occurred")
      setLoading(false)
    }
  }

  function field(
    key: "name" | "email" | "phone" | "address",
    label: string,
    type = "text",
    required = false
  ) {
    return (
      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <input
          type={type}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors[key] && <p className="text-rose-600 text-xs mt-1">{errors[key]}</p>}
      </div>
    )
  }

  const safeUsers = Array.isArray(users) ? users : []

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/customers">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
          </Button>
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isEdit ? "Edit Customer" : "New Customer"}
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl shadow-xs">
        {serverError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs">
            {serverError}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {field("name", "Customer Name", "text", true)}
          {field("email", "Email Address", "email", true)}
          {field("phone", "Phone Number")}
          {field("address", "Office Address")}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="PROSPECT">Prospect</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Assigned Sales Executive</label>
            {isSalesExec ? (
              <div className="border border-slate-200 bg-slate-50 rounded px-3 py-2 text-sm text-slate-700 font-medium">
                {safeUsers.find((u) => u.id === (form.assignedToId || currentUserId))?.name || "Assigned to You"}
                <span className="block text-[11px] text-slate-500 font-normal mt-0.5">
                  Sales Executives can only work on their own records.
                </span>
              </div>
            ) : (
              <select
                value={form.assignedToId}
                onChange={(e) => setForm((p) => ({ ...p, assignedToId: e.target.value }))}
                className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Unassigned</option>
                {safeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              rows={3}
              className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Customer notes, interaction logs, requirements..."
            />
          </div>

          <div className="flex gap-3 pt-3 border-t border-slate-200">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Customer" : "Save Customer"}
            </Button>
            <Link href="/customers">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
