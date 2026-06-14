import { NextResponse } from "next/server";
import {
  createMobileSessionSchema,
  historyQuerySchema
} from "@speakielts/contracts";
import { prisma } from "@/lib/db";
import { handleRouteError } from "@/lib/api/http";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";
import {
  decodeCursor,
  encodeCursor,
  toMobileSessionSummary
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const url = new URL(request.url);
    const query = historyQuerySchema.parse({
      cursor: url.searchParams.get("cursor") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined
    });
    const cursorId = decodeCursor(query.cursor);
    const sessions = await prisma.speakingSession.findMany({
      where: { userId: user.id },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: query.limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
    });
    const hasNextPage = sessions.length > query.limit;
    const page = hasNextPage ? sessions.slice(0, query.limit) : sessions;

    return NextResponse.json({
      sessions: page.map(toMobileSessionSummary),
      nextCursor: hasNextPage ? encodeCursor(page.at(-1)?.id) : null
    });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireUser(request.headers);
    const input = createMobileSessionSchema.parse(await request.json());
    const session = await prisma.speakingSession.create({
      data: {
        userId: user.id,
        mode: input.mode,
        topic: input.topic,
        targetBand: input.targetBand,
        voice: input.voice
      }
    });

    return NextResponse.json(
      { session: toMobileSessionSummary(session) },
      { status: 201 }
    );
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
