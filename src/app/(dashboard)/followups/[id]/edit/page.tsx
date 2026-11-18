import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { FollowUpForm } from "../../_components/followup-form"

export default async function EditFollowUpPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const [followUp, users, customers, leads, opportunities] = await Promise.all([
    prisma.followUp.findUnique({ where: { id } }),
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
      where: isSalesExec ? { OR: [{ assignedToId: session.user.id }, { assignedToId: null }] } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.opportunity.findMany({
      where: isSalesExec ? { OR: [{ ownerId: session.user.id }, { ownerId: null }] } : undefined,
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!followUp) notFound()

  if (isSalesExec && followUp.assignedToId && followUp.assignedToId !== session.user.id) {
    redirect("/followups")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Update Follow-Up</h1>
        <p className="text-sm text-slate-500">Change status to Completed, Missed, or reschedule</p>
      </div>
      <FollowUpForm
        initialData={followUp}
        users={users}
        customers={customers}
        leads={leads}
        opportunities={opportunities}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
