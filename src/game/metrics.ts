export interface KeyStat { attempts: number; errors: number }
export interface Metrics { attempts: number; correct: number; completed: number; activeMs: number; keys: Record<string, KeyStat> }
export function emptyMetrics(): Metrics { return { attempts: 0, correct: 0, completed: 0, activeMs: 0, keys: {} } }
export function accuracy(metrics: Metrics): number { return metrics.attempts ? metrics.correct / metrics.attempts : 1 }
export function speed(metrics: Metrics, singleKeys = false): number {
  return metrics.activeMs > 0 ? metrics.completed / (singleKeys ? 1 : 5) / (metrics.activeMs / 60000) : 0
}
export function speedLabel(value: number, target: number): string {
  return value < target * 0.5 ? 'Finding your rhythm' : value < target ? 'Steady rhythm' : 'Flying fingers'
}
