import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RateLimitBanner from '@/components/RateLimitBanner.vue'

describe('RateLimitBanner', () => {
  it('renders nothing when the rate limit is unknown', () => {
    const wrapper = mount(RateLimitBanner, {
      props: { rateLimit: { limit: null, remaining: null, reset: null } }
    })

    expect(wrapper.text()).toBe('')
  })

  it('shows remaining requests with a neutral style under normal usage', () => {
    const wrapper = mount(RateLimitBanner, {
      props: { rateLimit: { limit: 60, remaining: 59, reset: 1700000000 } }
    })

    expect(wrapper.text()).toContain('59 / 60 requests remaining')
    expect(wrapper.classes()).toContain('bg-grey-3')
  })

  it('switches to a warning style when remaining requests are low', () => {
    const wrapper = mount(RateLimitBanner, {
      props: { rateLimit: { limit: 60, remaining: 3, reset: 1700000000 } }
    })

    expect(wrapper.classes()).toContain('bg-warning')
  })
})
