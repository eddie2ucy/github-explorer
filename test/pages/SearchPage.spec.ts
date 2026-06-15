import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchPage from '@/pages/index/(index).vue'

describe('SearchPage placeholder', () => {
  it('renders the page heading', () => {
    const wrapper = mount(SearchPage)

    expect(wrapper.text()).toContain('Search GitHub Repositories')
  })
})
