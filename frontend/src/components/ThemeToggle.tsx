import { useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {
      // storage unavailable: theme just won't persist
    }
    setDark(next)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-xl hover:bg-gray-soft"
    >
      {dark ? '☀' : '☾'}
    </button>
  )
}
