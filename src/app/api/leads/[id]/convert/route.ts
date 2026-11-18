import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createAuditLog } from "@/lib/audit"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { createOpportunity, opportunityName, dealAmount } = body

  const lead = await prisma.lead.findUnique({ where: { id } })
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })
  }
  if (lead.status === "CONVERTED") {
    return NextResponse.json({ error: "Lead has already been converted" }, { status: 409 })
  }
  if (lead.status !== "QUALIFIED") {
    return NextResponse.json({ error: "Lead must be in QUALIFIED status to convert" }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    let customer = await tx.customer.findUnique({ where: { email: lead.email } })

    if (!customer) {
      customer = await tx.customer.create({
        data: {
          name: lead.name,
          email: lead.email,
          phone: lead.phone || null,
          companyName: lead.companyName || null,
          notes: lead.notes || null,
          assignedToId: lead.assignedToId || null,
          status: "ACTIVE",
        },
      })
    }

    let opportunity = null
    const shouldCreateOpp = createOpportunity === true || (dealAmount && Number(dealAmount) > 0)
    if (shouldCreateOpp) {
      const oppName = opportunityName || `${lead.name} - Opportunity`
      const amount = Number(dealAmount || lead.expectedValue || 1000)
      const closeDate = new Date()
      closeDate.setDate(closeDate.getDate() + 30)

      opportunity = await tx.opportunity.create({
        data: {
          name: oppName,
          customerId: customer.id,
          stage: "QUALIFICATION",
          amount: amount > 0 ? amount : 1000,
          probability: 20,
          expectedCloseDate: closeDate,
          ownerId: lead.assignedToId || session.user.id,
        },
      })
    }

    const updatedLead = await tx.lead.update({
      where: { id },
      data: {
        status: "CONVERTED",
        convertedAt: new Date(),
        customerId: customer.id,
      },
    })

    return { customer, opportunity, lead: updatedLead }
  })

  await createAuditLog({
    userId: session.user.id,
    action: "CONVERT",
    module: "LEAD",
    recordId: id,
    result: "SUCCESS",
  })

  return NextResponse.json(result)
}
