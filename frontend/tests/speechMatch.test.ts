import { describe, expect, it } from 'vitest'
import { matchDirection } from '../src/components/games/components/inputs/speechMatch'
import { audioLevel } from '../src/native/speech'

const en = { left: ['left'], right: ['right'] }
const es = { left: ['izquierda'], right: ['derecha'] }

describe('matchDirection', () => {
  it('finds the direction word', () => {
    expect(matchDirection('left', en)).toBe('left')
    expect(matchDirection('Right!', en)).toBe('right')
    expect(matchDirection('derecha', es)).toBe('right')
  })

  it('ignores accents and case', () => {
    expect(matchDirection('IZQUIERDA', es)).toBe('left')
    expect(matchDirection('esquerda', { left: ['Esquerda'], right: ['direita'] })).toBe('left')
  })

  it('matches whole words only', () => {
    expect(matchDirection('copyright', en)).toBeNull()
    expect(matchDirection('leftover', en)).toBeNull()
  })

  it('takes the last direction said', () => {
    expect(matchDirection('left no right', en)).toBe('right')
    expect(matchDirection('right left', en)).toBe('left')
  })

  it('accepts the alternative words of a direction', () => {
    const aliased = { left: ['left', 'lift'], right: ['right', 'write'] }
    expect(matchDirection('lift', aliased)).toBe('left')
    expect(matchDirection('write', aliased)).toBe('right')
    expect(matchDirection('lift', en)).toBeNull()
  })

  it('is null without a direction word', () => {
    expect(matchDirection('', en)).toBeNull()
    expect(matchDirection('hello there', en)).toBeNull()
  })
})

describe('audioLevel', () => {
  it('is 0 for silence and grows with loudness', () => {
    expect(audioLevel(new Float32Array(1024))).toBe(0)
    const at = (amplitude: number) => audioLevel(new Float32Array(1024).fill(amplitude))
    expect(at(0.01)).toBeLessThan(at(0.1))
    expect(at(0.1)).toBeLessThan(at(0.5))
    expect(at(1)).toBe(1)
  })
})
