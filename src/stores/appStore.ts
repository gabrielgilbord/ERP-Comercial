import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, CompanyProfile, DemoProduct } from '../domain/types'
import { ensureBootstrap } from '../db/database'
import {
  disableDemoData,
  enableDemoData,
  getCompany,
  getSettings,
  listDemoProducts,
  updateCompany,
  updateSettings,
} from '../db/repositories'

export const useAppStore = defineStore('app', () => {
  const ready = ref(false)
  const settings = ref<AppSettings | null>(null)
  const company = ref<CompanyProfile | null>(null)
  const demoProducts = ref<DemoProduct[]>([])
  const bootError = ref<string | null>(null)

  const needsSetup = computed(() => settings.value !== null && !settings.value.setupCompleted)
  const companyDisplayName = computed(
    () => company.value?.tradeName || company.value?.name || 'Faro',
  )

  async function init() {
    try {
      const boot = await ensureBootstrap()
      settings.value = boot.settings
      company.value = boot.company
      demoProducts.value = await listDemoProducts()
      ready.value = true
    } catch (error) {
      bootError.value = error instanceof Error ? error.message : 'Error al iniciar datos locales'
      ready.value = false
    }
  }

  async function saveCompany(patch: Partial<CompanyProfile>) {
    company.value = await updateCompany(patch)
  }

  async function saveSettings(patch: Partial<AppSettings>) {
    settings.value = await updateSettings(patch)
  }

  async function completeSetup() {
    settings.value = await updateSettings({ setupCompleted: true, setupStep: 4 })
  }

  async function setSetupStep(step: number) {
    settings.value = await updateSettings({ setupStep: step })
  }

  async function toggleDemo(enabled: boolean) {
    if (enabled) {
      demoProducts.value = await enableDemoData()
    } else {
      await disableDemoData()
      demoProducts.value = []
    }
    settings.value = await getSettings()
  }

  async function refresh() {
    settings.value = await getSettings()
    company.value = await getCompany()
    demoProducts.value = await listDemoProducts()
  }

  return {
    ready,
    settings,
    company,
    demoProducts,
    bootError,
    needsSetup,
    companyDisplayName,
    init,
    saveCompany,
    saveSettings,
    completeSetup,
    setSetupStep,
    toggleDemo,
    refresh,
  }
})
