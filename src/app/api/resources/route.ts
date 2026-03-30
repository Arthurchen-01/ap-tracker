import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subjectCode = searchParams.get("subjectCode") ?? undefined;

  const resources = await prisma.resource.findMany({
    where: subjectCode ? { subjectCode } : {},
    orderBy: { createdAt: "desc" },
    include: {
      student: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(resources);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { uploaderId, subjectCode, title, resourceType, description, url } = body;

  if (!uploaderId || !subjectCode || !title || !resourceType) {
    return NextResponse.json({ error: "缺少必填字段" }, { status: 400 });
  }

  const resource = await prisma.resource.create({
    data: {
      uploaderId,
      subjectCode,
      title,
      resourceType,
      description: description || null,
      url: url || null,
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
