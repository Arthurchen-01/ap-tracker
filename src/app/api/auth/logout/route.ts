import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete("studentId");
  cookieStore.delete("classId");
  return NextResponse.json({ success: true });
}
