"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ClassItem {
  id: string;
  name: string;
}

interface StudentItem {
  id: string;
  name: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Check if already logged in
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.studentId) {
          router.push(`/${data.classId}/dashboard`);
        }
      });
  }, [router]);

  // Load classes
  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => setClasses(data));
  }, []);

  // Load students when class changes
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      setSelectedStudent("");
      return;
    }
    fetch(`/api/students?classId=${selectedClass}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data);
        setSelectedStudent("");
      });
  }, [selectedClass]);

  async function handleLogin() {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/${data.classId}/dashboard`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">AP 备考追踪平台 - 登录</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {/* Step 1: Select Class */}
          <div className="flex flex-col gap-1.5">
            <Label>第一步：选择班级</Label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setStep(2);
              }}
              className="flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
            >
              <option value="">请选择班级</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Select Student */}
          {step >= 2 && selectedClass && (
            <div className="flex flex-col gap-1.5">
              <Label>第二步：选择学生</Label>
              <select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
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
          )}

          <Button
            onClick={handleLogin}
            disabled={!selectedStudent || loading}
            className="w-full"
          >
            {loading ? "登录中..." : "登录"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
