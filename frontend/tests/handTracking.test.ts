import { describe, expect, it } from 'vitest'
import { palmSide } from '../src/components/games/components/inputs/handTracking'

describe('palmSide', () => {
  it('is the side of a single open palm', () => {
    expect(palmSide([{ palm: true, x: 0.2 }])).toBe('left')
    expect(palmSide([{ palm: true, x: 0.8 }])).toBe('right')
  })

  it('ignores hands that are not open palms', () => {
    expect(palmSide([{ palm: false, x: 0.2 }, { palm: true, x: 0.9 }])).toBe('right')
    expect(palmSide([{ palm: false, x: 0.2 }])).toBeNull()
  })

  it('is null with no hands or palms on both sides', () => {
    expect(palmSide([])).toBeNull()
    expect(palmSide([{ palm: true, x: 0.1 }, { palm: true, x: 0.9 }])).toBeNull()
  })

  it('accepts two palms on the same side', () => {
    expect(palmSide([{ palm: true, x: 0.1 }, { palm: true, x: 0.3 }])).toBe('left')
  })
})
