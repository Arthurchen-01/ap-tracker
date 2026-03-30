import { AI_CONFIG, isAIEnabled } from './ai-config'

export interface ExplanationContext {
  studentName: string
  subjectCode: string
  oldRate: number
  newRate: number
  change: number
  activityType: string | null
  scorePercent: number | null
  timedMode: string | null
  description: string | null
  daysSinceLastUpdate: number
  components?: {
    testPerformance: number
    trend: number
    stability: number
    reviewQuality: number
    decay: number
  }
}

// --- Template version ---

function formatChange(change: number): string {
  if (change > 0) return `+${change.toFixed(1)}%`
  if (change < 0) return `${change.toFixed(1)}%`
  return '0%'
}

function getTestDetail(ctx: ExplanationContext): string {
  if (ctx.scorePercent == null) return ''
  const parts: string[] = [`本次正确率 ${ctx.scorePercent}%`]
  if (ctx.timedMode === 'timed') {
    parts.push('（计时模式）')
  } else if (ctx.timedMode === '不计时') {
    parts.push('（不计时）')
  }
  return parts.join('')
}

function getReviewDetail(ctx: ExplanationContext): string {
  if (!ctx.description) return ''
  const len = ctx.description.length
  if (len > 50) return '复习笔记较详细，有助于巩固知识点'
  if (len > 20) return '进行了基础复习'
  return '记录了简要复习内容'
}

function templateExplanation(ctx: ExplanationContext): string {
  const { studentName, subjectCode, change, activityType, daysSinceLastUpdate } = ctx
  const changeStr = formatChange(change)

  let trendPart: string
  if (change >= 3) {
    trendPart = `${studentName}在${subjectCode}表现显著提升，5 分率上升 ${changeStr}`
  } else if (change >= 1) {
    trendPart = `${studentName}在${subjectCode}稳步进步，5 分率上升 ${changeStr}`
  } else if (change > 0) {
    trendPart = `${studentName}在${subjectCode}略有提升，5 分率微升 ${changeStr}`
  } else if (change === 0) {
    trendPart = `${studentName}在${subjectCode}的 5 分率保持稳定`
  } else if (change > -1) {
    trendPart = `${studentName}在${subjectCode}的 5 分率轻微回落 ${changeStr}`
  } else {
    trendPart = `${studentName}在${subjectCode}的 5 分率下降 ${changeStr}，需要关注`
  }

  let detailPart = ''
  if (ctx.scorePercent != null) {
    detailPart = `。${getTestDetail(ctx)}`
  } else if (ctx.description) {
    detailPart = `。${getReviewDetail(ctx)}`
  } else if (daysSinceLastUpdate > 3) {
    detailPart = `。距上次更新已有 ${daysSinceLastUpdate} 天，遗忘衰减对分数有一定影响`
  }

  if (activityType && ctx.scorePercent == null && !ctx.description) {
    detailPart += `。完成了一次${activityType}`
  }

  let suggestionPart = ''
  if (change < -1) {
    suggestionPart = '。建议加强薄弱环节的练习，特别是计时模考'
  } else if (change >= 3) {
    suggestionPart = '。继续保持当前学习节奏！'
  } else if (daysSinceLastUpdate > 5) {
    suggestionPart = '。建议保持每日更新的习惯，减少遗忘衰减'
  }

  return `${trendPart}${detailPart}${suggestionPart}`
}

// --- AI version ---

const EXPLANATION_SYSTEM_PROMPT =
  '你是AP备考分析助手。根据5分率变化数据，用简洁中文解释变化原因（2-3句话）。语气鼓励但实事求是。'

async function generateExplanationWithAI(ctx: ExplanationContext): Promise<string | null> {
  if (!isAIEnabled()) return null

  const prompt = JSON.stringify({
    studentName: ctx.studentName,
    subjectCode: ctx.subjectCode,
    oldRate: ctx.oldRate,
    newRate: ctx.newRate,
    change: ctx.change,
    activityType: ctx.activityType,
    scorePercent: ctx.scorePercent,
    timedMode: ctx.timedMode,
    description: ctx.description,
    daysSinceLastUpdate: ctx.daysSinceLastUpdate,
    components: ctx.components,
  })

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)

  try {
    const res = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: 'system', content: EXPLANATION_SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`AI API error: ${res.status}`)

    const data = await res.json()
    const text = (data.choices[0].message.content as string).trim()
    return text || null
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// --- Unified export ---

export async function generateExplanation(ctx: ExplanationContext): Promise<string> {
  const aiResult = await generateExplanationWithAI(ctx)
  if (aiResult) return aiResult
  return templateExplanation(ctx)
}
