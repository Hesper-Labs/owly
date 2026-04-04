import { prisma } from "@/lib/prisma";

export async function logActivity(
  action: string,
  entity: string,
  entityId: string | null,
  description: string,
  userName?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entity,
        entityId,
        description,
        userName: userName || "System",
      },
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
