"use client";

import { useState, useMemo } from "react";
import {
  classroom,
  apExamDates,
  type APSubject,
  type Student,
} from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// ---------- Helpers ----------

const SUBJECT_SHORT: Record<APSubject, string> = {
  "AP Macro": "Macro",
  "AP Micro": "Micro",
  "AP Calc BC": "Calc BC",
  "AP Stats": "Stats",
  "AP Physics": "Physics",
  "AP Chemistry": "Chemistry",
  "AP Biology": "Bio",
  "AP English Lang": "Eng Lang",
};

const EXAM_TIME: Record<APSubject, string> = {
  "AP Biology": "上午 8:00",
  "AP Chemistry": "上午 8:00",
  "AP English Lang": "上午 8:00",
  "AP Stats": "上午 8:00",
  "AP Macro": "下午 12:00",
  "AP Micro": "下午 2:00",
  "AP Calc BC": "上午 8:00",
  "AP Physics": "上午 8:00",
};

interface ExamInfo {
  subject: APSubject;
  date: string; // "2026-05-DD"
  students: { name: string; fiveRate: number; id: string }[];
  avgFiveRate: number;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exam = new Date(dateStr);
  exam.setHours(0, 0, 0, 0);
  return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getColorClass(fiveRate: number, daysUntil: number): string {
  const near = daysUntil <= 14;
  if (fiveRate >= 0.7) {
    return near
      ? "bg-green-200 border-green-400 text-green-900"
      : "bg-green-50 border-green-200 text-green-800";
  }
  if (fiveRate >= 0.5) {
    return near
      ? "bg-orange-200 border-orange-400 text-orange-900"
      : "bg-orange-50 border-orange-200 text-orange-800";
  }
  return near
    ? "bg-red-200 border-red-400 text-red-900"
    : "bg-red-50 border-red-200 text-red-800";
}

// ---------- Calendar logic ----------

function getMay2026Grid() {
  // May 1, 2026 is a Friday (day 5, 0=Sun)
  const firstDay = new Date(2026, 4, 1).getDay(); // 5 = Friday
  // Convert to Mon-based: Sun=0 -> 6, Mon=1 -> 0, ..., Fri=5 -> 4
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const totalDays = 31;
  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// ---------- Component ----------

export function ExamCalendar() {
  const [selectedExam, setSelectedExam] = useState<ExamInfo | null>(null);

  const examMap = useMemo(() => {
    const map = new Map<number, ExamInfo[]>();
    for (const ed of apExamDates) {
      const day = parseInt(ed.date.split("-")[2], 10);
      const studentsForSubject: { name: string; fiveRate: number; id: string }[] =
        [];
      for (const stu of classroom.students) {
        const sub = stu.subjects.find((s) => s.subject === ed.subject);
        if (sub) {
          studentsForSubject.push({
            name: stu.name,
            fiveRate: sub.predictedFiveRate,
            id: stu.id,
          });
        }
      }
      const avg =
        studentsForSubject.length > 0
          ? studentsForSubject.reduce((s, x) => s + x.fiveRate, 0) /
            studentsForSubject.length
          : 0;

      const info: ExamInfo = {
        subject: ed.subject,
        date: ed.date,
        students: studentsForSubject,
        avgFiveRate: avg,
      };
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(info);
    }
    return map;
  }, []);

  const cells = getMay2026Grid();
  const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-zinc-900 mb-4">
        2026年5月 AP 考试日历
      </h2>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-zinc-500 py-1"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} className="h-20 md:h-24" />;
          }

          const exams = examMap.get(day) ?? [];
          const hasExam = exams.length > 0;

          if (!hasExam) {
            return (
              <div
                key={day}
                className="h-20 md:h-24 rounded-lg border border-zinc-100 bg-zinc-50 p-1.5 flex flex-col"
              >
                <span className="text-xs text-zinc-300 font-medium">
                  {day}
                </span>
              </div>
            );
          }

          // Aggregate color from worst (lowest fiveRate) exam
          const worstRate = Math.min(...exams.map((e) => e.avgFiveRate));
          const daysUntil = getDaysUntil(exams[0].date);
          const colorClass = getColorClass(worstRate, daysUntil);

          return (
            <button
              key={day}
              onClick={() => setSelectedExam(exams[0])}
              className={`h-24 md:h-28 rounded-lg border-2 p-1.5 flex flex-col items-start text-left transition-all hover:shadow-md hover:scale-[1.03] cursor-pointer ${colorClass}`}
            >
              <span className="text-sm font-bold">{day}</span>
              {exams.map((ex, i) => (
                <div key={i} className="mt-0.5 w-full">
                  <div className="text-[11px] font-semibold leading-tight">
                    {SUBJECT_SHORT[ex.subject]}
                  </div>
                  <div className="text-[10px] leading-tight opacity-80">
                    {ex.students.length}人 ·{" "}
                    {Math.round(ex.avgFiveRate * 100)}%
                  </div>
                </div>
              ))}
              <span className="mt-auto text-[10px] opacity-60">
                距今{daysUntil}天
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-200 border border-green-400" />
          5分率≥70% 近
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          5分率≥70% 远
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-200 border border-orange-400" />
          50-70% 近
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-50 border border-orange-200" />
          50-70% 远
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-200 border border-red-400" />
          &lt;50% 近
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          &lt;50% 远
        </span>
      </div>

      {/* Detail dialog */}
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
                <DialogTitle>
                  {selectedExam.subject} —{" "}
                  {selectedExam.date.replace("2026-", "").replace("-", "月")}
                  日
                </DialogTitle>
                <DialogDescription>
                  考试时间：{EXAM_TIME[selectedExam.subject]} ｜ 班级平均 5
                  分概率：{Math.round(selectedExam.avgFiveRate * 100)}%
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {selectedExam.students.map((stu) => {
                  const atRisk = stu.fiveRate < 0.6;
                  return (
                    <div
                      key={stu.id}
                      className={`flex justify-between items-center px-3 py-2 rounded-lg ${
                        atRisk
                          ? "bg-red-50 border border-red-200"
                          : "bg-zinc-50"
                      }`}
                    >
                      <span
                        className={`font-medium ${
                          atRisk ? "text-red-700" : "text-zinc-800"
                        }`}
                      >
                        {stu.name}
                        {atRisk && (
                          <span className="ml-2 text-xs text-red-500">
                            ⚠ 风险
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-sm font-mono ${
                          atRisk ? "text-red-600" : "text-zinc-600"
                        }`}
                      >
                        {Math.round(stu.fiveRate * 100)}%
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
