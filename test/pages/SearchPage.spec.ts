import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import SearchPage from '@/pages/index/(index).vue'
import type { Repository } from '@/types/github'
import type { GithubApiError, RateLimitInfo } from '@/composables/useGithubApi'

const searchRepositoriesMock = vi.fn()
const errorRef = ref<GithubApiError | null>(null)
const loadingRef = ref(false)
const rateLimitRef = ref<RateLimitInfo>({ limit: null, remaining: null, reset: null })

vi.mock('@/composables/useGithubApi', () => ({
  useGithubApi: () => ({
    data: ref(null),
    error: errorRef,
    loading: loadingRef,
    rateLimit: rateLimitRef,
    searchRepositories: searchRepositoriesMock,
    getRepository: vi.fn()
  })
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => ({ query: {} }) as unknown as ReturnType<typeof actual.useRoute>,
    useRouter: () => ({ replace: vi.fn() }) as unknown as ReturnType<typeof actual.useRouter>
  }
})

function createRepo(overrides: Partial<Repository> = {}): Repository {
  return {
    id: 1,
    node_id: 'node_1',
    name: 'vue',
    full_name: 'vuejs/vue',
    owner: {
      login: 'vuejs',
      id: 2,
      node_id: 'node_2',
      avatar_url: 'https://example.com/avatar.png',
      html_url: 'https://github.com/vuejs',
      type: 'Organization'
    },
    private: false,
    html_url: 'https://github.com/vuejs/vue',
    description: 'A progressive framework',
    fork: false,
    url: 'https://api.github.com/repos/vuejs/vue',
    homepage: 'https://vuejs.org',
    stargazers_count: 100,
    watchers_count: 100,
    forks_count: 10,
    open_issues_count: 1,
    language: 'TypeScript',
    license: null,
    topics: ['vue', 'frontend'],
    default_branch: 'main',
    archived: false,
    disabled: false,
    visibility: 'public',
    created_at: '2020-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    pushed_at: '2024-01-01T00:00:00Z',
    ...overrides
  }
}

describe('SearchPage', () => {
  beforeEach(() => {
    searchRepositoriesMock.mockReset()
    errorRef.value = null
    loadingRef.value = false
    rateLimitRef.value = { limit: null, remaining: null, reset: null }
  })

  it('shows a loading state while a request is in flight', () => {
    loadingRef.value = true

    const wrapper = mount(SearchPage)

    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders results returned by the search after clicking the search button', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 1,
      incomplete_results: false,
      items: [createRepo()]
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(searchRepositoriesMock).toHaveBeenCalledWith('vue')
    expect(wrapper.text()).toContain('vuejs/vue')
    expect(wrapper.text()).toContain('100 stars')
  })

  it('shows a zero-results state when the search returns nothing', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 0,
      incomplete_results: false,
      items: []
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'doesnotexist123'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No repositories found for "doesnotexist123"')
  })

  it('shows an error state when the search fails', async () => {
    searchRepositoriesMock.mockImplementation(async () => {
      errorRef.value = { status: 500, message: 'GitHub API request failed with status 500.' }
      return null
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('GitHub API request failed with status 500.')
  })
})
