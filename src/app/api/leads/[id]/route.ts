import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const STATUS_TRANSITIONS: Record<string, string[]> = {
  NEW: ["CONTACTED", "UNQUALIFIED", "LOST"],
  CONTACTED: ["QUALIFIED", "UNQUALIFIED", "LOST", "NEW"],
  QUALIFIED: ["CONVERTED", "LOST", "CONTACTED"],
  UNQUALIFIED: ["NEW", "CONTACTED", "LOST"],
  CONVERTED: [],
  LOST: ["NEW", "CONTACTED"],
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      followUps: { orderBy: { followUpDate: "asc" } },
    },
  })

  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  if (session.user.role === "SALES_EXECUTIVE" && lead.assignedToId && lead.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(lead)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { id } = await params
  const body = await request.json()
  const { name, email, phone, companyName, source, status, priority, expectedValue, notes, assignedToId, customerId } = body

  const existing = await prisma.lead.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  if (role === "SALES_EXECUTIVE" && existing.assignedToId && existing.assignedToId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (role === "SALES_EXECUTIVE" && assignedToId !== undefined && assignedToId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign leads to other users" }, { status: 403 })
  }

  if (name !== undefined && (!name || !name.trim())) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
  }
  if (email !== undefined && !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
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

  let auditAction = "UPDATE"

  if (status !== undefined && status !== existing.status) {
    const isPrivileged = role === "ADMIN" || role === "MANAGER"
    const allowed = STATUS_TRANSITIONS[existing.status] ?? []
    if (!isPrivileged && !allowed.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${existing.status} to ${status}` },
        { status: 400 }
      )
    }

    if (status === "CONVERTED") {
      auditAction = "CONVERT"
    } else {
      auditAction = "STATUS_CHANGE"
    }
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(companyName !== undefined && { companyName: companyName || null }),
      ...(source !== undefined && { source: source || null }),
      ...(status !== undefined && { status }),
      ...(priority !== undefined && { priority }),
      ...(expectedValue !== undefined && {
        expectedValue: expectedValue != null && expectedValue !== "" ? parseFloat(expectedValue) : null,
      }),
      ...(notes !== undefined && { notes: notes || null }),
      ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      ...(customerId !== undefined && { customerId: customerId || null }),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({ userId, action: auditAction, module: "LEAD", entityId: id })

  return NextResponse.json(lead)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  const { id } = await params

  await prisma.lead.delete({ where: { id } })
  await createAuditLog({ userId, action: "DELETE", module: "LEAD", entityId: id })

  return NextResponse.json({ success: true })
}
