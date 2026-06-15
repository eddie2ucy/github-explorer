import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import MainLayout from '@/pages/index.vue'

const pushMock = vi.fn()

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({ query: {} }) as unknown as ReturnType<typeof actual.useRoute>,
    useRouter: () => ({ push: pushMock }) as unknown as ReturnType<typeof actual.useRouter>
  }
})

describe('MainLayout', () => {
  it('navigates home when the title is clicked', async () => {
    const wrapper = mount(MainLayout)

    await wrapper.find('[data-testid="home-link"]').trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/')
  })

  it('navigates home when the title is activated with the keyboard', async () => {
    const wrapper = mount(MainLayout)

    await wrapper.find('[data-testid="home-link"]').trigger('keydown.enter')

    expect(pushMock).toHaveBeenCalledWith('/')
  })
})
