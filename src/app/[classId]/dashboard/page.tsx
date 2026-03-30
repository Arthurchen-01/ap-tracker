"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExamCalendar } from "@/components/exam-calendar";
import { InfoChip } from "@/components/info-chip";

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
    return <div className="text-zinc-500">正在加载班级仪表盘...</div>;
  }

  const cards = [
    {
      title: "全班报考总科次",
      value: `${data.totalSubjects}`,
      sub: `共 ${data.studentCount} 位学生，人均 ${data.avgPerStudent} 科`,
      metric: "subjects",
      color: "border-l-blue-500 bg-blue-50/50 hover:bg-blue-50",
      valueColor: "text-blue-700",
      tip: "看班级整体负荷。报考科次越多，老师越要注意安排是否过满。",
    },
    {
      title: "班级整体 5 分率",
      value: `${data.avgFiveRate}%`,
      sub: "按学生-科目最新快照计算",
      metric: "five-rate",
      color: "border-l-green-500 bg-green-50/50 hover:bg-green-50",
      valueColor: "text-green-700",
      tip: "这是全班当前最关键的结果指标，用来快速判断整体冲 5 分状态。",
    },
    {
      title: "班级平均 MCQ 正确率",
      value: `${data.avgMcq}%`,
      sub: "适合看选择题基本盘",
      metric: "mcq",
      color: "border-l-orange-500 bg-orange-50/50 hover:bg-orange-50",
      valueColor: "text-orange-700",
      tip: "如果 MCQ 明显低，通常意味着基础知识点还不够稳。",
    },
    {
      title: "班级平均 FRQ 得分率",
      value: `${data.avgFrq}%`,
      sub: "适合看主观题表达与结构",
      metric: "frq",
      color: "border-l-purple-500 bg-purple-50/50 hover:bg-purple-50",
      valueColor: "text-purple-700",
      tip: "如果 FRQ 明显低，通常要优先补写作、表达或步骤完整度。",
    },
  ];

  const noAlerts =
    !!alerts &&
    alerts.riskStudents.length === 0 &&
    alerts.inactiveStudents.length === 0 &&
    alerts.volatileStudents.length === 0;

  const riskCount = alerts
    ? alerts.riskStudents.length +
      alerts.inactiveStudents.length +
      alerts.volatileStudents.length
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-zinc-900">班级仪表盘</h1>
          <InfoChip tip="班级仪表盘先看整体结果，再看预警，最后再进个人和单科。"/>
        </div>
        <p className="mt-1 text-zinc-500">
          先判断全班整体状态，再决定今天老师最该优先关注谁。
        </p>
      </div>

      <Card
        className={
          noAlerts
            ? "border-l-4 border-l-green-500 bg-green-50/30"
            : "border-l-4 border-l-amber-500 bg-amber-50/30"
        }
      >
        <CardContent className="flex items-center justify-between py-3">
          <div className="text-sm text-zinc-700">
            {noAlerts ? (
              <span>当前没有明显预警，可以继续保持当前节奏。</span>
            ) : (
              <span>
                当前共有 <strong>{riskCount}</strong> 条优先关注信号，建议先看预警中心。
              </span>
            )}
          </div>
          {!noAlerts && (
            <a href="#alerts" className="text-sm font-medium text-amber-700 hover:underline">
              查看预警 →
            </a>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link key={c.metric} href={`/${classId}/dashboard/${c.metric}`} className="block">
            <Card
              className={`border-l-4 transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer ${c.color}`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-700">
                  {c.title}
                  <InfoChip tip={c.tip} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${c.valueColor}`}>{c.value}</div>
                <p className="mt-1 text-sm text-zinc-500">{c.sub}</p>
                <p className="mt-3 text-xs text-zinc-400">点击查看这个指标的明细和名单</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-l-4 border-l-emerald-500 bg-emerald-50/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-zinc-800">
              5 分率是怎么来的
            </CardTitle>
            <Badge
              variant="outline"
              className="cursor-pointer border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setShowMethodology(!showMethodology)}
            >
              {showMethodology ? "收起" : "展开说明"}
            </Badge>
          </div>
        </CardHeader>
        {showMethodology && (
          <CardContent className="space-y-4">
            <p className="text-sm text-zinc-600">
              5 分率不是单次成绩，也不是拍脑袋判断。它会综合最近测试结果、趋势、稳定度和复习活跃度。
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "测试表现", weight: "60%", desc: "MCQ、FRQ、整套模考的综合结果。" },
                { name: "最近趋势", weight: "15%", desc: "最近几次测试是在进步、持平还是回落。" },
                { name: "稳定程度", weight: "15%", desc: "分数波动越小，当前判断越可信。" },
                { name: "复习活跃度", weight: "10%", desc: "最近是否持续更新和完成有效练习。" },
              ].map((item) => (
                <div key={item.name} className="rounded-lg border border-emerald-200 bg-white p-3">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-semibold text-zinc-800">{item.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.weight}
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-zinc-500">
              更详细的统一解释可以到说明页查看，避免学生和老师对同一个指标理解不一致。
            </p>
          </CardContent>
        )}
      </Card>

      <div id="alerts">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-lg font-semibold text-zinc-800">预警中心</h2>
          <InfoChip tip="预警不是给学生贴标签，而是帮老师快速决定今天先看谁。"/>
        </div>

        {noAlerts ? (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-6 text-center text-green-700">
              当前没有明显预警，全班状态比较平稳。
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card className={alerts && alerts.riskStudents.length > 0 ? "border-l-4 border-l-red-500" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">需要优先关注</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.riskStudents.length > 0 ? (
                  <ul className="space-y-2">
                    {alerts.riskStudents.map((s) => (
                      <li key={s.studentId} className="text-sm">
                        <Link href={`/${classId}/personal?student=${s.studentId}`} className="hover:underline">
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          <span className="text-zinc-500"> · {s.worstSubject} 当前 5 分率 {s.fiveRate}%</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">暂无</p>
                )}
              </CardContent>
            </Card>

            <Card className={alerts && alerts.inactiveStudents.length > 0 ? "border-l-4 border-l-amber-500" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">最近没有更新</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.inactiveStudents.length > 0 ? (
                  <ul className="space-y-2">
                    {alerts.inactiveStudents.map((s) => (
                      <li key={s.studentId} className="text-sm">
                        <Link href={`/${classId}/personal?student=${s.studentId}`} className="hover:underline">
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          <span className="text-zinc-500">
                            {" "}· {s.daysInactive >= 999 ? "还没有有效更新" : `${s.daysInactive} 天没更新`}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">暂无</p>
                )}
              </CardContent>
            </Card>

            <Card className={alerts && alerts.volatileStudents.length > 0 ? "border-l-4 border-l-purple-500" : ""}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">近期波动较大</CardTitle>
              </CardHeader>
              <CardContent>
                {alerts && alerts.volatileStudents.length > 0 ? (
                  <ul className="space-y-2">
                    {alerts.volatileStudents.map((s, i) => (
                      <li key={`${s.studentId}-${s.subjectCode}-${i}`} className="text-sm">
                        <Link href={`/${classId}/personal?student=${s.studentId}`} className="hover:underline">
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          <span className="text-zinc-500"> · {s.subjectCode} 波动值 {s.stdDev}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-zinc-400">暂无</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <ExamCalendar />
    </div>
  );
}
