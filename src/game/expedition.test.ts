import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createExpedition } from './expedition'
import { newSave, parseSave, type Save } from './persistence'

describe('expedition state machine', () => {
  let save: Save
  let clock: number
  let game: ReturnType<typeof createExpedition>
  beforeEach(() => { vi.useFakeTimers(); save = newSave(); clock = 0; game = createExpedition(() => save, next => { save = next }, () => clock) })
  afterEach(() => { game.dispose(); vi.useRealTimers() })
  function completeEncounter() { for (const character of game.state.prompts[game.state.index]!) game.character(character); vi.advanceTimersByTime(650) }
  it('completes a slow ten-encounter run and persists before the hatch ceremony', () => {
    game.start(1)
    for (let encounter = 0; encounter < 10; encounter++) { clock += 600000; completeEncounter() }
    expect(game.state.phase).toBe('egg')
    expect(game.state.hearts).toBe(5)
    expect(save.totals.wins).toBe(1)
    expect(save.progression[1]).toBe(1)
    expect(save.pending?.creatureId).toBe(game.state.reward)
    expect(save.collection[game.state.reward]).toBe(1)
    expect(game.state.metrics.activeMs).toBe(6000000)
    expect(parseSave(JSON.stringify(save))).toEqual(save)
    game.character('x'); game.start(3); game.hatch(); game.hatch()
    vi.advanceTimersByTime(1600)
    expect(game.state.phase).toBe('hatched')
    expect(save.totals.wins).toBe(1)
    game.home(); expect(save.pending).toBe(null)
  })
  it('retreats at zero hearts while recording suppressed errors and no egg', () => {
    game.start(2)
    for (let mistake = 0; mistake < 5; mistake++) { game.character('!'); game.character('!'); game.erase(); game.erase() }
    expect(game.state.phase).toBe('retreat')
    expect(save.totals.attempts).toBe(9)
    expect(save.totals.correct).toBe(0)
    expect(save.totals.expeditions).toBe(1)
    expect(save.totals.wins).toBe(0)
    expect(save.collection).toEqual({})
    expect(save.pending).toBe(null)
  })
  it('excludes transition and pause time and includes ordinary thinking time', () => {
    game.start(1); clock = 10000; game.pause(); clock = 80000; game.resume(); clock = 90000
    expect(game.snapshot().activeMs).toBe(20000)
    for (const character of game.state.prompts[0]!) game.character(character)
    const attempts = game.state.metrics.attempts
    game.character('x'); expect(game.state.metrics.attempts).toBe(attempts)
    clock = 190000; vi.advanceTimersByTime(650); clock = 200000
    expect(game.snapshot().activeMs).toBe(30000)
  })
  it('pauses during the last transition and awards exactly once on resume', () => {
    game.start(0)
    for (let encounter = 0; encounter < 9; encounter++) completeEncounter()
    for (const character of game.state.prompts[9]!) game.character(character)
    game.pause(); vi.advanceTimersByTime(5000)
    expect(save.pending).toBe(null)
    game.resume(); game.resume(); vi.advanceTimersByTime(5000)
    expect(save.totals.wins).toBe(1)
    expect(game.state.phase).toBe('egg')
  })
  it('restores a pending hatch without awarding another creature', () => {
    game.start(1); for (let encounter = 0; encounter < 10; encounter++) completeEncounter()
    const before = JSON.stringify(save)
    const restored = createExpedition(() => save, next => { save = next })
    restored.restore(); restored.hatch(); vi.advanceTimersByTime(1600)
    expect(restored.state.phase).toBe('hatched')
    expect(JSON.stringify(save)).toBe(before)
    restored.home(); expect(save.pending).toBe(null)
    restored.dispose()
  })
  it('keeps checkpoint totals incremental and rerolls a retreat', () => {
    game.start(0); game.character('!'); clock = 1000; game.checkpoint(); clock = 2000; game.checkpoint()
    expect(save.totals.attempts).toBe(1)
    expect(save.totals.activeMs).toBe(2000)
    const previous = game.state.prompts
    game.erase()
    for (let mistake = 0; mistake < 4; mistake++) { game.character('!'); game.erase() }
    game.start(0)
    expect(game.state.prompts).not.toBe(previous)
    expect(game.state.phase).toBe('encounter')
    expect(game.state.hearts).toBe(5)
  })
  it('increases friendship on duplicates without adding another catalog entry', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    game.start(1); for (let encounter = 0; encounter < 10; encounter++) completeEncounter()
    const creatureId = game.state.reward
    game.hatch(); vi.advanceTimersByTime(1600); game.home()
    game.start(1); for (let encounter = 0; encounter < 10; encounter++) completeEncounter()
    expect(save.collection[creatureId]).toBe(2)
    expect(Object.keys(save.collection)).toHaveLength(1)
    vi.restoreAllMocks()
  })
  it.each([0, 1, 2, 3, 4, 5])('completes every curriculum world: %s', world => {
    game.start(world)
    for (let encounter = 0; encounter < 10; encounter++) completeEncounter()
    expect(game.state.phase).toBe('egg')
    expect(save.progression[world]).toBe(1)
    expect(save.totals.correct).toBe(save.totals.attempts)
  })
})
