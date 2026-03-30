import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const currentStudentId = cookieStore.get("studentId")?.value;

  const body = await request.json();
  const {
    studentId,
    updateDate,
    subjectCode,
    activityType,
    timedMode,
    durationMinutes,
    scoreRaw,
    scorePercent,
    description,
  } = body;

  const sid = studentId || currentStudentId;
  if (!sid) {
    return NextResponse.json({ error: "未指定学生" }, { status: 400 });
  }
  if (!updateDate || !subjectCode || !activityType) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const record = await prisma.dailyUpdate.create({
    data: {
      studentId: sid,
      updateDate: new Date(updateDate),
      subjectCode,
      activityType,
      timedMode: timedMode || null,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
      scoreRaw: scoreRaw !== "" && scoreRaw != null ? parseFloat(scoreRaw) : null,
      scorePercent: scorePercent !== "" && scorePercent != null ? parseFloat(scorePercent) : null,
      description: description || null,
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

  const records = await prisma.dailyUpdate.findMany({
    where: { studentId: sid },
    orderBy: { updateDate: "desc" },
    take: 50,
  });

  return NextResponse.json(records);
}
