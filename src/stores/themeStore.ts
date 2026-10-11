import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import type { ThemeMode } from '../domain/types'
import { updateSettings } from '../db/repositories'

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('system')

  const resolved = computed<'light' | 'dark'>(() => {
    if (mode.value === 'system') return systemPrefersDark() ? 'dark' : 'light'
    return mode.value
  })

  function applyDom() {
    document.documentElement.dataset.theme = resolved.value
    document.documentElement.style.colorScheme = resolved.value
  }

  async function setMode(next: ThemeMode, persist = true) {
    mode.value = next
    applyDom()
    if (persist) {
      await updateSettings({ theme: next })
    }
  }

  function initFromSettings(theme: ThemeMode) {
    mode.value = theme
    applyDom()
  }

  watch(resolved, () => applyDom())

  if (typeof window !== 'undefined') {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') applyDom()
    })
  }

  return { mode, resolved, setMode, initFromSettings, applyDom }
})
