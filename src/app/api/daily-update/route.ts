import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { calculateFiveRate } from "@/lib/scoring-engine";
import { generateExplanation } from "@/lib/ai-explainer";

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

  // Get previous snapshot for comparison
  const prevSnapshot = await prisma.probabilitySnapshot.findFirst({
    where: { studentId: sid, subjectCode },
    orderBy: { snapshotDate: "desc" },
    select: { fiveRate: true, snapshotDate: true },
  });

  const oldRate = prevSnapshot ? Math.round(prevSnapshot.fiveRate * 100) : 0;

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

  // Auto-recalculate five rate
  const scoringResult = await calculateFiveRate(prisma, sid, subjectCode);
  const newRate = Math.round(scoringResult.fiveRate * 100);
  const change = newRate - oldRate;

  // Get student name for explanation
  const student = await prisma.student.findUnique({
    where: { id: sid },
    select: { name: true },
  });

  const daysSinceLastUpdate = prevSnapshot
    ? Math.floor((new Date(updateDate).getTime() - prevSnapshot.snapshotDate.getTime()) / (1000 * 60 * 60 * 24))
    : 0

  const explanation = generateExplanation({
    studentName: student?.name ?? "学生",
    subjectCode,
    oldRate,
    newRate,
    change,
    activityType: activityType || null,
    scorePercent: scorePercent != null && scorePercent !== "" ? parseFloat(scorePercent) : null,
    timedMode: timedMode || null,
    description: description || null,
    daysSinceLastUpdate,
  });

  // Persist snapshot with explanation
  await prisma.probabilitySnapshot.create({
    data: {
      studentId: sid,
      subjectCode,
      snapshotDate: new Date(),
      fiveRate: scoringResult.fiveRate,
      stabilityScore: scoringResult.components.stability,
      trendScore: scoringResult.components.trend,
      decayScore: scoringResult.components.decay,
      confidenceLevel: scoringResult.confidenceLevel,
      explanation,
    },
  });

  return NextResponse.json({
    success: true,
    oldRate,
    newRate,
    change,
    explanation,
    record,
  });
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
