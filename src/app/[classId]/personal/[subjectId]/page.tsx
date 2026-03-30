"use client";

import { use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { classroom, getStudentById, apExamDates } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export default function SubjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const { classId, subjectId } = use(params);
  const { student: studentId } = use(searchParams);

  const decodedSubject = decodeURIComponent(subjectId);

  const { students } = classroom;
  const currentStudent = studentId
    ? getStudentById(studentId) ?? students[0]
    : students[0];

  const subjectData = currentStudent.subjects.find(
    (s) => s.subject === decodedSubject
  );

  if (!subjectData) {
    notFound();
  }

  // Five rate
  const fiveRate = Math.round(subjectData.predictedFiveRate * 100);
  const confidence =
    fiveRate >= 75 ? "高" : fiveRate >= 55 ? "中" : "低";
  const confidenceColor =
    fiveRate >= 75
      ? "bg-green-100 text-green-800"
      : fiveRate >= 55
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  // Line chart data (five rate trend - simulated from mock scores)
  const trendData = subjectData.mockScores.map((ms) => ({
    date: ms.date,
    五分率: Math.round(
      (subjectData.predictedFiveRate * 0.8 +
        (ms.overallScore / 100) * 0.2) *
        100
    ),
  }));

  // MCQ/FRQ scores
  const mcqScores = subjectData.mockScores.map((ms) => ({
    date: ms.date,
    label: ms.label,
    score: ms.mcqScore,
    timed: ms.timed,
  }));

  const frqScores = subjectData.mockScores.map((ms) => ({
    date: ms.date,
    label: ms.label,
    score: ms.frqScore,
    timed: ms.timed,
  }));

  // Timed vs untimed bar chart
  const timedMcq = subjectData.mockScores
    .filter((ms) => ms.timed)
    .map((ms) => ms.mcqScore);
  const untimedMcq = subjectData.mockScores
    .filter((ms) => !ms.timed)
    .map((ms) => ms.mcqScore);
  const timedFrq = subjectData.mockScores
    .filter((ms) => ms.timed)
    .map((ms) => ms.frqScore);
  const untimedFrq = subjectData.mockScores
    .filter((ms) => !ms.timed)
    .map((ms) => ms.frqScore);

  const avgTimedMcq = timedMcq.length
    ? Math.round(timedMcq.reduce((a, b) => a + b, 0) / timedMcq.length)
    : 0;
  const avgUntimedMcq = untimedMcq.length
    ? Math.round(untimedMcq.reduce((a, b) => a + b, 0) / untimedMcq.length)
    : 0;
  const avgTimedFrq = timedFrq.length
    ? Math.round(timedFrq.reduce((a, b) => a + b, 0) / timedFrq.length)
    : 0;
  const avgUntimedFrq = untimedFrq.length
    ? Math.round(untimedFrq.reduce((a, b) => a + b, 0) / untimedFrq.length)
    : 0;

  const barData = [
    { name: "MCQ", 不计时: avgUntimedMcq, 计时: avgTimedMcq },
    { name: "FRQ", 不计时: avgUntimedFrq, 计时: avgTimedFrq },
  ];

  // Exam date
  const examDate = apExamDates.find((e) => e.subject === decodedSubject);

  // Mastery color gradient (red -> yellow -> green)
  function getMasteryColor(mastery: number): string {
    const pct = mastery * 100;
    if (pct >= 75) return "text-green-600";
    if (pct >= 50) return "text-yellow-600";
    return "text-red-600";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${classId}/personal?student=${currentStudent.id}`}
          className="text-sm text-zinc-400 hover:text-zinc-600"
        >
          ← 返回个人中心
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            {decodedSubject}
          </h1>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-500">{currentStudent.name}</span>
          {examDate && (
            <>
              <span className="text-zinc-500">·</span>
              <span className="text-sm text-zinc-400">
                考试日期: {examDate.date}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Result Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Five rate card + trend chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">5 分概率趋势</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-green-700">
                {fiveRate}%
              </span>
              <Badge className={confidenceColor}>置信{confidence}</Badge>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="五分率"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ fill: "#16a34a", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Timed vs Untimed bar chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">计时 vs 不计时对比</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="#9ca3af"
                  />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="不计时"
                    fill="#60a5fa"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar dataKey="计时" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MCQ & FRQ score tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MCQ Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MCQ 历次成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>测试</TableHead>
                  <TableHead className="text-center">分数</TableHead>
                  <TableHead className="text-center">模式</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mcqScores.map((ms) => (
                  <TableRow key={ms.label}>
                    <TableCell className="text-sm">{ms.date}</TableCell>
                    <TableCell>{ms.label}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {ms.score}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          ms.timed
                            ? "bg-orange-50 text-orange-700"
                            : "bg-blue-50 text-blue-700"
                        }
                      >
                        {ms.timed ? "计时" : "不计时"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* FRQ Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">FRQ 历次成绩</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>测试</TableHead>
                  <TableHead className="text-center">分数</TableHead>
                  <TableHead className="text-center">模式</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {frqScores.map((ms) => (
                  <TableRow key={ms.label}>
                    <TableCell className="text-sm">{ms.date}</TableCell>
                    <TableCell>{ms.label}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {ms.score}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          ms.timed
                            ? "bg-orange-50 text-orange-700"
                            : "bg-blue-50 text-blue-700"
                        }
                      >
                        {ms.timed ? "计时" : "不计时"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Topic Mastery */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">单元掌握度</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjectData.topicMastery.map((topic) => {
            const pct = Math.round(topic.mastery * 100);
            return (
              <div key={topic.unit} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-zinc-700">{topic.unit}</span>
                  <span
                    className={`text-sm font-semibold ${getMasteryColor(
                      topic.mastery
                    )}`}
                  >
                    {pct}%
                  </span>
                </div>
                <Progress value={pct} className="h-2" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
