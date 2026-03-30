import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RiskStudent {
  studentId: string
  name: string
  worstSubject: string
  fiveRate: number
}

interface InactiveStudent {
  studentId: string
  name: string
  daysInactive: number
}

interface VolatileStudent {
  studentId: string
  name: string
  subjectCode: string
  stdDev: number
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    // Get all students in this class
    const students = await prisma.student.findMany({
      where: { classId },
      select: { id: true, name: true },
    })

    const studentIds = students.map((s) => s.id)
    if (studentIds.length === 0) {
      return NextResponse.json({ riskStudents: [], inactiveStudents: [], volatileStudents: [] })
    }

    // 1. Risk students: latest fiveRate < 50%
    const riskStudents: RiskStudent[] = []
    for (const student of students) {
      const snapshots = await prisma.probabilitySnapshot.findMany({
        where: { studentId: student.id },
        orderBy: { snapshotDate: 'desc' },
        distinct: ['subjectCode'],
      })

      const lowRateSnapshots = snapshots.filter((s) => s.fiveRate < 0.5)
      if (lowRateSnapshots.length > 0) {
        const worst = lowRateSnapshots.reduce((a, b) => (a.fiveRate < b.fiveRate ? a : b))
        riskStudents.push({
          studentId: student.id,
          name: student.name,
          worstSubject: worst.subjectCode,
          fiveRate: Math.round(worst.fiveRate * 100),
        })
      }
    }

    // 2. Inactive students: no DailyUpdate in last 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const inactiveStudents: InactiveStudent[] = []
    for (const student of students) {
      const lastUpdate = await prisma.dailyUpdate.findFirst({
        where: { studentId: student.id },
        orderBy: { updateDate: 'desc' },
        select: { updateDate: true },
      })

      if (!lastUpdate || lastUpdate.updateDate < threeDaysAgo) {
        const daysInactive = lastUpdate
          ? Math.floor((Date.now() - lastUpdate.updateDate.getTime()) / (1000 * 60 * 60 * 24))
          : 999
        inactiveStudents.push({
          studentId: student.id,
          name: student.name,
          daysInactive,
        })
      }
    }

    // 3. Volatile students: stdDev of last 5 test scores > 15
    const volatileStudents: VolatileStudent[] = []
    for (const student of students) {
      const records = await prisma.assessmentRecord.findMany({
        where: { studentId: student.id },
        orderBy: { takenAt: 'desc' },
        take: 20,
      })

      // Group by subject
      const bySubject: Record<string, number[]> = {}
      for (const r of records) {
        if (r.scorePercent == null) continue
        if (!bySubject[r.subjectCode]) bySubject[r.subjectCode] = []
        bySubject[r.subjectCode].push(r.scorePercent)
      }

      for (const [subjectCode, scores] of Object.entries(bySubject)) {
        if (scores.length < 3) continue
        const recent5 = scores.slice(0, 5)
        const mean = recent5.reduce((a, b) => a + b, 0) / recent5.length
        const variance = recent5.reduce((a, b) => a + (b - mean) ** 2, 0) / recent5.length
        const stdDev = Math.round(Math.sqrt(variance) * 10) / 10

        if (stdDev > 15) {
          volatileStudents.push({
            studentId: student.id,
            name: student.name,
            subjectCode,
            stdDev,
          })
        }
      }
    }

    return NextResponse.json({ riskStudents, inactiveStudents, volatileStudents })
  } catch (err) {
    console.error('dashboard/alerts error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
