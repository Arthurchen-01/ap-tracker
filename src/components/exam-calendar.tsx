"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InfoChip } from "@/components/info-chip";

interface StudentInfo {
  id: string;
  name: string;
  fiveRate: number;
}

interface ExamInfo {
  subjectCode: string;
  subjectName: string;
  date: string;
  students: StudentInfo[];
  avgFiveRate: number;
}

const SUBJECT_SHORT: Record<string, string> = {
  "AP-BIO": "Bio",
  "AP-CHEM": "Chem",
  "AP-ENGLANG": "Lang",
  "AP-STATS": "Stats",
  "AP-MACRO": "Macro",
  "AP-MICRO": "Micro",
  "AP-CALCBC": "Calc BC",
  "AP-PHYSICS": "Physics",
};

const SUBJECT_NAME: Record<string, string> = {
  "AP-BIO": "AP Biology",
  "AP-CHEM": "AP Chemistry",
  "AP-ENGLANG": "AP English Lang",
  "AP-STATS": "AP Statistics",
  "AP-MACRO": "AP Macro",
  "AP-MICRO": "AP Micro",
  "AP-CALCBC": "AP Calc BC",
  "AP-PHYSICS": "AP Physics",
};

const EXAM_TIME: Record<string, string> = {
  "AP-BIO": "上午 8:00",
  "AP-CHEM": "上午 8:00",
  "AP-ENGLANG": "上午 8:00",
  "AP-STATS": "上午 8:00",
  "AP-MACRO": "中午 12:00",
  "AP-MICRO": "下午 2:00",
  "AP-CALCBC": "上午 8:00",
  "AP-PHYSICS": "上午 8:00",
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getColorClass(fiveRate: number, daysUntil: number): string {
  const near = daysUntil <= 14;
  if (fiveRate >= 70) {
    return near
      ? "bg-green-200 border-green-400 text-green-900"
      : "bg-green-50 border-green-200 text-green-800";
  }
  if (fiveRate >= 50) {
    return near
      ? "bg-orange-200 border-orange-400 text-orange-900"
      : "bg-orange-50 border-orange-200 text-orange-800";
  }
  return near
    ? "bg-red-200 border-red-400 text-red-900"
    : "bg-red-50 border-red-200 text-red-800";
}

function getMay2026Grid() {
  const firstDay = new Date(2026, 4, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const totalDays = 31;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function ExamCalendar() {
  const params = useParams();
  const classId = params.classId as string;
  const [exams, setExams] = useState<ExamInfo[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null);

  useEffect(() => {
    if (!classId) return;

    Promise.all([
      fetch(`/api/dashboard?classId=${classId}`).then((r) => r.json()),
      fetch(`/api/students?classId=${classId}`).then((r) => r.json()),
    ]).then(async ([, students]) => {
      const examDates = [
        { code: "AP-BIO", date: "2026-05-04" },
        { code: "AP-CHEM", date: "2026-05-05" },
        { code: "AP-ENGLANG", date: "2026-05-06" },
        { code: "AP-STATS", date: "2026-05-07" },
        { code: "AP-MACRO", date: "2026-05-11" },
        { code: "AP-MICRO", date: "2026-05-11" },
        { code: "AP-CALCBC", date: "2026-05-12" },
        { code: "AP-PHYSICS", date: "2026-05-14" },
      ];

      const examInfos: ExamInfo[] = [];

      for (const ed of examDates) {
        const subjectStudents: StudentInfo[] = [];

        for (const stu of students) {
          try {
            const resp = await fetch(`/api/student/${stu.id}`);
            const data = await resp.json();
            const sub = data.subjects?.find(
              (s: { subjectCode: string; fiveRate: number }) =>
                s.subjectCode === ed.code,
            );
            if (sub) {
              subjectStudents.push({
                id: stu.id,
                name: data.name,
                fiveRate: sub.fiveRate,
              });
            }
          } catch {}
        }

        const avgRate =
          subjectStudents.length > 0
            ? Math.round(
                subjectStudents.reduce((s, x) => s + x.fiveRate, 0) /
                  subjectStudents.length,
              )
            : 0;

        examInfos.push({
          subjectCode: ed.code,
          subjectName: SUBJECT_NAME[ed.code] ?? ed.code,
          date: ed.date,
          students: subjectStudents,
          avgFiveRate: avgRate,
        });
      }

      setExams(examInfos);
    });
  }, [classId]);

  const examMap = new Map<number, ExamInfo[]>();
  for (const ex of exams) {
    const day = parseInt(ex.date.split("-")[2], 10);
    if (!examMap.has(day)) examMap.set(day, []);
    examMap.get(day)!.push(ex);
  }

  const cells = getMay2026Grid();
  const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-xl font-bold text-zinc-900">2026 年 5 月 AP 考试日历</h2>
        <InfoChip tip="颜色优先反映离考试远近和对应学科平均 5 分率，用来帮助老师排复习顺序。"/>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekDays.map((d) => (
          <div key={d} className="py-1 text-center text-xs font-medium text-zinc-500">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-20 md:h-24" />;
          }

          const dayExams = examMap.get(day) ?? [];
          const hasExam = dayExams.length > 0;

          if (!hasExam) {
            return (
              <div
                key={day}
                className="flex h-20 flex-col rounded-lg border border-zinc-100 bg-zinc-50 p-1.5 md:h-24"
              >
                <span className="text-xs font-medium text-zinc-300">{day}</span>
              </div>
            );
          }

          const worstRate = Math.min(...dayExams.map((e) => e.avgFiveRate));
          const daysUntil = getDaysUntil(dayExams[0].date);
          const colorClass = getColorClass(worstRate, daysUntil);

          return (
            <button
              key={day}
              onClick={() => setSelectedExam(dayExams[0])}
              className={`flex h-24 flex-col items-start rounded-lg border-2 p-1.5 text-left transition-all hover:scale-[1.03] hover:shadow-md md:h-28 ${colorClass}`}
            >
              <span className="text-sm font-bold">{day}</span>
              {dayExams.map((ex, i) => (
                <div key={i} className="mt-0.5 w-full">
                  <div className="text-[11px] font-semibold leading-tight">
                    {SUBJECT_SHORT[ex.subjectCode] ?? ex.subjectCode}
                  </div>
                  <div className="text-[10px] leading-tight opacity-80">
                    {ex.students.length} 人 · {ex.avgFiveRate}%
                  </div>
                </div>
              ))}
              <span className="mt-auto text-[10px] opacity-60">距今 {daysUntil} 天</span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-green-400 bg-green-200" />
          近两周内且平均 5 分率较稳
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-orange-400 bg-orange-200" />
          近两周内但还有明显压力
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-red-400 bg-red-200" />
          近两周内且需要优先关注
        </span>
      </div>

      <Dialog
        open={!!selectedExam}
        onOpenChange={(open) => {
          if (!open) setSelectedExam(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          {selectedExam && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedExam.subjectName}</DialogTitle>
                <DialogDescription>
                  考试时间：{EXAM_TIME[selectedExam.subjectCode] ?? "待定"} · 班级平均 5 分率：
                  {selectedExam.avgFiveRate}%
                </DialogDescription>
              </DialogHeader>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {selectedExam.students.map((stu) => {
                  const atRisk = stu.fiveRate < 60;
                  return (
                    <div
                      key={stu.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        atRisk ? "border border-red-200 bg-red-50" : "bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          atRisk ? "text-red-700" : "text-zinc-800"
                        }`}
                      >
                        {stu.name}
                        {atRisk && (
                          <span className="ml-2 text-xs text-red-500">需要优先关注</span>
                        )}
                      </span>
                      <span
                        className={`text-sm font-mono ${
                          atRisk ? "text-red-600" : "text-zinc-600"
                        }`}
                      >
                        {stu.fiveRate}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
