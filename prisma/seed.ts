import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const connectionString: string =
  process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/acxiomcrm"

const prisma =
  connectionString.startsWith("prisma+postgres://") || connectionString.startsWith("prisma://")
    ? new PrismaClient({ accelerateUrl: connectionString })
    : new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

async function main() {
  const adminHash = await bcrypt.hash("Admin@123", 12)
  const managerHash = await bcrypt.hash("Manager@123", 12)
  const salesHash = await bcrypt.hash("Sales@123", 12)

  const admin = await prisma.user.upsert({
    where: { email: "admin@acxiom.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@acxiom.com",
      passwordHash: adminHash,
      role: "ADMIN",
    },
  })

  const manager = await prisma.user.upsert({
    where: { email: "manager@acxiom.com" },
    update: {},
    create: {
      name: "Sales Manager",
      email: "manager@acxiom.com",
      passwordHash: managerHash,
      role: "MANAGER",
    },
  })

  const salesExec = await prisma.user.upsert({
    where: { email: "john@acxiom.com" },
    update: { managerId: manager.id },
    create: {
      name: "John Sales",
      email: "john@acxiom.com",
      passwordHash: salesHash,
      role: "SALES_EXECUTIVE",
      managerId: manager.id,
    },
  })

  const customer1 = await prisma.customer.upsert({
    where: { email: "alice@techcorp.com" },
    update: {},
    create: {
      name: "Alice Johnson",
      email: "alice@techcorp.com",
      phone: "9876543210",
      companyName: "TechCorp Systems",
      address: "123 Tech Ave, San Francisco, CA",
      status: "ACTIVE",
      notes: "Long-term enterprise client",
      assignedToId: salesExec.id,
    },
  })

  const customer2 = await prisma.customer.upsert({
    where: { email: "bob@globex.com" },
    update: {},
    create: {
      name: "Bob Martinez",
      email: "bob@globex.com",
      phone: "9876543211",
      companyName: "Globex Industries",
      address: "456 Business Blvd, New York, NY",
      status: "ACTIVE",
      notes: "Mid-market client interested in expansion",
      assignedToId: manager.id,
    },
  })

  const customer3 = await prisma.customer.upsert({
    where: { email: "carol@startup.io" },
    update: {},
    create: {
      name: "Carol White",
      email: "carol@startup.io",
      phone: "9876543212",
      companyName: "Startup Dynamics",
      address: "789 Innovation Dr, Austin, TX",
      status: "PROSPECT",
      notes: "Startup evaluating our platform",
      assignedToId: salesExec.id,
    },
  })

  await prisma.lead.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "David Kim",
        email: "david@newco.com",
        phone: "9876543213",
        source: "Website",
        status: "NEW",
        priority: "HIGH",
        expectedValue: 12000,
        notes: "Enquired about enterprise plan",
        assignedToId: salesExec.id,
      },
      {
        name: "Emma Davis",
        email: "emma@prospect.org",
        phone: "9876543214",
        source: "Referral",
        status: "CONTACTED",
        priority: "MEDIUM",
        expectedValue: 8000,
        notes: "Referred by Alice Johnson",
        assignedToId: manager.id,
      },
      {
        name: "Frank Lee",
        email: "frank@bigbiz.net",
        phone: "9876543215",
        source: "LinkedIn",
        status: "QUALIFIED",
        priority: "HIGH",
        expectedValue: 35000,
        notes: "Ready to move forward with purchase",
        assignedToId: salesExec.id,
        customerId: customer3.id,
      },
    ],
  })

  await prisma.opportunity.createMany({
    skipDuplicates: true,
    data: [
      {
        name: "TechCorp Enterprise Deal",
        stage: "PROPOSAL",
        amount: 75000,
        probability: 60,
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        source: "Inbound",
        notes: "Annual enterprise license renewal and expansion",
        ownerId: salesExec.id,
        customerId: customer1.id,
      },
      {
        name: "Globex Expansion Package",
        stage: "NEGOTIATION",
        amount: 45000,
        probability: 80,
        expectedCloseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        source: "Outbound",
        notes: "Adding 50 more seats to existing contract",
        ownerId: manager.id,
        customerId: customer2.id,
      },
    ],
  })

  await prisma.followUp.createMany({
    skipDuplicates: true,
    data: [
      {
        subject: "Quarterly Strategy Review with TechCorp",
        type: "MEETING",
        status: "PLANNED",
        followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        assignedToId: salesExec.id,
        customerId: customer1.id,
        notes: "Present Q3 roadmaps and new feature tiers",
      },
      {
        subject: "Follow up on Globex proposal draft",
        type: "CALL",
        status: "PLANNED",
        followUpDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        assignedToId: manager.id,
        customerId: customer2.id,
        notes: "Address pricing model questions",
      },
    ],
  })

  console.log("Database seeded successfully with demo users:")
  console.log("Admin: admin@acxiom.com / Admin@123")
  console.log("Manager: manager@acxiom.com / Manager@123")
  console.log("Sales Executive: john@acxiom.com / Sales@123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
