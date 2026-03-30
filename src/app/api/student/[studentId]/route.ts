import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAggregateConfidenceLevel } from "@/lib/confidence";

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
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  type StudentAssessment = (typeof student.assessments)[number];
  type StudentSubject = (typeof student.subjects)[number];
  type StudentSnapshot = (typeof student.snapshots)[number];

  const latestSnapshots = new Map<
    string,
    { fiveRate: number; confidenceLevel: string }
  >();

  for (const snapshot of student.snapshots as StudentSnapshot[]) {
    if (!latestSnapshots.has(snapshot.subjectCode)) {
      latestSnapshots.set(snapshot.subjectCode, {
        fiveRate: snapshot.fiveRate,
        confidenceLevel: snapshot.confidenceLevel,
      });
    }
  }

  const fiveRates = Array.from(latestSnapshots.values()).map(
    (snapshot) => snapshot.fiveRate
  );
  const avgFiveRate =
    fiveRates.length > 0
      ? Math.round(
          (fiveRates.reduce((a: number, b: number) => a + b, 0) /
            fiveRates.length) *
            100
        )
      : 0;

  const overallConfidenceLevel = getAggregateConfidenceLevel(
    Array.from(latestSnapshots.values()).map(
      (snapshot) => snapshot.confidenceLevel
    )
  );

  const mcqRecords = student.assessments.filter(
    (assessment: StudentAssessment) =>
      assessment.recordType === "MCQ" && assessment.scorePercent != null
  );
  const mcqScores = mcqRecords.map(
    (assessment: StudentAssessment) => assessment.scorePercent as number
  );
  const avgMcq =
    mcqScores.length > 0
      ? Math.round(
          mcqScores.reduce((a: number, b: number) => a + b, 0) /
            mcqScores.length
        )
      : 0;

  const frqRecords = student.assessments.filter(
    (assessment: StudentAssessment) =>
      assessment.recordType === "FRQ" && assessment.scorePercent != null
  );
  const frqScores = frqRecords.map(
    (assessment: StudentAssessment) => assessment.scorePercent as number
  );
  const avgFrq =
    frqScores.length > 0
      ? Math.round(
          frqScores.reduce((a: number, b: number) => a + b, 0) /
            frqScores.length
        )
      : 0;

  const timedRecords = student.assessments.filter(
    (assessment: StudentAssessment) =>
      assessment.timedMode === "timed" && assessment.scorePercent != null
  );
  const untimedRecords = student.assessments.filter(
    (assessment: StudentAssessment) =>
      assessment.timedMode !== "timed" && assessment.scorePercent != null
  );

  const avgTimed =
    timedRecords.length > 0
      ? Math.round(
          timedRecords.reduce(
            (sum: number, assessment: StudentAssessment) =>
              sum + (assessment.scorePercent ?? 0),
            0
          ) / timedRecords.length
        )
      : 0;

  const avgUntimed =
    untimedRecords.length > 0
      ? Math.round(
          untimedRecords.reduce(
            (sum: number, assessment: StudentAssessment) =>
              sum + (assessment.scorePercent ?? 0),
            0
          ) / untimedRecords.length
        )
      : 0;

  const subjects = student.subjects.map((subject: StudentSubject) => {
    const snapshot = latestSnapshots.get(subject.subjectCode);

    return {
      subjectCode: subject.subjectCode,
      targetScore: subject.targetScore,
      fiveRate: snapshot ? Math.round(snapshot.fiveRate * 100) : 0,
      confidenceLevel: snapshot?.confidenceLevel ?? "unknown",
    };
  });

  const examDates = await prisma.examDate.findMany({
    where: { classId: student.classId },
  });
  type StudentExamDate = (typeof examDates)[number];

  return NextResponse.json({
    id: student.id,
    name: student.name,
    classId: student.classId,
    avgFiveRate,
    overallConfidenceLevel,
    avgMcq,
    mcqTestCount: mcqRecords.length,
    avgFrq,
    frqTestCount: frqRecords.length,
    avgTimed,
    avgUntimed,
    subjects,
    examDates: examDates.map((examDate: StudentExamDate) => ({
      subjectCode: examDate.subjectCode,
      date: examDate.examDate.toISOString().split("T")[0],
    })),
  });
}
