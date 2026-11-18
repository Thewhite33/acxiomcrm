"use client"

import { useState, useEffect, Suspense } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccess("Account created successfully! Please sign in with your credentials.")
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error.includes("locked") || result.error === "AccountLocked") {
          setError("Your account has been temporarily locked due to repeated failed login attempts.")
        } else {
          setError("Invalid email or password. Please verify your credentials.")
        }
        setLoading(false)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("An unexpected authentication error occurred.")
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-8">
        <div className="mb-6 text-center">
          <div className="inline-flex h-10 w-10 rounded-lg bg-blue-600 items-center justify-center text-white font-bold text-xl mb-2">
            A
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sign in to AcxiomCRM</h2>
          <p className="text-slate-500 mt-1 text-sm">Enter your credentials to access your workspace</p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-xs font-medium">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border border-slate-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <Button type="submit" className="w-full h-10 text-sm font-semibold" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </Button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">
              Need an account?{" "}
              <Link href="/register" className="text-blue-600 font-medium hover:underline">
                Register here
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
