"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SUBJECTS = [
  { code: "AP-Macro", name: "AP 宏观经济学" },
  { code: "AP-Micro", name: "AP 微观经济学" },
  { code: "AP-Calc-AB", name: "AP 微积分 AB" },
  { code: "AP-Calc-BC", name: "AP 微积分 BC" },
  { code: "AP-Phys1", name: "AP 物理 1" },
  { code: "AP-PhysC-Mech", name: "AP 物理 C: 力学" },
  { code: "AP-CSA", name: "AP 计算机科学 A" },
  { code: "AP-Stat", name: "AP 统计学" },
  { code: "AP-EngLang", name: "AP 英语语言" },
  { code: "AP-Chem", name: "AP 化学" },
];

const RECORD_TYPES = [
  { value: "MCQ", label: "MCQ（选择题）" },
  { value: "FRQ", label: "FRQ（简答题）" },
  { value: "FullMock", label: "完整模考" },
] as const;

const TIMED_MODES = [
  { value: "timed", label: "计时" },
  { value: "untimed", label: "不计时" },
] as const;

interface AssessmentRecord {
  id: string;
  subjectCode: string;
  recordType: string;
  timedMode: string;
  difficulty: string;
  scoreRaw: number | null;
  scorePercent: number | null;
  takenAt: string;
}

export default function RecordTestPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    subjectCode: "",
    recordType: "",
    timedMode: "timed",
    difficulty: "medium",
    source: "",
    scoreRaw: "",
    scorePercent: "",
    takenAt: today,
  });

  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const loadRecords = useCallback(() => {
    fetch("/api/assessment")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRecords(data);
      });
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subjectCode || !form.recordType) {
      alert("请填写所有必填项（带 * 号）");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectCode: form.subjectCode,
          recordType: form.recordType,
          timedMode: form.timedMode,
          difficulty: form.difficulty,
          source: form.source || null,
          scoreRaw: form.scoreRaw || null,
          scorePercent: form.scorePercent || null,
          takenAt: form.takenAt,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        loadRecords();
        setForm({
          subjectCode: "",
          recordType: "",
          timedMode: "timed",
          difficulty: "medium",
          source: "",
          scoreRaw: "",
          scorePercent: "",
          takenAt: today,
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">记录测试成绩</h1>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
          ✅ 测试记录已成功保存！
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>录入测试成绩</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="takenAt">考试日期</Label>
              <Input
                id="takenAt"
                type="date"
                value={form.takenAt}
                onChange={(e) => updateField("takenAt", e.target.value)}
              />
            </div>

            {/* Subject */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subjectCode">
                科目 <span className="text-red-500">*</span>
              </Label>
              <select
                id="subjectCode"
                value={form.subjectCode}
                onChange={(e) => updateField("subjectCode", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="">请选择科目</option>
                {SUBJECTS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Record Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recordType">
                测试类型 <span className="text-red-500">*</span>
              </Label>
              <select
                id="recordType"
                value={form.recordType}
                onChange={(e) => updateField("recordType", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="">请选择测试类型</option>
                {RECORD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Timed Mode */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timedMode">作答条件</Label>
              <select
                id="timedMode"
                value={form.timedMode}
                onChange={(e) => updateField("timedMode", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                {TIMED_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="difficulty">难度</Label>
              <select
                id="difficulty"
                value={form.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
                className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              >
                <option value="easy">简单</option>
                <option value="medium">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="source">来源</Label>
              <Input
                id="source"
                placeholder="如：Barron's, Princeton Review"
                value={form.source}
                onChange={(e) => updateField("source", e.target.value)}
              />
            </div>

            {/* Score fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scoreRaw">得分</Label>
                <Input
                  id="scoreRaw"
                  type="number"
                  min={0}
                  placeholder="如 42"
                  value={form.scoreRaw}
                  onChange={(e) => updateField("scoreRaw", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scorePercent">正确率 (%)</Label>
                <Input
                  id="scorePercent"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="如 84"
                  value={form.scorePercent}
                  onChange={(e) => updateField("scorePercent", e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" className="mt-2 w-full" disabled={submitting}>
              {submitting ? "提交中..." : "提交测试记录"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* History */}
      {records.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>历史测试记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>条件</TableHead>
                  <TableHead>难度</TableHead>
                  <TableHead>得分</TableHead>
                  <TableHead>正确率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.takenAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>{r.subjectCode}</TableCell>
                    <TableCell>{r.recordType}</TableCell>
                    <TableCell>{r.timedMode === "timed" ? "计时" : "不计时"}</TableCell>
                    <TableCell>
                      {r.difficulty === "easy" ? "简单" : r.difficulty === "hard" ? "困难" : "中等"}
                    </TableCell>
                    <TableCell>{r.scoreRaw ?? "-"}</TableCell>
                    <TableCell>
                      {r.scorePercent != null ? `${r.scorePercent}%` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
