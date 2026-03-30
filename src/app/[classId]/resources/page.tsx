"use client";

import { useState } from "react";
import {
  sharedResources,
  students,
  type APSubject,
  type SharedResource,
} from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ---------- Helpers ----------

const allSubjects = Array.from(
  new Set(sharedResources.map((r) => r.subject))
).sort() as APSubject[];

const typeLabels: Record<SharedResource["type"], string> = {
  notes: "笔记",
  video: "视频",
  practice: "练习",
  flashcards: "闪卡",
};

const typeColors: Record<SharedResource["type"], string> = {
  notes: "bg-blue-100 text-blue-700",
  video: "bg-purple-100 text-purple-700",
  practice: "bg-green-100 text-green-700",
  flashcards: "bg-orange-100 text-orange-700",
};

function getStudentName(id: string): string {
  return students.find((s) => s.id === id)?.name ?? "未知";
}

export default function ResourcesPage() {
  const [filterSubject, setFilterSubject] = useState<string>("all");

  const filtered =
    filterSubject === "all"
      ? sharedResources
      : sharedResources.filter((r) => r.subject === filterSubject);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-zinc-900">资源共享</h1>

        {/* Subject filter */}
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 sm:w-48"
        >
          <option value="all">全部科目</option>
          {allSubjects.map((subj) => (
            <option key={subj} value={subj}>
              {subj}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-zinc-500">暂无资源</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((res) => (
            <Card key={res.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="mb-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={typeColors[res.type]}
                  >
                    {typeLabels[res.type]}
                  </Badge>
                  <Badge variant="outline">{res.subject}</Badge>
                </div>
                <CardTitle className="text-base leading-snug">
                  {res.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between pt-0">
                <p className="mb-3 text-sm text-zinc-600">{res.description}</p>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>上传人：{getStudentName(res.sharedBy)}</span>
                  <a
                    href={res.url}
                    className="font-medium text-zinc-700 hover:underline"
                  >
                    查看 →
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
