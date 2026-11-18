import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { OpportunityForm } from "../_components/opportunity-form"

export default async function NewOpportunityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const [customers, users] = await Promise.all([
    prisma.customer.findMany({
      where: isSalesExec ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    isSalesExec
      ? Promise.resolve([{ id: session.user.id, name: session.user.name || "Sales Executive" }])
      : session.user.role === "MANAGER"
      ? prisma.user.findMany({
          where: {
            isActive: true,
            OR: [{ id: session.user.id }, { managerId: session.user.id }],
          },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : prisma.user.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create Opportunity</h1>
        <p className="text-sm text-slate-500">Record a new sales deal and forecast parameters</p>
      </div>
      <OpportunityForm
        customers={customers}
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
