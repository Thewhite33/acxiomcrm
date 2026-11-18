import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { OpportunityForm } from "../../_components/opportunity-form"

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const [opp, customers, users] = await Promise.all([
    prisma.opportunity.findUnique({ where: { id } }),
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

  if (!opp) notFound()

  if (isSalesExec && opp.ownerId && opp.ownerId !== session.user.id) {
    redirect("/opportunities")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Opportunity</h1>
        <p className="text-sm text-slate-500">Update stage, probability, and closing date</p>
      </div>
      <OpportunityForm
        initialData={opp}
        customers={customers}
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
