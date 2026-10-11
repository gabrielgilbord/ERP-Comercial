export type ThemeMode = 'light' | 'dark' | 'system'

export interface CompanyProfile {
  id: string
  name: string
  tradeName: string
  taxId: string
  email: string
  phone: string
  address: string
  city: string
  postalCode: string
  country: string
  businessTemplate: BusinessTemplateId | null
  updatedAt: string
}

export type BusinessTemplateId =
  | 'tienda_general'
  | 'comercio_especializado'
  | 'distribuidor'
  | 'servicios'

export interface AppSettings {
  id: 'app'
  theme: ThemeMode
  locale: string
  currency: string
  terminalId: string
  demoMode: boolean
  setupStep: number
  setupCompleted: boolean
  lastSyncAt: string | null
  lastBackupAt: string | null
  createdAt: string
  updatedAt: string
}

export interface ConnectivitySnapshot {
  online: boolean
  pendingOps: number
  conflictCount: number
  lastSyncAt: string | null
  lastBackupAt: string | null
}

export interface DemoProduct {
  id: string
  sku: string
  name: string
  priceCents: number
  stock: number
  category: string
  isDemo: true
}

export interface MetaRecord {
  key: string
  value: string
}

export const BUSINESS_TEMPLATES: {
  id: BusinessTemplateId
  label: string
  description: string
}[] = [
  {
    id: 'tienda_general',
    label: 'Tienda o comercio general',
    description: 'Vendes al público varios tipos de productos.',
  },
  {
    id: 'comercio_especializado',
    label: 'Comercio especializado',
    description: 'Una categoría concreta: moda, electrónica, ferretería…',
  },
  {
    id: 'distribuidor',
    label: 'Pequeña distribución',
    description: 'Compras, almacenas y sirves a otros negocios.',
  },
  {
    id: 'servicios',
    label: 'Negocio de servicios',
    description: 'Reparaciones, citas u otros trabajos sin stock como eje.',
  },
]
