import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

function hashPassword(pwd: string): string {
  return createHash("sha256").update(pwd).digest("hex");
}

export async function POST(request: Request) {
  const body = await request.json();
  const { studentId, email, password } = body;
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  // 方式1：邮箱密码登录
  if (email && password) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: {
          include: { class: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    if (hashPassword(password) !== user.passwordHash) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      type: "email",
      email: user.email,
      studentId: user.studentId,
      studentName: user.student?.name,
      classId: user.student?.classId,
      className: user.student?.class?.name,
      onboardingStep: user.student?.onboardingStep,
    });

    response.cookies.set("userId", user.id, {
      httpOnly: true, secure: isProduction, sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, path: "/",
    });
    if (user.studentId) {
      response.cookies.set("studentId", user.studentId, {
        httpOnly: true, secure: isProduction, sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, path: "/",
      });
    }
    if (user.student?.classId) {
      response.cookies.set("classId", user.student.classId, {
        httpOnly: true, secure: isProduction, sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, path: "/",
      });
    }

    return response;
  }

  // 方式2：旧的学生ID登录（选班级选学生）
  if (!studentId) {
    return NextResponse.json({ error: "缺少 studentId 或 email/password" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) {
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });
  }

  const response = NextResponse.json({
    success: true,
    type: "student",
    studentId: student.id,
    classId: student.classId,
    studentName: student.name,
    onboardingStep: student.onboardingStep,
  });

  response.cookies.set("studentId", student.id, {
    httpOnly: true, secure: isProduction, sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, path: "/",
  });
  response.cookies.set("classId", student.classId, {
    httpOnly: true, secure: isProduction, sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, path: "/",
  });

  return response;
}
