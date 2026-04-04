import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { webhookId } = body;

    if (!webhookId) {
      return NextResponse.json(
        { error: "webhookId is required" },
        { status: 400 }
      );
    }

    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook not found" },
        { status: 404 }
      );
    }

    const testPayload = {
      event: webhook.triggerOn,
      test: true,
      timestamp: new Date().toISOString(),
      data: {
        id: "test_123",
        message: "This is a test payload from Owly",
        webhookName: webhook.name,
        triggerEvent: webhook.triggerOn,
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "Owly-Webhook/1.0",
      ...(typeof webhook.headers === "object" && webhook.headers !== null
        ? (webhook.headers as Record<string, string>)
        : {}),
    };

    const fetchOptions: RequestInit = {
      method: webhook.method,
      headers,
    };

    if (webhook.method !== "GET") {
      fetchOptions.body = JSON.stringify(testPayload);
    }

    const response = await fetch(webhook.url, fetchOptions);

    let responseBody: string;
    try {
      responseBody = await response.text();
    } catch {
      responseBody = "(unable to read response body)";
    }

    // Limit preview length
    const bodyPreview =
      responseBody.length > 1000
        ? responseBody.slice(0, 1000) + "..."
        : responseBody;

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      bodyPreview,
      sentPayload: testPayload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to send test webhook";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
