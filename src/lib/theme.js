import { useLayoutEffect, useState } from 'react'

const KEY = 'cl_theme_v1'

export function getInitialTheme() {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

export function applyTheme(theme) {
  const root = document.documentElement
  const isDark = theme === 'dark'
  root.classList.toggle('dark', isDark)
  root.dataset.theme = theme
  root.style.colorScheme = isDark ? 'dark' : 'light'
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', isDark ? '#0b0b0d' : '#f5f5f7')
  // eslint-disable-next-line no-console
  console.log('[theme] applied:', theme, 'html class:', root.className || '(none)')
}

export function useTheme() {
  const [theme, setTheme] = useState(() => getInitialTheme())
  useLayoutEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(KEY, theme) } catch {}
  }, [theme])
  const toggle = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  return { theme, setTheme, toggle }
}
