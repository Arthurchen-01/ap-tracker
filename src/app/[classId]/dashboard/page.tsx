"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExamCalendar } from "@/components/exam-calendar";

interface DashboardData {
  totalSubjects: number;
  studentCount: number;
  avgPerStudent: string;
  avgFiveRate: number;
  avgMcq: number;
  avgFrq: number;
}

export default function DashboardPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?classId=${classId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  if (loading || !data) {
    return <div className="text-zinc-500">加载中...</div>;
  }

  const cards = [
    {
      title: "全班 AP 报考总科次数",
      value: `${data.totalSubjects}科`,
      sub: `共${data.studentCount}人，人均${data.avgPerStudent}科`,
      metric: "subjects",
      color: "border-l-blue-500 bg-blue-50/50 hover:bg-blue-50",
      valueColor: "text-blue-700",
    },
    {
      title: "班级整体 5 分概率",
      value: `${data.avgFiveRate}%`,
      sub: "按人×科平均",
      metric: "five-rate",
      color: "border-l-green-500 bg-green-50/50 hover:bg-green-50",
      valueColor: "text-green-700",
    },
    {
      title: "班级平均 MCQ 得分率",
      value: `${data.avgMcq}%`,
      sub: "最近一次模考",
      metric: "mcq",
      color: "border-l-orange-500 bg-orange-50/50 hover:bg-orange-50",
      valueColor: "text-orange-700",
    },
    {
      title: "班级平均 FRQ 得分率",
      value: `${data.avgFrq}%`,
      sub: "最近一次模考",
      metric: "frq",
      color: "border-l-purple-500 bg-purple-50/50 hover:bg-purple-50",
      valueColor: "text-purple-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">班级仪表盘</h1>
        <p className="text-zinc-500 mt-1">AP备考班2026</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((c) => (
          <Link
            key={c.metric}
            href={`/${classId}/dashboard/${c.metric}`}
            className="block"
          >
            <Card
              className={`border-l-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${c.color}`}
            >
              <CardHeader>
                <CardTitle className="text-sm font-medium text-zinc-600">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${c.valueColor}`}>
                  {c.value}
                </div>
                <p className="text-sm text-zinc-500 mt-1">{c.sub}</p>
                <p className="text-xs text-zinc-400 mt-3">
                  点击查看明细 →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Exam calendar */}
      <ExamCalendar />
    </div>
  );
}
