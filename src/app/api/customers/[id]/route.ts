import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      leads: { orderBy: { createdAt: "desc" } },
      followUps: { orderBy: { followUpDate: "asc" } },
      opportunities: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  if (session.user.role === "SALES_EXECUTIVE" && customer.assignedToId && customer.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(customer)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { id } = await params
  const body = await request.json()
  const { name, email, phone, companyName, address, status, assignedToId, notes } = body

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  if (role === "SALES_EXECUTIVE" && existing.assignedToId && existing.assignedToId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (role === "SALES_EXECUTIVE" && assignedToId !== undefined && assignedToId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign customers to other users" }, { status: 403 })
  }

  if (name !== undefined && (!name || !name.trim())) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
  }
  if (email !== undefined && !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
  }
  if (phone !== undefined && phone && phone.trim() !== "" && !PHONE_REGEX.test(phone)) {
    return NextResponse.json({ error: "Invalid phone format" }, { status: 400 })
  }

  if (email && email !== existing.email) {
    const existingEmail = await prisma.customer.findFirst({ where: { email, NOT: { id } } })
    if (existingEmail) return NextResponse.json({ error: "A customer with this email already exists" }, { status: 409 })
  }

  if (phone && phone.trim() !== "" && phone !== existing.phone) {
    const existingPhone = await prisma.customer.findFirst({ where: { phone: phone.trim(), NOT: { id } } })
    if (existingPhone) return NextResponse.json({ error: "A customer with this phone number already exists" }, { status: 409 })
  }

  if (assignedToId && assignedToId !== existing.assignedToId) {
    const targetUser = await prisma.user.findUnique({ where: { id: assignedToId } })
    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 })
    }
    if (role === "MANAGER" && assignedToId !== userId && targetUser.managerId !== userId) {
      return NextResponse.json({ error: "Managers can only assign work to themselves or their assigned sales executives" }, { status: 403 })
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(companyName !== undefined && { companyName: companyName || null }),
      ...(address !== undefined && { address: address || null }),
      ...(status !== undefined && { status }),
      ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })

  await createAuditLog({ userId, action: "UPDATE", module: "CUSTOMER", entityId: id })

  return NextResponse.json(customer)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  const { id } = await params

  const existing = await prisma.customer.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  await prisma.customer.delete({ where: { id } })
  await createAuditLog({ userId, action: "DELETE", module: "CUSTOMER", entityId: id })

  return NextResponse.json({ success: true })
}
