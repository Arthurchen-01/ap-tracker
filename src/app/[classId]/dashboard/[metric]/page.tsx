"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
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

interface MetricResponse {
  summaryText: string;
  rows: RowData[];
}

function getRiskLevel(rate: number) {
  if (rate >= 0.7)
    return { label: "安全", color: "bg-green-100 text-green-800 border-green-300" };
  if (rate >= 0.5)
    return { label: "关注", color: "bg-orange-100 text-orange-800 border-orange-300" };
  return { label: "高风险", color: "bg-red-100 text-red-800 border-red-300" };
}

export default function MetricDetailPage() {
  const params = useParams();
  const classId = params.classId as string;
  const metric = params.metric as string;

  const [data, setData] = useState<MetricResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!["subjects", "five-rate", "mcq", "frq"].includes(metric)) {
      return;
    }
    fetch(`/api/dashboard/${metric}?classId=${classId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [metric, classId]);

  if (!["subjects", "five-rate", "mcq", "frq"].includes(metric)) {
    notFound();
  }

  const metricType = metric as MetricType;

  if (loading || !data) {
    return <div className="text-zinc-500">加载中...</div>;
  }

  const { summaryText, rows } = data;

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
