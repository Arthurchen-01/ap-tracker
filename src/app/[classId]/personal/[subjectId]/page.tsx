"use client";

import { use, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface ScoreEntry {
  date: string;
  label: string;
  score: number | null;
  timed: boolean;
}

interface SubjectDetailData {
  studentId: string;
  studentName: string;
  subjectCode: string;
  fiveRate: number;
  confidenceLevel: string;
  examDate: string | null;
  mcqScores: ScoreEntry[];
  frqScores: ScoreEntry[];
  barData: { name: string; 不计时: number; 计时: number }[];
  trendData: { date: string; fiveRate: number }[];
}

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

  const [data, setData] = useState<SubjectDetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    const encoded = encodeURIComponent(decodedSubject);
    fetch(`/api/student/${studentId}/${encoded}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId, decodedSubject]);

  if (loading || !data) {
    return <div className="text-zinc-500">加载中...</div>;
  }

  const fiveRate = data.fiveRate;
  const confidence =
    fiveRate >= 75 ? "高" : fiveRate >= 55 ? "中" : "低";
  const confidenceColor =
    fiveRate >= 75
      ? "bg-green-100 text-green-800"
      : fiveRate >= 55
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  // Line chart data: use trendData from API, fallback to mcq-based estimate
  const trendChartData = data.trendData.length > 0
    ? data.trendData.map((t) => ({ date: t.date, 五分率: t.fiveRate }))
    : data.mcqScores.map((ms) => ({
        date: ms.date,
        五分率: fiveRate,
      }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/${classId}/personal?student=${data.studentId}`}
          className="text-sm text-zinc-400 hover:text-zinc-600"
        >
          ← 返回个人中心
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <h1 className="text-2xl font-bold text-zinc-900">
            {data.subjectCode}
          </h1>
          <span className="text-zinc-500">·</span>
          <span className="text-zinc-500">{data.studentName}</span>
          {data.examDate && (
            <>
              <span className="text-zinc-500">·</span>
              <span className="text-sm text-zinc-400">
                考试日期: {data.examDate}
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
                <LineChart data={trendChartData}>
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
                <BarChart data={data.barData}>
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
                {data.mcqScores.map((ms, i) => (
                  <TableRow key={`${ms.label}-${i}`}>
                    <TableCell className="text-sm">{ms.date}</TableCell>
                    <TableCell>{ms.label}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {ms.score != null ? `${ms.score}%` : "-"}
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
                {data.frqScores.map((ms, i) => (
                  <TableRow key={`${ms.label}-${i}`}>
                    <TableCell className="text-sm">{ms.date}</TableCell>
                    <TableCell>{ms.label}</TableCell>
                    <TableCell className="text-center font-semibold">
                      {ms.score != null ? `${ms.score}%` : "-"}
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
    </div>
  );
}
