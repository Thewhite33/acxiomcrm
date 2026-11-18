import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const opportunity = await prisma.opportunity.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
      followUps: { orderBy: { followUpDate: "asc" } },
    },
  })

  if (!opportunity) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })

  if (session.user.role === "SALES_EXECUTIVE" && opportunity.ownerId && opportunity.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const weightedValue =
    opportunity.amount && opportunity.probability != null
      ? (Number(opportunity.amount) * opportunity.probability) / 100
      : 0

  return NextResponse.json({ ...opportunity, weightedValue })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { id } = await params
  const body = await request.json()
  const { name, customerId, stage, amount, probability, expectedCloseDate, source, notes, ownerId } = body

  const existing = await prisma.opportunity.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })

  if (role === "SALES_EXECUTIVE" && existing.ownerId && existing.ownerId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (role === "SALES_EXECUTIVE" && ownerId !== undefined && ownerId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign opportunities to other users" }, { status: 403 })
  }

  if (name !== undefined && (!name || !name.trim())) {
    return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 })
  }
  if (amount !== undefined && (isNaN(Number(amount)) || Number(amount) <= 0)) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }
  if (probability !== undefined && (Number(probability) < 0 || Number(probability) > 100)) {
    return NextResponse.json({ error: "Probability must be between 0 and 100" }, { status: 400 })
  }

  if (customerId && customerId !== existing.customerId) {
    const existingCustomer = await prisma.customer.findUnique({ where: { id: customerId } })
    if (!existingCustomer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  if (ownerId && ownerId !== existing.ownerId) {
    const targetUser = await prisma.user.findUnique({ where: { id: ownerId } })
    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 })
    }
    if (role === "MANAGER" && ownerId !== userId && targetUser.managerId !== userId) {
      return NextResponse.json({ error: "Managers can only assign work to themselves or their assigned sales executives" }, { status: 403 })
    }
  }

  const activeStages = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION"]
  const currentStage = stage ?? existing.stage
  if (expectedCloseDate !== undefined) {
    const closeDateObj = new Date(expectedCloseDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (activeStages.includes(currentStage) && closeDateObj < today) {
      return NextResponse.json(
        { error: "Expected close date cannot be in the past for active opportunities" },
        { status: 400 }
      )
    }
  }

  const newAmount = amount !== undefined ? Number(amount) : Number(existing.amount)
  const newProbability = probability !== undefined ? Number(probability) : (existing.probability ?? 0)
  const weightedValue = (newAmount * newProbability) / 100

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(customerId !== undefined && { customerId }),
      ...(stage !== undefined && { stage }),
      ...(amount !== undefined && { amount: Number(amount) }),
      ...(probability !== undefined && { probability: Number(probability) }),
      ...(expectedCloseDate !== undefined && { expectedCloseDate: new Date(expectedCloseDate) }),
      ...(source !== undefined && { source }),
      ...(notes !== undefined && { notes }),
      ...(ownerId !== undefined && { ownerId }),
    },
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  let action = "UPDATE"
  if (stage !== undefined && stage !== existing.stage) {
    action = stage === "WON" || stage === "LOST" ? "STATUS_CHANGE" : "UPDATE"
  }

  await createAuditLog({
    userId,
    action: "DELETE",
    module: "OPPORTUNITY",
    entityId: id,
  })

  return NextResponse.json({ ...opportunity, weightedValue })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const userId = session.user.id
  const { id } = await params

  await prisma.opportunity.delete({ where: { id } })
  await createAuditLog({
    userId,
    action: "DELETE",
    module: "OPPORTUNITY",
    entityId: id,
  })

  return NextResponse.json({ success: true })
}
