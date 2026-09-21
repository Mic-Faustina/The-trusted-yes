import { NextRequest, NextResponse } from "next/server";
import { peekQuestion } from "@/lib/challenges";
import { QUESTIONS } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nonce: string }> }
) {
  const { nonce } = await params;
  const question = peekQuestion(nonce);
  if (!question) {
    return NextResponse.json({ error: "Unknown or expired challenge" }, { status: 404 });
  }
  return NextResponse.json({ question, questionText: QUESTIONS[question] });
}