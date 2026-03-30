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
    return NextResponse.json({ error: "Missing classId" }, { status: 400 });
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

  type DashboardStudent = (typeof students)[number];
  type DashboardSubject = DashboardStudent["subjects"][number];
  type DashboardAssessment = DashboardStudent["assessments"][number];

  const metricType = metric as MetricType;

  if (metricType === "subjects") {
    const totalSubjects = students.reduce(
      (sum: number, student: DashboardStudent) =>
        sum + student.subjects.length,
      0
    );

    const rows = students.map((student: DashboardStudent) => ({
      studentId: student.id,
      name: student.name,
      count: student.subjects.length,
      subjectList: student.subjects
        .map((subject: DashboardSubject) => subject.subjectCode)
        .join(" / "),
    }));

    return NextResponse.json({
      summaryText: `${totalSubjects} subjects across ${students.length} students`,
      rows,
    });
  }

  if (metricType === "five-rate") {
    const rows = students.map((student: DashboardStudent) => {
      const latestSnapshots = new Map<string, number>();

      for (const snapshot of student.snapshots) {
        if (!latestSnapshots.has(snapshot.subjectCode)) {
          latestSnapshots.set(snapshot.subjectCode, snapshot.fiveRate);
        }
      }

      const rates = Array.from(latestSnapshots.values());
      const avgRate =
        rates.length > 0
          ? rates.reduce((a: number, b: number) => a + b, 0) / rates.length
          : 0;

      let highest = "";
      let lowest = "";
      let maxRate = -Infinity;
      let minRate = Infinity;

      for (const [code, rate] of latestSnapshots) {
        if (rate > maxRate) {
          maxRate = rate;
          highest = code;
        }
        if (rate < minRate) {
          minRate = rate;
          lowest = code;
        }
      }

      return {
        studentId: student.id,
        name: student.name,
        avgRate: Math.round(avgRate * 100),
        highest,
        lowest,
        risk: avgRate,
      };
    });

    const overallAvg =
      rows.length > 0
        ? Math.round(
            (
              rows.reduce(
                (sum: number, row: { risk: number }) => sum + row.risk,
                0
              ) / rows.length
            ) * 100
          )
        : 0;

    return NextResponse.json({
      summaryText: `Overall ${overallAvg}%`,
      rows,
    });
  }

  if (metricType === "mcq") {
    const rows = students.map((student: DashboardStudent) => {
      const mcqRecords = student.assessments.filter(
        (assessment: DashboardAssessment) =>
          assessment.recordType === "MCQ" && assessment.scorePercent != null
      );
      const scores = mcqRecords.map(
        (record: DashboardAssessment) => record.scorePercent as number
      );
      const avgScore =
        scores.length > 0
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          : 0;

      const latestPerSubject = getLatestScoresBySubject(mcqRecords);

      return {
        studentId: student.id,
        name: student.name,
        avgScore: Math.round(avgScore),
        highest:
          latestPerSubject.length > 0
            ? Math.round(Math.max(...latestPerSubject))
            : 0,
        lowest:
          latestPerSubject.length > 0
            ? Math.round(Math.min(...latestPerSubject))
            : 0,
        trend: getTrendArrow(scores.slice(-3)),
      };
    });

    const classAvg =
      rows.length > 0
        ? Math.round(
            rows.reduce(
              (sum: number, row: { avgScore: number }) => sum + row.avgScore,
              0
            ) / rows.length
          )
        : 0;

    return NextResponse.json({
      summaryText: `Class average ${classAvg}%`,
      rows,
    });
  }

  if (metricType === "frq") {
    const rows = students.map((student: DashboardStudent) => {
      const frqRecords = student.assessments.filter(
        (assessment: DashboardAssessment) =>
          assessment.recordType === "FRQ" && assessment.scorePercent != null
      );
      const scores = frqRecords.map(
        (record: DashboardAssessment) => record.scorePercent as number
      );
      const avgScore =
        scores.length > 0
          ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length
          : 0;

      const latestPerSubject = getLatestScoresBySubject(frqRecords);

      return {
        studentId: student.id,
        name: student.name,
        avgScore: Math.round(avgScore),
        highest:
          latestPerSubject.length > 0
            ? Math.round(Math.max(...latestPerSubject))
            : 0,
        lowest:
          latestPerSubject.length > 0
            ? Math.round(Math.min(...latestPerSubject))
            : 0,
        trend: getTrendArrow(scores.slice(-3)),
      };
    });

    const classAvg =
      rows.length > 0
        ? Math.round(
            rows.reduce(
              (sum: number, row: { avgScore: number }) => sum + row.avgScore,
              0
            ) / rows.length
          )
        : 0;

    return NextResponse.json({
      summaryText: `Class average ${classAvg}%`,
      rows,
    });
  }

  return NextResponse.json({ error: "Unknown metric" }, { status: 400 });
}

function getLatestScoresBySubject(records: Array<{ subjectCode: string; scorePercent: number | null }>) {
  const bySubject = new Map<string, number[]>();

  for (const record of records) {
    if (record.scorePercent == null) {
      continue;
    }

    if (!bySubject.has(record.subjectCode)) {
      bySubject.set(record.subjectCode, []);
    }

    bySubject.get(record.subjectCode)?.push(record.scorePercent);
  }

  return Array.from(bySubject.values()).map((scores: number[]) => scores[0]);
}

function getTrendArrow(scores: number[]): string {
  if (scores.length < 2) {
    return "flat";
  }

  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];

  if (last > prev + 2) {
    return "up";
  }

  if (last < prev - 2) {
    return "down";
  }

  return "flat";
}
