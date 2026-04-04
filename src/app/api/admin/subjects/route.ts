import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subjects = await prisma.subject.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { code, name, unitCount, passingScore } = body;

  if (!code || !name) {
    return NextResponse.json({ error: "code and name required" }, { status: 400 });
  }

  const subject = await prisma.subject.create({
    data: { code, name, unitCount: unitCount ?? 0, passingScore: passingScore ?? 0 },
  });

  return NextResponse.json(subject, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
