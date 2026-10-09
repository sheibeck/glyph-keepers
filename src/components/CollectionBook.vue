<script setup lang="ts">
import { computed, ref } from 'vue'
import { creatures, rarities } from '../data/creatures'
import PixelCreature from './PixelCreature.vue'
const props = defineProps<{ collection: Record<string, number>; companion: string | null }>()
const emit = defineEmits<{ companion: [id: string] }>()
const filter = ref('All')
const visible = computed(() => creatures.filter(creature => filter.value === 'All' || creature.rarity === filter.value))
</script>
<template>
  <section class="book"><div class="page-title"><div><div class="eyebrow">The best kind of treasure</div><h1>Your field guide</h1><p>Every egg is the beginning of a friendship.</p></div><span class="count-pill">{{ Object.keys(collection).length }} / {{ creatures.length }} discovered</span></div>
    <div class="filters" aria-label="Filter by rarity"><button v-for="rarity in ['All', ...rarities]" :key="rarity" :class="{ selected: filter === rarity }" @click="filter = rarity">{{ rarity }}</button></div>
    <div class="collection-grid"><article v-for="creature in visible" :key="creature.id" class="creature-card" :class="{ undiscovered: !collection[creature.id], chosen: companion === creature.id }">
      <span class="rarity-label" :class="`text-rarity-${rarities.indexOf(creature.rarity)}`">{{ creature.rarity }}</span>
      <div class="creature-portrait"><PixelCreature :creature="creature" :silhouette="!collection[creature.id]" /></div>
      <h3>{{ collection[creature.id] ? creature.name : 'Undiscovered' }}</h3><p>{{ collection[creature.id] ? creature.description : 'An unknown friend is waiting inside an egg.' }}</p>
      <template v-if="collection[creature.id]"><div class="friendship">♥ Friendship {{ collection[creature.id] }} <span>{{ collection[creature.id] === 1 ? 'New friends' : `${collection[creature.id]! - 1} reunions` }}</span></div><button class="button small-button" :class="{ primary: companion === creature.id }" @click="emit('companion', creature.id)">{{ companion === creature.id ? '✓ Your companion' : 'Choose companion' }}</button></template>
      <div v-else class="locked-label">◇ Awaiting discovery</div>
    </article></div>
  </section>
</template>
