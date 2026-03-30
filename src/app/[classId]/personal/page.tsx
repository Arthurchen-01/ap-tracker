"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getConfidenceBadgeClass,
  getConfidenceDescription,
  getConfidenceLabel,
} from "@/lib/confidence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoChip } from "@/components/info-chip";

interface SubjectInfo {
  subjectCode: string;
  targetScore: number;
  fiveRate: number;
  confidenceLevel: string;
}

interface StudentData {
  id: string;
  name: string;
  classId: string;
  avgFiveRate: number;
  overallConfidenceLevel: string;
  avgMcq: number;
  mcqTestCount: number;
  avgFrq: number;
  frqTestCount: number;
  avgTimed: number;
  avgUntimed: number;
  subjects: SubjectInfo[];
  examDates: { subjectCode: string; date: string }[];
}

interface StudentListItem {
  id: string;
  name: string;
}

function getRangeLabel(avgFiveRate: number, confidenceLevel: string) {
  const spread =
    confidenceLevel === "high" ? 5 : confidenceLevel === "medium" ? 8 : 12;
  const low = Math.max(0, avgFiveRate - spread);
  const high = Math.min(100, avgFiveRate + spread);
  return `${low}% - ${high}%`;
}

function getNextAction(student: StudentData) {
  const weakest = [...student.subjects].sort((a, b) => a.fiveRate - b.fiveRate)[0];
  if (student.avgFrq < student.avgMcq - 8) {
    return "先补 FRQ 输出和表达完整度，别只刷选择题。";
  }
  if (student.avgTimed < student.avgUntimed - 8) {
    return "先补计时训练，把会做但做不完的问题解决掉。";
  }
  if (weakest) {
    return `先稳住 ${weakest.subjectCode}，它现在是最需要优先关注的学科。`;
  }
  return "保持当前节奏，同时继续补最近有效测试。";
}

export default function PersonalPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = params.classId as string;
  const studentId = searchParams.get("student");

  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [advice, setAdvice] = useState<string[]>([]);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/students?classId=${classId}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data);
      });
  }, [classId]);

  useEffect(() => {
    const sid = studentId || students[0]?.id;
    if (!sid) return;

    fetch(`/api/student/${sid}`)
      .then((r) => r.json())
      .then((d) => {
        setStudentData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [studentId, students, classId]);

  useEffect(() => {
    const sid = studentId || students[0]?.id;
    if (!sid) return;

    setAdviceLoading(true);
    fetch(`/api/ai/advice?studentId=${sid}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.advice) setAdvice(d.advice);
        setAdviceLoading(false);
      })
      .catch(() => setAdviceLoading(false));
  }, [studentId, students, classId]);

  if (loading || !studentData) {
    return <div className="text-zinc-500">正在加载个人中心...</div>;
  }

  const currentStudent = studentData;
  const avgFiveRate = currentStudent.avgFiveRate;
  const confidenceLevel = getConfidenceLabel(currentStudent.overallConfidenceLevel);
  const confidenceColor = getConfidenceBadgeClass(currentStudent.overallConfidenceLevel);
  const latestTestCount = currentStudent.mcqTestCount + currentStudent.frqTestCount;
  const referenceRange = getRangeLabel(
    currentStudent.avgFiveRate,
    currentStudent.overallConfidenceLevel,
  );
  const nextAction = getNextAction(currentStudent);

  function handleStudentChange(sid: string | null) {
    if (sid) router.push(`/${classId}/personal?student=${sid}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">个人中心</h1>
            <InfoChip tip="个人中心重点看当前结果、参考区间、最近有效测试和下一步建议。"/>
          </div>
          <p className="mt-1 text-zinc-500">{currentStudent.name}</p>
        </div>
        <div className="w-48">
          <Select defaultValue={currentStudent.id} onValueChange={handleStudentChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择学生" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-zinc-200 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            本页最重要的 5 个信息
            <InfoChip tip="这 5 项是学生和老师最需要一起看的统一结构。"/>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-zinc-600 md:grid-cols-5">
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">当前 5 分率</div>
            <div className="mt-2 text-2xl font-bold text-green-700">{avgFiveRate}%</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">参考区间</div>
            <div className="mt-2 text-xl font-semibold text-zinc-900">{referenceRange}</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">结果稳不稳</div>
            <div className="mt-2">
              <Badge className={confidenceColor}>置信等级：{confidenceLevel}</Badge>
            </div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">最近有效测试</div>
            <div className="mt-2 text-xl font-semibold text-zinc-900">{latestTestCount} 次</div>
          </div>
          <div className="rounded-2xl bg-zinc-50 p-4">
            <div className="text-xs text-zinc-500">下一步建议</div>
            <div className="mt-2 leading-6 text-zinc-800">{nextAction}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-600">
              整体 5 分率
              <InfoChip tip="这是当前最重要的结果指标，用来判断现在离 5 分有多近。"/>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-700">{avgFiveRate}%</div>
            <div className="mt-2">
              <Badge className={confidenceColor}>置信等级：{confidenceLevel}</Badge>
              <p className="mt-2 text-xs text-zinc-500">
                {getConfidenceDescription(
                  currentStudent.overallConfidenceLevel,
                  latestTestCount,
                )}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-600">
              计时 vs 非计时
              <InfoChip tip="两者差距大时，通常说明不是不会，而是时间压力下还不够稳。"/>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-6">
              <div>
                <p className="text-xs text-zinc-400">非计时</p>
                <p className="text-3xl font-bold text-blue-700">{currentStudent.avgUntimed}%</p>
              </div>
              <div className="text-2xl text-zinc-300">vs</div>
              <div>
                <p className="text-xs text-zinc-400">计时</p>
                <p className="text-3xl font-bold text-blue-700">{currentStudent.avgTimed}%</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-zinc-500">
              {currentStudent.avgTimed > currentStudent.avgUntimed
                ? `计时表现高出 ${currentStudent.avgTimed - currentStudent.avgUntimed}%`
                : currentStudent.avgTimed < currentStudent.avgUntimed
                  ? `非计时高出 ${currentStudent.avgUntimed - currentStudent.avgTimed}%`
                  : "两者基本持平"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">FRQ 情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-700">{currentStudent.avgFrq}%</div>
            <p className="mt-1 text-sm text-zinc-500">
              平均得分率 · 共 {currentStudent.frqTestCount} 次有效记录
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-600">MCQ 情况</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-700">{currentStudent.avgMcq}%</div>
            <p className="mt-1 text-sm text-zinc-500">
              平均正确率 · 共 {currentStudent.mcqTestCount} 次有效记录
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold text-zinc-900">报考学科</h2>
          <InfoChip tip="进入单科页后，可以看趋势、最近变化解释和单科下一步建议。"/>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {currentStudent.subjects.map((sub) => {
            const examDateObj = currentStudent.examDates.find(
              (e) => e.subjectCode === sub.subjectCode,
            );

            return (
              <Link
                key={sub.subjectCode}
                href={`/${classId}/personal/${encodeURIComponent(sub.subjectCode)}?student=${currentStudent.id}`}
              >
                <Card className="h-full cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-zinc-800">
                      {sub.subjectCode}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">当前 5 分率</span>
                      <span className="font-bold text-green-700">{sub.fiveRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">置信等级</span>
                      <span className="font-bold text-blue-700">
                        {getConfidenceLabel(sub.confidenceLevel)}
                      </span>
                    </div>
                    {examDateObj && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-zinc-500">考试日期</span>
                        <span className="text-sm text-zinc-600">{examDateObj.date}</span>
                      </div>
                    )}
                    <p className="pt-1 text-xs text-zinc-500">点击进入单科详情，看趋势和最近变化。</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold text-zinc-900">AI 学习建议</h2>
          <InfoChip tip="建议会优先盯住最弱学科、最近活跃度和距离考试时间。"/>
        </div>
        <Card className="border-l-4 border-l-cyan-500">
          <CardContent className="pt-4">
            {adviceLoading ? (
              <p className="text-zinc-500">正在生成建议...</p>
            ) : advice.length > 0 ? (
              <ul className="space-y-3">
                {advice.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Badge variant="outline" className="shrink-0 mt-0.5">
                      {index + 1}
                    </Badge>
                    <span className="text-sm text-zinc-700">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500">暂时还没有生成建议。</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-l-4 border-l-indigo-500 bg-indigo-50/20">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-zinc-800">
            今天的行动清单
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-zinc-700">
            {avgFiveRate < 50 && <li>先做一套完整测试，把当前基础线重新拉清楚。</li>}
            {avgFiveRate >= 50 && avgFiveRate < 75 && (
              <li>距离高把握区间还有提升空间，建议今天至少完成一次计时练习。</li>
            )}
            {avgFiveRate >= 75 && <li>当前整体状态不错，重点是维持节奏并防止回落。</li>}
            {currentStudent.avgTimed < currentStudent.avgUntimed && (
              <li>计时表现低于非计时，说明时间管理仍是关键问题。</li>
            )}
            {currentStudent.subjects.length > 1 && (
              <li>多科备考时，建议给最弱学科固定留出稳定时段。</li>
            )}
            <li>做完练习后记得去“每日更新”补一条记录，让系统判断更准。</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
