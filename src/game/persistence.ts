import { creatures } from '../data/creatures'
import { emptyMetrics, type Metrics } from './metrics'

export interface Result extends Metrics { id: string; world: number; won: boolean; date: string; creatureId?: string; odds: number[] }
export interface Save {
  version: 1
  name: string
  collection: Record<string, number>
  companion: string | null
  progression: number[]
  settings: { keyboard: boolean; reducedMotion: boolean }
  runs: Result[]
  totals: Metrics & { expeditions: number; wins: number }
  pending: { result: Result; creatureId: string } | null
}
export const storageKey = 'glyph-keepers.save.v1'
export function newSave(): Save {
  return { version: 1, name: 'Keeper', collection: {}, companion: null, progression: [0, 0, 0, 0, 0, 0], settings: { keyboard: true, reducedMotion: false }, runs: [], totals: { ...emptyMetrics(), expeditions: 0, wins: 0 }, pending: null }
}
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value)
function validMetrics(value: unknown): value is Metrics {
  if (!object(value)) return false
  return ['attempts', 'correct', 'completed', 'activeMs'].every(key => finite(value[key])) && (value.correct as number) <= (value.attempts as number) && object(value.keys) && Object.entries(value.keys).every(([key, stat]) => key.length === 1 && object(stat) && finite(stat.attempts) && finite(stat.errors) && stat.errors <= stat.attempts)
}
function validResult(value: unknown): value is Result {
  if (!object(value) || !validMetrics(value)) return false
  const record = value as unknown as Record<string, unknown>
  return typeof record.id === 'string' && Number.isInteger(record.world) && (record.world as number) >= 0 && (record.world as number) < 6 && typeof record.won === 'boolean' && typeof record.date === 'string' && Number.isFinite(Date.parse(record.date)) && Array.isArray(record.odds) && record.odds.length === 7 && record.odds.every(finite) && Math.abs(record.odds.reduce((sum: number, odd: number) => sum + odd, 0) - 1) < 0.00001 && (record.creatureId === undefined || creatures.some(creature => creature.id === record.creatureId))
}
export function parseSave(raw: string): Save {
  const value = JSON.parse(raw)
  if (!object(value) || value.version !== 1 || typeof value.name !== 'string' || value.name.length > 40 || !object(value.collection) || !Object.entries(value.collection).every(([id, count]) => creatures.some(creature => creature.id === id) && Number.isSafeInteger(count) && (count as number) > 0) || !object(value.settings) || typeof value.settings.keyboard !== 'boolean' || typeof value.settings.reducedMotion !== 'boolean' || !Array.isArray(value.runs) || value.runs.length > 100 || !value.runs.every(validResult) || !validMetrics(value.totals)) throw new Error('This is not a supported Glyph Keepers save.')
  const totals = value.totals as unknown as Record<string, unknown>
  if (!Array.isArray(value.progression) || value.progression.length !== 6 || !value.progression.every(count => Number.isSafeInteger(count) && count >= 0)) throw new Error('Invalid world progression.')
  if (!Number.isSafeInteger(totals.expeditions) || (totals.expeditions as number) < 0 || !Number.isSafeInteger(totals.wins) || (totals.wins as number) < 0 || (totals.wins as number) > (totals.expeditions as number) || !(value.companion === null || (typeof value.companion === 'string' && value.collection[value.companion]))) throw new Error('Invalid profile statistics.')
  if (value.pending !== null && (!object(value.pending) || !validResult(value.pending.result) || !value.pending.result.won || value.pending.result.creatureId !== value.pending.creatureId || typeof value.pending.creatureId !== 'string' || !value.collection[value.pending.creatureId])) throw new Error('Invalid pending hatch.')
  return value as unknown as Save
}
export function loadSave(): { save: Save; warning: string } {
  try { const raw = localStorage.getItem(storageKey); return { save: raw ? parseSave(raw) : newSave(), warning: '' } }
  catch { return { save: newSave(), warning: 'Your save could not be read. A fresh profile is ready. Export any recoverable data before playing.' } }
}
export function writeSave(save: Save): void { localStorage.setItem(storageKey, JSON.stringify(save)) }
