import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

let isShuttingDown = false;

export function isGracefulShutdown(): boolean {
  return isShuttingDown;
}

export function registerShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Allow in-flight requests to complete (10s grace period)
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Close database connection pool
    try {
      await prisma.$disconnect();
      logger.info("Database connections closed");
    } catch (error) {
      logger.error("Error closing database connections", error);
    }

    logger.info("Graceful shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
