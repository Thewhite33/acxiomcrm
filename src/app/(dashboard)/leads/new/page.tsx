import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { LeadForm } from "../_components/lead-form"

export default async function NewLeadPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const users = isSalesExec
    ? [{ id: session.user.id, name: session.user.name || "Sales Executive" }]
    : session.user.role === "MANAGER"
    ? await prisma.user.findMany({
        where: {
          isActive: true,
          OR: [{ id: session.user.id }, { managerId: session.user.id }],
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create New Lead</h1>
        <p className="text-sm text-slate-500">Capture prospective customer information</p>
      </div>
      <LeadForm
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
