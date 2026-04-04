"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ClassItem = { id: string; name: string; season: string; _count: { students: number; examDates: number } };
type StudentItem = { id: string; name: string; classId: string; _count: { subjects: number } };
type ExamDateItem = { id: string; classId: string; subjectCode: string; examDate: string };
type SubjectItem = { id: string; code: string; name: string; unitCount: number; passingScore: number };

type Tab = "classes" | "students" | "exams" | "subjects";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("classes");
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  // Data
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [examDates, setExamDates] = useState<ExamDateItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);

  // Selected class for student/exam management
  const [selectedClassId, setSelectedClassId] = useState("");

  // Forms
  const [className, setClassName] = useState("");
  const [classSeason, setClassSeason] = useState("");
  const [studentName, setStudentName] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [subjCode, setSubjCode] = useState("");
  const [subjName, setSubjName] = useState("");

  // Check session storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_key");
    if (stored) {
      setAdminKey(stored);
      setAuthenticated(true);
    }
  }, []);

  const api = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const res = await fetch(path, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          ...(options.headers || {}),
        },
      });
      if (res.status === 401) {
        sessionStorage.removeItem("admin_key");
        setAuthenticated(false);
        throw new Error("Unauthorized");
      }
      return res.json();
    },
    [adminKey]
  );

  async function loadData() {
    if (!adminKey) return;
    setLoading(true);
    try {
      const [cls, studs, exams, subjs] = await Promise.all([
        api("/api/admin/classes"),
        selectedClassId ? api(`/api/admin/students?classId=${selectedClassId}`) : api("/api/admin/students"),
        selectedClassId ? api(`/api/admin/exam-dates?classId=${selectedClassId}`) : api("/api/admin/exam-dates"),
        api("/api/admin/subjects"),
      ]);
      setClasses(cls);
      setStudents(Array.isArray(studs) ? studs : []);
      setExamDates(Array.isArray(exams) ? exams : []);
      setSubjects(Array.isArray(subjs) ? subjs : []);
    } catch {
      // handled in api()
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authenticated) loadData();
  }, [authenticated, selectedClassId]);

  function logout() {
    sessionStorage.removeItem("admin_key");
    router.push("/admin/login");
  }

  // ---- CRUD helpers ----
  async function addClass() {
    if (!className || !classSeason) return;
    await api("/api/admin/classes", {
      method: "POST",
      body: JSON.stringify({ name: className, season: classSeason }),
    });
    setClassName("");
    setClassSeason("");
    loadData();
  }

  async function delClass(id: string) {
    if (!confirm("删除班级会同时删除该班级所有学生和考试日期？")) return;
    await api(`/api/admin/classes?id=${id}`, { method: "DELETE" });
    if (selectedClassId === id) setSelectedClassId("");
    loadData();
  }

  async function addStudent() {
    if (!studentName || !selectedClassId) return;
    await api("/api/admin/students", {
      method: "POST",
      body: JSON.stringify({ name: studentName, classId: selectedClassId }),
    });
    setStudentName("");
    loadData();
  }

  async function delStudent(id: string) {
    if (!confirm("删除学生？")) return;
    await api(`/api/admin/students?id=${id}`, { method: "DELETE" });
    loadData();
  }

  async function addExam() {
    if (!examSubject || !examDate || !selectedClassId) return;
    await api("/api/admin/exam-dates", {
      method: "POST",
      body: JSON.stringify({ classId: selectedClassId, subjectCode: examSubject, examDate }),
    });
    setExamSubject("");
    setExamDate("");
    loadData();
  }

  async function delExam(id: string) {
    await api(`/api/admin/exam-dates?id=${id}`, { method: "DELETE" });
    loadData();
  }

  async function addSubject() {
    if (!subjCode || !subjName) return;
    await api("/api/admin/subjects", {
      method: "POST",
      body: JSON.stringify({ code: subjCode, name: subjName, unitCount: 0, passingScore: 0 }),
    });
    setSubjCode("");
    setSubjName("");
    loadData();
  }

  async function delSubject(id: string) {
    await api(`/api/admin/subjects?id=${id}`, { method: "DELETE" });
    loadData();
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">请先 <a href="/admin/login" className="text-blue-600 underline">登录</a></p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "classes", label: "班级" },
    { id: "students", label: "学生" },
    { id: "exams", label: "考试日期" },
    { id: "subjects", label: "科目" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <div className="bg-zinc-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">AP Tracker 管理面板</h1>
        <div className="flex gap-3">
          <Button variant="ghost" className="text-white hover:text-white hover:bg-zinc-700" onClick={logout}>
            退出
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {loading && <p className="text-zinc-400 text-sm">加载中...</p>}

        {/* ===== 班级 ===== */}
        {tab === "classes" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>添加班级</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>班级名称</Label>
                  <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="如：AP备考班2026" className="mt-1" />
                </div>
                <div>
                  <Label>学期/赛季</Label>
                  <Input value={classSeason} onChange={(e) => setClassSeason(e.target.value)} placeholder="如：2026春季" className="mt-1" />
                </div>
                <Button onClick={addClass} disabled={!className || !classSeason} className="w-full">
                  创建班级
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>现有班级</CardTitle></CardHeader>
              <CardContent>
                {classes.length === 0 && <p className="text-zinc-400 text-sm">暂无班级</p>}
                <div className="space-y-2">
                  {classes.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium text-zinc-900">{c.name}</p>
                        <p className="text-xs text-zinc-500">{c.season} · {c._count.students} 学生 · {c._count.examDates} 考试日期</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => delClass(c.id)}>
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== 学生 ===== */}
        {tab === "students" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>添加学生</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>所属班级</Label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm mt-1"
                  >
                    <option value="">先选择班级</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>学生姓名</Label>
                  <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="输入姓名" className="mt-1" />
                </div>
                <Button onClick={addStudent} disabled={!studentName || !selectedClassId} className="w-full">
                  添加学生
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>现有学生</CardTitle>
                {selectedClassId && (
                  <p className="text-xs text-zinc-500 font-normal">
                    班级：{classes.find((c) => c.id === selectedClassId)?.name}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                {!selectedClassId && <p className="text-zinc-400 text-sm">请先选择班级</p>}
                {students.length === 0 && selectedClassId && <p className="text-zinc-400 text-sm">该班级暂无学生</p>}
                <div className="space-y-2">
                  {students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium text-zinc-900">{s.name}</p>
                        <p className="text-xs text-zinc-500">已选 {s._count.subjects} 科目</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => delStudent(s.id)}>
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== 考试日期 ===== */}
        {tab === "exams" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>添加考试日期</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>所属班级</Label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm mt-1"
                  >
                    <option value="">选择班级</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>科目代码</Label>
                  <Input value={examSubject} onChange={(e) => setExamSubject(e.target.value)} placeholder="如：Calculus BC" className="mt-1" />
                </div>
                <div>
                  <Label>考试日期</Label>
                  <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1" />
                </div>
                <Button onClick={addExam} disabled={!examSubject || !examDate || !selectedClassId} className="w-full">
                  添加考试
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>考试日期列表</CardTitle></CardHeader>
              <CardContent>
                {examDates.length === 0 && <p className="text-zinc-400 text-sm">暂无考试日期</p>}
                <div className="space-y-2">
                  {examDates.map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium text-zinc-900">{e.subjectCode}</p>
                        <p className="text-xs text-zinc-500">{new Date(e.examDate).toLocaleDateString("zh-CN")}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => delExam(e.id)}>
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ===== 科目 ===== */}
        {tab === "subjects" && (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>添加科目</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>科目代码</Label>
                  <Input value={subjCode} onChange={(e) => setSubjCode(e.target.value)} placeholder="如：Calculus BC" className="mt-1" />
                </div>
                <div>
                  <Label>科目名称</Label>
                  <Input value={subjName} onChange={(e) => setSubjName(e.target.value)} placeholder="如：AP微积分BC" className="mt-1" />
                </div>
                <Button onClick={addSubject} disabled={!subjCode || !subjName} className="w-full">
                  添加科目
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>现有科目</CardTitle></CardHeader>
              <CardContent>
                {subjects.length === 0 && <p className="text-zinc-400 text-sm">暂无科目</p>}
                <div className="space-y-2">
                  {subjects.map((s) => (
                    <div key={s.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                      <div>
                        <p className="font-medium text-zinc-900">{s.name}</p>
                        <p className="text-xs text-zinc-500">{s.code}</p>
                      </div>
                      <Button variant="destructive" size="sm" onClick={() => delSubject(s.id)}>
                        删除
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
