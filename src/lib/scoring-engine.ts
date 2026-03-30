import { PrismaClient } from '@prisma/client'
import { getConfidenceLevel } from './confidence'

export interface ScoringResult {
  fiveRate: number
  confidenceLevel: 'high' | 'medium' | 'low'
  components: {
    testPerformance: number
    trend: number
    stability: number
    reviewQuality: number
    decay: number
  }
}

interface AssessmentLike {
  recordType: string
  timedMode: string
  scorePercent: number | null
  takenAt: Date
}

function getWeight(record: AssessmentLike): number {
  if (record.recordType === 'FullMock' && record.timedMode === 'timed') return 3
  if ((record.recordType === 'MCQ' || record.recordType === 'FRQ') && record.timedMode === 'timed') return 2
  return 1
}

function computeWeightedAverage(records: AssessmentLike[]): number {
  let totalWeight = 0
  let weightedSum = 0
  for (const r of records) {
    if (r.scorePercent == null) continue
    const w = getWeight(r)
    weightedSum += r.scorePercent * w
    totalWeight += w
  }
  if (totalWeight === 0) return 0
  return weightedSum / totalWeight / 100 // map to 0-1
}

function computeTrend(scores: number[]): number {
  if (scores.length < 3) return 0.5
  const n = scores.length
  const xMean = (n - 1) / 2
  const yMean = scores.reduce((a, b) => a + b, 0) / n
  let num = 0
  let den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (scores[i] - yMean)
    den += (i - xMean) ** 2
  }
  const slope = den === 0 ? 0 : num / den
  // slope is in percent units per step; normalize
  if (slope > 0) return Math.min(0.7 + slope * 0.02, 0.99)
  return Math.max(0.3 + slope * 0.02, 0.01)
}

function computeStability(scores: number[]): number {
  if (scores.length < 2) return 0.5
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length
  const stdDev = Math.sqrt(variance)
  return Math.max(0, Math.min(1, 1 - stdDev / 50))
}

async function computeReviewQuality(prisma: PrismaClient, studentId: string, subjectCode: string, aiQualityScore?: number): Promise<number> {
  if (aiQualityScore != null) return aiQualityScore

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const updates = await prisma.dailyUpdate.findMany({
    where: {
      studentId,
      subjectCode,
      updateDate: { gte: sevenDaysAgo },
    },
  })
  type ReviewUpdate = (typeof updates)[number]

  if (updates.length === 0) return 0.1

  const hasTestScore = updates.some(
    (u: ReviewUpdate) => u.scorePercent != null
  )
  if (hasTestScore) return 0.7

  const hasDetailedDesc = updates.some(
    (u: ReviewUpdate) => (u.description?.length ?? 0) > 20
  )
  if (hasDetailedDesc) return 0.5

  return 0.3
}

function computeDecay(lastActivityDate: Date | null): number {
  if (!lastActivityDate) return 0.10
  const now = new Date()
  const diffMs = now.getTime() - lastActivityDate.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  return Math.min(days * 0.005, 0.10)
}

export async function calculateFiveRate(
  prisma: PrismaClient,
  studentId: string,
  subjectCode: string,
  aiQualityScore?: number,
): Promise<ScoringResult> {
  // 1. Fetch assessment records
  const records = await prisma.assessmentRecord.findMany({
    where: { studentId, subjectCode },
    orderBy: { takenAt: 'asc' },
  })

  // 2. Test performance (60%)
  const testPerformance = computeWeightedAverage(records)

  // 3. Trend (15%) — last 5 scores
  const recent5 = records
    .filter((r: AssessmentLike) => r.scorePercent != null)
    .slice(-5)
    .map((r: AssessmentLike) => r.scorePercent as number)
  const trend = computeTrend(recent5)

  // 4. Stability (15%)
  const stability = computeStability(recent5)

  // 5. Review quality (10%)
  const reviewQuality = await computeReviewQuality(prisma, studentId, subjectCode, aiQualityScore)

  // 6. Decay
  const lastRecord = records[records.length - 1]
  const lastUpdate = await prisma.dailyUpdate.findFirst({
    where: { studentId, subjectCode },
    orderBy: { updateDate: 'desc' },
    select: { updateDate: true },
  })
  const lastActivity = lastUpdate?.updateDate ?? lastRecord?.takenAt ?? null
  const decay = computeDecay(lastActivity)

  // 7. Final calculation
  const fiveRate = Math.max(
    0.01,
    Math.min(
      0.99,
      testPerformance * 0.60 + trend * 0.15 + stability * 0.15 + reviewQuality * 0.10 - decay,
    ),
  )

  // 8. Confidence
  const confidenceLevel = getConfidenceLevel(records.length)

  return {
    fiveRate,
    confidenceLevel,
    components: {
      testPerformance,
      trend,
      stability,
      reviewQuality,
      decay,
    },
  }
}
