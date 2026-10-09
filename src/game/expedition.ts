import { reactive } from 'vue'
import { worlds, choosePrompts } from '../data/curriculum'
import { rollCreature, rewardOdds } from './rewards'
import { emptyMetrics, type Metrics } from './metrics'
import { emptyTyping, typeCharacter, backspace } from './typing'
import type { Save, Result } from './persistence'

export type Phase = 'idle' | 'encounter' | 'transition' | 'paused' | 'retreat' | 'egg' | 'hatching' | 'hatched'
export function createExpedition(getSave: () => Save, persist: (save: Save) => void, now = () => performance.now()) {
  const state = reactive({ phase: 'idle' as Phase, world: 0, prompts: [] as string[], index: 0, hearts: 5, typing: emptyTyping(), metrics: emptyMetrics(), result: null as Result | null, reward: '', previous: 'encounter' as Phase })
  let started: number | null = null
  let timer: ReturnType<typeof setTimeout> | undefined
  let generation = 0
  let recorded: Metrics = emptyMetrics()
  const clone = <Value>(value: Value): Value => JSON.parse(JSON.stringify(value))
  function stopClock() { if (started !== null) { state.metrics.activeMs += Math.max(0, now() - started); started = null } }
  function beginClock() { if (state.phase === 'encounter' && started === null) started = now() }
  function snapshot() { return { ...state.metrics, activeMs: state.metrics.activeMs + (started === null ? 0 : Math.max(0, now() - started)) } }
  function later(callback: () => void, delay: number) { const token = generation; timer = setTimeout(() => { if (token === generation) callback() }, delay) }
  function savePractice() {
    const save = clone(getSave())
    for (const field of ['attempts', 'correct', 'completed', 'activeMs'] as const) save.totals[field] += state.metrics[field] - recorded[field]
    for (const [key, stat] of Object.entries(state.metrics.keys)) {
      const previous = recorded.keys[key] ?? { attempts: 0, errors: 0 }
      const total = save.totals.keys[key] ??= { attempts: 0, errors: 0 }
      total.attempts += stat.attempts - previous.attempts
      total.errors += stat.errors - previous.errors
    }
    persist(save); recorded = clone(state.metrics)
  }
  function start(world: number) {
    if (state.phase !== 'idle' && state.phase !== 'retreat') return
    clearTimeout(timer); generation++; recorded = emptyMetrics()
    const meadowWins = getSave().progression[0]!
    Object.assign(state, { phase: 'encounter', world, prompts: choosePrompts(worlds[world]!, getSave().totals.keys, Math.random, meadowWins), index: 0, hearts: 5, typing: emptyTyping(), metrics: emptyMetrics(), result: null, reward: '' })
    started = null; beginClock()
  }
  function finish(won: boolean) {
    stopClock(); savePractice()
    const odds = rewardOdds(state.world, state.metrics)
    const reward = won ? rollCreature(odds) : null
    const result: Result = { ...clone(state.metrics), id: crypto.randomUUID(), world: state.world, won, date: new Date().toISOString(), odds, ...(reward ? { creatureId: reward.id } : {}) }
    const save = clone(getSave())
    save.runs.unshift(result); save.runs = save.runs.slice(0, 100)
    save.totals.expeditions++; save.totals.wins += Number(won)
    if (won) save.progression[state.world]!++
    if (reward) { save.collection[reward.id] = (save.collection[reward.id] ?? 0) + 1; save.pending = { result, creatureId: reward.id } }
    persist(save)
    state.result = result; state.reward = reward?.id ?? ''; state.phase = won ? 'egg' : 'retreat'
  }
  function character(character: string) {
    if (state.phase !== 'encounter' || [...character].length !== 1) return
    const target = state.prompts[state.index]!
    const expected = [...target][[...state.typing.input].length]
    const next = typeCharacter(state.typing, target, character)
    const correct = next.correct > state.typing.correct
    state.metrics.attempts++; state.metrics.correct += Number(correct)
    const key = expected ?? character
    const stat = state.metrics.keys[key] ??= { attempts: 0, errors: 0 }
    stat.attempts++; stat.errors += Number(!correct)
    state.typing = next
    if (next.damage) state.hearts--
    if (state.hearts === 0) { finish(false); return }
    if (next.input === target) {
      stopClock(); state.metrics.completed += target.length; savePractice(); state.phase = 'transition'
      later(() => { if (state.index === 9) finish(true); else { state.index++; state.typing = emptyTyping(); state.phase = 'encounter'; beginClock() } }, 650)
    }
  }
  function erase() { if (state.phase === 'encounter') state.typing = backspace(state.typing, state.prompts[state.index]!) }
  function pause() {
    if (state.phase !== 'encounter' && state.phase !== 'transition') return
    stopClock(); clearTimeout(timer); generation++; state.previous = state.phase; state.phase = 'paused'; savePractice()
  }
  function resume() {
    if (state.phase !== 'paused') return
    if (state.previous === 'transition') { if (state.index === 9) { finish(true); return }; state.index++; state.typing = emptyTyping() }
    state.phase = 'encounter'; beginClock()
  }
  function hatch() { if (state.phase !== 'egg') return; state.phase = 'hatching'; later(() => { state.phase = 'hatched' }, 1600) }
  function home() {
    if (!['hatched', 'retreat', 'idle'].includes(state.phase)) return
    if (state.phase === 'hatched') { const save = clone(getSave()); save.pending = null; persist(save) }
    clearTimeout(timer); generation++; state.phase = 'idle'
  }
  function restore() { const pending = getSave().pending; if (pending) { state.reward = pending.creatureId; state.result = clone(pending.result); state.world = pending.result.world; state.phase = 'egg' } }
  function checkpoint() { if (state.phase === 'encounter') { stopClock(); savePractice(); beginClock() } }
  function dispose() { stopClock(); clearTimeout(timer); generation++; if (['encounter', 'transition', 'paused'].includes(state.phase)) savePractice() }
  return { state, start, character, erase, pause, resume, hatch, home, restore, snapshot, checkpoint, dispose }
}
