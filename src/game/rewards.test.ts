import { describe, expect, it } from 'vitest'
import { accuracy, emptyMetrics, speed, type Metrics } from './metrics'
import { baseOdds, rewardOdds, rollCreature } from './rewards'
import { creatures, rarities } from '../data/creatures'
import { choosePrompts, worlds } from '../data/curriculum'

const metrics = (precision: number, wpm: number): Metrics => ({ ...emptyMetrics(), attempts: 100, correct: precision * 100, completed: wpm * 5, activeMs: 60000 })
const rareSum = (odds: number[]) => odds.slice(2).reduce((sum, odd) => sum + odd, 0)
describe('metrics and rewards', () => {
  it('uses completed characters and the proper CPM/WPM units', () => {
    const value = { ...metrics(0.9, 20), attempts: 200, correct: 180 }
    expect(speed(value)).toBe(20)
    expect(speed(value, true)).toBe(100)
    expect(accuracy(value)).toBe(0.9)
    expect(speed(emptyMetrics())).toBe(0)
  })
  it('keeps all seven probabilities normalized and bounded', () => {
    for (const world of worlds) {
      expect(baseOdds[world.id]!.reduce((sum, odd) => sum + odd, 0)).toBeCloseTo(1)
      for (const precision of [0, 0.79, 0.8, 0.94, 0.95, 0.99, 1]) for (const wpm of [0, 5, 50, 100000]) {
        const odds = rewardOdds(world.id, metrics(precision, wpm))
        expect(odds).toHaveLength(7)
        expect(odds.reduce((sum, odd) => sum + odd, 0)).toBeCloseTo(1)
        expect(odds.every(odd => odd > 0 && odd < 1)).toBe(true)
      }
    }
  })
  it('blocks speed bonuses below 95% accuracy and favors slow flawless runs', () => {
    for (const world of worlds) {
      expect(rewardOdds(world.id, metrics(0.94, 0))).toEqual(rewardOdds(world.id, metrics(0.94, 10000)))
      expect(rareSum(rewardOdds(world.id, metrics(1, 1)))).toBeGreaterThan(rareSum(rewardOdds(world.id, metrics(0.95, 10000))))
      expect(rareSum(rewardOdds(world.id, metrics(1, 1)))).toBeGreaterThan(rareSum(rewardOdds(world.id, metrics(0.99, 1))))
    }
  })
  it('has five creatures per tier and can roll both ends of the spectrum', () => {
    expect(creatures).toHaveLength(35)
    for (const rarity of rarities) expect(creatures.filter(creature => creature.rarity === rarity)).toHaveLength(5)
    expect(rollCreature(baseOdds[0]!, () => 0).rarity).toBe('Common')
    expect(rollCreature(baseOdds[0]!, () => 0.999999).rarity).toBe('Cosmic')
  })
})
describe('curriculum selection', () => {
  it('selects ten unique prompts whenever the curriculum permits', () => {
    for (const world of worlds) {
      const prompts = choosePrompts(world, {}, () => 0.5)
      expect(prompts).toHaveLength(10)
      expect(new Set(prompts).size).toBe(10)
      expect(prompts.every(prompt => world.prompts.includes(prompt))).toBe(true)
    }
  })
  it('progresses from individual home-row keys to longer patterns', () => {
    const prompts = choosePrompts(worlds[0]!, {}, () => 0, 0)
    expect(prompts.every(prompt => prompt.length === 1)).toBe(true)
    expect(new Set(prompts.slice(0, 8)).size).toBe(8)
    expect(choosePrompts(worlds[0]!, {}, () => 0.99, 1).every(prompt => prompt.length <= 2)).toBe(true)
  })
  it('keeps short and common word worlds within their lengths', () => {
    expect(choosePrompts(worlds[1]!, {}).every(prompt => prompt.length >= 2 && prompt.length <= 4)).toBe(true)
    expect(choosePrompts(worlds[2]!, {}).every(prompt => prompt.length >= 4 && prompt.length <= 6)).toBe(true)
  })
  it('modestly weights struggling keys without leaving the selected world', () => {
    const world = { ...worlds[1]!, prompts: ['aa', 'bb', 'cc', 'dd', 'ee', 'ff', 'gg', 'hh', 'ii', 'jj', 'kk'] }
    const baseline = choosePrompts(world, {}, () => 0.1)[0]
    const adaptive = choosePrompts(world, { a: { attempts: 100, errors: 100 } }, () => 0.1)[0]
    expect(baseline).toBe('bb')
    expect(adaptive).toBe('aa')
  })
})
