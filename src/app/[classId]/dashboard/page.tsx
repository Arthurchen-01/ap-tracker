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
import { Badge } from "@/components/ui/badge";
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
  const [showMethodology, setShowMethodology] = useState(false);

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

  // Determine class status from alerts
  const hasAnyRisk = alerts && (alerts.riskStudents.length > 0 || alerts.inactiveStudents.length > 0 || alerts.volatileStudents.length > 0);
  const riskCount = alerts ? alerts.riskStudents.length + alerts.inactiveStudents.length + alerts.volatileStudents.length : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">班级仪表盘</h1>
        <p className="text-zinc-500 mt-1">AP备考班2026</p>
      </div>

      {/* Quick status */}
      {!loading && (
        <Card className={hasAnyRisk ? "border-l-4 border-l-amber-500 bg-amber-50/30" : "border-l-4 border-l-green-500 bg-green-50/30"}>
          <CardContent className="py-3 flex items-center justify-between">
            <div className="text-sm text-zinc-700">
              {hasAnyRisk ? (
                <span>⚠️ 当前有 <strong>{riskCount}</strong> 位同学需要关注，建议查看预警中心</span>
              ) : (
                <span>✅ 全班状态良好，继续保持</span>
              )}
            </div>
            {hasAnyRisk && (
              <a href="#alerts" className="text-sm text-amber-700 font-medium hover:underline">
                查看预警 ↓
              </a>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* 5-rate methodology explainer */}
      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-zinc-800">
              📐 5 分概率是怎么算出来的？
            </CardTitle>
            <Badge
              variant="outline"
              className="cursor-pointer text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => setShowMethodology(!showMethodology)}
            >
              {showMethodology ? "收起" : "展开说明"}
            </Badge>
          </div>
        </CardHeader>
        {showMethodology && (
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600">
              5 分概率不是拍脑袋的，而是根据你的实际学习数据，用以下 5 个维度加权计算出来的：
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "模考表现", weight: "60%", desc: "MCQ / FRQ / 全套模考的加权得分率，计时测试权重更高", color: "bg-blue-50 border-blue-200" },
                { name: "近期趋势", weight: "15%", desc: "最近 5 次成绩的变化趋势，持续上升则加分", color: "bg-green-50 border-green-200" },
                { name: "成绩稳定性", weight: "15%", desc: "最近 5 次成绩的波动程度，波动越小越好", color: "bg-amber-50 border-amber-200" },
                { name: "复习质量", weight: "10%", desc: "7 天内的学习活跃度，有测试记录或详细描述则加分", color: "bg-purple-50 border-purple-200" },
                { name: "遗忘衰减", weight: "减分项", desc: "距上次学习的天数，太久不动会扣分（每天 -0.5%）", color: "bg-red-50 border-red-200" },
              ].map((item) => (
                <div key={item.name} className={`rounded-lg border p-3 ${item.color}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-zinc-800">{item.name}</span>
                    <Badge variant="outline" className="text-xs">{item.weight}</Badge>
                  </div>
                  <p className="text-xs text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-zinc-100 p-3">
              <p className="text-xs text-zinc-500 font-mono">
                5分率 = 模考表现 × 0.60 + 趋势 × 0.15 + 稳定性 × 0.15 + 复习质量 × 0.10 − 遗忘衰减
              </p>
            </div>
            <p className="text-xs text-zinc-400">
              💡 模考稳定 ≥75 分，即可判断为高 5 分置信度。点击「查看详情 →」可看到个人的具体维度得分。
            </p>
          </CardContent>
        )}
      </Card>

      {/* Alerts */}
      <div id="alerts">
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
                        <Link href={`/${classId}/personal?student=${s.studentId}`} className="hover:underline">
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          <span className="text-zinc-500"> · {s.worstSubject} {s.fiveRate}%</span>
                        </Link>
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
                        <Link href={`/${classId}/personal?student=${s.studentId}`} className="hover:underline">
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          <span className="text-zinc-500">
                            {" "}· 断更 {s.daysInactive >= 999 ? "≥7天" : `${s.daysInactive} 天`}
                          </span>
                        </Link>
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
                        <Link href={`/${classId}/personal?student=${s.studentId}`} className="hover:underline">
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          <span className="text-zinc-500"> · {s.subjectCode} 标准差 {s.stdDev}</span>
                        </Link>
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
