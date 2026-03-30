import Link from "next/link";
import { classroom } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ExamCalendar } from "@/components/exam-calendar";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const { students } = classroom;

  // --- Compute metrics ---

  // 1. Total AP subject registrations
  const totalSubjects = students.reduce(
    (sum, s) => sum + s.subjects.length,
    0
  );
  const avgPerStudent = (totalSubjects / students.length).toFixed(1);

  // 2. Average five-rate across all student-subjects
  let fiveRateSum = 0;
  let fiveRateCount = 0;
  for (const s of students) {
    for (const sub of s.subjects) {
      fiveRateSum += sub.predictedFiveRate;
      fiveRateCount++;
    }
  }
  const avgFiveRate = Math.round((fiveRateSum / fiveRateCount) * 100);

  // 3 & 4. Average MCQ / FRQ from latest mock scores
  let mcqSum = 0;
  let frqSum = 0;
  let scoreCount = 0;
  for (const s of students) {
    for (const sub of s.subjects) {
      if (sub.mockScores.length > 0) {
        const latest = sub.mockScores[sub.mockScores.length - 1];
        mcqSum += latest.mcqScore;
        frqSum += latest.frqScore;
        scoreCount++;
      }
    }
  }
  const avgMcq = Math.round(mcqSum / scoreCount);
  const avgFrq = Math.round(frqSum / scoreCount);

  const cards = [
    {
      title: "全班 AP 报考总科次数",
      value: `${totalSubjects}科`,
      sub: `共${students.length}人，人均${avgPerStudent}科`,
      metric: "subjects",
      color: "border-l-blue-500 bg-blue-50/50 hover:bg-blue-50",
      valueColor: "text-blue-700",
    },
    {
      title: "班级整体 5 分概率",
      value: `${avgFiveRate}%`,
      sub: "按人×科平均",
      metric: "five-rate",
      color: "border-l-green-500 bg-green-50/50 hover:bg-green-50",
      valueColor: "text-green-700",
    },
    {
      title: "班级平均 MCQ 得分率",
      value: `${avgMcq}%`,
      sub: "最近一次模考",
      metric: "mcq",
      color: "border-l-orange-500 bg-orange-50/50 hover:bg-orange-50",
      valueColor: "text-orange-700",
    },
    {
      title: "班级平均 FRQ 得分率",
      value: `${avgFrq}%`,
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
        <p className="text-zinc-500 mt-1">{classroom.name}</p>
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
