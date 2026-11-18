import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const assignedToId = searchParams.get("assignedToId")

  const where: Record<string, unknown> = {}

  if (role === "SALES_EXECUTIVE") {
    where.assignedToId = userId
  } else if (assignedToId) {
    where.assignedToId = assignedToId
  }

  if (status) where.status = status
  if (priority) where.priority = priority

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { companyName: { contains: search, mode: "insensitive" } },
    ]
  }

  const leads = await prisma.lead.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(leads)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const body = await request.json()
  const { name, email, phone, companyName, source, status, priority, expectedValue, notes, assignedToId, customerId } = body

  if (role === "SALES_EXECUTIVE" && assignedToId && assignedToId !== userId) {
    return NextResponse.json({ error: "Sales Executives cannot assign leads to other users" }, { status: 403 })
  }

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
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

  const lead = await prisma.lead.create({
    data: {
      name: name.trim(),
      email,
      phone: phone || null,
      companyName: companyName || null,
      source: source || null,
      status: status ?? "NEW",
      priority: priority ?? "MEDIUM",
      expectedValue: expectedValue != null && expectedValue !== "" ? parseFloat(expectedValue) : null,
      notes: notes || null,
      assignedToId: finalAssignedToId,
      customerId: customerId || null,
    },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
      customer: { select: { id: true, name: true } },
    },
  })

  await createAuditLog({ userId, action: "CREATE", module: "LEAD", entityId: lead.id })

  return NextResponse.json(lead, { status: 201 })
}
