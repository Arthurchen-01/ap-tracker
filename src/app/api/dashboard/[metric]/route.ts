import { NextResponse } from "next/server";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type MetricType = "subjects" | "five-rate" | "mcq" | "frq";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ metric: string }> }
) {
  const { metric } = await params;

  if (!["subjects", "five-rate", "mcq", "frq"].includes(metric)) {
    notFound();
  }

  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  if (!classId) {
    return NextResponse.json({ error: "缺少 classId" }, { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: { classId },
    include: {
      subjects: true,
      assessments: {
        orderBy: { takenAt: "desc" },
      },
      snapshots: {
        orderBy: { snapshotDate: "desc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const metricType = metric as MetricType;

  if (metricType === "subjects") {
    const totalSubjects = students.reduce((sum, s) => sum + s.subjects.length, 0);
    const rows = students.map((s) => ({
      studentId: s.id,
      name: s.name,
      count: s.subjects.length,
      subjectList: s.subjects.map((sub) => sub.subjectCode).join("、"),
    }));
    return NextResponse.json({
      summaryText: `${totalSubjects}科 / ${students.length}人 / 人均${(totalSubjects / students.length).toFixed(1)}科`,
      rows,
    });
  }

  if (metricType === "five-rate") {
    // Latest snapshot per student-subject
    const rows = students.map((s) => {
      const latestSnapshots = new Map<string, number>();
      for (const snap of s.snapshots) {
        if (!latestSnapshots.has(snap.subjectCode)) {
          latestSnapshots.set(snap.subjectCode, snap.fiveRate);
        }
      }
      const rates = Array.from(latestSnapshots.values());
      const avg =
        rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
      const subjectCodes = Array.from(latestSnapshots.keys());

      let highest = subjectCodes[0] ?? "";
      let lowest = subjectCodes[0] ?? "";
      let maxRate = -Infinity;
      let minRate = Infinity;
      for (const [code, rate] of latestSnapshots) {
        if (rate > maxRate) { maxRate = rate; highest = code; }
        if (rate < minRate) { minRate = rate; lowest = code; }
      }

      return {
        studentId: s.id,
        name: s.name,
        avgRate: Math.round(avg * 100),
        highest,
        lowest,
        risk: avg,
      };
    });

    // Overall avg
    let sum = 0, count = 0;
    for (const r of rows) { sum += r.risk; count++; }
    const overallAvg = count > 0 ? Math.round((sum / count) * 100) : 0;

    return NextResponse.json({
      summaryText: `整体 ${overallAvg}%`,
      rows,
    });
  }

  if (metricType === "mcq") {
    const rows = students.map((s) => {
      const mcqRecords = s.assessments.filter((a) => a.recordType === "MCQ" && a.scorePercent != null);
      const scores = mcqRecords.map((r) => r.scorePercent!);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      // Group by subject for latest
      const bySubject = new Map<string, number[]>();
      for (const r of mcqRecords) {
        if (!bySubject.has(r.subjectCode)) bySubject.set(r.subjectCode, []);
        bySubject.get(r.subjectCode)!.push(r.scorePercent!);
      }
      const latestPerSubject = Array.from(bySubject.values()).map((arr) => arr[0]);

      return {
        studentId: s.id,
        name: s.name,
        avgScore: Math.round(avg),
        highest: latestPerSubject.length > 0 ? Math.round(Math.max(...latestPerSubject)) : 0,
        lowest: latestPerSubject.length > 0 ? Math.round(Math.min(...latestPerSubject)) : 0,
        trend: getTrendArrow(scores.slice(-3)),
      };
    });

    let mcqSum = 0, mcqCount = 0;
    for (const r of rows) { mcqSum += r.avgScore; mcqCount++; }

    return NextResponse.json({
      summaryText: `班级平均 ${mcqCount > 0 ? Math.round(mcqSum / mcqCount) : 0}%`,
      rows,
    });
  }

  if (metricType === "frq") {
    const rows = students.map((s) => {
      const frqRecords = s.assessments.filter((a) => a.recordType === "FRQ" && a.scorePercent != null);
      const scores = frqRecords.map((r) => r.scorePercent!);
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

      const bySubject = new Map<string, number[]>();
      for (const r of frqRecords) {
        if (!bySubject.has(r.subjectCode)) bySubject.set(r.subjectCode, []);
        bySubject.get(r.subjectCode)!.push(r.scorePercent!);
      }
      const latestPerSubject = Array.from(bySubject.values()).map((arr) => arr[0]);

      return {
        studentId: s.id,
        name: s.name,
        avgScore: Math.round(avg),
        highest: latestPerSubject.length > 0 ? Math.round(Math.max(...latestPerSubject)) : 0,
        lowest: latestPerSubject.length > 0 ? Math.round(Math.min(...latestPerSubject)) : 0,
        trend: getTrendArrow(scores.slice(-3)),
      };
    });

    let frqSum = 0, frqCount = 0;
    for (const r of rows) { frqSum += r.avgScore; frqCount++; }

    return NextResponse.json({
      summaryText: `班级平均 ${frqCount > 0 ? Math.round(frqSum / frqCount) : 0}%`,
      rows,
    });
  }

  return NextResponse.json({ error: "未知指标" }, { status: 400 });
}

function getTrendArrow(scores: number[]): string {
  if (scores.length < 2) return "→";
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  if (last > prev + 2) return "↑";
  if (last < prev - 2) return "↓";
  return "→";
}
