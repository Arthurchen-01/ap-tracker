import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  if (!classId) {
    return NextResponse.json({ error: "缺少 classId" }, { status: 400 });
  }

  // Total subject registrations (StudentSubject count)
  const totalSubjects = await prisma.studentSubject.count({
    where: { student: { classId } },
  });

  // Number of students
  const studentCount = await prisma.student.count({ where: { classId } });

  // Average five-rate from ProbabilitySnapshot (latest snapshot per student-subject)
  const snapshots = await prisma.probabilitySnapshot.findMany({
    where: { student: { classId } },
    orderBy: { snapshotDate: "desc" },
  });

  // Deduplicate: keep only the latest snapshot per (studentId, subjectCode)
  const latestSnapshots = new Map<string, number>();
  for (const snap of snapshots) {
    const key = `${snap.studentId}-${snap.subjectCode}`;
    if (!latestSnapshots.has(key)) {
      latestSnapshots.set(key, snap.fiveRate);
    }
  }
  const fiveRates = Array.from(latestSnapshots.values());
  const avgFiveRate =
    fiveRates.length > 0
      ? Math.round(
          (fiveRates.reduce((a, b) => a + b, 0) / fiveRates.length) * 100
        )
      : 0;

  // Average MCQ scorePercent
  const mcqRecords = await prisma.assessmentRecord.findMany({
    where: { student: { classId }, recordType: "MCQ", scorePercent: { not: null } },
    select: { scorePercent: true },
  });
  const avgMcq =
    mcqRecords.length > 0
      ? Math.round(
          mcqRecords.reduce((sum, r) => sum + (r.scorePercent ?? 0), 0) /
            mcqRecords.length
        )
      : 0;

  // Average FRQ scorePercent
  const frqRecords = await prisma.assessmentRecord.findMany({
    where: { student: { classId }, recordType: "FRQ", scorePercent: { not: null } },
    select: { scorePercent: true },
  });
  const avgFrq =
    frqRecords.length > 0
      ? Math.round(
          frqRecords.reduce((sum, r) => sum + (r.scorePercent ?? 0), 0) /
            frqRecords.length
        )
      : 0;

  return NextResponse.json({
    totalSubjects,
    studentCount,
    avgPerStudent: studentCount > 0 ? (totalSubjects / studentCount).toFixed(1) : "0",
    avgFiveRate,
    avgMcq,
    avgFrq,
  });
}
