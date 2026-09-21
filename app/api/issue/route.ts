import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import {
  PRIVATE_KEY, JWT_ALGORITHM, ISSUER,
  getHolderKeys, answerQuestion, isQuestionId,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { citizenId, question } = await req.json();

  if (!question || !isQuestionId(question)) {
    return NextResponse.json({ error: "Unknown question" }, { status: 400 });
  }

  const citizen = await prisma.citizen.findUnique({ where: { id: citizenId } });
  if (!citizen) {
    return NextResponse.json({ error: "Citizen not found" }, { status: 404 });
  }

  const holderKeys = getHolderKeys(citizen.id);

  const payload = {
    sub: citizen.id,
    iss: ISSUER,
    question,                                  // what was asked
    answer: answerQuestion(citizen, question), // the only fact disclosed
    cnf: { key: holderKeys.publicKey },
  };

  const token = jwt.sign(payload, PRIVATE_KEY, {
    algorithm: JWT_ALGORITHM,
    expiresIn: "5m",
  });

  return NextResponse.json({ token });
}