import { AI_CONFIG, isAIEnabled } from './ai-config'

export interface EvaluateInput {
  description: string
  subjectCode: string
  activityType: string
  scorePercent: number | null
  timedMode: string | null
}

export interface EvaluateResult {
  evidenceLevel: 'weak' | 'medium' | 'strong'
  qualityScore: number // 0-1
  explanation: string
}

function ruleBasedEvaluate(input: EvaluateInput): EvaluateResult {
  if (input.scorePercent != null && input.timedMode === 'timed') {
    return {
      evidenceLevel: 'strong',
      qualityScore: 0.7,
      explanation: '计时测试提供了较强的证据，反映了真实考试环境下的表现。',
    }
  }

  if (input.scorePercent != null) {
    return {
      evidenceLevel: 'medium',
      qualityScore: 0.5,
      explanation: '有分数记录但未计时，属于中等质量的复习证据。',
    }
  }

  const descLen = input.description.length
  if (descLen > 50) {
    return {
      evidenceLevel: 'medium',
      qualityScore: 0.5,
      explanation: '复习笔记较为详细，有助于巩固知识点。',
    }
  }

  if (descLen > 20) {
    return {
      evidenceLevel: 'weak',
      qualityScore: 0.3,
      explanation: '复习描述较简短，建议补充更多细节。',
    }
  }

  return {
    evidenceLevel: 'weak',
    qualityScore: 0.1,
    explanation: '缺乏有效证据，建议进行有记录的测试或详细复习笔记。',
  }
}

const SYSTEM_PROMPT =
  '你是一个AP备考评估专家。根据学生的学习记录描述，判断这次复习的质量和有效性。严格评估，不要轻易给高分。请以JSON格式返回，格式为：{"evidenceLevel":"weak|medium|strong","qualityScore":0到1的数字,"explanation":"简短中文解释"}。只返回JSON，不要其他内容。'

async function callAI(prompt: string): Promise<string> {
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
        temperature: 0.3,
      }),
      signal: controller.signal,
    })

    if (!res.ok) throw new Error(`AI API error: ${res.status}`)

    const data = await res.json()
    return data.choices[0].message.content as string
  } finally {
    clearTimeout(timeout)
  }
}

function parseAIResponse(text: string): EvaluateResult | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (
      ['weak', 'medium', 'strong'].includes(parsed.evidenceLevel) &&
      typeof parsed.qualityScore === 'number' &&
      typeof parsed.explanation === 'string'
    ) {
      return {
        evidenceLevel: parsed.evidenceLevel,
        qualityScore: Math.max(0, Math.min(1, parsed.qualityScore)),
        explanation: parsed.explanation,
      }
    }
    return null
  } catch {
    return null
  }
}

export async function evaluateDailyUpdate(
  input: EvaluateInput,
): Promise<EvaluateResult> {
  if (!isAIEnabled()) {
    return ruleBasedEvaluate(input)
  }

  const prompt = [
    `科目：${input.subjectCode}`,
    `活动类型：${input.activityType}`,
    input.scorePercent != null ? `分数：${input.scorePercent}%` : '无分数',
    input.timedMode ? `模式：${input.timedMode}` : '无计时信息',
    `描述：${input.description || '无描述'}`,
  ].join('\n')

  try {
    const raw = await callAI(prompt)
    const result = parseAIResponse(raw)
    if (result) return result
  } catch {
    // fallback to rules
  }

  return ruleBasedEvaluate(input)
}
