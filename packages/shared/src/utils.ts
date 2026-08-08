/**
 * 跨模块共享工具函数
 */

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreLabel(score: number): { label: string; color: string } {
  if (score >= 95) return { label: '巅峰状态', color: '#34C759' };
  if (score >= 75) return { label: '恢复较好', color: '#34C759' };
  if (score >= 50) return { label: '中等', color: '#FF9500' };
  if (score >= 25) return { label: '偏低', color: '#FF9500' };
  return { label: '很低', color: '#FF3B30' };
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function generateId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
}
