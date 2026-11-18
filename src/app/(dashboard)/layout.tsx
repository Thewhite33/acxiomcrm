import Link from "next/link"
import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  TrendingUp,
  CheckSquare,
  BarChart3,
  UserCog,
  Network,
  ShieldCheck,
  LogOut,
} from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const role = session.user.role || "SALES_EXECUTIVE"
  const isAdmin = role === "ADMIN"

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-30">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            A
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">AcxiomCRM</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-500" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/customers"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <Building2 className="h-4 w-4 text-slate-500" />
            <span>Customers</span>
          </Link>
          <Link
            href="/leads"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <Users className="h-4 w-4 text-slate-500" />
            <span>Leads</span>
          </Link>
          <Link
            href="/opportunities"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <TrendingUp className="h-4 w-4 text-slate-500" />
            <span>Opportunities</span>
          </Link>
          <Link
            href="/followups"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <Calendar className="h-4 w-4 text-slate-500" />
            <span>Follow-Ups</span>
          </Link>
          <Link
            href="/activities"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <CheckSquare className="h-4 w-4 text-slate-500" />
            <span>Activities</span>
          </Link>
          <Link
            href="/reports"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
          >
            <BarChart3 className="h-4 w-4 text-slate-500" />
            <span>Reports</span>
          </Link>

          {isAdmin && (
            <>
              <div className="pt-4 pb-1 px-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Administration</span>
              </div>
              <Link
                href="/users"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <UserCog className="h-4 w-4 text-slate-500" />
                <span>Users & Roles</span>
              </Link>
              <Link
                href="/users/teams"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <Network className="h-4 w-4 text-slate-500" />
                <span>Team Hierarchy</span>
              </Link>
              <Link
                href="/audit"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-sm font-medium transition-colors"
              >
                <ShieldCheck className="h-4 w-4 text-slate-500" />
                <span>Audit Logs</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors"
            >
              <LogOut className="h-4 w-4 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </form>
          <div className="mt-2 px-3 text-xs text-slate-400">
            {session.user.name} ({role.replace("_", " ")})
          </div>
        </div>
      </aside>

      <main className="flex-1 ml-60 p-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
