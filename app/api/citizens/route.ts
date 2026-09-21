import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const nin = req.nextUrl.searchParams.get("nin");
  if (!nin) {
    return NextResponse.json({ error: "Missing nin" }, { status: 400 });
  }

  const citizen = await prisma.citizen.findUnique({
    where: { nin },
    select: { id: true, name: true },
  });

  if (!citizen) {
    return NextResponse.json({ error: "No record found for that ID" }, { status: 404 });
  }

  return NextResponse.json(citizen);
}

export async function POST(req: NextRequest) {
  const { name, dob, nin, state } = await req.json();

  if (!name || !dob || !nin || !state) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  try {
    const citizen = await prisma.citizen.create({
      data: { name, dob: new Date(dob), nin, state },
    });
    return NextResponse.json({ id: citizen.id, nin: citizen.nin }, { status: 201 });
  } catch (err) {
    const isDuplicate =
      typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
    if (isDuplicate) {
      return NextResponse.json({ error: "A citizen with this NIN is already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not register citizen" }, { status: 500 });
  }
}