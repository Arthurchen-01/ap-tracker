import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string; subjectCode: string }> }
) {
  const { studentId, subjectCode } = await params;
  const decodedSubject = decodeURIComponent(subjectCode);

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });
  }

  // Get assessments for this subject
  const assessments = await prisma.assessmentRecord.findMany({
    where: { studentId, subjectCode: decodedSubject },
    orderBy: { takenAt: "asc" },
  });
  type AssessmentRecord = (typeof assessments)[number];

  // Get snapshots for trend
  const snapshots = await prisma.probabilitySnapshot.findMany({
    where: { studentId, subjectCode: decodedSubject },
    orderBy: { snapshotDate: "asc" },
  });
  type SnapshotRecord = (typeof snapshots)[number];

  // Latest snapshot
  const latestSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const fiveRate = latestSnap ? Math.round(latestSnap.fiveRate * 100) : 0;

  // Exam date
  const examDate = await prisma.examDate.findFirst({
    where: { classId: student.classId, subjectCode: decodedSubject },
  });

  // MCQ records
  const mcqRecords = assessments.filter(
    (a: AssessmentRecord) => a.recordType === "MCQ"
  );
  const frqRecords = assessments.filter(
    (a: AssessmentRecord) => a.recordType === "FRQ"
  );

  // Timed vs untimed comparison
  const timedMcq = mcqRecords.filter(
    (a: AssessmentRecord) => a.timedMode === "timed" && a.scorePercent != null
  );
  const untimedMcq = mcqRecords.filter(
    (a: AssessmentRecord) => a.timedMode !== "timed" && a.scorePercent != null
  );
  const timedFrq = frqRecords.filter(
    (a: AssessmentRecord) => a.timedMode === "timed" && a.scorePercent != null
  );
  const untimedFrq = frqRecords.filter(
    (a: AssessmentRecord) => a.timedMode !== "timed" && a.scorePercent != null
  );

  const avg = (arr: { scorePercent: number | null }[]) => {
    const vals = arr
      .map((r: { scorePercent: number | null }) => r.scorePercent!)
      .filter((v: number | null) => v != null);
    return vals.length > 0
      ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length)
      : 0;
  };

  // Trend data from snapshots
  const trendData = snapshots.map((s: SnapshotRecord) => ({
    date: s.snapshotDate.toISOString().split("T")[0],
    fiveRate: Math.round(s.fiveRate * 100),
  }));

  return NextResponse.json({
    studentId,
    studentName: student.name,
    subjectCode: decodedSubject,
    fiveRate,
    confidenceLevel: latestSnap?.confidenceLevel ?? "未知",
    assessmentCount: assessments.length,
    examDate: examDate ? examDate.examDate.toISOString().split("T")[0] : null,
    mcqScores: mcqRecords.map((r: AssessmentRecord) => ({
      date: r.takenAt.toISOString().split("T")[0],
      label: r.source ?? `测试`,
      score: r.scorePercent,
      timed: r.timedMode === "timed",
    })),
    frqScores: frqRecords.map((r: AssessmentRecord) => ({
      date: r.takenAt.toISOString().split("T")[0],
      label: r.source ?? `测试`,
      score: r.scorePercent,
      timed: r.timedMode === "timed",
    })),
    barData: [
      { name: "MCQ", 不计时: avg(untimedMcq), 计时: avg(timedMcq) },
      { name: "FRQ", 不计时: avg(untimedFrq), 计时: avg(timedFrq) },
    ],
    trendData,
  });
}
