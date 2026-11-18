import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"
import bcrypt from "bcryptjs"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters"
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter"
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter"
  if (!/[0-9]/.test(password)) return "Password must contain at least one number"
  return null
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isLocked: true,
      failedLoginCount: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
      salesExecutives: { select: { id: true, name: true, email: true, isActive: true } },
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json(user)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const adminId = session.user.id
  const { id } = await params
  const body = await request.json()
  const { name, email, role, isActive, isLocked, password, managerId } = body

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (adminId === id) {
    if (role !== undefined && role !== existing.role) {
      return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 })
    }
    if (isActive === false) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 })
    }
  }

  if (existing.role === "ADMIN" && ((role !== undefined && role !== "ADMIN") || isActive === false)) {
    const activeAdminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    })
    if (activeAdminCount <= 1) {
      return NextResponse.json({ error: "Cannot demote or deactivate the last active administrator" }, { status: 400 })
    }
  }

  if (email !== undefined && !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }
  if (email !== undefined && email !== existing.email) {
    const duplicateEmail = await prisma.user.findFirst({ where: { email, NOT: { id } } })
    if (duplicateEmail) return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  }

  const auditActions: string[] = []
  const updateData: Record<string, unknown> = {}

  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email
  if (isActive !== undefined) {
    updateData.isActive = isActive
    auditActions.push(isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED")
  }

  if (role !== undefined && role !== existing.role) {
    updateData.role = role
    auditActions.push("ROLE_CHANGE")
    if (role !== "SALES_EXECUTIVE") {
      updateData.managerId = null
    }
  }

  if (managerId !== undefined) {
    if (managerId) {
      const managerUser = await prisma.user.findUnique({ where: { id: managerId } })
      if (!managerUser || managerUser.role !== "MANAGER" || !managerUser.isActive) {
        return NextResponse.json({ error: "Assigned manager not found or inactive" }, { status: 400 })
      }
      updateData.managerId = managerId
    } else {
      updateData.managerId = null
    }
  }

  if (isLocked === false) {
    updateData.isLocked = false
    updateData.failedLoginCount = 0
    auditActions.push("ACCOUNT_UNLOCKED")
  }

  if (password !== undefined && password !== "") {
    const passwordError = validatePassword(password)
    if (passwordError) return NextResponse.json({ error: passwordError }, { status: 400 })
    updateData.passwordHash = await bcrypt.hash(password, 12)
    auditActions.push("PASSWORD_CHANGE")
  }

  if (auditActions.length === 0) auditActions.push("UPDATE")

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isLocked: true,
      failedLoginCount: true,
      managerId: true,
      manager: { select: { id: true, name: true, email: true } },
      createdAt: true,
      updatedAt: true,
    },
  })

  for (const action of auditActions) {
    await createAuditLog({ userId: adminId, action, module: "USER", entityId: id })
  }

  return NextResponse.json(user)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const adminId = session.user.id
  const { id } = await params

  if (adminId === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "User not found" }, { status: 404 })

  if (existing.role === "ADMIN") {
    const activeAdminCount = await prisma.user.count({
      where: { role: "ADMIN", isActive: true },
    })
    if (activeAdminCount <= 1) {
      return NextResponse.json({ error: "Cannot delete the last active administrator" }, { status: 400 })
    }
  }

  await prisma.user.delete({ where: { id } })
  await createAuditLog({ userId: adminId, action: "DELETE", module: "USER", entityId: id })

  return NextResponse.json({ success: true })
}
