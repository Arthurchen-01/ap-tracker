import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get("classId");

  if (!classId) {
    return NextResponse.json({ error: "缺少 classId" }, { status: 400 });
  }

  const students = await prisma.student.findMany({
    where: { classId },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(students);
}
