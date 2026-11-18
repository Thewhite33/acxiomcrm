import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FollowUpForm } from "../_components/followup-form"

export default async function NewFollowUpPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; customerId?: string; opportunityId?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { leadId, customerId, opportunityId } = await searchParams
  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const [users, customers, leads, opportunities] = await Promise.all([
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
    prisma.customer.findMany({
      where: isSalesExec ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.lead.findMany({
      where: {
        status: { notIn: ["CONVERTED", "LOST"] },
        ...(isSalesExec ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.opportunity.findMany({
      where: {
        stage: { notIn: ["WON", "LOST"] },
        ...(isSalesExec ? { OR: [{ ownerId: session.user.id }, { ownerId: null }] } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Schedule Follow-Up</h1>
        <p className="text-sm text-slate-500">Plan a call, meeting, or reminder</p>
      </div>
      <FollowUpForm
        users={users}
        customers={customers}
        leads={leads}
        opportunities={opportunities}
        preselectedLeadId={leadId}
        preselectedCustomerId={customerId}
        preselectedOpportunityId={opportunityId}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
