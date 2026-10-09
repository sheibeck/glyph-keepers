import { describe, expect, it } from 'vitest'
import { backspace, emptyTyping, printable, typeCharacter } from './typing'

describe('typing validation', () => {
  it('damages once per invalid prefix and re-arms after correction', () => {
    let state = typeCharacter(emptyTyping(), 'cat', 'x')
    expect(state.damage).toBe(true)
    state = typeCharacter(state, 'cat', 'y')
    expect(state.damage).toBe(false)
    expect(state.attempts).toBe(2)
    state = backspace(state, 'cat')
    expect(state.error).toBe(true)
    state = backspace(state, 'cat')
    expect(state.error).toBe(false)
    state = typeCharacter(state, 'cat', 'z')
    expect(state.damage).toBe(true)
    expect(state.attempts).toBe(3)
  })
  it('compares each attempted character even while an earlier error remains', () => {
    let state = typeCharacter(emptyTyping(), 'cat', 'x')
    state = typeCharacter(state, 'cat', 'a')
    state = typeCharacter(state, 'cat', 'z')
    expect(state.correct).toBe(1)
    expect(state.attempts).toBe(3)
    expect(state.error).toBe(true)
    expect(state.damage).toBe(false)
  })
  it('accepts spaces, case and punctuation exactly', () => {
    const target = 'Hi, owl!'
    let state = emptyTyping()
    for (const character of target) state = typeCharacter(state, target, character)
    expect(state.input).toBe(target)
    expect(state.correct).toBe(target.length)
    expect(state.error).toBe(false)
    expect(typeCharacter(emptyTyping(), 'H', 'h').damage).toBe(true)
  })
  it('counts a Unicode printable mistake once and erases the whole character', () => {
    const state = typeCharacter(emptyTyping(), 'cat', '🐉')
    expect(state.attempts).toBe(1)
    expect(state.damage).toBe(true)
    expect(backspace(state, 'cat').input).toBe('')
    expect(printable({ key: '🐉' } as KeyboardEvent)).toBe(true)
  })
  it('ignores shortcuts, repeats, composition, and non-character keys', () => {
    const event = { key: 'a', repeat: false, isComposing: false, ctrlKey: false, metaKey: false, altKey: false } as KeyboardEvent
    expect(printable(event)).toBe(true)
    for (const patch of [{ repeat: true }, { isComposing: true }, { ctrlKey: true }, { metaKey: true }, { altKey: true }, { key: 'Shift' }, { key: 'ArrowLeft' }, { key: 'Backspace' }, { key: 'Enter' }]) expect(printable({ ...event, ...patch } as KeyboardEvent)).toBe(false)
  })
})
