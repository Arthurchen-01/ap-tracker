import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const currentStudentId = cookieStore.get("studentId")?.value;

  const body = await request.json();
  const {
    studentId,
    subjectCode,
    recordType,
    timedMode,
    difficulty,
    source,
    scoreRaw,
    scorePercent,
    takenAt,
  } = body;

  const sid = studentId || currentStudentId;
  if (!sid) {
    return NextResponse.json({ error: "未指定学生" }, { status: 400 });
  }
  if (!subjectCode || !recordType) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const record = await prisma.assessmentRecord.create({
    data: {
      studentId: sid,
      subjectCode,
      recordType,
      timedMode: timedMode || "timed",
      difficulty: difficulty || "medium",
      source: source || null,
      scoreRaw: scoreRaw !== "" && scoreRaw != null ? parseFloat(scoreRaw) : null,
      scorePercent: scorePercent !== "" && scorePercent != null ? parseFloat(scorePercent) : null,
      takenAt: takenAt ? new Date(takenAt) : new Date(),
    },
  });

  return NextResponse.json(record);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const cookieStore = await cookies();
  const sid = studentId || cookieStore.get("studentId")?.value;

  if (!sid) {
    return NextResponse.json({ error: "未指定学生" }, { status: 400 });
  }

  const records = await prisma.assessmentRecord.findMany({
    where: { studentId: sid },
    orderBy: { takenAt: "desc" },
    take: 50,
  });

  return NextResponse.json(records);
}
