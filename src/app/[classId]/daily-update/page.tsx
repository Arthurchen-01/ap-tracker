"use client";

import { useState } from "react";
import { students, type APSubject } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// ---------- Constants ----------

const TASK_TYPES = [
  "MCQ练习",
  "FRQ练习",
  "整套模考",
  "知识点复习",
  "错题整理",
  "看资料/视频",
  "其他",
] as const;

const ANSWER_CONDITIONS = ["计时", "不计时", "不适用"] as const;

// Collect all unique subjects from mock data
const allSubjects = Array.from(
  new Set(students.flatMap((s) => s.subjects.map((sub) => sub.subject)))
).sort() as APSubject[];

// Collect all unique units from mock data (for multi-select)
const allUnits = Array.from(
  new Set(
    students.flatMap((s) =>
      s.subjects.flatMap((sub) => sub.topicMastery.map((t) => t.unit))
    )
  )
).sort();

export default function DailyUpdatePage() {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date: today,
    studentId: "",
    subject: "",
    taskType: "",
    condition: "",
    questionCount: "",
    correctCount: "",
    score: "",
    totalScore: "",
    timeSpent: "",
    units: [] as string[],
    description: "",
  });

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleUnit(unit: string) {
    setForm((prev) => ({
      ...prev,
      units: prev.units.includes(unit)
        ? prev.units.filter((u) => u !== unit)
        : [...prev.units, unit],
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.studentId || !form.subject || !form.taskType) {
      alert("请填写所有必填项（带 * 号）");
      return;
    }
    alert("已记录");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">每日更新</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>填写今日学习记录</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">日期</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => updateField("date", e.target.value)}
              />
            </div>

            {/* Student */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="student">
                学生 <span className="text-red-500">*</span>
              </Label>
              <select
                id="student"
                value={form.studentId}
                onChange={(e) => updateField("studentId", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="">请选择学生</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subject">
                科目 <span className="text-red-500">*</span>
              </Label>
              <select
                id="subject"
                value={form.subject}
                onChange={(e) => updateField("subject", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="">请选择科目</option>
                {allSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            {/* Task Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="taskType">
                任务类型 <span className="text-red-500">*</span>
              </Label>
              <select
                id="taskType"
                value={form.taskType}
                onChange={(e) => updateField("taskType", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="">请选择任务类型</option>
                {TASK_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Answer Condition */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="condition">作答条件</Label>
              <select
                id="condition"
                value={form.condition}
                onChange={(e) => updateField("condition", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="">请选择</option>
                {ANSWER_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Score fields — two columns */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="questionCount">做题数</Label>
                <Input
                  id="questionCount"
                  type="number"
                  min={0}
                  placeholder="如 30"
                  value={form.questionCount}
                  onChange={(e) => updateField("questionCount", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="correctCount">正确数</Label>
                <Input
                  id="correctCount"
                  type="number"
                  min={0}
                  placeholder="如 24"
                  value={form.correctCount}
                  onChange={(e) => updateField("correctCount", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="score">得分</Label>
                <Input
                  id="score"
                  type="number"
                  min={0}
                  placeholder="如 85"
                  value={form.score}
                  onChange={(e) => updateField("score", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="totalScore">总分</Label>
                <Input
                  id="totalScore"
                  type="number"
                  min={0}
                  placeholder="如 100"
                  value={form.totalScore}
                  onChange={(e) => updateField("totalScore", e.target.value)}
                />
              </div>
            </div>

            {/* Time Spent */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timeSpent">花费时间（分钟）</Label>
              <Input
                id="timeSpent"
                type="number"
                min={0}
                placeholder="如 60"
                value={form.timeSpent}
                onChange={(e) => updateField("timeSpent", e.target.value)}
              />
            </div>

            {/* Units — multi-select chips */}
            <div className="flex flex-col gap-1.5">
              <Label>涉及单元（可选）</Label>
              <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border p-3">
                {allUnits.map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => toggleUnit(unit)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      form.units.includes(unit)
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : "border-zinc-300 text-zinc-600 hover:bg-zinc-100"
                    }`}
                  >
                    {unit}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                placeholder="详细描述今天的学习内容，例如：复习了 Macro Unit 3，做了 20 道 MCQ，错了 4 道，整理了错因…"
                rows={4}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="mt-2 w-full">
              提交记录
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
