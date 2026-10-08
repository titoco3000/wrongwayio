import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../src/api'
import { applyRun, clearGuestRecords, driveGear, emptyByGear, formatClock, loadGuestRecords, normalizeRecords, saveGuestRecords } from '../src/infinite/infiniteDrive'

beforeEach(() => localStorage.clear())

const run = (score: number, ms: number, byGear: Partial<ReturnType<typeof emptyByGear>> = {}) => ({ score, ms, byGear: { ...emptyByGear(), ...byGear } })
const none = normalizeRecords(null)

describe('infinite driving records', () => {
  it('first points are records in the gears they were made in', () => {
    expect(applyRun(none, run(5, 20000, { '1': 2, '5': 3 })).broken).toEqual([
      { kind: 'gear', gear: '1' },
      { kind: 'gear', gear: '5' },
      { kind: 'score' },
      { kind: 'time' },
    ])
  })

  it('keeps every record separately and only reports the ones beaten', () => {
    const first = applyRun(none, run(5, 20000, { '1': 2, '5': 3 })).records
    const second = applyRun(first, run(4, 30000, { '1': 3, '5': 1 }))
    expect(second.broken).toEqual([{ kind: 'gear', gear: '1' }, { kind: 'time' }])
    expect(second.records).toEqual(run(5, 30000, { '1': 3, '5': 3 }))
  })

  it('a run with no points beats nothing', () => {
    expect(applyRun(none, run(0, 9000)).broken).toEqual([])
  })

  it('a logged in user keeps the records on their account', async () => {
    const user = await api.createUser('Ana')
    expect(user.infiniteRecords ?? null).toBeNull()
    const { records } = applyRun(normalizeRecords(user.infiniteRecords), run(3, 5000, { '2': 3 }))
    await api.saveInfiniteRecords('Ana', records)
    expect((await api.getUser('ana'))?.infiniteRecords).toEqual(records)
  })

  it('the guest keeps theirs in local storage', () => {
    expect(loadGuestRecords()).toBeNull()
    saveGuestRecords(run(3, 5000, { '2': 3 }))
    expect(loadGuestRecords()?.score).toBe(3)
    clearGuestRecords()
    expect(loadGuestRecords()).toBeNull()
  })

  it('counts reverse as first gear and formats the clock', () => {
    expect(driveGear('R')).toBe('R')
    expect(driveGear('N')).toBe('1')
    expect(driveGear('4')).toBe('4')
    expect(formatClock(83000)).toBe('1:23')
  })
})
