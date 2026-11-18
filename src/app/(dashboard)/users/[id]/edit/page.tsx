import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { UserForm } from "../../_components/user-form"

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params

  const [user, managers] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        managerId: true,
        isActive: true,
        isLocked: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "MANAGER", isActive: true, NOT: { id } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  if (!user) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit User Account</h1>
        <p className="text-sm text-slate-500">Update role assignment, reporting manager, status, or unlock account</p>
      </div>
      <UserForm initialData={user} managers={managers} />
    </div>
  )
}
