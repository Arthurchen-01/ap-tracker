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

interface RiskStudent {
  studentId: string;
  name: string;
  worstSubject: string;
  fiveRate: number;
}

interface InactiveStudent {
  studentId: string;
  name: string;
  daysInactive: number;
}

interface VolatileStudent {
  studentId: string;
  name: string;
  subjectCode: string;
  stdDev: number;
}

interface AlertsData {
  riskStudents: RiskStudent[];
  inactiveStudents: InactiveStudent[];
  volatileStudents: VolatileStudent[];
}

export default function DashboardPage() {
  const params = useParams();
  const classId = params.classId as string;
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<AlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard?classId=${classId}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/dashboard/alerts?classId=${classId}`)
      .then((r) => r.json())
      .then((a) => setAlerts(a))
      .catch(() => {});
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

      {/* Alerts */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-800 mb-3">预警中心</h2>
        {alerts && alerts.riskStudents.length === 0 && alerts.inactiveStudents.length === 0 && alerts.volatileStudents.length === 0 ? (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="py-6 text-center text-green-700">
              暂无预警 ✅ 全班状态良好！
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Risk students */}
            <Card className={alerts && alerts.riskStudents.length > 0 ? "border-l-4 border-l-red-500" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  🔴 风险学生
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.riskStudents.length > 0 ? (
                  <ul className="space-y-2">
                    {alerts.riskStudents.map((s) => (
                      <li key={s.studentId} className="text-sm">
                        <span className="font-medium text-zinc-800">{s.name}</span>
                        <span className="text-zinc-500"> · {s.worstSubject} {s.fiveRate}%</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">无</p>
                )}
              </CardContent>
            </Card>

            {/* Inactive students */}
            <Card className={alerts && alerts.inactiveStudents.length > 0 ? "border-l-4 border-l-amber-500" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  ⚠️ 断更学生
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.inactiveStudents.length > 0 ? (
                  <ul className="space-y-2">
                    {alerts.inactiveStudents.map((s) => (
                      <li key={s.studentId} className="text-sm">
                        <span className="font-medium text-zinc-800">{s.name}</span>
                        <span className="text-zinc-500">
                          {" "}· 断更 {s.daysInactive >= 999 ? "≥7天" : `${s.daysInactive} 天`}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">无</p>
                )}
              </CardContent>
            </Card>

            {/* Volatile students */}
            <Card className={alerts && alerts.volatileStudents.length > 0 ? "border-l-4 border-l-purple-500" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  📊 波动异常
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.volatileStudents.length > 0 ? (
                  <ul className="space-y-2">
                    {alerts.volatileStudents.map((s, i) => (
                      <li key={`${s.studentId}-${s.subjectCode}-${i}`} className="text-sm">
                        <span className="font-medium text-zinc-800">{s.name}</span>
                        <span className="text-zinc-500"> · {s.subjectCode} 标准差 {s.stdDev}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">无</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Exam calendar */}
      <ExamCalendar />
    </div>
  );
}
