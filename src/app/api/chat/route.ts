import { NextResponse } from "next/server";
import { handleMessage } from "../../../service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await handleMessage({
      conversationId: body.conversationId,
      brandId: body.brandId,
      channel: "chat",
      payload: { text: body.text },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
