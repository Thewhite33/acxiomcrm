import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const status = searchParams.get("status")
  const assignedToId = searchParams.get("assignedToId")

  const where: Record<string, unknown> = {}

  if (role === "SALES_EXECUTIVE") {
    where.assignedToId = userId
  } else if (assignedToId) {
    where.assignedToId = assignedToId
  }

  if (status) where.status = status

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ]
  }

  const customers = await prisma.customer.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(customers)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const body = await request.json()
  const { name, email, phone, companyName, address, status, assignedToId, notes } = body

  if (role === "SALES_EXECUTIVE" && assignedToId && assignedToId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign customers to other users" }, { status: 403 })
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
  }
  if (phone && phone.trim() !== "" && !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: "Invalid phone format" }, { status: 400 })
  }

  const existingEmail = await prisma.customer.findUnique({ where: { email } })
  if (existingEmail) {
    return NextResponse.json({ error: "A customer with this email already exists" }, { status: 409 })
  }

  if (phone && phone.trim() !== "") {
    const existingPhone = await prisma.customer.findFirst({
      where: { phone: phone.trim() },
    })
    if (existingPhone) {
      return NextResponse.json({ error: "A customer with this phone number already exists" }, { status: 409 })
    }
  }

  const finalAssignedToId = role === "SALES_EXECUTIVE" ? userId : (assignedToId || null)

  if (finalAssignedToId) {
    const targetUser = await prisma.user.findUnique({ where: { id: finalAssignedToId } })
    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 })
    }
    if (role === "MANAGER" && finalAssignedToId !== userId && targetUser.managerId !== userId) {
      return NextResponse.json({ error: "Managers can only assign work to themselves or their assigned sales executives" }, { status: 403 })
    }
  }

  const customer = await prisma.customer.create({
    data: {
      name: name.trim(),
      email,
      phone: phone || null,
      companyName: companyName || null,
      address: address || null,
      status: status ?? "ACTIVE",
      assignedToId: finalAssignedToId,
      notes: notes || null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  await createAuditLog({ userId, action: "CREATE", module: "CUSTOMER", entityId: customer.id })

  return NextResponse.json(customer, { status: 201 })
}
