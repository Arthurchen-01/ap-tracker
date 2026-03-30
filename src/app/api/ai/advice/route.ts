import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateAdvice, StudentContext } from '@/lib/ai-advisor'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  const cookieStore = await cookies()
  const sid = studentId || cookieStore.get('studentId')?.value

  if (!sid) {
    return NextResponse.json({ error: '未指定学生' }, { status: 400 })
  }

  // Fetch student with subjects and snapshots
  const student = await prisma.student.findUnique({
    where: { id: sid },
    include: {
      subjects: true,
    },
  })

  if (!student) {
    return NextResponse.json({ error: '学生不存在' }, { status: 404 })
  }

  // Build subject briefs from snapshots
  const subjects: StudentContext['subjects'] = []
  for (const sub of student.subjects) {
    const snapshots = await prisma.probabilitySnapshot.findMany({
      where: { studentId: sid, subjectCode: sub.subjectCode },
      orderBy: { snapshotDate: 'desc' },
      take: 5,
    })

    const latestRate =
      snapshots.length > 0 ? Math.round(snapshots[0].fiveRate * 100) : 0

    // Simple trend: compare latest to oldest
    let trend = 0
    if (snapshots.length >= 2) {
      trend =
        Math.round(snapshots[0].fiveRate * 100) -
        Math.round(snapshots[snapshots.length - 1].fiveRate * 100)
    }

    const confidenceLevel =
      latestRate >= 75 ? '高' : latestRate >= 55 ? '中' : '低'

    // Find weakest units (from assessment records)
    const recentRecords = await prisma.assessmentRecord.findMany({
      where: { studentId: sid, subjectCode: sub.subjectCode },
      orderBy: { takenAt: 'desc' },
      take: 10,
    })

    const weakestUnits: string[] = []
    if (latestRate < 60) {
      weakestUnits.push('核心概念')
    }

    subjects.push({
      code: sub.subjectCode,
      fiveRate: latestRate,
      confidenceLevel,
      trend,
      weakestUnits,
    })
  }

  // Check recent activity
  const lastUpdate = await prisma.dailyUpdate.findFirst({
    where: { studentId: sid },
    orderBy: { updateDate: 'desc' },
    select: { updateDate: true },
  })

  let recentActivity = 'active'
  if (lastUpdate) {
    const daysSince = Math.floor(
      (Date.now() - lastUpdate.updateDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSince > 3) recentActivity = 'inactive'
  } else {
    recentActivity = 'inactive'
  }

  // Nearest exam
  const classInfo = await prisma.class.findUnique({
    where: { id: student.classId },
    include: { examDates: true },
  })

  let daysUntilNearestExam = 999
  if (classInfo) {
    for (const exam of classInfo.examDates) {
      const days = Math.floor(
        (exam.examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
      if (days >= 0 && days < daysUntilNearestExam) {
        daysUntilNearestExam = days
      }
    }
  }

  const advice = await generateAdvice({
    name: student.name,
    subjects,
    recentActivity,
    daysUntilNearestExam,
  })

  return NextResponse.json({ advice })
}
