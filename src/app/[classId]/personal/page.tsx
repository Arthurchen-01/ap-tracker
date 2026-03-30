"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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

  // Fetch student list
  useEffect(() => {
    fetch(`/api/students?classId=${classId}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data);
      });
  }, [classId]);

  // Fetch student data
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

  // Fetch AI advice
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
    return <div className="text-zinc-500">加载中...</div>;
  }

  const currentStudent = studentData;
  const avgFiveRate = currentStudent.avgFiveRate;
  const confidenceLevel =
    avgFiveRate >= 75 ? "高" : avgFiveRate >= 55 ? "中" : "低";
  const confidenceColor =
    avgFiveRate >= 75
      ? "bg-green-100 text-green-800"
      : avgFiveRate >= 55
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  function handleStudentChange(sid: string | null) {
    if (sid) router.push(`/${classId}/personal?student=${sid}`);
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
              {currentStudent.avgFrq}%
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              平均分 · 共 {currentStudent.frqTestCount} 次测试
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
              {currentStudent.avgMcq}%
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              平均分 · 共 {currentStudent.mcqTestCount} 次测试
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
                  {currentStudent.avgUntimed}%
                </p>
              </div>
              <div className="text-2xl text-zinc-300">vs</div>
              <div>
                <p className="text-xs text-zinc-400">计时</p>
                <p className="text-3xl font-bold text-blue-700">
                  {currentStudent.avgTimed}%
                </p>
              </div>
            </div>
            <p className="text-sm text-zinc-500 mt-1">
              {currentStudent.avgTimed > currentStudent.avgUntimed
                ? `计时高出 ${currentStudent.avgTimed - currentStudent.avgUntimed}%`
                : currentStudent.avgTimed < currentStudent.avgUntimed
                ? `不计时高出 ${currentStudent.avgUntimed - currentStudent.avgTimed}%`
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
            const examDateObj = currentStudent.examDates.find(
              (e) => e.subjectCode === sub.subjectCode
            );
            return (
              <Link
                key={sub.subjectCode}
                href={`/${classId}/personal/${encodeURIComponent(sub.subjectCode)}?student=${currentStudent.id}`}
              >
                <Card className="hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-semibold text-zinc-800">
                      {sub.subjectCode}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">5 分率</span>
                      <span className="font-bold text-green-700">
                        {sub.fiveRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-500">置信等级</span>
                      <span className="font-bold text-blue-700">
                        {sub.confidenceLevel}
                      </span>
                    </div>
                    {examDateObj && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-zinc-500">考试日期</span>
                        <span className="text-sm text-zinc-600">
                          {examDateObj.date}
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

      {/* AI Learning Advice */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-4">AI 学习建议</h2>
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
              <p className="text-zinc-500">暂无建议</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
