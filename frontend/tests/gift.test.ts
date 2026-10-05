import { describe, expect, it } from 'vitest'
import { giftFromUrl } from '../src/session/SessionProvider'

describe('giftFromUrl', () => {
  it('reads the sender from a link given as an argument (deep link)', () => {
    expect(giftFromUrl('https://wrongway.io/?premium=gift&from=Anna')).toBe('Anna')
  })
  it('ignores other links', () => {
    expect(giftFromUrl('https://wrongway.io/')).toBeNull()
    expect(giftFromUrl('https://wrongway.io/?premium=other&from=Anna')).toBeNull()
  })
})
