import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import CustomerForm from "../../_components/customer-form"

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params
  const isSalesExec = session.user.role === "SALES_EXECUTIVE"

  const [customer, users] = await Promise.all([
    prisma.customer.findUnique({ where: { id } }),
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

  if (!customer) notFound()

  if (isSalesExec && customer.assignedToId && customer.assignedToId !== session.user.id) {
    redirect("/customers")
  }

  return (
    <CustomerForm
      customerId={id}
      users={users}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      initialData={{
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? "",
        address: customer.address ?? "",
        status: customer.status,
        assignedToId: customer.assignedToId ?? "",
        notes: customer.notes ?? "",
      }}
    />
  )
}
