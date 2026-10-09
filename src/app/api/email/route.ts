import { NextResponse } from "next/server";
import { handleMessage } from "../../../service";

/**
 * Inbound email webhook. Same core, same routing — only the parsing differs.
 * A real deployment would point an inbound-email provider (or IMAP poller)
 * here, and send the outbound reply back over the same channel.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await handleMessage({
      conversationId: body.conversationId,
      brandId: body.brandId,
      channel: "email",
      payload: { from: body.from, subject: body.subject, text: body.text },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
