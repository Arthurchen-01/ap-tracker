import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFiveRate } from '@/lib/scoring-engine'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { classId } = body as { classId: string }

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    const students = await prisma.student.findMany({
      where: { classId },
      include: { subjects: true },
    })

    const subjects = await prisma.subject.findMany({ select: { code: true } })

    const results: {
      studentId: string
      subjectCode: string
      fiveRate: number
      confidenceLevel: string
    }[] = []

    for (const student of students) {
      for (const subject of subjects) {
        const result = await calculateFiveRate(prisma, student.id, subject.code)

        await prisma.probabilitySnapshot.create({
          data: {
            studentId: student.id,
            subjectCode: subject.code,
            snapshotDate: new Date(),
            fiveRate: result.fiveRate,
            stabilityScore: result.components.stability,
            trendScore: result.components.trend,
            decayScore: result.components.decay,
            confidenceLevel: result.confidenceLevel,
          },
        })

        results.push({
          studentId: student.id,
          subjectCode: subject.code,
          fiveRate: result.fiveRate,
          confidenceLevel: result.confidenceLevel,
        })
      }
    }

    return NextResponse.json({
      total: results.length,
      updated: results.length,
      results,
    })
  } catch (err) {
    console.error('scoring/batch error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
