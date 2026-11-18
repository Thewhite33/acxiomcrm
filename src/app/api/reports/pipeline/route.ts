import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const role = session.user.role

  const isSalesExec = role === "SALES_EXECUTIVE"
  const ownerFilter = isSalesExec ? { ownerId: userId } : {}

  const opportunities = await prisma.opportunity.findMany({
    where: ownerFilter,
    include: { owner: true },
  })

  const stageMap: Record<string, { count: number; totalAmount: number; weightedAmount: number }> = {}
  for (const o of opportunities) {
    if (!stageMap[o.stage]) {
      stageMap[o.stage] = { count: 0, totalAmount: 0, weightedAmount: 0 }
    }
    stageMap[o.stage].count += 1
    stageMap[o.stage].totalAmount += o.amount
    stageMap[o.stage].weightedAmount += (o.amount * o.probability) / 100
  }

  const byStage = Object.entries(stageMap).map(([stage, data]) => ({ stage, ...data }))

  const ownerMap: Record<string, { ownerId: string; ownerName: string; count: number; totalAmount: number }> = {}
  for (const o of opportunities) {
    if (!o.ownerId) continue
    if (!ownerMap[o.ownerId]) {
      ownerMap[o.ownerId] = {
        ownerId: o.ownerId,
        ownerName: o.owner?.name ?? "Unknown",
        count: 0,
        totalAmount: 0,
      }
    }
    ownerMap[o.ownerId].count += 1
    ownerMap[o.ownerId].totalAmount += o.amount
  }

  const byOwner = Object.values(ownerMap)

  const totalAmount = opportunities
    .filter((o) => o.stage !== "WON" && o.stage !== "LOST")
    .reduce((s, o) => s + o.amount, 0)

  const weightedAmount = opportunities
    .filter((o) => o.stage !== "WON" && o.stage !== "LOST")
    .reduce((s, o) => s + (o.amount * o.probability) / 100, 0)

  const wonAmount = opportunities
    .filter((o) => o.stage === "WON")
    .reduce((s, o) => s + o.amount, 0)

  const lostAmount = opportunities
    .filter((o) => o.stage === "LOST")
    .reduce((s, o) => s + o.amount, 0)

  return NextResponse.json({
    byStage,
    byOwner,
    summary: { totalAmount, weightedAmount, wonAmount, lostAmount },
  })
}
