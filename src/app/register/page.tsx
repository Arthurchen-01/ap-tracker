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

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => setClasses(data));
  }, []);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("两次密码不一致");
      return;
    }
    if (password.length < 6) {
      setError("密码至少6位");
      return;
    }
    if (!name.trim()) {
      setError("请输入姓名");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name: name.trim(), classId: classId || undefined }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "注册失败，请重试");
      }
    } catch {
      setError("注册失败，请检查网络后重试");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-100 px-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">注册成功</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-zinc-600">
              账号已创建！
              {classId ? (
                <span>正在跳转登录页...</span>
              ) : (
                <span>请等待管理员分配班级后登录。</span>
              )}
            </p>
            {classId && (
              <Button onClick={() => router.push("/login")} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
                去登录
              </Button>
            )}
            {!classId && (
              <Button onClick={() => router.push("/login")} variant="outline" className="w-full">
                返回登录页
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-zinc-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-2 inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 text-white text-2xl font-bold shadow-lg">
            AP
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">AP Tracker</h1>
          <p className="text-zinc-500 text-sm mt-1">创建你的账号</p>
        </div>

        <Card className="shadow-xl border-zinc-200">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">注册</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-zinc-700">姓名</Label>
                <Input
                  placeholder="你的姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
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
                  placeholder="至少6位"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-700">确认密码</Label>
                <Input
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-700">所在班级（可选）</Label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm mt-1"
                >
                  <option value="">无（请管理员分配）</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-400 mt-1">
                  如果班级暂未开放，留空稍后由管理员分配
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white h-10">
                {loading ? "注册中..." : "注册"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm text-muted-foreground">
              已有账号？{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                去登录
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
