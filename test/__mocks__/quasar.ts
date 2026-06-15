import { vi } from 'vitest'

export function useQuasar() {
  return {
    screen: { width: 1024, height: 768, name: 'md', gt: {}, lt: {} },
    dark: { isActive: false, set: vi.fn(), toggle: vi.fn() },
    notify: vi.fn(),
    loading: { show: vi.fn(), hide: vi.fn() },
    platform: { is: {} }
  }
}

export const Notify = {
  create: vi.fn()
}

export const Dialog = {
  create: vi.fn(() => ({ onOk: vi.fn(), onCancel: vi.fn(), onDismiss: vi.fn() }))
}

export const Loading = {
  show: vi.fn(),
  hide: vi.fn()
}

export const Quasar = {
  install: vi.fn()
}

export default Quasar
