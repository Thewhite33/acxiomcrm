import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { LeadForm } from "../../_components/lead-form"

export default async function EditLeadPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const [lead, users] = await Promise.all([
    prisma.lead.findUnique({ where: { id } }),
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

  if (!lead) notFound()

  if (isSalesExec && lead.assignedToId && lead.assignedToId !== session.user.id) {
    redirect("/leads")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Lead</h1>
        <p className="text-sm text-slate-500">Update status and sales parameters</p>
      </div>
      <LeadForm
        initialData={lead}
        users={users}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  )
}
