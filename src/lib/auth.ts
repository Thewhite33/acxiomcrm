import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { createAuditLog } from "@/lib/audit"
import { authConfig } from "@/lib/auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user) {
          await createAuditLog({
            action: "LOGIN_FAILURE",
            module: "AUTH",
            result: "User not found",
            metadata: { email: credentials.email },
          })
          return null
        }

        if (!user.isActive) {
          await createAuditLog({
            userId: user.id,
            action: "LOGIN_FAILURE",
            module: "AUTH",
            result: "Account inactive",
          })
          return null
        }

        if (user.isLocked) {
          await createAuditLog({
            userId: user.id,
            action: "LOGIN_FAILURE",
            module: "AUTH",
            result: "Account locked",
          })
          return null
        }

        const isValid = await bcrypt.compare(credentials.password as string, user.passwordHash)

        if (!isValid) {
          const failedCount = user.failedLoginCount + 1
          const shouldLock = failedCount >= 5
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: failedCount,
              isLocked: shouldLock,
              lockedAt: shouldLock ? new Date() : undefined,
            },
          })
          await createAuditLog({
            userId: user.id,
            action: "LOGIN_FAILURE",
            module: "AUTH",
            result: `Invalid password (attempt ${failedCount})`,
          })
          return null
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { failedLoginCount: 0 },
        })

        await createAuditLog({
          userId: user.id,
          action: "LOGIN_SUCCESS",
          module: "AUTH",
          result: "Success",
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
})
