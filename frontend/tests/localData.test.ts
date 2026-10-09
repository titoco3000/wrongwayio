import { beforeEach, describe, expect, it } from 'vitest'
import { adoptGuestData, loadDailyResult, loadStreak, pendingDailySync, saveDailyResult, todayKey } from '../src/daily/dailyChallenge'
import { clearGuestRecords, loadGuestRecords, recordsFromScores, saveGuestRecords } from '../src/infinite/infiniteDrive'
import { loadLocalData } from '../src/localData'

beforeEach(() => localStorage.clear())

describe('local data', () => {
  it('is stored with the fields the server keeps on a user', () => {
    saveDailyResult(null, 'done')
    saveGuestRecords(recordsFromScores([0, 3, 0, 0, 0, 0]))
    expect(loadLocalData(null)).toEqual({ currentStreakStart: todayKey(), lastStreakCheckin: todayKey(), largestStreak: 1, drivingHighScores: [0, 3, 0, 0, 0, 0] })
  })

  it('the first daily result of a day counts, a loss ends the streak', () => {
    expect(saveDailyResult(null, 'done')).toBe(1)
    expect(saveDailyResult(null, 'failed')).toBe(1)
    expect(loadDailyResult(null)).toBe('done')
    saveDailyResult('Ana', 'failed')
    expect(loadDailyResult('Ana')).toBe('failed')
    expect(loadStreak('Ana')).toBe(0)
    expect(pendingDailySync('Ana')).toEqual([{ date: todayKey(), result: 'failed' }])
  })

  it('a new user takes over the guest streak but the guest scores stay for the records sync', () => {
    saveDailyResult(null, 'done')
    saveGuestRecords(recordsFromScores([2, 0, 0, 0, 0, 0]))
    adoptGuestData('Ana')
    expect(loadStreak('Ana')).toBe(1)
    expect(loadStreak(null)).toBe(0)
    expect(loadGuestRecords()?.score).toBe(2)
    clearGuestRecords()
    expect(loadGuestRecords()).toBeNull()
  })
})
