export function getConfidenceLevel(recordCount: number): 'high' | 'medium' | 'low' {
  if (recordCount >= 5) return 'high'
  if (recordCount >= 2) return 'medium'
  return 'low'
}
