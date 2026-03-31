export type ConfidenceLevel = "high" | "medium" | "low";

function normalizeDaysSince(daysSinceLastRecord?: number): number {
  if (typeof daysSinceLastRecord !== "number" || Number.isNaN(daysSinceLastRecord)) {
    return 999;
  }

  return Math.max(0, daysSinceLastRecord);
}

export function getConfidenceLevel(
  recordCount: number,
  daysSinceLastRecord?: number,
): ConfidenceLevel {
  const daysSince = normalizeDaysSince(daysSinceLastRecord);

  if (recordCount >= 5 && daysSince <= 30) return "high";
  if (recordCount >= 2 && daysSince <= 60) return "medium";
  if (recordCount >= 5) return "medium";
  return "low";
}

export function getConfidenceLabel(level: string): string {
  if (level === "high") return "高";
  if (level === "medium") return "中";
  return "低";
}

export function getConfidenceBadgeClass(level: string): string {
  if (level === "high") return "bg-green-100 text-green-800";
  if (level === "medium") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function getConfidenceDescription(
  level: string,
  recordCount?: number,
): string {
  const evidence =
    typeof recordCount === "number"
      ? `基于最近 ${recordCount} 次有效测试`
      : "基于当前已有测试记录";

  if (level === "high") {
    return `${evidence}，当前判断比较稳定，可以作为近期复习安排的重要参考。`;
  }
  if (level === "medium") {
    return `${evidence}，当前判断已经有参考价值，但还建议继续补充测试。`;
  }
  return `${evidence}，当前判断波动较大，建议先补更多有效测试再下结论。`;
}

export function getAggregateConfidenceLevel(levels: string[]): ConfidenceLevel {
  if (levels.length === 0) return "low";

  const total = levels.reduce((sum, level) => {
    if (level === "high") return sum + 2;
    if (level === "medium") return sum + 1;
    return sum;
  }, 0);

  const avg = total / levels.length;
  if (avg >= 1.5) return "high";
  if (avg >= 0.75) return "medium";
  return "low";
}
