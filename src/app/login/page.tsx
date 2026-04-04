"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ClassItem {
  id: string;
  name: string;
}

interface StudentItem {
  id: string;
  name: string;
}

type AuthMode = "select" | "email";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("select");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.studentId) {
          const target = data.onboardingStep === 1 || data.onboardingStep === 2
            ? `/${data.classId}/learning-method`
            : data.onboardingStep === 3
            ? `/${data.classId}/initial-exams`
            : `/${data.classId}/dashboard`;
          router.push(target);
        }
      });
  }, [router]);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => setClasses(data));
  }, []);

  useEffect(() => {
    if (!selectedClass) { setStudents([]); setSelectedStudent(""); return; }
    fetch(`/api/students?classId=${selectedClass}`)
      .then((r) => r.json())
      .then((data) => { setStudents(data); setSelectedStudent(""); });
  }, [selectedClass]);

  async function handleStudentLogin() {
    if (!selectedStudent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent }),
      });
      const data = await res.json();
      if (data.success) {
        const target = data.onboardingStep === 1 || data.onboardingStep === 2
          ? `/${data.classId}/learning-method`
          : data.onboardingStep === 3
          ? `/${data.classId}/initial-exams`
          : `/${data.classId}/dashboard`;
        router.push(target);
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (!data.studentId) {
          setError("该账号未绑定学生，请先由管理员分配班级");
          return;
        }
        const target = data.onboardingStep === 1 || data.onboardingStep === 2
          ? `/${data.classId}/learning-method`
          : data.onboardingStep === 3
          ? `/${data.classId}/initial-exams`
          : `/${data.classId}/dashboard`;
        router.push(target);
      } else {
        setError(data.error || "登录失败");
      }
    } catch {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-white text-2xl font-bold shadow-lg">
            AP
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">AP Tracker</h1>
          <p className="text-zinc-500 text-sm mt-1">AI驱动的AP备考追踪平台</p>
        </div>

        <Card className="shadow-xl border-zinc-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">登录</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">

            {/* 登录方式切换 */}
            <div className="flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 text-sm">
              <button
                onClick={() => { setMode("select"); setError(null); }}
                className={`flex-1 py-1.5 rounded-md transition-colors ${mode === "select" ? "bg-white shadow text-zinc-900 font-medium" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                选择账号
              </button>
              <button
                onClick={() => { setMode("email"); setError(null); }}
                className={`flex-1 py-1.5 rounded-md transition-colors ${mode === "email" ? "bg-white shadow text-zinc-900 font-medium" : "text-zinc-500 hover:text-zinc-700"}`}
              >
                邮箱登录
              </button>
            </div>

            {/* 方式1：选班级选学生 */}
            {mode === "select" && (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium text-zinc-700">班级</Label>
                  <select
                    value={selectedClass}
                    onChange={(e) => { setSelectedClass(e.target.value); setStep(2); }}
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-transparent"
                  >
                    <option value="">请选择班级</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {step >= 2 && selectedClass && (
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium text-zinc-700">学生</Label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:border-transparent"
                    >
                      <option value="">请选择学生</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  onClick={handleStudentLogin}
                  disabled={!selectedStudent || loading}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-10"
                >
                  {loading ? "登录中..." : "登录"}
                </Button>
              </>
            )}

            {/* 方式2：邮箱密码 */}
            {mode === "email" && (
              <form onSubmit={handleEmailLogin} className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-zinc-700">邮箱</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-zinc-700">密码</Label>
                  <Input
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-10">
                  {loading ? "登录中..." : "登录"}
                </Button>
              </form>
            )}

            {/* 注册链接 */}
            <div className="text-center text-sm text-muted-foreground">
              还没有账号？{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">
                去注册
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
