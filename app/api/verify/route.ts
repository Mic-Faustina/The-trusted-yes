import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { PUBLIC_KEY, JWT_ALGORITHM, ISSUER, QUESTIONS } from "@/lib/auth";
import { consumeChallenge } from "@/lib/challenges";

export async function POST(req: NextRequest) {
  const { credentialToken, bindingToken, nonce } = await req.json();

  // 1. The registry signed this.
  let cred: jwt.JwtPayload;
  try {
    cred = jwt.verify(credentialToken, PUBLIC_KEY, {
      algorithms: [JWT_ALGORITHM],
    }) as jwt.JwtPayload;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Invalid credential";
    return NextResponse.json({ ok: false, outcome: "invalid", reason });
  }

  if (cred.iss !== ISSUER) {
    return NextResponse.json({ ok: false, outcome: "invalid", reason: "Wrong issuer" });
  }

  // 2. The presenter holds the bound key.
  const holderPublicKey = cred.cnf?.key;
  if (!holderPublicKey) {
    return NextResponse.json({ ok: false, outcome: "invalid", reason: "Credential has no bound key" });
  }

  let binding: jwt.JwtPayload;
  try {
    binding = jwt.verify(bindingToken, holderPublicKey, {
      algorithms: [JWT_ALGORITHM],
    }) as jwt.JwtPayload;
  } catch (err) {
    const reason = err instanceof Error ? err.message : "Invalid binding";
    return NextResponse.json({ ok: false, outcome: "forged", reason });
  }

  // 3. This proof answers THIS challenge.
  if (binding.nonce !== nonce) {
    return NextResponse.json({
      ok: false, outcome: "invalid", reason: "Proof does not match the challenge issued",
    });
  }

  const challenge = consumeChallenge(nonce);
  if (!challenge.ok) {
    return NextResponse.json({ ok: false, outcome: "replayed", reason: challenge.reason });
  }

  // 4. And it answers the question that was actually asked.
  if (cred.question !== challenge.question) {
    return NextResponse.json({
      ok: false, outcome: "invalid",
      reason: `Answered "${cred.question}" but "${challenge.question}" was asked`,
    });
  }

  return NextResponse.json({
    ok: true,
    outcome: "valid",
    question: challenge.question,
    questionText: QUESTIONS[challenge.question],
    answer: cred.answer,
    sub: cred.sub,
  });
}