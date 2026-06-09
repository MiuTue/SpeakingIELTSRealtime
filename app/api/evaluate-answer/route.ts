import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api/http";
import { evaluateAnswerSchema } from "@/lib/api/schemas";
import { evaluateAnswer } from "@/lib/scoring/evaluator";
import { handleAuthError, requireUser } from "@/lib/server/authGuards";

export async function POST(request: Request) {
  try {
    await requireUser(request.headers);
    const input = evaluateAnswerSchema.parse(await request.json());
    const feedback = await evaluateAnswer(input);
    return NextResponse.json({ feedback });
  } catch (error) {
    const authError = handleAuthError(error);
    if (authError) return authError;
    return handleRouteError(error);
  }
}
