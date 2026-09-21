import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getHolderKeys, JWT_ALGORITHM } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { citizenId, nonce } = await req.json();

  if (!nonce || typeof nonce !== "string") {
    return NextResponse.json({ error: "Missing nonce" }, { status: 400 });
  }

  const citizen = await prisma.citizen.findUnique({
    where: { id: citizenId },
    select: { id: true },
  });
  if (!citizen) {
    return NextResponse.json({ error: "Citizen not found" }, { status: 404 });
  }

  const holderKeys = getHolderKeys(citizen.id);
  const bindingToken = jwt.sign({ nonce }, holderKeys.privateKey, {
    algorithm: JWT_ALGORITHM,
    expiresIn: "2m",
  });

  return NextResponse.json({ bindingToken });
}