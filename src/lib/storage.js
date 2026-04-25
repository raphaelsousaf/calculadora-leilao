const HISTORY_KEY = 'cl_history_v1'
const SETTINGS_KEY = 'cl_settings_v1'

export const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}
export const saveHistory = (items) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items))
}

export const loadSettings = () => {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') } catch { return {} }
}
export const saveSettings = (s) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
