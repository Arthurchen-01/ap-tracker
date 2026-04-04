import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");

  const where = classId ? { classId } : {};
  const examDates = await prisma.examDate.findMany({
    where,
    orderBy: { examDate: "asc" },
  });

  return NextResponse.json(examDates);
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET_KEY;

  if (!expectedKey || adminKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { classId, subjectCode, examDate } = body;

  if (!classId || !subjectCode || !examDate) {
    return NextResponse.json({ error: "classId, subjectCode, examDate required" }, { status: 400 });
  }

  const exam = await prisma.examDate.create({
    data: { classId, subjectCode, examDate: new Date(examDate) },
  });

  return NextResponse.json(exam, { status: 201 });
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

  await prisma.examDate.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
