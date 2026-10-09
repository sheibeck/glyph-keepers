import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadSave, newSave, parseSave, writeSave, storageKey } from './persistence'

afterEach(() => vi.unstubAllGlobals())
describe('versioned save storage', () => {
  it('round-trips a local profile and its settings', () => {
    const save = newSave(); save.collection.mossbun = 3; save.companion = 'mossbun'; save.settings.keyboard = false
    expect(parseSave(JSON.stringify(save))).toEqual(save)
    const setItem = vi.fn(); vi.stubGlobal('localStorage', { setItem })
    writeSave(save); expect(setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(save))
  })
  it('recovers from malformed JSON and denied storage without throwing', () => {
    vi.stubGlobal('localStorage', { getItem: () => '{not json' })
    expect(loadSave().save).toEqual(newSave())
    expect(loadSave().warning).toBeTruthy()
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('Denied') } })
    expect(loadSave().warning).toBeTruthy()
  })
  it('rejects unknown versions, impossible counts, bad settings and fake pending rewards', () => {
    for (const patch of [{ version: 2 }, { collection: { mossbun: -1 } }, { collection: { invented: 1 } }, { companion: 'mossbun' }, { settings: {} }, { progression: [0] }, { pending: { creatureId: 'mossbun', result: {} } }, { totals: { ...newSave().totals, correct: 1 } }]) expect(() => parseSave(JSON.stringify({ ...newSave(), ...patch }))).toThrow()
  })
})
