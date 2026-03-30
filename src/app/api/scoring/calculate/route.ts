import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateFiveRate } from '@/lib/scoring-engine'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { studentId, subjectCode } = body as { studentId: string; subjectCode: string }

    if (!studentId || !subjectCode) {
      return NextResponse.json({ error: 'studentId and subjectCode are required' }, { status: 400 })
    }

    const result = await calculateFiveRate(prisma, studentId, subjectCode)

    // Persist snapshot
    await prisma.probabilitySnapshot.create({
      data: {
        studentId,
        subjectCode,
        snapshotDate: new Date(),
        fiveRate: result.fiveRate,
        stabilityScore: result.components.stability,
        trendScore: result.components.trend,
        decayScore: result.components.decay,
        confidenceLevel: result.confidenceLevel,
      },
    })

    return NextResponse.json(result)
  } catch (err) {
    console.error('scoring/calculate error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
