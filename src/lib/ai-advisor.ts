import { AI_CONFIG, isAIEnabled } from './ai-config'

export interface SubjectBrief {
  code: string
  fiveRate: number
  confidenceLevel: string
  trend: number
  weakestUnits: string[]
}

export interface StudentContext {
  name: string
  subjects: SubjectBrief[]
  recentActivity: string
  daysUntilNearestExam: number
}

const SYSTEM_PROMPT =
  '你是AP备考教练。根据学生数据给出3条具体可执行的学习建议。每条建议简洁有力（不超过50字），包含具体行动和科目/单元。以JSON数组格式返回，如["建议1","建议2","建议3"]。只返回JSON。'

async function callAI(prompt: string): Promise<string | null> {
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
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`AI API error: ${res.status}`)

    const data = await res.json()
    return data.choices[0].message.content as string
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function parseAIAdvice(text: string): string[] | null {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return parsed.slice(0, 3)
    }
    return null
  } catch {
    return null
  }
}

function ruleBasedAdvice(ctx: StudentContext): string[] {
  const advice: string[] = []

  // Lowest five rate subject
  if (ctx.subjects.length > 0) {
    const sorted = [...ctx.subjects].sort((a, b) => a.fiveRate - b.fiveRate)
    const weakest = sorted[0]
    if (weakest.weakestUnits.length > 0) {
      advice.push(
        `${weakest.code} 的 5 分率最低（${weakest.fiveRate}%），建议重点加强 ${weakest.weakestUnits[0]} 单元的练习。`,
      )
    } else {
      advice.push(
        `${weakest.code} 的 5 分率最低（${weakest.fiveRate}%），建议增加该科目的练习频率。`,
      )
    }
  }

  // Activity freshness
  if (ctx.recentActivity === 'inactive') {
    advice.push('已多日未提交学习记录，建议尽快进行一次计时测试，保持学习节奏。')
  } else {
    advice.push('继续保持每日学习更新的习惯，定期模考有助于适应考试节奏。')
  }

  // Exam proximity
  if (ctx.daysUntilNearestExam <= 30 && ctx.daysUntilNearestExam > 0) {
    advice.push(
      `距最近考试仅 ${ctx.daysUntilNearestExam} 天，建议加大模考频率，重点关注薄弱环节。`,
    )
  } else if (ctx.daysUntilNearestExam <= 0) {
    advice.push('考试已过或日期临近，保持心态平稳，回顾错题和核心知识点。')
  } else {
    advice.push('时间尚充裕，建议制定每周学习计划，均衡分配各科目复习时间。')
  }

  return advice.slice(0, 3)
}

export async function generateAdvice(ctx: StudentContext): Promise<string[]> {
  if (!isAIEnabled()) {
    return ruleBasedAdvice(ctx)
  }

  const prompt = JSON.stringify({
    name: ctx.name,
    subjects: ctx.subjects,
    recentActivity: ctx.recentActivity,
    daysUntilNearestExam: ctx.daysUntilNearestExam,
  })

  try {
    const raw = await callAI(prompt)
    if (raw) {
      const parsed = parseAIAdvice(raw)
      if (parsed && parsed.length > 0) return parsed
    }
  } catch {
    // fallback
  }

  return ruleBasedAdvice(ctx)
}
