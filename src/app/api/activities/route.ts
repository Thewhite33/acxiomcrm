import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const assignedToId = searchParams.get("assignedToId")

    const where: Record<string, unknown> = {}
    if (session.user.role === "SALES_EXECUTIVE") {
      where.assignedToId = session.user.id
    } else if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (type) where.activityType = type
    if (status) where.status = status

    const activities = await prisma.activity.findMany({
      where,
      include: {
        assignedTo: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        lead: { select: { id: true, name: true } },
      },
      orderBy: { activityDate: "desc" },
    })

    return NextResponse.json(activities)
  } catch {
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { activityType, subject, description, activityDate, status, assignedToId, customerId, leadId } = body

    if (session.user.role === "SALES_EXECUTIVE" && assignedToId && assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Sales Executives cannot assign activities or tasks to other users" }, { status: 403 })
    }

    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }

    if (!activityType) {
      return NextResponse.json({ error: "Activity type is required" }, { status: 400 })
    }

    const finalAssignedToId = session.user.role === "SALES_EXECUTIVE" ? session.user.id : (assignedToId || session.user.id)

    if (finalAssignedToId) {
      const targetUser = await prisma.user.findUnique({ where: { id: finalAssignedToId } })
      if (!targetUser || !targetUser.isActive) {
        return NextResponse.json({ error: "Assigned employee not found or inactive" }, { status: 400 })
      }
      if (session.user.role === "MANAGER" && finalAssignedToId !== session.user.id && targetUser.managerId !== session.user.id) {
        return NextResponse.json({ error: "Managers can only assign work to themselves or their assigned sales executives" }, { status: 403 })
      }
    }

    const activity = await prisma.activity.create({
      data: {
        activityType,
        subject,
        description: description || null,
        activityDate: activityDate ? new Date(activityDate) : new Date(),
        status: status || "COMPLETED",
        assignedToId: finalAssignedToId,
        customerId: customerId || null,
        leadId: leadId || null,
      },
    })

    await createAuditLog({
      userId: session.user.id,
      action: "CREATE",
      module: "ACTIVITY",
      recordId: activity.id,
      result: "Activity logged",
      metadata: { activityType, subject },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create activity" }, { status: 500 })
  }
}
