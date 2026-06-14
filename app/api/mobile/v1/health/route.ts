import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "speakielts-api",
    timestamp: new Date().toISOString()
  });
}
