import { prisma } from "@/lib/prisma"
import { AuditAction } from "@/generated/prisma/enums"

export type AuditLogData = {
  userId?: string
  action: AuditAction | string
  module: string
  recordId?: string
  entityId?: string
  result?: string
  metadata?: any
}

export async function createAuditLog(data: AuditLogData) {
  try {
    const recordId = data.recordId || data.entityId
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        action: data.action as AuditAction,
        module: data.module,
        recordId: recordId || null,
        result: data.result || "SUCCESS",
        metadata: data.metadata ?? undefined,
      },
    })
  } catch {
  }
}
