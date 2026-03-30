import Link from "next/link";
import { classroom, getStudentById } from "@/lib/mock-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apExamDates } from "@/lib/mock-data";

export default async function PersonalPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ student?: string }>;
}) {
  const { classId } = await params;
  const { student: studentId } = await searchParams;
  const { students } = classroom;

  const currentStudent = studentId
    ? getStudentById(studentId) ?? students[0]
    : students[0];

  // --- Compute student stats ---

  // Overall five rate
  const fiveRates = currentStudent.subjects.map((s) => s.predictedFiveRate);
  const avgFiveRate =
    Math.round(
      (fiveRates.reduce((a, b) => a + b, 0) / fiveRates.length) * 100
    );
  const confidenceLevel =
    avgFiveRate >= 75 ? "高" : avgFiveRate >= 55 ? "中" : "低";
  const confidenceColor =
    avgFiveRate >= 75
      ? "bg-green-100 text-green-800"
      : avgFiveRate >= 55
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  // FRQ stats
  const allFrqScores = currentStudent.subjects.flatMap((s) =>
    s.mockScores.map((ms) => ms.frqScore)
  );
  const avgFrq = allFrqScores.length
    ? Math.round(
        allFrqScores.reduce((a, b) => a + b, 0) / allFrqScores.length
      )
    : 0;
  const frqTestCount = allFrqScores.length;

  // MCQ stats
  const allMcqScores = currentStudent.subjects.flatMap((s) =>
    s.mockScores.map((ms) => ms.mcqScore)
  );
  const avgMcq = allMcqScores.length
    ? Math.round(
        allMcqScores.reduce((a, b) => a + b, 0) / allMcqScores.length
      )
    : 0;
  const mcqTestCount = allMcqScores.length;

  // Timed vs untimed
  const timedScores = currentStudent.subjects.flatMap((s) =>
    s.mockScores.filter((ms) => ms.timed).map((ms) => ms.overallScore)
  );
  const untimedScores = currentStudent.subjects.flatMap((s) =>
    s.mockScores.filter((ms) => !ms.timed).map((ms) => ms.overallScore)
  );
  const avgTimed = timedScores.length
    ? Math.round(
        timedScores.reduce((a, b) => a + b, 0) / timedScores.length
      )
    : 0;
  const avgUntimed = untimedScores.length
    ? Math.round(
        untimedScores.reduce((a, b) => a + b, 0) / untimedScores.length
      )
    : 0;

  // Average mastery per subject
  function getAvgMastery(subjectIndex: number): number {
    const masteries = currentStudent.subjects[subjectIndex].topicMastery;
    if (!masteries.length) return 0;
    return Math.round(
      (masteries.reduce((a, b) => a + b.mastery, 0) / masteries.length) * 100
    );
  }

  // Get exam date for subject
  function getExamDate(subject: string): string {
    const found = apExamDates.find(
      (e) => e.subject === subject
    );
    return found ? found.date : "";
  }

  return (
    <div className="space-y-6">
      {/* Student selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">个人中心</h1>
          <p className="text-zinc-500 mt-1">{currentStudent.name}</p>
        </div>
        <div className="w-48">
          <Select defaultValue={currentStudent.id}>
            <SelectTrigger>
              <SelectValue placeholder="选择学生" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <Link
                    href={`/${classId}/personal?student=${s.id}`}
                    className="block w-full"
                  >
                    {s.name}
                  </Link>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top 4 metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Overall 5-rate */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              整体 5 分概率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">
              {avgFiveRate}%
            </div>
            <div className="mt-2">
              <Badge className={confidenceColor}>
                置信等级：{confidenceLevel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* FRQ */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              FRQ 测试情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-700">
              {avgFrq}%
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              平均分 · 共 {frqTestCount} 次测试
            </p>
          </CardContent>
        </Card>

        {/* MCQ */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              MCQ 测试情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-700">
              {avgMcq}%
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              平均分 · 共 {mcqTestCount} 次测试
            </p>
          </CardContent>
        </Card>

        {/* Timed vs Untimed */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">
              计时 vs 不计时对比
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-6">
              <div>
                <p className="text-xs text-zinc-400">不计时</p>
                <p className="text-3xl font-bold text-blue-700">
                  {avgUntimed}%
                </p>
              </div>
              <div className="text-2xl text-zinc-300">vs</div>
              <div>
                <p className="text-xs text-zinc-400">计时</p>
                <p className="text-3xl font-bold text-blue-700">{avgTimed}%</p>
              </div>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {avgTimed > avgUntimed
                ? `计时高出 ${avgTimed - avgUntimed}%`
                : avgTimed < avgUntimed
                ? `不计时高出 ${avgUntimed - avgTimed}%`
                : "持平"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Subject cards */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">报名科目</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentStudent.subjects.map((sub) => {
            const mastery = getAvgMastery(
              currentStudent.subjects.indexOf(sub)
            );
            const examDate = getExamDate(sub.subject);
            return (
              <Link
                key={sub.subject}
                href={`/${classId}/personal/${encodeURIComponent(sub.subject)}?student=${currentStudent.id}`}
              >
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-zinc-800">
                      {sub.subject}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">5 分率</span>
                      <span className="font-bold text-green-700">
                        {Math.round(sub.predictedFiveRate * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">掌握度</span>
                      <span className="font-bold text-blue-700">
                        {mastery}%
                      </span>
                    </div>
                    {examDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-500">考试日期</span>
                        <span className="text-sm text-zinc-600">
                          {examDate}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
