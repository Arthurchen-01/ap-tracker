import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const { studentId } = body;

  if (!studentId) {
    return NextResponse.json({ error: "缺少 studentId" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return NextResponse.json({ error: "学生不存在" }, { status: 404 });
  }

  const cookieStore = await cookies();
  cookieStore.set("studentId", student.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  cookieStore.set("classId", student.classId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return NextResponse.json({ success: true, studentId: student.id, classId: student.classId });
}
