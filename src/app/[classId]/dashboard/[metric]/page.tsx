import Link from "next/link";
import { notFound } from "next/navigation";
import { classroom } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type MetricType = "subjects" | "five-rate" | "mcq" | "frq";

const METRIC_TITLES: Record<MetricType, string> = {
  subjects: "报考总科数",
  "five-rate": "5分概率",
  mcq: "MCQ得分率",
  frq: "FRQ得分率",
};

interface RowData {
  studentId: string;
  name: string;
  [key: string]: string | number;
}

function getRiskLevel(rate: number) {
  if (rate >= 0.7)
    return { label: "安全", color: "bg-green-100 text-green-800 border-green-300" };
  if (rate >= 0.5)
    return { label: "关注", color: "bg-orange-100 text-orange-800 border-orange-300" };
  return { label: "高风险", color: "bg-red-100 text-red-800 border-red-300" };
}

function getTrendArrow(scores: number[]): string {
  if (scores.length < 2) return "→";
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  if (last > prev + 2) return "↑";
  if (last < prev - 2) return "↓";
  return "→";
}

export default async function MetricDetailPage({
  params,
}: {
  params: Promise<{ classId: string; metric: string }>;
}) {
  const { classId, metric } = await params;

  if (!["subjects", "five-rate", "mcq", "frq"].includes(metric)) {
    notFound();
  }

  const metricType = metric as MetricType;
  const { students } = classroom;

  // --- Compute rows based on metric type ---
  let rows: RowData[] = [];
  let summaryText = "";

  if (metricType === "subjects") {
    const totalSubjects = students.reduce((sum, s) => sum + s.subjects.length, 0);
    summaryText = `${totalSubjects}科 / ${students.length}人 / 人均${(totalSubjects / students.length).toFixed(1)}科`;
    rows = students.map((s) => ({
      studentId: s.id,
      name: s.name,
      count: s.subjects.length,
      subjectList: s.subjects.map((sub) => sub.subject).join("、"),
    }));
  } else if (metricType === "five-rate") {
    let fiveRateSum = 0;
    let fiveRateCount = 0;
    for (const s of students) {
      for (const sub of s.subjects) {
        fiveRateSum += sub.predictedFiveRate;
        fiveRateCount++;
      }
    }
    summaryText = `整体 ${Math.round((fiveRateSum / fiveRateCount) * 100)}%`;
    rows = students.map((s) => {
      const rates = s.subjects.map((sub) => sub.predictedFiveRate);
      const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
      const maxIdx = rates.indexOf(Math.max(...rates));
      const minIdx = rates.indexOf(Math.min(...rates));
      return {
        studentId: s.id,
        name: s.name,
        avgRate: Math.round(avg * 100),
        highest: s.subjects[maxIdx].subject,
        lowest: s.subjects[minIdx].subject,
        risk: avg,
      };
    });
  } else if (metricType === "mcq") {
    let mcqSum = 0;
    let mcqCount = 0;
    for (const s of students) {
      for (const sub of s.subjects) {
        if (sub.mockScores.length > 0) {
          const latest = sub.mockScores[sub.mockScores.length - 1];
          mcqSum += latest.mcqScore;
          mcqCount++;
        }
      }
    }
    summaryText = `班级平均 ${Math.round(mcqSum / mcqCount)}%`;
    rows = students.map((s) => {
      const latestScores: number[] = [];
      const allAverages: number[] = [];
      for (const sub of s.subjects) {
        if (sub.mockScores.length > 0) {
          latestScores.push(sub.mockScores[sub.mockScores.length - 1].mcqScore);
          allAverages.push(
            sub.mockScores.reduce((a, b) => a + b.mcqScore, 0) / sub.mockScores.length
          );
        }
      }
      const avg = latestScores.reduce((a, b) => a + b, 0) / latestScores.length;
      const trendScores = s.subjects
        .flatMap((sub) => sub.mockScores.map((ms) => ms.mcqScore))
        .slice(-3);
      return {
        studentId: s.id,
        name: s.name,
        avgScore: Math.round(avg),
        highest: Math.round(Math.max(...latestScores)),
        lowest: Math.round(Math.min(...latestScores)),
        trend: getTrendArrow(trendScores),
      };
    });
  } else if (metricType === "frq") {
    let frqSum = 0;
    let frqCount = 0;
    for (const s of students) {
      for (const sub of s.subjects) {
        if (sub.mockScores.length > 0) {
          const latest = sub.mockScores[sub.mockScores.length - 1];
          frqSum += latest.frqScore;
          frqCount++;
        }
      }
    }
    summaryText = `班级平均 ${Math.round(frqSum / frqCount)}%`;
    rows = students.map((s) => {
      const latestScores: number[] = [];
      for (const sub of s.subjects) {
        if (sub.mockScores.length > 0) {
          latestScores.push(sub.mockScores[sub.mockScores.length - 1].frqScore);
        }
      }
      const avg = latestScores.reduce((a, b) => a + b, 0) / latestScores.length;
      const trendScores = s.subjects
        .flatMap((sub) => sub.mockScores.map((ms) => ms.frqScore))
        .slice(-3);
      return {
        studentId: s.id,
        name: s.name,
        avgScore: Math.round(avg),
        highest: Math.round(Math.max(...latestScores)),
        lowest: Math.round(Math.min(...latestScores)),
        trend: getTrendArrow(trendScores),
      };
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${classId}/dashboard`}
          className="text-sm text-zinc-400 hover:text-zinc-600"
        >
          ← 返回仪表盘
        </Link>
        <h1 className="text-2xl font-bold text-zinc-900 mt-2">
          {METRIC_TITLES[metricType]} 明细
        </h1>
        <p className="text-zinc-500 mt-1">{summaryText}</p>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            {metricType === "subjects" && (
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead className="text-center">报考科数</TableHead>
                <TableHead>报考科目列表</TableHead>
              </TableRow>
            )}
            {metricType === "five-rate" && (
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead className="text-center">整体5分率</TableHead>
                <TableHead>最高科</TableHead>
                <TableHead>最低科</TableHead>
                <TableHead className="text-center">风险等级</TableHead>
              </TableRow>
            )}
            {(metricType === "mcq" || metricType === "frq") && (
              <TableRow>
                <TableHead>学生姓名</TableHead>
                <TableHead className="text-center">
                  {metricType === "mcq" ? "MCQ平均分" : "FRQ平均分"}
                </TableHead>
                <TableHead className="text-center">最高分</TableHead>
                <TableHead className="text-center">最低分</TableHead>
                <TableHead className="text-center">趋势</TableHead>
              </TableRow>
            )}
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.studentId}
                className="cursor-pointer hover:bg-zinc-50"
              >
                <TableCell>
                  <Link
                    href={`/${classId}/personal?student=${row.studentId}`}
                    className="text-blue-600 hover:underline font-medium"
                  >
                    {row.name}
                  </Link>
                </TableCell>

                {metricType === "subjects" && (
                  <>
                    <TableCell className="text-center font-semibold">
                      {row.count}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-600">
                      {row.subjectList}
                    </TableCell>
                  </>
                )}

                {metricType === "five-rate" && (
                  <>
                    <TableCell className="text-center font-semibold">
                      {row.avgRate}%
                    </TableCell>
                    <TableCell>{row.highest}</TableCell>
                    <TableCell>{row.lowest}</TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const risk = getRiskLevel(row.risk as number);
                        return (
                          <Badge variant="outline" className={risk.color}>
                            {risk.label}
                          </Badge>
                        );
                      })()}
                    </TableCell>
                  </>
                )}

                {(metricType === "mcq" || metricType === "frq") && (
                  <>
                    <TableCell className="text-center font-semibold">
                      {row.avgScore}%
                    </TableCell>
                    <TableCell className="text-center">{row.highest}%</TableCell>
                    <TableCell className="text-center">{row.lowest}%</TableCell>
                    <TableCell className="text-center text-lg">
                      {row.trend}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
