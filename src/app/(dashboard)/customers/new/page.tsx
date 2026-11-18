import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import CustomerForm from "../_components/customer-form"

export default async function NewCustomerPage() {
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
    <CustomerForm
      users={users}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
    />
  )
}
