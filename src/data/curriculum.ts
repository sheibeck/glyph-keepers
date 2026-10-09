export interface World { id: number; name: string; subtitle: string; icon: string; color: string; prompts: string[]; speedTarget: number }
const words = (value: string) => value.split(' ')
export const worlds: World[] = [
  { id: 0, name: 'Key Meadow', subtitle: 'Keys & home row', icon: '✿', color: '#b9d588', speedTarget: 100, prompts: [...words('a s d f j k l ;'), ...words('aa ss dd ff jj kk ll as ad af sa sd sf da ds df fa fs fd ja js jd jf ka ks kd kf la ls ld lf aj ak al sj sk sl dj dk dl fj fk fl jk jl kj kl lj lk'), 'a s', 'd f', 'j k', 'l ;', 'asdf', 'jkl;', 'fj', 'dk', 'sl', 'a;'] },
  { id: 1, name: 'Tiny Woods', subtitle: 'Little words · 2–4 letters', icon: '♣', color: '#89c9a4', speedTarget: 25, prompts: words('at in on up go to we us be is it if ox by my he me no so do an as of cat dog fox owl bee ant bat cow cub pup hen egg sun sky sea mud dew fog oak elm ash fir bud pet hop run dig sip nap hug joy gem map cup hat bag kite nest leaf moss frog pond star moon bird fish rain wind warm soft glow tiny blue gold pink red calm kind wish play seed root rock path fern duck bear boat home snow song wing twig') },
  { id: 2, name: 'Goblin Grove', subtitle: 'Everyday words · 4–6 letters', icon: '❧', color: '#a9b977', speedTarget: 30, prompts: words('apple basket bridge bright candle castle cherry cloud cotton dragon dream feather flower forest friend gentle garden golden grape green happy hidden honey island keeper kitten lantern little magic meadow mellow monkey morning nature orange pebble pencil planet pocket purple puzzle rabbit rainbow rescue ribbon river rocket secret shadow silver sleepy smooth sparkle spring stone summer sunny sweet turtle velvet violet water willow window winter wonder yellow acorn blanket branch breeze clover cookie crystal') },
  { id: 3, name: 'Crystal Caverns', subtitle: 'Longer words', icon: '◆', color: '#b8a4df', speedTarget: 35, prompts: words('adventure beautiful blueberry butterfly celebrate chocolate cinnamon collection colorful comfortable companion confidence curious delightful discovery dragonfly enchanted evergreen excellent fantastic fireflies friendship glittering gratitude happiness imagination incredible jellyfish kindness lavender moonlight mountain mushroom mysterious peaceful peppermint pineapple practice precious quietly raspberry remarkable sapphire shimmering snowflake starlight strawberry sunshine treasure turquoise underwater wonderful woodland yesterday together waterfall wilderness patient explorer crystal lanterns learning rainbow courage graceful carefully') },
  { id: 4, name: 'Wizard’s Library', subtitle: 'Short lowercase phrases', icon: '▤', color: '#ddb77c', speedTarget: 40, prompts: ['a little bit of magic', 'follow the glowing path', 'keep your dragon cozy', 'the moon is made of stories', 'slow and steady wins', 'a basket full of stars', 'small steps make progress', 'a friend in the forest', 'listen to the quiet rain', 'every egg holds a surprise', 'the owl reads at midnight', 'turn the page softly', 'be kind to little creatures', 'a spell for sunny days', 'the secret under the willow', 'a tiny spark of courage', 'practice makes new paths', 'the meadow smells like spring', 'find the silver feather', 'a warm cup of cocoa', 'the fox carries a lantern', 'a castle above the clouds', 'dream of distant islands', 'the turtle takes its time', 'gather gems by the river', 'the library is full of wonder', 'plant a seed of kindness', 'a soft breeze in the trees', 'bring a blanket for the dragon', 'the stars light our way', 'we learn a little each day', 'a pocket full of pebbles'] },
  { id: 5, name: 'Dragon Peaks', subtitle: 'Capitals & punctuation', icon: '▲', color: '#df9a83', speedTarget: 45, prompts: ['The dragon smiled and offered us tea.', 'Look! A tiny egg is glowing.', 'Slow down, take a breath, and try again.', 'Can you hear the owls in the trees?', 'My favorite treasure is a good book.', 'We climbed the hill before sunset.', 'Hello, little keeper! Welcome home.', 'A brave heart comes in every size.', 'The clouds look like sleeping dragons.', 'Practice today; discover more tomorrow.', 'Is that a crystal under the bridge?', 'The fox said, "Follow my lantern!"', 'Our adventure starts with a single step.', 'Kindness is a powerful kind of magic.', 'Every mistake is a chance to learn.', 'Wait! The egg is starting to hatch.', 'The moon rose over the quiet valley.', 'I packed apples, bread, and a map.', 'Keep going. You are making progress!', 'Who left these sparkly footprints?', 'A gentle breeze carried the song home.', 'The library opens at nine each morning.', 'We found three gems and one tiny feather.', 'You can be careful and courageous.', 'The mountain path leads to a garden.', 'Take your time; the stars can wait.', 'Today, our little dragon learned to fly.', 'Would you like a cup of cinnamon tea?', 'The keeper whispered, "You are safe."', 'What a wonderful day for an adventure!'] },
]

export function choosePrompts(world: World, keys: Record<string, { attempts: number; errors: number }>, random = Math.random, meadowWins = 2): string[] {
  const available = [...new Set(world.prompts)].filter(prompt => {
    if (world.id === 0) return meadowWins === 0 ? prompt.length === 1 : meadowWins === 1 ? prompt.length <= 2 : true
    if (world.id === 2) return prompt.length >= 4 && prompt.length <= 6
    return true
  })
  const pool = [...available]
  return Array.from({ length: 10 }, () => {
    if (!pool.length) pool.push(...available)
    const weights = pool.map(prompt => {
      const letters = [...new Set(prompt)]
      return 1 + 0.6 * letters.reduce((sum, key) => {
        const stat = keys[key]
        return sum + (stat ? stat.errors / (stat.attempts + 5) : 0)
      }, 0) / letters.length
    })
    let draw = random() * weights.reduce((sum, weight) => sum + weight, 0)
    const index = weights.findIndex(weight => (draw -= weight) < 0)
    return pool.splice(index < 0 ? pool.length - 1 : index, 1)[0]!
  })
}
