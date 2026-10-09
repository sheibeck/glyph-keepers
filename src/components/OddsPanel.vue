<script setup lang="ts">
import { rarities } from '../data/creatures'
defineProps<{ odds: number[]; title?: string }>()
const percent = (chance: number) => `${(chance * 100).toFixed(chance < 0.01 ? 3 : 1)}%`
</script>
<template>
  <section class="odds-panel"><h3>{{ title || 'Your egg odds' }}</h3><div v-for="(rarity, index) in rarities" :key="rarity" class="odds-row"><span><i :class="`rarity-${index}`"></i>{{ rarity }}</span><strong>{{ percent(odds[index]!) }}</strong></div><p class="fine-print">One egg per completed expedition. Five equally likely creatures in each tier. Displayed odds are rounded.</p></section>
</template>
