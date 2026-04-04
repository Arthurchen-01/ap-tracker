import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "crypto";

function hashPassword(pwd: string): string {
  return hash("sha256", pwd, "hex");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, password, name, classId } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name 必填" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少6位" }, { status: 400 });
  }

  // 检查邮箱是否已注册
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 409 });
  }

  const passwordHash = hashPassword(password);

  // 如果提供了 classId，创建学生并关联
  let studentId: string | undefined;
  if (classId) {
    const student = await prisma.student.create({
      data: { name, classId },
    });
    studentId = student.id;
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      studentId,
    },
  });

  return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
}
