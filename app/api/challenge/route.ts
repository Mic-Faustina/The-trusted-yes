import { NextRequest, NextResponse } from "next/server";
import { issueChallenge } from "@/lib/challenges";
import { isQuestionId } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { question } = await req.json();
  if (!question || !isQuestionId(question)) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }
  const nonce = issueChallenge(question);
  return NextResponse.json({ nonce, question });
}