"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoChip } from "@/components/info-chip";

interface ResourceItem {
  id: string;
  uploaderId: string;
  subjectCode: string;
  title: string;
  resourceType: string;
  description: string | null;
  url: string | null;
  createdAt: string;
  student: { id: string; name: string };
}

const SUBJECT_OPTIONS = [
  "AP Macro",
  "AP Micro",
  "AP Calc BC",
  "AP Stats",
  "AP Physics",
  "AP Chemistry",
  "AP Biology",
  "AP English Lang",
];

const TYPE_OPTIONS = [
  { value: "notes", label: "笔记" },
  { value: "video", label: "视频" },
  { value: "practice", label: "练习" },
  { value: "flashcards", label: "闪卡" },
];

const typeColors: Record<string, string> = {
  notes: "bg-blue-100 text-blue-700",
  video: "bg-purple-100 text-purple-700",
  practice: "bg-green-100 text-green-700",
  flashcards: "bg-orange-100 text-orange-700",
};

const typeLabels: Record<string, string> = {
  notes: "笔记",
  video: "视频",
  practice: "练习",
  flashcards: "闪卡",
};

function getRecommendationText(resourceType: string) {
  if (resourceType === "practice") {
    return "更适合想马上动手补练的同学。";
  }
  if (resourceType === "video") {
    return "更适合先快速补概念、补框架。";
  }
  if (resourceType === "flashcards") {
    return "更适合短时回顾和碎片时间复习。";
  }
  return "更适合先把知识点结构梳理清楚。";
}

export default function ResourcesPage() {
  useParams();

  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formType, setFormType] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  function fetchResources() {
    const url =
      filterSubject === "all"
        ? "/api/resources"
        : `/api/resources?subjectCode=${encodeURIComponent(filterSubject)}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setResources(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  useEffect(() => {
    fetchResources();
  }, [filterSubject]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.studentId) setCurrentUserId(data.studentId);
      });
  }, []);

  async function handleSubmit() {
    if (!formTitle || !formSubject || !formType) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uploaderId: currentUserId,
          subjectCode: formSubject,
          resourceType: formType,
          title: formTitle,
          description: formDescription || null,
          url: formUrl || null,
        }),
      });

      if (res.ok) {
        setFormTitle("");
        setFormSubject("");
        setFormType("");
        setFormDescription("");
        setFormUrl("");
        setDialogOpen(false);
        fetchResources();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const filtered =
    filterSubject === "all"
      ? resources
      : resources.filter((r) => r.subjectCode === filterSubject);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900">资源共享</h1>
            <InfoChip tip="资源页不只是堆文件，而是帮助学生快速判断这份资料为什么值得看。"/>
          </div>
          <p className="mt-2 text-sm text-zinc-500">
            优先分享“为什么推荐”“适合什么阶段”的资料，而不只是简单丢链接。
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 sm:w-48"
          >
            <option value="all">全部科目</option>
            {SUBJECT_OPTIONS.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" />}>上传资源</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>上传资源</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">标题 *</Label>
                  <Input
                    id="title"
                    placeholder="资源标题"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>科目 *</Label>
                  <Select value={formSubject} onValueChange={(v) => setFormSubject(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECT_OPTIONS.map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>类型 *</Label>
                  <Select value={formType} onValueChange={(v) => setFormType(v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">为什么推荐</Label>
                  <Textarea
                    id="description"
                    placeholder="例如：这份资料适合临考前快速梳理 FRQ 框架。"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">链接</Label>
                  <Input
                    id="url"
                    placeholder="https://..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formTitle || !formSubject || !formType || submitting}
                >
                  {submitting ? "提交中..." : "提交"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-zinc-500">正在加载资源...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-zinc-500">当前还没有资源。</p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((res) => (
            <Card key={res.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="mb-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={typeColors[res.resourceType] ?? "bg-zinc-100 text-zinc-700"}
                  >
                    {typeLabels[res.resourceType] ?? res.resourceType}
                  </Badge>
                  <Badge variant="outline">{res.subjectCode}</Badge>
                </div>
                <CardTitle className="text-base leading-snug">{res.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between pt-0">
                <div>
                  <p className="mb-3 text-sm text-zinc-600">
                    {res.description || "上传者还没有补充推荐理由。"}
                  </p>
                  <div className="mb-4 rounded-xl bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
                    推荐理由：{getRecommendationText(res.resourceType)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>上传者：{res.student.name}</span>
                  {res.url && (
                    <a href={res.url} className="font-medium text-zinc-700 hover:underline">
                      查看资源 →
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
