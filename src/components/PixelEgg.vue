<script setup lang="ts">
withDefaults(defineProps<{ color?: string; cracking?: boolean; small?: boolean }>(), { color: '#c4d5a2' })
</script>
<template>
  <svg viewBox="0 0 32 40" shape-rendering="crispEdges" class="pixel-egg" :class="{ cracking, small }" role="img" aria-label="A mysterious pixel egg">
    <ellipse cx="16" cy="37" rx="11" ry="2" fill="#142c22" opacity=".15" />
    <path d="M12 3h8v3h4v5h3v6h2v13h-3v4H6v-4H3V17h2v-6h3V6h4z" fill="#3e5945" />
    <path d="M12 5h8v3h3v5h3v6h1v10h-3v3H8v-3H5V19h2v-6h3V8h2z" fill="#fff0ce" />
    <path d="M10 12h5v5h-5zM19 19h6v5h-6zM8 25h5v4H8zM17 7h3v4h-3zM15 29h4v3h-4z" :fill="color" />
    <path d="M10 9h2v3h-2zM7 15h2v6H7z" fill="#fffdf5" />
    <path d="M25 27h2v3h-3v2H8v-2h15v-3z" fill="#d1c09a" />
    <path v-if="cracking" d="M17 5v7h-4v5h6v5h-4v7h3v3" fill="none" stroke="#3e5945" stroke-width="2" />
  </svg>
</template>
