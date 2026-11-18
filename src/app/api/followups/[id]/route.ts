import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const followUp = await prisma.followUp.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  })

  if (!followUp) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })

  if (session.user.role === "SALES_EXECUTIVE" && followUp.assignedToId && followUp.assignedToId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json(followUp)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { id } = await params
  const body = await request.json()
  const { subject, type, status, followUpDate, notes, assignedToId, customerId, leadId, opportunityId } = body

  const existing = await prisma.followUp.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Follow-up not found" }, { status: 404 })

  if (role === "SALES_EXECUTIVE" && existing.assignedToId && existing.assignedToId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (role === "SALES_EXECUTIVE" && assignedToId !== undefined && assignedToId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign follow-ups to other users" }, { status: 403 })
  }

  if (subject !== undefined && (!subject || !subject.trim())) {
    return NextResponse.json({ error: "Subject cannot be empty" }, { status: 400 })
  }

  if (existing.status === "COMPLETED" && status === "COMPLETED") {
    return NextResponse.json({ error: "Completed follow-ups cannot be completed again" }, { status: 400 })
  }

  if (followUpDate !== undefined) {
    const dateObj = new Date(followUpDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dateObj < today && status !== "COMPLETED") {
      return NextResponse.json({ error: "Follow-up date cannot be in the past" }, { status: 400 })
    }
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

  const isRescheduled = followUpDate !== undefined && new Date(followUpDate).getTime() !== new Date(existing.followUpDate).getTime()
  let auditAction = "UPDATE"
  if (status !== undefined && status !== existing.status) {
    auditAction = status === "COMPLETED" ? "FOLLOWUP_COMPLETED" : "STATUS_CHANGE"
  } else if (isRescheduled) {
    auditAction = "FOLLOWUP_RESCHEDULED"
  }

  const followUp = await prisma.followUp.update({
    where: { id },
    data: {
      ...(subject !== undefined && { subject: subject.trim() }),
      ...(type !== undefined && { type }),
      ...(status !== undefined && { status }),
      ...(followUpDate !== undefined && { followUpDate: new Date(followUpDate) }),
      ...(notes !== undefined && { notes }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(customerId !== undefined && { customerId }),
      ...(leadId !== undefined && { leadId }),
      ...(opportunityId !== undefined && { opportunityId }),
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
      lead: { select: { id: true, name: true } },
      opportunity: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({ userId, action: auditAction, module: "FOLLOWUP", entityId: id })

  return NextResponse.json(followUp)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  const { id } = await params

  await prisma.followUp.delete({ where: { id } })
  await createAuditLog({ userId, action: "DELETE", module: "FOLLOWUP", entityId: id })

  return NextResponse.json({ success: true })
}
