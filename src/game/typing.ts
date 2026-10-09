export interface TypingState { input: string; error: boolean; attempts: number; correct: number; damage: boolean }
export function emptyTyping(): TypingState { return { input: '', error: false, attempts: 0, correct: 0, damage: false } }
export function typeCharacter(state: TypingState, target: string, character: string): TypingState {
  const input = state.input + character
  const valid = target.startsWith(input)
  const correct = character === [...target][[...state.input].length]
  return { input, error: !valid, attempts: state.attempts + 1, correct: state.correct + Number(correct), damage: !valid && !state.error }
}
export function backspace(state: TypingState, target: string): TypingState {
  const input = [...state.input].slice(0, -1).join('')
  return { ...state, input, error: !target.startsWith(input), damage: false }
}
export function printable(event: KeyboardEvent): boolean {
  return [...event.key].length === 1 && !/[\u0000-\u001f\u007f-\u009f]/.test(event.key) && !event.repeat && !event.isComposing && !event.ctrlKey && !event.metaKey && !event.altKey
}
