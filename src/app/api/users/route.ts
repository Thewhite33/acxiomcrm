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

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  if (session.user.role === "SALES_EXECUTIVE") {
    return NextResponse.json([
      {
        id: session.user.id,
        name: session.user.name || "Sales Executive",
        role: "SALES_EXECUTIVE",
      },
    ])
  }

  if (session.user.role === "MANAGER") {
    const teamUsers = await prisma.user.findMany({
      where: {
        isActive: true,
        OR: [
          { id: session.user.id },
          { managerId: session.user.id },
        ],
      },
      select: {
        id: true,
        name: true,
        role: true,
        managerId: true,
      },
      orderBy: { name: "asc" },
    })
    return NextResponse.json(teamUsers)
  }

  const users = await prisma.user.findMany({
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
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const adminId = session.user.id
  const body = await request.json()
  const { name, email, password, role, managerId } = body

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 })
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 })
  }

  if (managerId) {
    const managerUser = await prisma.user.findUnique({ where: { id: managerId } })
    if (!managerUser || managerUser.role !== "MANAGER" || !managerUser.isActive) {
      return NextResponse.json({ error: "Assigned manager not found or inactive" }, { status: 400 })
    }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      passwordHash,
      role: role ?? "SALES_EXECUTIVE",
      managerId: role === "SALES_EXECUTIVE" ? managerId || null : null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isLocked: true,
      managerId: true,
      createdAt: true,
    },
  })

  await createAuditLog({ userId: adminId, action: "CREATE", module: "USER", entityId: user.id })

  return NextResponse.json(user, { status: 201 })
}
