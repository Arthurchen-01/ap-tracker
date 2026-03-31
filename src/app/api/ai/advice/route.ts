import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateAdvice, StudentContext } from '@/lib/ai-advisor'
import { getConfidenceLevel } from '@/lib/confidence'

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

  const subjectCodes = student.subjects.map((subject) => subject.subjectCode)

  const [allSnapshots, allRecentRecords, lastUpdate, classInfo] = await Promise.all([
    prisma.probabilitySnapshot.findMany({
      where: {
        studentId: sid,
        subjectCode: { in: subjectCodes },
      },
      orderBy: [{ subjectCode: 'asc' }, { snapshotDate: 'desc' }],
      select: {
        subjectCode: true,
        snapshotDate: true,
        fiveRate: true,
        confidenceLevel: true,
      },
    }),
    prisma.assessmentRecord.findMany({
      where: {
        studentId: sid,
        subjectCode: { in: subjectCodes },
      },
      orderBy: [{ subjectCode: 'asc' }, { takenAt: 'desc' }],
      select: {
        subjectCode: true,
        takenAt: true,
      },
    }),
    prisma.dailyUpdate.findFirst({
      where: { studentId: sid },
      orderBy: { updateDate: 'desc' },
      select: { updateDate: true },
    }),
    prisma.class.findUnique({
      where: { id: student.classId },
      include: { examDates: true },
    }),
  ])

  const snapshotsBySubject = new Map<string, typeof allSnapshots>()
  for (const snapshot of allSnapshots) {
    const snapshots = snapshotsBySubject.get(snapshot.subjectCode) ?? []
    if (snapshots.length < 5) {
      snapshots.push(snapshot)
      snapshotsBySubject.set(snapshot.subjectCode, snapshots)
    }
  }

  const recordsBySubject = new Map<string, typeof allRecentRecords>()
  for (const record of allRecentRecords) {
    const records = recordsBySubject.get(record.subjectCode) ?? []
    if (records.length < 10) {
      records.push(record)
      recordsBySubject.set(record.subjectCode, records)
    }
  }

  const getDaysSince = (date?: Date) => {
    if (!date) return undefined
    return Math.max(
      0,
      Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)),
    )
  }

  // Build subject briefs from batched snapshots and assessment records
  const subjects: StudentContext['subjects'] = []
  for (const sub of student.subjects) {
    const snapshots = snapshotsBySubject.get(sub.subjectCode) ?? []

    const latestRate =
      snapshots.length > 0 ? Math.round(snapshots[0].fiveRate * 100) : 0

    // Simple trend: compare latest to oldest
    let trend = 0
    if (snapshots.length >= 2) {
      trend =
        Math.round(snapshots[0].fiveRate * 100) -
        Math.round(snapshots[snapshots.length - 1].fiveRate * 100)
    }

    // Find weakest units (from assessment records)
    const recentRecords = recordsBySubject.get(sub.subjectCode) ?? []
    const daysSinceLastRecord = getDaysSince(recentRecords[0]?.takenAt)

    const confidenceLevel =
      snapshots.length > 0
        ? snapshots[0].confidenceLevel
        : getConfidenceLevel(recentRecords.length, daysSinceLastRecord)

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

  let recentActivity = 'active'
  if (lastUpdate) {
    const daysSince = Math.floor(
      (Date.now() - lastUpdate.updateDate.getTime()) / (1000 * 60 * 60 * 24),
    )
    if (daysSince > 3) recentActivity = 'inactive'
  } else {
    recentActivity = 'inactive'
  }

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
