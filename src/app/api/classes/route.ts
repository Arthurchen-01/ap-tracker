import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const classes = await prisma.class.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(classes);
}
