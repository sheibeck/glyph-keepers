<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { worlds } from './data/curriculum'
import { creatures, rarities } from './data/creatures'
import { accuracy, speed, speedLabel } from './game/metrics'
import { baseOdds, rewardOdds } from './game/rewards'
import { loadSave, parseSave, writeSave, type Save } from './game/persistence'
import { createExpedition } from './game/expedition'
import PixelCreature from './components/PixelCreature.vue'
import PixelEgg from './components/PixelEgg.vue'
import TypingPrompt from './components/TypingPrompt.vue'
import OddsPanel from './components/OddsPanel.vue'
import CollectionBook from './components/CollectionBook.vue'
import ParentStats from './components/ParentStats.vue'

const loaded = loadSave()
const save = ref(loaded.save)
const warning = ref(loaded.warning)
const notice = ref('')
const storageFailed = ref(false)
const page = ref<'adventure' | 'collection' | 'journal'>('adventure')
const selectedWorld = ref(0)
const tick = ref(0)
const resumeButton = ref<HTMLButtonElement>()
const resultHeading = ref<HTMLHeadingElement>()
function persist(next: Save) {
  try { writeSave(next); storageFailed.value = false }
  catch { storageFailed.value = true; warning.value = 'This browser cannot save right now. Keep this tab open and export your save from the journal.' }
  save.value = next
}
const game = createExpedition(() => save.value, persist)
game.restore()
const state = game.state
const active = computed(() => state.phase !== 'idle')
watch(() => state.phase, async phase => {
  await nextTick()
  if (phase === 'paused') resumeButton.value?.focus()
  if (['egg', 'hatched', 'retreat'].includes(phase)) resultHeading.value?.focus()
})
const world = computed(() => worlds[active.value ? state.world : selectedWorld.value]!)
const companion = computed(() => creatures.find(creature => creature.id === save.value.companion))
const reward = computed(() => creatures.find(creature => creature.id === state.reward))
const currentMetrics = computed(() => { void tick.value; return game.snapshot() })
const odds = computed(() => state.result?.odds ?? rewardOdds(state.world, currentMetrics.value))
const enemies = ['Moss Muncher', 'Berry Bandit', 'Puddle Sprite', 'Toast Troll', 'Drowsy Imp']
const enemy = computed(() => {
  const prompt = state.prompts[state.index] ?? ''
  return [...prompt].reduce((total, character) => total + character.charCodeAt(0), 0) % enemies.length
})
const caught = computed(() => Object.keys(save.value.collection).length)
let ticker: ReturnType<typeof setInterval>
function update(mutator: (next: Save) => void) { const next = JSON.parse(JSON.stringify(save.value)) as Save; mutator(next); persist(next) }
function setCompanion(id: string) { if (save.value.collection[id]) update(next => { next.companion = id }) }
function start() { notice.value = ''; game.start(selectedWorld.value); if (document.hidden) game.pause() }
function navigation(destination: typeof page.value) { if (active.value) return; page.value = destination }
function home(collection = false) { game.home(); page.value = collection ? 'collection' : 'adventure' }
function exportSave() {
  const url = URL.createObjectURL(new Blob([JSON.stringify(save.value, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a'); link.href = url; link.download = 'glyph-keepers-save.json'; link.click(); URL.revokeObjectURL(url)
}
async function importSave(file: File) {
  try {
    if (file.size > 2_000_000) throw new Error('Please choose a save smaller than 2 MB.')
    const incoming = parseSave(await file.text())
    if (!window.confirm('Replace this local profile with the imported save? Export a backup first if you want to keep your current collection.')) return
    persist(incoming); warning.value = storageFailed.value ? warning.value : ''; notice.value = 'Save imported successfully.'; game.restore(); if (state.phase !== 'idle') page.value = 'adventure'
  } catch (error) { warning.value = error instanceof Error ? error.message : 'Unable to import this save.' }
}
function visibility() { if (document.hidden) game.pause() }
function windowBlur() { game.pause() }
function pageHide() { game.checkpoint() }
onMounted(() => { ticker = setInterval(() => { tick.value++; if (tick.value % 20 === 0) game.checkpoint() }, 250); document.addEventListener('visibilitychange', visibility); window.addEventListener('blur', windowBlur); window.addEventListener('pagehide', pageHide) })
onUnmounted(() => { clearInterval(ticker); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('blur', windowBlur); window.removeEventListener('pagehide', pageHide); game.dispose() })
</script>

<template>
  <div class="app-shell" :class="{ 'reduce-motion': save.settings.reducedMotion }">
    <header class="site-header"><button class="brand" aria-label="Glyph Keepers home" :disabled="active" @click="navigation('adventure')"><PixelEgg small /><span>GLYPH <b>KEEPERS</b><small>A little practice. A lot of magic.</small></span></button>
      <nav aria-label="Main navigation"><button :class="{ selected: page === 'adventure' }" :disabled="active" @click="navigation('adventure')"><span>⚔</span> Adventure</button><button :class="{ selected: page === 'collection' }" :disabled="active" @click="navigation('collection')"><span>▦</span> Collection <i>{{ caught }}</i></button><button :class="{ selected: page === 'journal' }" :disabled="active" @click="navigation('journal')"><span>▤</span> Parent journal</button></nav>
      <div class="profile"><span class="profile-icon">✦</span><div>{{ save.name }}<small>Egg Keeper · {{ save.totals.wins }} expeditions</small></div></div>
    </header>
    <main>
      <div v-if="warning" class="notice warning" role="alert">{{ warning }}<button v-if="storageFailed" class="button" @click="exportSave">Export backup</button><button aria-label="Dismiss warning" @click="warning = ''">×</button></div><div v-if="notice" class="notice" role="status">{{ notice }}</div>
      <template v-if="page === 'adventure'">
        <template v-if="!active">
          <div class="home-heading"><div><div class="eyebrow"><span class="little-star">✦</span> Your next chapter awaits</div><h1>Small spells.<br><em>Extraordinary friends.</em></h1><p>Enter a world of curious creatures and hidden eggs.<br>All it takes is a little typing magic.</p></div><div class="hero-art"><span class="orbit orbit-one">✦</span><span class="orbit orbit-two">✧</span><PixelEgg /><PixelCreature :creature="creatures[0]" /><div class="hero-art-caption">A new friend is just ten spells away.</div></div></div>
          <div class="adventure-layout"><section><div class="section-heading"><h2>Choose your world</h2><span>All worlds open · Go at your own pace</span></div><div class="world-grid"><button v-for="item in worlds" :key="item.id" class="world-card" :class="{ selected: selectedWorld === item.id }" :style="{ '--world-color': item.color }" :aria-pressed="selectedWorld === item.id" @click="selectedWorld = item.id"><div class="world-landscape" :class="`landscape-${item.id}`"><span class="landscape-sun"></span><span class="landscape-mountain"></span><span class="landscape-tree tree-one"></span><span class="landscape-tree tree-two"></span><span class="world-number">0{{ item.id + 1 }}</span><span class="world-symbol">{{ item.icon }}</span><span v-if="selectedWorld === item.id" class="selected-check">✓</span></div><div class="world-card-copy"><h3>{{ item.name }}</h3><span>{{ item.subtitle }}</span><b>→</b></div></button></div></section>
            <aside class="expedition-card"><div class="eyebrow">Your expedition</div><h2>{{ world.name }}</h2><p>Ten little challenges.<br>One egg full of possibility.</p><div class="expedition-facts"><span><b class="hearts-text">♥ ♥ ♥ ♥ ♥</b>5 hearts</span><span><b>⚔</b>10 encounters</span><span><b>◇</b>1 mystery egg</span></div><button class="button primary start-button" @click="start">Begin expedition <span>→</span></button><div class="gentle-note"><span>✧</span><p>Accuracy is your strongest magic.<br><b>There’s no timer. Take your time.</b></p></div><details class="base-odds"><summary>View base egg odds</summary><OddsPanel :odds="baseOdds[selectedWorld]!" title="Starting rarity chances" /></details></aside></div>
          <section class="companion-strip"><div class="companion-image"><PixelCreature v-if="companion" :creature="companion" /><PixelEgg v-else small /></div><div><div class="eyebrow">By your side</div><h3>{{ companion ? `${companion.name}, your trusty companion` : 'Your first companion is waiting' }}</h3><p>{{ companion ? 'Here for the adventure. And the snacks. Companions are purely cosmetic.' : 'Hatch an egg, then choose a friend from your collection.' }}</p></div><button class="text-button" @click="navigation('collection')">Open field guide →</button></section>
        </template>
        <template v-else-if="['encounter', 'transition', 'paused'].includes(state.phase)">
          <div class="expedition-heading"><div><div class="eyebrow">Expedition · {{ world.name }}</div><h1>The egg awaits.</h1></div><div class="combat-controls"><div class="hearts" aria-label="Hearts remaining" role="status"><span v-for="heart in 5" :key="heart" :class="{ lost: heart > state.hearts }" aria-hidden="true">♥</span><span class="sr-only">{{ state.hearts }} of 5 hearts</span></div><button class="button" :disabled="state.phase === 'paused'" @click="game.pause">Ⅱ Pause</button></div></div>
          <div class="combat-layout"><section class="combat-main"><div class="battlefield" :class="{ defeated: state.phase === 'transition' }" :style="{ '--world-color': world.color }"><div class="battle-stars">✧<span>✦</span>·</div><div class="battle-hill back-hill"></div><div class="battle-hill front-hill"></div><div class="battle-tree left-tree"></div><div class="battle-tree right-tree"></div><div class="enemy-title"><span class="section-label">Friendly guardian {{ state.index + 1 }}</span><h2>{{ enemies[enemy] }}</h2><span class="enemy-mood">{{ state.phase === 'transition' ? 'A lovely spell! The path is clear.' : '“A little spell, and I’ll let you pass!”' }}</span></div><div class="enemy-art"><PixelCreature :enemy="enemy" /></div><div v-if="companion" class="battle-companion"><PixelCreature :creature="companion" /><span>{{ companion.name }}</span></div><div class="battle-ground"></div><span class="battle-flower flower-one">✿</span><span class="battle-flower flower-two">✿</span><div class="progress-track" aria-label="Encounter progress"><span v-for="step in 10" :key="step" :class="{ complete: step <= state.index + Number(state.phase === 'transition'), current: step === state.index + 1 }"></span><b>{{ state.index + 1 }} / 10</b></div></div>
              <TypingPrompt :target="state.prompts[state.index]!" :input="state.typing.input" :error="state.typing.error" :active="state.phase === 'encounter'" :keyboard="save.settings.keyboard" @character="game.character" @erase="game.erase" @pause="game.pause" />
              <div v-if="state.phase === 'paused'" class="pause-overlay" role="dialog" aria-modal="true" aria-labelledby="pause-title" @keydown.tab.prevent="resumeButton?.focus()" @keydown.esc.prevent="game.resume"><div class="pause-card"><span class="pause-symbol">☾</span><div class="eyebrow">A moment of quiet</div><h2 id="pause-title">Your adventure can wait.</h2><p>The clock is paused. Your hearts are safe.<br>Return whenever you’re ready.</p><button ref="resumeButton" class="button primary" @click="game.resume">Continue adventure →</button></div></div>
            </section><aside class="combat-sidebar"><div class="panel run-stats"><div class="section-label">Your magic so far</div><div><strong>{{ (accuracy(currentMetrics) * 100).toFixed(1) }}<small>%</small></strong><span>Accuracy</span></div><div class="rhythm"><span>✧</span>{{ speedLabel(speed(currentMetrics, state.world === 0), world.speedTarget) }}</div><p>Careful spells keep your hearts safe. Speed is just a little extra sparkle.</p></div><OddsPanel :odds="odds" title="Live egg odds" /><p class="fine-print sidebar-note">These become your final odds after encounter 10. Flawless spells get a special bonus.</p></aside></div>
        </template>
        <section v-else class="results-view">
          <div class="eyebrow">{{ state.phase === 'retreat' ? 'Every spell is practice' : 'Expedition complete' }}</div><h1 ref="resultHeading" tabindex="-1">{{ state.phase === 'retreat' ? 'Rest, regroup, return.' : state.phase === 'hatched' ? 'A friendship has hatched.' : 'Something wonderful is inside.' }}</h1><p>{{ state.phase === 'retreat' ? 'Your practice counts, even without an egg. A fresh adventure is ready when you are.' : 'Ten guardians, ten spells, and one new story to share.' }}</p>
          <div v-if="state.phase !== 'retreat'" class="hatch-stage" :class="{ hatching: state.phase === 'hatching', revealed: state.phase === 'hatched' }"><div class="hatch-glow"></div><span class="hatch-star star-a">✦</span><span class="hatch-star star-b">✦</span><span class="hatch-star star-c">✧</span><PixelCreature v-if="state.phase === 'hatched'" :creature="reward" /><PixelEgg v-else :color="reward?.color" :cracking="state.phase === 'hatching'" /></div>
          <span v-if="reward && ['egg', 'hatching'].includes(state.phase)" class="rarity-label" :class="`text-rarity-${rarities.indexOf(reward.rarity)}`">{{ reward.rarity }} egg</span>
          <div v-if="state.phase === 'retreat'" class="retreat-art"><PixelCreature :enemy="4" /></div>
          <div v-if="state.phase === 'hatched' && reward" class="reward-name"><span class="rarity-label" :class="`text-rarity-${rarities.indexOf(reward.rarity)}`">{{ reward.rarity }}</span><h2>{{ reward.name }}</h2><p>{{ reward.description }}</p><span class="count-pill">{{ save.collection[reward.id] === 1 ? '✦ New discovery' : `♥ Friendship grew to ${save.collection[reward.id]}` }}</span></div>
          <div class="result-metrics" v-if="state.result"><div><strong>{{ (accuracy(state.result) * 100).toFixed(1) }}%</strong><span>Accuracy {{ accuracy(state.result) === 1 ? '· Flawless!' : '' }}</span></div><div><strong>{{ speedLabel(speed(state.result, state.world === 0), world.speedTarget) }}</strong><span>Your rhythm</span></div><div><strong>{{ state.result.completed }}</strong><span>Characters completed</span></div></div>
          <div class="button-row result-actions"><button v-if="state.phase === 'egg'" class="button primary" @click="game.hatch">Hatch your egg ✦</button><span v-if="state.phase === 'hatching'" role="status">A tiny friend is waking up…</span><template v-if="state.phase === 'hatched'"><button class="button primary" @click="home(true)">Meet your collection →</button><button class="button" @click="home()">Back to the meadow</button></template><template v-if="state.phase === 'retreat'"><button class="button primary" @click="game.start(state.world)">Try a fresh expedition →</button><button class="button" @click="home()">Choose a world</button></template></div>
          <p v-if="state.phase === 'egg'" class="fine-print">{{ storageFailed ? 'Your friend is in memory only. Export a backup before closing this tab.' : 'Your friend is already saved. Refreshing will bring you back to this egg.' }}</p><details v-if="state.result && state.phase !== 'retreat'" class="final-odds"><summary>View this expedition’s final egg odds</summary><OddsPanel :odds="state.result.odds" /></details>
        </section>
      </template>
      <CollectionBook v-else-if="page === 'collection'" :collection="save.collection" :companion="save.companion" @companion="setCompanion" />
      <ParentStats v-else :save="save" @export="exportSave" @import="importSave" @settings="settings => update(next => { next.settings = settings })" @rename="name => update(next => { next.name = name })" />
    </main>
    <footer><span>✧ Made for little moments of progress.</span><span>Local play · No ads · No rush</span></footer>
  </div>
</template>
