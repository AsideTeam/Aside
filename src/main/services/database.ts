import { PrismaClient } from '@prisma/client'
import { Config } from '@main/core/env'
import { createLogger } from '@main/utils/logger'

const logger = createLogger('database')

let prismaInstance: PrismaClient | null = null

/**
 * Prisma Client 싱글톤
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    const config = Config.getInstance()
    logger.info('Initializing Prisma Client', { dbPath: config.dbPath })

    prismaInstance = new PrismaClient({
      datasources: {
        db: {
          url: config.databaseUrl,
        },
      },
    })
  }
  return prismaInstance
}

/**
 * Prisma Client 종료
 */
export async function closePrismaClient(): Promise<void> {
  if (prismaInstance) {
    logger.info('Disconnecting Prisma Client')
    await prismaInstance.$disconnect()
    prismaInstance = null
    logger.info('Prisma Client disconnected')
  }
}
