import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("studentId")?.value;
  const classId = cookieStore.get("classId")?.value;

  if (!studentId || !classId) {
    return NextResponse.json(null);
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    return NextResponse.json(null);
  }

  return NextResponse.json({
    studentId: student.id,
    name: student.name,
    classId: student.classId,
  });
}
