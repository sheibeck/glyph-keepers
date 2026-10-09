<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { printable } from '../game/typing'
const props = defineProps<{ target: string; input: string; active: boolean; error: boolean; keyboard: boolean }>()
const emit = defineEmits<{ character: [character: string]; erase: []; pause: [] }>()
const surface = ref<HTMLElement>()
const composing = ref(false)
const notice = ref('')
const inputCharacters = computed(() => [...props.input])
const current = computed(() => props.target[inputCharacters.value.length] ?? '')
const shiftedKeys: Record<string, string> = { '!': '1', '@': '2', '#': '3', '$': '4', '%': '5', '^': '6', '&': '7', '*': '8', '(': '9', ')': '0', '_': '-', '+': '=', '{': '[', '}': ']', '|': '\\', ':': ';', '"': "'", '<': ',', '>': '.', '?': '/' }
const guideKey = computed(() => shiftedKeys[current.value] ?? current.value.toLowerCase())
const needsShift = computed(() => !!shiftedKeys[current.value] || current.value !== current.value.toLowerCase())
function focus() { if (props.active) nextTick(() => surface.value?.focus({ preventScroll: true })) }
function keydown(event: KeyboardEvent) {
  if (event.key === 'Escape') { event.preventDefault(); emit('pause'); return }
  if (!props.active || composing.value || event.isComposing || event.keyCode === 229) return
  if (event.repeat) { if (event.key === 'Backspace' || [...event.key].length === 1) event.preventDefault(); return }
  if (event.key === 'Backspace') { event.preventDefault(); emit('erase'); return }
  if (printable(event)) { event.preventDefault(); notice.value = ''; emit('character', event.key) }
}
function blocked() { notice.value = 'Type each character yourself. Paste and drag-and-drop are disabled.' }
watch(() => [props.active, props.target], focus)
onMounted(focus)
</script>
<template>
  <section class="typing-panel" :class="{ 'has-error': error }">
    <div class="section-label">{{ error ? 'A little tangle · Backspace to fix it' : 'Cast your spell · type the glyphs below' }}</div>
    <div ref="surface" class="typing-surface" tabindex="0" role="textbox" aria-label="Typing challenge. Type the displayed prompt. Backspace corrects mistakes. Escape pauses." :aria-readonly="!active" :aria-invalid="error" :aria-description="target" @keydown="keydown" @paste.prevent="blocked" @drop.prevent="blocked" @beforeinput.prevent @compositionstart="composing = true; notice = 'Composition input is disabled. Please use a physical keyboard in English mode.'" @compositionend="composing = false" @blur="active && emit('pause')">
      <div class="prompt-characters" aria-hidden="true"><span v-for="(character, index) in target" :key="index" :class="{ correct: index < inputCharacters.length && inputCharacters[index] === character, wrong: index < inputCharacters.length && inputCharacters[index] !== character, current: index === inputCharacters.length }">{{ character === ' ' ? '\u00a0' : character }}</span><span v-if="inputCharacters.length > target.length" class="wrong">{{ inputCharacters.slice(target.length).join('') }}</span></div>
      <div class="typed-line" aria-hidden="true">{{ input || 'Your spell appears here…' }}<span class="cursor">▏</span></div>
    </div>
    <div class="typing-caption"><span>{{ notice || (active ? 'Click the spell to focus · Backspace to correct · No timer, no rush' : 'Your spellbook is resting') }}</span><kbd>ESC to pause</kbd></div>
    <div v-if="keyboard" class="keyboard-guide" aria-label="Keyboard guide">
      <div v-for="row in ['1234567890-=', 'qwertyuiop[]', 'asdfghjkl;\'', 'zxcvbnm,./']" :key="row" class="key-row"><kbd v-for="key in row" :key="key" :class="{ highlighted: guideKey === key }">{{ key }}</kbd></div>
      <div class="key-row"><kbd class="wide" :class="{ highlighted: needsShift }">shift</kbd><kbd class="space" :class="{ highlighted: current === ' ' }">space</kbd><kbd class="wide">⌫</kbd></div>
    </div>
  </section>
</template>
