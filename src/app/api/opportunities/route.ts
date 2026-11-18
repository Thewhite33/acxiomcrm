import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get("stage")
  const customerId = searchParams.get("customerId")
  const ownerId = searchParams.get("ownerId")

  const where: Record<string, unknown> = {}

  if (role === "SALES_EXECUTIVE") {
    where.ownerId = userId
  } else if (ownerId) {
    where.ownerId = ownerId
  }

  if (stage) where.stage = stage
  if (customerId) where.customerId = customerId

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const withWeighted = opportunities.map((opp) => ({
    ...opp,
    weightedValue: opp.amount && opp.probability != null ? (Number(opp.amount) * opp.probability) / 100 : 0,
  }))

  return NextResponse.json(withWeighted)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const body = await request.json()
  const { name, customerId, stage, amount, probability, expectedCloseDate, source, notes, ownerId } = body

  if (role === "SALES_EXECUTIVE" && ownerId && ownerId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign opportunities to other users" }, { status: 403 })
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!customerId) {
    return NextResponse.json({ error: "Customer is required" }, { status: 400 })
  }

  const existingCustomer = await prisma.customer.findUnique({ where: { id: customerId } })
  if (!existingCustomer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })
  }

  const finalOwnerId = role === "SALES_EXECUTIVE" ? userId : (ownerId || null)

  if (finalOwnerId) {
    const targetUser = await prisma.user.findUnique({ where: { id: finalOwnerId } })
    if (!targetUser || !targetUser.isActive) {
      return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 })
    }
    if (role === "MANAGER" && finalOwnerId !== userId && targetUser.managerId !== userId) {
      return NextResponse.json({ error: "Managers can only assign work to themselves or their assigned sales executives" }, { status: 403 })
    }
  }

  if (amount == null || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
  }
  if (probability != null && (Number(probability) < 0 || Number(probability) > 100)) {
    return NextResponse.json({ error: "Probability must be between 0 and 100" }, { status: 400 })
  }
  if (!expectedCloseDate) {
    return NextResponse.json({ error: "Expected close date is required" }, { status: 400 })
  }

  const activeStages = ["QUALIFICATION", "PROPOSAL", "NEGOTIATION"]
  const currentStage = stage ?? "QUALIFICATION"
  const closeDateObj = new Date(expectedCloseDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (activeStages.includes(currentStage) && closeDateObj < today) {
    return NextResponse.json({ error: "Expected close date cannot be in the past for active opportunities" }, { status: 400 })
  }

  const prob = probability != null ? Number(probability) : 50
  const weightedValue = (Number(amount) * prob) / 100

  const opportunity = await prisma.opportunity.create({
    data: {
      name: name.trim(),
      customerId,
      stage: currentStage,
      amount: Number(amount),
      probability: prob,
      expectedCloseDate: closeDateObj,
      source: source ?? null,
      notes: notes ?? null,
      ownerId: finalOwnerId,
    },
    include: {
      customer: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true, email: true } },
    },
  })

  await createAuditLog({
    userId,
    action: "CREATE",
    module: "OPPORTUNITY",
    recordId: opportunity.id,
    result: "SUCCESS",
  })

  return NextResponse.json({ ...opportunity, weightedValue }, { status: 201 })
}
