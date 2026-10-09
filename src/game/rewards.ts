import { creatures, rarities, type Creature } from '../data/creatures'
import { accuracy, speed, type Metrics } from './metrics'
import { worlds } from '../data/curriculum'

export const baseOdds = [
  [0.70, 0.23, 0.055, 0.013, 0.0015, 0.0004, 0.0001], [0.63, 0.27, 0.075, 0.022, 0.002, 0.0008, 0.0002],
  [0.56, 0.29, 0.11, 0.034, 0.004, 0.0015, 0.0005], [0.49, 0.30, 0.15, 0.05, 0.007, 0.0023, 0.0007],
  [0.43, 0.30, 0.19, 0.065, 0.011, 0.003, 0.001], [0.37, 0.30, 0.23, 0.075, 0.018, 0.005, 0.002],
]
export function rewardOdds(worldId: number, metrics: Metrics): number[] {
  const precision = accuracy(metrics)
  const accuracyBonus = Math.max(0, Math.min(1, (precision - 0.8) / 0.2))
  const speedBonus = precision >= 0.95 ? Math.min(1, speed(metrics, worldId === 0) / worlds[worldId]!.speedTarget) : 0
  const performance = 0.75 * accuracyBonus + 0.25 * speedBonus
  const multiplier = 1 + 1.5 * performance + (precision === 1 && metrics.attempts > 0 ? 0.5 : 0)
  const weights = baseOdds[worldId]!.map((base, index) => base * multiplier ** (index / 2))
  const total = weights.reduce((sum, value) => sum + value, 0)
  return weights.map(value => value / total)
}
export function rollCreature(odds: number[], random = Math.random): Creature {
  let draw = random()
  let rarityIndex = odds.findIndex(chance => (draw -= chance) < 0)
  if (rarityIndex < 0) rarityIndex = rarities.length - 1
  const pool = creatures.filter(creature => creature.rarity === rarities[rarityIndex])
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))]!
}
