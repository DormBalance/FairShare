// Prisma client singleton to prevent multiple instances during Next.js hot reload in development.
// Pattern referenced from Prisma docs (best practices for Next.js).
// AI was used to speed up translating those docs into this boilerplate.

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
