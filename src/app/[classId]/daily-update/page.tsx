"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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

interface DailyUpdateRecord {
  id: string;
  updateDate: string;
  subjectCode: string;
  activityType: string;
  timedMode: string | null;
  durationMinutes: number | null;
  scoreRaw: number | null;
  scorePercent: number | null;
  description: string | null;
}

interface RateChangeResult {
  success: boolean;
  oldRate: number;
  newRate: number;
  change: number;
  explanation: string;
}

export default function DailyUpdatePage() {
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    date: today,
    subjectCode: "",
    activityType: "",
    timedMode: "",
    durationMinutes: "",
    scoreRaw: "",
    scorePercent: "",
    description: "",
  });

  const [records, setRecords] = useState<DailyUpdateRecord[]>([]);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rateChange, setRateChange] = useState<RateChangeResult | null>(null);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const loadRecords = useCallback(() => {
    fetch("/api/daily-update")
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
    if (!form.subjectCode || !form.activityType) {
      alert("请填写所有必填项（带 * 号）");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/daily-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updateDate: form.date,
          subjectCode: form.subjectCode,
          activityType: form.activityType,
          timedMode: form.timedMode || null,
          durationMinutes: form.durationMinutes || null,
          scoreRaw: form.scoreRaw || null,
          scorePercent: form.scorePercent || null,
          description: form.description || null,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setSuccess(true);
        setRateChange(result);
        setTimeout(() => setSuccess(false), 5000);
        loadRecords();
        // Reset form but keep date
        setForm({
          date: today,
          subjectCode: "",
          activityType: "",
          timedMode: "",
          durationMinutes: "",
          scoreRaw: "",
          scorePercent: "",
          description: "",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-6 text-2xl font-bold text-zinc-900">每日更新</h1>

      {success && (
        <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-800 border border-green-200">
          ✅ 记录已成功保存！
        </div>
      )}

      {rateChange && (
        <Card className="mb-4 border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="text-base">📊 5 分率变化</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-sm text-zinc-500">旧值</div>
                <div className="text-2xl font-bold text-zinc-600">{rateChange.oldRate}%</div>
              </div>
              <div className="text-2xl">
                {rateChange.change > 0 ? "→" : rateChange.change < 0 ? "→" : "→"}
              </div>
              <div className="text-center">
                <div className="text-sm text-zinc-500">新值</div>
                <div className={`text-2xl font-bold ${rateChange.newRate >= rateChange.oldRate ? "text-green-700" : "text-red-700"}`}>
                  {rateChange.newRate}%
                </div>
              </div>
              <div className={`text-lg font-semibold px-3 py-1 rounded-full ${
                rateChange.change > 0
                  ? "bg-green-100 text-green-700"
                  : rateChange.change < 0
                  ? "bg-red-100 text-red-700"
                  : "bg-zinc-100 text-zinc-600"
              }`}>
                {rateChange.change > 0 ? `↑ +${rateChange.change}%` : rateChange.change < 0 ? `↓ ${rateChange.change}%` : "→ 0%"}
              </div>
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed">
              {rateChange.explanation}
            </p>
          </CardContent>
        </Card>
      )}

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

            {/* Task Type */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="activityType">
                任务类型 <span className="text-red-500">*</span>
              </Label>
              <select
                id="activityType"
                value={form.activityType}
                onChange={(e) => updateField("activityType", e.target.value)}
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
              <Label htmlFor="timedMode">作答条件</Label>
              <select
                id="timedMode"
                value={form.timedMode}
                onChange={(e) => updateField("timedMode", e.target.value)}
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

            {/* Score fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="scoreRaw">得分</Label>
                <Input
                  id="scoreRaw"
                  type="number"
                  min={0}
                  placeholder="如 85"
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
                  placeholder="如 80"
                  value={form.scorePercent}
                  onChange={(e) => updateField("scorePercent", e.target.value)}
                />
              </div>
            </div>

            {/* Duration */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="durationMinutes">花费时间（分钟）</Label>
              <Input
                id="durationMinutes"
                type="number"
                min={0}
                placeholder="如 60"
                value={form.durationMinutes}
                onChange={(e) => updateField("durationMinutes", e.target.value)}
              />
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
            <Button type="submit" className="mt-2 w-full" disabled={submitting}>
              {submitting ? "提交中..." : "提交记录"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {/* History */}
      {records.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>历史更新记录</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>任务类型</TableHead>
                  <TableHead>用时</TableHead>
                  <TableHead>得分</TableHead>
                  <TableHead>正确率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {new Date(r.updateDate).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>{r.subjectCode}</TableCell>
                    <TableCell>{r.activityType}</TableCell>
                    <TableCell>
                      {r.durationMinutes ? `${r.durationMinutes} 分钟` : "-"}
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
