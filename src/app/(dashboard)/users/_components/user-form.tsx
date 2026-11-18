"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ManagerOption {
  id: string
  name: string
}

interface UserFormProps {
  initialData?: {
    id?: string
    name: string
    email: string
    role: string
    managerId?: string | null
    isActive: boolean
    isLocked: boolean
  }
  managers?: ManagerOption[]
}

export function UserForm({ initialData, managers = [] }: UserFormProps) {
  const router = useRouter()
  const isEdit = !!initialData?.id

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    role: initialData?.role || "SALES_EXECUTIVE",
    managerId: initialData?.managerId || "",
    password: "",
    isActive: initialData?.isActive ?? true,
    isLocked: initialData?.isLocked ?? false,
  })

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!formData.name.trim()) {
      setError("Name is required.")
      return
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Enter a valid email address.")
      return
    }

    if (!isEdit && (!formData.password || formData.password.length < 8)) {
      setError("Password must be at least 8 characters.")
      return
    }

    if (formData.password && (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password))) {
      setError("Password must contain uppercase, lowercase and a number.")
      return
    }

    setLoading(true)

    try {
      const url = isEdit ? `/api/users/${initialData.id}` : "/api/users"
      const method = isEdit ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          managerId: formData.role === "SALES_EXECUTIVE" ? formData.managerId || null : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save user")
        setLoading(false)
        return
      }

      router.push("/users")
      router.refresh()
    } catch {
      setError("An unexpected error occurred.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-lg p-6 max-w-xl space-y-4">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs">
          {error}
        </div>
      )}

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
          placeholder="Jane Doe"
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
          placeholder="jane@acxiom.com"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          System Role *
        </label>
        <select
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="SALES_EXECUTIVE">Sales Executive</option>
          <option value="MANAGER">Manager</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>

      {formData.role === "SALES_EXECUTIVE" && (
        <div>
          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
            Reporting Manager
          </label>
          <select
            value={formData.managerId}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Unassigned (Direct to Admin)</option>
            {managers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
          {isEdit ? "New Password (leave blank to keep current)" : "Password *"}
        </label>
        <input
          type="password"
          required={!isEdit}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Min 8 characters with classes"
        />
      </div>

      {isEdit && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Account Active</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!formData.isLocked}
              onChange={(e) => setFormData({ ...formData, isLocked: !e.target.checked })}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-700">Account Unlocked</span>
          </label>
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : isEdit ? "Update User" : "Create User"}
        </Button>
        <Link href="/users">
          <Button variant="outline" type="button">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
