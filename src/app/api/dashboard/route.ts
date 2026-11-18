import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

function getDateFilter(filter: string | null): { gte: Date; lte: Date } | undefined {
  const now = new Date()
  if (filter === "today") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    const end = new Date(now)
    end.setHours(23, 59, 59, 999)
    return { gte: start, lte: end }
  }
  if (filter === "week") {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { gte: start, lte: end }
  }
  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    return { gte: start, lte: end }
  }
  return undefined
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const userId = session.user.id
  const role = session.user.role
  const { searchParams } = new URL(request.url)
  const dateFilter = searchParams.get("dateFilter")
  const dateRange = getDateFilter(dateFilter)

  const createdAtFilter = dateRange ? { createdAt: dateRange } : {}

  if (role === "ADMIN") {
    const [
      totalCustomers,
      totalLeads,
      openLeads,
      openOpportunities,
      pendingFollowUps,
      totalUsers,
      pipelineAgg,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.customer.count({ where: { ...createdAtFilter } }),
      prisma.lead.count({ where: { ...createdAtFilter } }),
      prisma.lead.count({ where: { status: { notIn: ["CONVERTED", "LOST"] }, ...createdAtFilter } }),
      prisma.opportunity.count({ where: { stage: { notIn: ["WON", "LOST"] }, ...createdAtFilter } }),
      prisma.followUp.count({ where: { status: "PLANNED", ...createdAtFilter } }),
      prisma.user.count(),
      prisma.opportunity.aggregate({
        _sum: { amount: true },
        where: { stage: { notIn: ["WON", "LOST"] }, ...createdAtFilter },
      }),
      prisma.auditLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
      }),
    ])

    return NextResponse.json({
      totalCustomers,
      totalLeads,
      openLeads,
      openOpportunities,
      pendingFollowUps,
      totalUsers,
      totalPipelineAmount: Number(pipelineAgg._sum.amount ?? 0),
      recentAuditLogs,
    })
  }

  if (role === "MANAGER") {
    const [
      totalCustomers,
      totalLeads,
      openLeads,
      openOpportunities,
      pendingFollowUps,
      pipelineAgg,
      teamMembers,
    ] = await Promise.all([
      prisma.customer.count({ where: { ...createdAtFilter } }),
      prisma.lead.count({ where: { ...createdAtFilter } }),
      prisma.lead.count({ where: { status: { notIn: ["CONVERTED", "LOST"] }, ...createdAtFilter } }),
      prisma.opportunity.count({ where: { stage: { notIn: ["WON", "LOST"] }, ...createdAtFilter } }),
      prisma.followUp.count({ where: { status: "PLANNED", ...createdAtFilter } }),
      prisma.opportunity.aggregate({
        _sum: { amount: true },
        where: { stage: { notIn: ["WON", "LOST"] }, ...createdAtFilter },
      }),
      prisma.user.findMany({
        where: { role: "SALES_EXECUTIVE", isActive: true },
        select: { id: true, name: true, email: true },
      }),
    ])

    return NextResponse.json({
      totalCustomers,
      totalLeads,
      openLeads,
      openOpportunities,
      pendingFollowUps,
      totalPipelineAmount: Number(pipelineAgg._sum.amount ?? 0),
      teamMembers,
    })
  }

  const [
    totalCustomers,
    totalLeads,
    openLeads,
    openOpportunities,
    pendingFollowUps,
    pipelineAgg,
  ] = await Promise.all([
    prisma.customer.count({ where: { assignedToId: userId, ...createdAtFilter } }),
    prisma.lead.count({ where: { assignedToId: userId, ...createdAtFilter } }),
    prisma.lead.count({ where: { assignedToId: userId, status: { notIn: ["CONVERTED", "LOST"] }, ...createdAtFilter } }),
    prisma.opportunity.count({ where: { ownerId: userId, stage: { notIn: ["WON", "LOST"] }, ...createdAtFilter } }),
    prisma.followUp.count({ where: { assignedToId: userId, status: "PLANNED", ...createdAtFilter } }),
    prisma.opportunity.aggregate({
      _sum: { amount: true },
      where: { ownerId: userId, stage: { notIn: ["WON", "LOST"] }, ...createdAtFilter },
    }),
  ])

  return NextResponse.json({
    totalCustomers,
    totalLeads,
    openLeads,
    openOpportunities,
    pendingFollowUps,
    totalPipelineAmount: Number(pipelineAgg._sum.amount ?? 0),
  })
}
