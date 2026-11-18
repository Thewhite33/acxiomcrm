import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Network, Shield, Users, UserCheck } from "lucide-react"
import { TeamAssigner } from "./_components/team-assigner"

export default async function TeamHierarchyPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [managers, allExecutives] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MANAGER", isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        salesExecutives: {
          where: { isActive: true },
          select: { id: true, name: true, email: true, isActive: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "SALES_EXECUTIVE", isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        managerId: true,
        isActive: true,
      },
      orderBy: { name: "asc" },
    }),
  ])

  const unassignedExecutives = allExecutives.filter((e) => !e.managerId)
  const assignedExecutives = allExecutives.filter((e) => !!e.managerId)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/users">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              {/* <Network className="h-6 w-6 text-blue-600" /> */}
              Organizational Team Hierarchy
            </h1>
            <p className="text-sm text-slate-500">
              Assign sales executives to managers and establish team delegation scopes
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Managers</p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{managers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Sales Executives</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{allExecutives.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Assigned to Teams</p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{assignedExecutives.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unassigned Executives</p>
          <p className="text-2xl font-extrabold text-amber-600 mt-1">{unassignedExecutives.length}</p>
        </div>
      </div>

      <TeamAssigner
        managers={managers}
        unassignedExecutives={unassignedExecutives}
        allExecutives={allExecutives}
      />
    </div>
  )
}
