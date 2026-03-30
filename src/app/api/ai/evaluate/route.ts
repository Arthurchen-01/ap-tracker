import { NextResponse } from 'next/server'
import { evaluateDailyUpdate } from '@/lib/ai-evaluator'

export async function POST(request: Request) {
  const body = await request.json()
  const { description, subjectCode, activityType, scorePercent, timedMode } = body

  if (!subjectCode || !activityType) {
    return NextResponse.json({ error: '缺少必填字段' }, { status: 400 })
  }

  const result = await evaluateDailyUpdate({
    description: description || '',
    subjectCode,
    activityType,
    scorePercent: scorePercent ?? null,
    timedMode: timedMode ?? null,
  })

  return NextResponse.json(result)
}
