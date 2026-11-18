import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const assignedToId = searchParams.get("assignedToId")
  const customerId = searchParams.get("customerId")
  const leadId = searchParams.get("leadId")
  const opportunityId = searchParams.get("opportunityId")
  const type = searchParams.get("type")

  const where: Record<string, unknown> = {}

  if (session.user.role === "SALES_EXECUTIVE") {
    where.assignedToId = session.user.id
  } else if (assignedToId) {
    where.assignedToId = assignedToId
  }

  if (status) where.status = status
  if (customerId) where.customerId = customerId
  if (leadId) where.leadId = leadId
  if (opportunityId) where.opportunityId = opportunityId

  if (type === "upcoming") {
    where.followUpDate = { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
    if (!status) where.status = "PLANNED"
  } else if (type === "overdue") {
    where.followUpDate = { lt: new Date(new Date().setHours(0, 0, 0, 0)) }
    if (!status) where.status = "PLANNED"
  }

  const followUps = await prisma.followUp.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
    orderBy: { followUpDate: "asc" },
  })

  return NextResponse.json(followUps)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const body = await request.json()
  const { subject, type, status, followUpDate, notes, assignedToId, customerId, leadId, opportunityId } = body

  if (role === "SALES_EXECUTIVE" && assignedToId && assignedToId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign follow-ups to other users" }, { status: 403 })
  }

  if (!subject || typeof subject !== "string" || !subject.trim()) {
    return NextResponse.json({ error: "Subject is required" }, { status: 400 })
  }
  if (!followUpDate) {
    return NextResponse.json({ error: "Follow-up date is required" }, { status: 400 })
  }
  if (!customerId && !leadId && !opportunityId) {
    return NextResponse.json({ error: "Follow-up must reference a customer, lead, or opportunity" }, { status: 400 })
  }

  const followUpDateObj = new Date(followUpDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (followUpDateObj < today) {
    return NextResponse.json({ error: "Follow-up date cannot be in the past" }, { status: 400 })
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

  const followUp = await prisma.followUp.create({
    data: {
      subject: subject.trim(),
      type: type ?? null,
      status: status ?? "PLANNED",
      followUpDate: followUpDateObj,
      notes: notes ?? null,
      assignedToId: finalAssignedToId,
      customerId: customerId ?? null,
      leadId: leadId ?? null,
      opportunityId: opportunityId ?? null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({ userId, action: "CREATE", module: "FOLLOWUP", entityId: followUp.id })

  return NextResponse.json(followUp, { status: 201 })
}
