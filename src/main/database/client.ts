// @ts-ignore - Prisma 런타임 주입
import { PrismaClient } from '@prisma/client'
import { Config } from '@config/paths'

let prisma: PrismaClient | null = null

/**
 * Prisma Client 싱글톤 인스턴스
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: `file:${Config.getDbPath()}`
        }
      }
    })
  }
  return prisma
}

/**
 * Prisma Client 종료
 */
export async function closePrismaClient(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect()
    prisma = null
  }
}
