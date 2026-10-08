import { Fragment, useSyncExternalStore, type ReactNode } from 'react'

/** Flat map of message keys to text. `{name}` marks a value filled in at runtime. */
export type Messages = Record<string, string>
type Params = Record<string, string | number>

/**
 * Every `locales/<code>.json` is a language: drop a file in that folder to add one, no code changes.
 * The code is the file name (`pt`, `pt-BR`), the name shown in the picker is the file's `language.name`.
 */
const catalogs: Record<string, Messages> = Object.fromEntries(
  Object.entries(import.meta.glob<Messages>('./locales/*.json', { eager: true, import: 'default' })).map(([path, messages]) => [
    path.match(/([^/]+)\.json$/)![1].toLowerCase(),
    messages,
  ]),
)

export const FALLBACK_LANGUAGE = 'en'
const STORAGE_KEY = 'language'

export const languages = Object.keys(catalogs)
  .sort()
  .map((code) => ({ code, name: catalogs[code]['language.name'] ?? code }))

/** The supported language for a BCP 47 tag: `pt-BR` finds `pt-br`, else `pt`. */
const match = (tag: string): string | undefined => {
  const lower = tag.toLowerCase()
  if (lower in catalogs) return lower
  const base = lower.split('-')[0]
  return base in catalogs ? base : undefined
}

const read = () => {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const write = (value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // storage unavailable: the choice just isn't remembered
  }
}

/** What the user chose in the settings (a language code), or null to follow the browser. */
let preference: string | null = (() => {
  const saved = read()
  return saved && match(saved) ? match(saved)! : null
})()

/** User's choice first, then the browser's languages in order of preference, then English. */
const resolve = (): string => {
  if (preference) return preference
  const browser = typeof navigator === 'undefined' ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language])
  for (const tag of browser) {
    const found = tag && match(tag)
    if (found) return found
  }
  return FALLBACK_LANGUAGE
}

let active = resolve()
const listeners = new Set<() => void>()

const apply = () => {
  active = resolve()
  if (typeof document !== 'undefined') document.documentElement.lang = active
  listeners.forEach((l) => l())
}
apply()

/** Picks a language, or null to follow the browser again. */
export function setLanguage(code: string | null) {
  preference = code && match(code) ? match(code)! : null
  write(preference)
  apply()
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const lookup = (key: string, count?: number): string => {
  const chain = [catalogs[active], catalogs[active.split('-')[0]], catalogs[FALLBACK_LANGUAGE]]
  const forms = count === undefined ? [key] : [`${key}.${new Intl.PluralRules(active).select(count)}`, `${key}.other`, key]
  for (const messages of chain) {
    for (const form of forms) if (messages?.[form] !== undefined) return messages[form]
  }
  return key
}

/**
 * Text for a key in the active language, falling back to English, then to the key itself.
 * With a `count` param the key's `.one` / `.other` (etc.) form is picked by the language's plural rules.
 */
export function t(key: string, params: Params = {}): string {
  return lookup(key, typeof params.count === 'number' ? params.count : undefined).replace(/\{(\w+)\}/g, (whole, name) =>
    name in params ? String(params[name]) : whole,
  )
}

/** Like `t`, but values can be React nodes, e.g. to style a name inside a sentence. */
export function rich(key: string, params: Record<string, ReactNode>): ReactNode {
  return lookup(key)
    .split(/(\{\w+\})/)
    .map((part, i) => {
      const name = part.match(/^\{(\w+)\}$/)?.[1]
      return <Fragment key={i}>{name && name in params ? params[name] : part}</Fragment>
    })
}

/** Re-renders the component when the language changes. */
export function useI18n() {
  const language = useSyncExternalStore(subscribe, () => active)
  return { t, rich, language, preference, setLanguage, languages }
}
