export const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Cosmic'] as const
export type Rarity = typeof rarities[number]
export interface Creature { id: string; name: string; rarity: Rarity; color: string; kind: number; description: string }
const names = [
  ['Mossbun', 'Pebblepup', 'Clovercat', 'Dewdrop', 'Acornowl'],
  ['Fernfox', 'Honeyhorn', 'Bubblefin', 'Thistletoad', 'Willowisp'],
  ['Moonmoth', 'Crystalcub', 'Starling', 'Mistwhisker', 'Opalotter'],
  ['Aurorafawn', 'Emberwing', 'Velvetdrake', 'Dreamtail', 'Prismapuff'],
  ['Solstice', 'Lunarose', 'Astralynx', 'Everglow', 'Cloudcrown'],
  ['Phoenixpetal', 'Mythweaver', 'Dawnkirin', 'Chronopup', 'Celestifawn'],
  ['Nebulynx', 'Orbitowl', 'Cometkin', 'Galaxolotl', 'Infinitydrake'],
]
const colors = ['#a9c985', '#e4bb77', '#91c6d1', '#c0a2dc', '#f1ce78', '#f1a3b7', '#a8b4ff']
export const creatures: Creature[] = names.flatMap((group, rarity) => group.map((name, kind) => ({
  id: name.toLowerCase(), name, rarity: rarities[rarity]!, color: colors[rarity]!, kind,
  description: ['Collects soft moss for a very comfortable nest.', 'Brings a little sunshine wherever it wanders.', 'Likes quiet stories and sparkling stones.', 'Dreams of adventures above the clouds.', 'A rare little friend with a heart full of starlight.', 'A living legend who still loves belly rubs.', 'Carries a pocket-sized universe of wonder.'][rarity]!,
})))
