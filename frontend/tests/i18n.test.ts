import { afterEach, describe, expect, it, vi } from 'vitest'
import en from '../src/i18n/locales/en.json'
import { FALLBACK_LANGUAGE, languages, setLanguage, t } from '../src/i18n'

afterEach(() => {
  setLanguage(null)
  localStorage.clear()
  vi.restoreAllMocks()
})

const browser = (...tags: string[]) => vi.spyOn(navigator, 'languages', 'get').mockReturnValue(tags)

describe('i18n', () => {
  it('finds every file in the locales folder', () => {
    expect(languages.map((l) => l.code)).toEqual(expect.arrayContaining(['en', 'es', 'pt']))
  })

  it('every language has the keys of English', () => {
    const modules = import.meta.glob<Record<string, string>>('../src/i18n/locales/*.json', { eager: true, import: 'default' })
    for (const [path, messages] of Object.entries(modules)) expect(Object.keys(messages).sort(), path).toEqual(Object.keys(en).sort())
  })

  it('follows the browser, matching regional tags', () => {
    browser('fr-FR', 'pt-BR')
    setLanguage(null)
    expect(t('common.continue')).toBe('Continuar')
  })

  it('falls back to English when the browser language is not supported', () => {
    browser('fr-FR')
    setLanguage(null)
    expect(t('common.continue')).toBe(en['common.continue'])
    expect(FALLBACK_LANGUAGE).toBe('en')
  })

  it('prefers the language the user configured', () => {
    browser('pt-BR')
    setLanguage('es')
    expect(t('common.continue')).toBe('Continuar')
    expect(t('common.done')).toBe('Listo')
  })

  it('fills values and picks plural forms', () => {
    setLanguage('en')
    expect(t('time.days', { count: 1 })).toBe('1 day')
    expect(t('time.days', { count: 3 })).toBe('3 days')
    expect(t('account.welcome', { name: 'Ana' })).toBe('Welcome, Ana.')
  })

  it('returns the key when no language has it', () => {
    expect(t('nope.missing')).toBe('nope.missing')
  })
})
