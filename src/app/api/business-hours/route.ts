import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let config = await prisma.businessHours.findUnique({
      where: { id: "default" },
    });

    if (!config) {
      config = await prisma.businessHours.create({
        data: { id: "default" },
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to fetch business hours:", error);
    return NextResponse.json(
      { error: "Failed to fetch business hours" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      enabled,
      timezone,
      monday,
      tuesday,
      wednesday,
      thursday,
      friday,
      saturday,
      sunday,
      offlineMessage,
    } = body;

    const timePattern = /^\d{2}:\d{2}-\d{2}:\d{2}$/;
    const days = { monday, tuesday, wednesday, thursday, friday, saturday, sunday };

    for (const [day, value] of Object.entries(days)) {
      if (value !== undefined && value !== "" && !timePattern.test(value as string)) {
        return NextResponse.json(
          { error: `Invalid time format for ${day}. Use HH:mm-HH:mm or leave empty.` },
          { status: 400 }
        );
      }
    }

    const config = await prisma.businessHours.upsert({
      where: { id: "default" },
      update: {
        ...(enabled !== undefined && { enabled }),
        ...(timezone !== undefined && { timezone }),
        ...(monday !== undefined && { monday }),
        ...(tuesday !== undefined && { tuesday }),
        ...(wednesday !== undefined && { wednesday }),
        ...(thursday !== undefined && { thursday }),
        ...(friday !== undefined && { friday }),
        ...(saturday !== undefined && { saturday }),
        ...(sunday !== undefined && { sunday }),
        ...(offlineMessage !== undefined && { offlineMessage }),
      },
      create: {
        id: "default",
        enabled: enabled ?? false,
        timezone: timezone ?? "UTC",
        monday: monday ?? "09:00-18:00",
        tuesday: tuesday ?? "09:00-18:00",
        wednesday: wednesday ?? "09:00-18:00",
        thursday: thursday ?? "09:00-18:00",
        friday: friday ?? "09:00-18:00",
        saturday: saturday ?? "",
        sunday: sunday ?? "",
        offlineMessage:
          offlineMessage ??
          "We are currently offline. We will get back to you during business hours.",
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error("Failed to update business hours:", error);
    return NextResponse.json(
      { error: "Failed to update business hours" },
      { status: 500 }
    );
  }
}
