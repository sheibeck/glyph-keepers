<script setup lang="ts">
import { computed } from 'vue'
import { rarities, type Creature } from '../data/creatures'
const props = withDefaults(defineProps<{ creature?: Creature; enemy?: number; silhouette?: boolean }>(), { enemy: 0, silhouette: false })
const kind = computed(() => props.creature?.kind ?? props.enemy % 5)
const tier = computed(() => props.creature ? rarities.indexOf(props.creature.rarity) : 0)
const color = computed(() => props.silhouette ? '#314b43' : props.creature?.color ?? ['#b8c685', '#dbb1cf', '#97c7bf', '#e9bb82', '#b6b3dd'][props.enemy % 5])
</script>

<template>
  <svg viewBox="0 0 40 40" class="pixel-creature" shape-rendering="crispEdges" role="img" :aria-label="silhouette ? 'Undiscovered creature' : creature?.name ?? 'Friendly forest guardian'">
    <ellipse cx="20" cy="37" rx="13" ry="2" fill="#10291c" opacity=".15" />
    <g :fill="color">
      <path v-if="kind === 0" d="M9 6h5v11H9zM25 3h5v14h-5zM12 3h3v5h-3z" />
      <path v-if="kind === 1" d="M5 11h4V5h5v12H5zM26 5h5v6h4v6h-9zM31 23h6v7h-4v4h-6v-5h4z" />
      <path v-if="kind === 2" d="M6 14V7h5v4h5v6H6zM24 11h5V7h5v10H24zM7 24H3v6h7zM30 24h7v6h-7z" />
      <path v-if="kind === 3" d="M8 12h5V8h5V5h5v4h5v5h4v16H8zM5 24h5v6H5zM30 23h5v8h-5z" />
      <path v-if="kind === 4" d="M5 12V6h5v3h5v6H5zM25 9h5V6h5v9H25zM3 21h5v10H3zM32 21h5v10h-5z" />
      <path d="M12 13h16v3h5v16h-4v4H11v-4H7V19h5z" />
      <path d="M10 33h7v4h-7zM24 33h7v4h-7z" />
    </g>
    <template v-if="!silhouette">
      <path d="M13 28h14v5H13zM16 25h8v4h-8z" fill="#fff2d9" opacity=".65" />
      <path d="M9 20h3v10H9zM12 16h5v3h-5z" fill="#fff" opacity=".28" />
      <path d="M13 21h4v5h-4zM25 21h4v5h-4z" fill="#263e35" />
      <path d="M14 21h1v2h-1zM26 21h1v2h-1z" fill="#fffdf4" />
      <path d="M19 27h4v2h-4zM20 29h2v1h-2z" fill="#705554" />
      <path d="M10 26h4v2h-4zM28 26h4v2h-4z" fill="#e18e8f" opacity=".65" />
      <path v-if="kind === 0" d="M10 8h2v7h-2zM26 6h2v8h-2z" fill="#e59c9d" />
      <path v-if="kind === 1" d="M33 24h4v4h-4zM8 9h3v5H8zM28 9h3v5h-3z" fill="#fff2d9" />
      <path v-if="kind === 2" d="M7 9h3v4H7zM30 9h3v4h-3z" fill="#e59c9d" />
      <path v-if="kind === 3" d="M17 9h4v4h-4zM21 6h2v3h-2z" fill="#f7e7b0" />
      <path v-if="kind === 4" d="M11 19h8v8h-8zM23 19h8v8h-8z" fill="#fff1d0" opacity=".45" />
      <path v-if="tier >= 2" d="M16 14h3v3h-3zM22 14h3v3h-3z" fill="#fff7c3" />
      <path v-if="tier >= 3" d="M3 15h4v3h3v6H6v-3H3zM33 15h4v6h-3v3h-4v-6h3z" :fill="tier >= 5 ? '#efc4ed' : '#e6cfef'" />
      <path v-if="tier >= 4" d="M16 12V6h3v3h3V6h3v6z" fill="#e9c55f" />
      <path v-if="tier >= 5" d="M2 7h2V5h2v2h2v2H6v2H4V9H2zM33 2h2V0h2v2h2v2h-2v2h-2V4h-2z" fill="#f4d5a0" />
      <path v-if="tier === 6" d="M1 31h3v3h3v3H4v-2H1zM31 9h2v2h-2zM17 1h5v2h-5z" fill="#e4d7ff" />
    </template>
    <text v-else x="20" y="28" text-anchor="middle" fill="#91a399" font-size="12" font-family="monospace">?</text>
  </svg>
</template>
