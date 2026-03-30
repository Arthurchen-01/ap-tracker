import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const subjectCode = searchParams.get('subjectCode')

    if (!studentId || !subjectCode) {
      return NextResponse.json({ error: 'studentId and subjectCode are required' }, { status: 400 })
    }

    const snapshots = await prisma.probabilitySnapshot.findMany({
      where: { studentId, subjectCode },
      orderBy: { snapshotDate: 'asc' },
      select: {
        id: true,
        snapshotDate: true,
        fiveRate: true,
        stabilityScore: true,
        trendScore: true,
        decayScore: true,
        confidenceLevel: true,
        explanation: true,
      },
    })

    return NextResponse.json(snapshots)
  } catch (err) {
    console.error('scoring/history error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
