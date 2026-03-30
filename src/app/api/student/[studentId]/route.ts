import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const { studentId } = await params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      subjects: true,
      assessments: {
        orderBy: { takenAt: "desc" },
      },
      snapshots: {
        orderBy: { snapshotDate: "desc" },
      },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });
  }

  // Latest five-rate per subject
  const latestSnapshots = new Map<string, { fiveRate: number; confidenceLevel: string }>();
  for (const snap of student.snapshots) {
    if (!latestSnapshots.has(snap.subjectCode)) {
      latestSnapshots.set(snap.subjectCode, {
        fiveRate: snap.fiveRate,
        confidenceLevel: snap.confidenceLevel,
      });
    }
  }

  // Overall five rate
  const fiveRates = Array.from(latestSnapshots.values()).map((s) => s.fiveRate);
  const avgFiveRate =
    fiveRates.length > 0
      ? Math.round((fiveRates.reduce((a, b) => a + b, 0) / fiveRates.length) * 100)
      : 0;

  // MCQ stats
  const mcqRecords = student.assessments.filter(
    (a) => a.recordType === "MCQ" && a.scorePercent != null
  );
  const mcqScores = mcqRecords.map((r) => r.scorePercent!);
  const avgMcq =
    mcqScores.length > 0
      ? Math.round(mcqScores.reduce((a, b) => a + b, 0) / mcqScores.length)
      : 0;

  // FRQ stats
  const frqRecords = student.assessments.filter(
    (a) => a.recordType === "FRQ" && a.scorePercent != null
  );
  const frqScores = frqRecords.map((r) => r.scorePercent!);
  const avgFrq =
    frqScores.length > 0
      ? Math.round(frqScores.reduce((a, b) => a + b, 0) / frqScores.length)
      : 0;

  // Timed vs untimed
  const timedRecords = student.assessments.filter((a) => a.timedMode === "timed" && a.scorePercent != null);
  const untimedRecords = student.assessments.filter((a) => a.timedMode !== "timed" && a.scorePercent != null);
  const avgTimed =
    timedRecords.length > 0
      ? Math.round(timedRecords.reduce((sum, r) => sum + (r.scorePercent ?? 0), 0) / timedRecords.length)
      : 0;
  const avgUntimed =
    untimedRecords.length > 0
      ? Math.round(untimedRecords.reduce((sum, r) => sum + (r.scorePercent ?? 0), 0) / untimedRecords.length)
      : 0;

  // Subject details
  const subjects = student.subjects.map((sub) => {
    const snap = latestSnapshots.get(sub.subjectCode);
    return {
      subjectCode: sub.subjectCode,
      targetScore: sub.targetScore,
      fiveRate: snap ? Math.round(snap.fiveRate * 100) : 0,
      confidenceLevel: snap?.confidenceLevel ?? "未知",
    };
  });

  // Exam dates
  const examDates = await prisma.examDate.findMany({
    where: { classId: student.classId },
  });

  return NextResponse.json({
    id: student.id,
    name: student.name,
    classId: student.classId,
    avgFiveRate,
    avgMcq,
    mcqTestCount: mcqRecords.length,
    avgFrq,
    frqTestCount: frqRecords.length,
    avgTimed,
    avgUntimed,
    subjects,
    examDates: examDates.map((e) => ({
      subjectCode: e.subjectCode,
      date: e.examDate.toISOString().split("T")[0],
    })),
  });
}
