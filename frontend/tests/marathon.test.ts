import { beforeEach, describe, expect, it } from 'vitest'
import { api } from '../src/api'
import { loadGuestMarathon, saveGuestMarathon, shuffleAvoiding } from '../src/infinite/marathon'

beforeEach(() => localStorage.clear())

describe('marathon shuffle', () => {
  it('plays every game once per shuffle', () => {
    expect([...shuffleAvoiding(14)].sort((a, b) => a - b)).toEqual(Array.from({ length: 14 }, (_, i) => i))
  })

  it('never opens with the game that closed the previous shuffle', () => {
    for (let i = 0; i < 200; i++) expect(shuffleAvoiding(5, 3)[0]).not.toBe(3)
    // forced: random always picks the last slot to stay put, so the previous game opens and gets swapped
    const order = shuffleAvoiding(3, 0, () => 0.99)
    expect(order[0]).not.toBe(0)
    expect([...order].sort()).toEqual([0, 1, 2])
  })

  it('a single game can only repeat', () => {
    expect(shuffleAvoiding(1, 0)).toEqual([0])
  })
})

describe('marathon record', () => {
  it('the guest keeps it on the device', () => {
    expect(loadGuestMarathon()).toBe(0)
    saveGuestMarathon(6)
    expect(loadGuestMarathon()).toBe(6)
  })

  it('a user keeps the best on the account and on the board', async () => {
    await api.createUser('Ana')
    await api.saveMarathonRecord('Ana', 7)
    expect((await api.saveMarathonRecord('Ana', 3)).marathonHighScore).toBe(7)
    expect((await api.getScoreboard('marathon')).map((e) => [e.name, e.marathonHighScore])).toEqual([['Ana', 7]])
  })
})
