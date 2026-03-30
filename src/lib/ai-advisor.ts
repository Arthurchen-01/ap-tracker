import { AI_CONFIG, isAIEnabled } from "./ai-config";

export interface SubjectBrief {
  code: string;
  fiveRate: number;
  confidenceLevel: string;
  trend: number;
  weakestUnits: string[];
}

export interface StudentContext {
  name: string;
  subjects: SubjectBrief[];
  recentActivity: string;
  daysUntilNearestExam: number;
}

const SYSTEM_PROMPT =
  '你是 AP 备考教练。请根据学生当前数据给出 3 条简洁、具体、可执行的学习建议。每条建议都要带行动，不要空话。请只返回 JSON 数组，例如 ["建议1","建议2","建议3"]。';

async function callAI(prompt: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AI_CONFIG.apiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
      }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`AI API error: ${res.status}`);

    const data = await res.json();
    return data.choices[0].message.content as string;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function parseAIAdvice(text: string): string[] | null {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === "string")) {
      return parsed.slice(0, 3);
    }
    return null;
  } catch {
    return null;
  }
}

function ruleBasedAdvice(ctx: StudentContext): string[] {
  const advice: string[] = [];

  if (ctx.subjects.length > 0) {
    const sorted = [...ctx.subjects].sort((a, b) => a.fiveRate - b.fiveRate);
    const weakest = sorted[0];
    if (weakest.weakestUnits.length > 0) {
      advice.push(
        `${weakest.code} 的 5 分率最低（${weakest.fiveRate}%），建议优先补 ${weakest.weakestUnits[0]} 相关练习。`,
      );
    } else {
      advice.push(
        `${weakest.code} 的 5 分率最低（${weakest.fiveRate}%），建议先把这门课的练习频率提上来。`,
      );
    }
  }

  if (ctx.recentActivity === "inactive") {
    advice.push("最近几天没有更新记录，建议尽快做一次计时测试，把状态重新拉回来。");
  } else {
    advice.push("继续保持每日更新，最好固定加入小测或整套训练，帮助自己适应考试节奏。");
  }

  if (ctx.daysUntilNearestExam <= 30 && ctx.daysUntilNearestExam > 0) {
    advice.push(
      `距离最近考试还有 ${ctx.daysUntilNearestExam} 天，建议加大模考频率，并优先盯住最弱环节。`,
    );
  } else if (ctx.daysUntilNearestExam <= 0) {
    advice.push("考试已经很近了，先稳住节奏，优先回顾错题和最核心的必考知识点。");
  } else {
    advice.push("时间还够，建议按周安排复习节奏，让每门课都有稳定推进。");
  }

  return advice.slice(0, 3);
}

export async function generateAdvice(ctx: StudentContext): Promise<string[]> {
  if (!isAIEnabled()) {
    return ruleBasedAdvice(ctx);
  }

  const prompt = JSON.stringify({
    name: ctx.name,
    subjects: ctx.subjects,
    recentActivity: ctx.recentActivity,
    daysUntilNearestExam: ctx.daysUntilNearestExam,
  });

  try {
    const raw = await callAI(prompt);
    if (raw) {
      const parsed = parseAIAdvice(raw);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }

  return ruleBasedAdvice(ctx);
}
