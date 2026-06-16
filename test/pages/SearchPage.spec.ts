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
const routeQueryRef = ref<Record<string, string>>({})
const routerReplaceMock = vi.fn()

vi.mock('@/composables/useGithubApi', () => ({
  useGithubApi: () => ({
    data: ref(null),
    error: errorRef,
    loading: loadingRef,
    rateLimit: rateLimitRef,
    searchRepositories: searchRepositoriesMock,
    getRepository: vi.fn()
  }),
  SEARCH_RESULTS_PER_PAGE: 30,
  SEARCH_RESULTS_MAX: 1000
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () =>
      ({
        get query() {
          return routeQueryRef.value
        }
      }) as unknown as ReturnType<typeof actual.useRoute>,
    useRouter: () =>
      ({ replace: routerReplaceMock }) as unknown as ReturnType<typeof actual.useRouter>
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
    routeQueryRef.value = {}
    routerReplaceMock.mockReset()
  })

  it('shows an idle prompt when no search has been performed', () => {
    const wrapper = mount(SearchPage)

    expect(wrapper.find('[data-testid="idle-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Enter a keyword above to search for GitHub repositories.')
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

    expect(searchRepositoriesMock).toHaveBeenCalledWith('vue', 1)
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

  it('navigates to the next page, fetches more results, and syncs the page to the URL', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 100,
      incomplete_results: false,
      items: [createRepo()]
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="page-indicator"]').text()).toBe('Page 1 of 4')
    expect(wrapper.vm.hasPrevPage).toBe(false)
    expect(wrapper.vm.hasNextPage).toBe(true)

    await wrapper.find('[data-testid="next-page-button"]').trigger('click')
    await flushPromises()

    expect(searchRepositoriesMock).toHaveBeenLastCalledWith('vue', 2)
    expect(wrapper.find('[data-testid="page-indicator"]').text()).toBe('Page 2 of 4')
    expect(wrapper.vm.hasPrevPage).toBe(true)
    expect(routerReplaceMock).toHaveBeenLastCalledWith({ query: { q: 'vue', page: '2' } })
  })

  it('jumps to the last page and back to the first page using the first/last buttons', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 100,
      incomplete_results: false,
      items: [createRepo()]
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="page-indicator"]').text()).toBe('Page 1 of 4')

    await wrapper.find('[data-testid="last-page-button"]').trigger('click')
    await flushPromises()

    expect(searchRepositoriesMock).toHaveBeenLastCalledWith('vue', 4)
    expect(wrapper.find('[data-testid="page-indicator"]').text()).toBe('Page 4 of 4')
    expect(wrapper.vm.hasNextPage).toBe(false)
    expect(routerReplaceMock).toHaveBeenLastCalledWith({ query: { q: 'vue', page: '4' } })

    await wrapper.find('[data-testid="first-page-button"]').trigger('click')
    await flushPromises()

    expect(searchRepositoriesMock).toHaveBeenLastCalledWith('vue', 1)
    expect(wrapper.find('[data-testid="page-indicator"]').text()).toBe('Page 1 of 4')
    expect(wrapper.vm.hasPrevPage).toBe(false)
    expect(routerReplaceMock).toHaveBeenLastCalledWith({ query: { q: 'vue' } })
  })

  it('shows a cap note when total results exceed 1,000', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 5000,
      incomplete_results: true,
      items: [createRepo()]
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="cap-note"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('GitHub limits search results to 1,000 entries.')
  })

  it('disables the next page button once the 1000-result cap is reached', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 5000,
      incomplete_results: true,
      items: [createRepo()]
    })

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    wrapper.vm.page = 33
    expect(wrapper.vm.hasNextPage).toBe(true)

    wrapper.vm.page = 34
    expect(wrapper.vm.hasNextPage).toBe(false)
  })

  it('resets to the initial state when the route is navigated to with an empty query', async () => {
    searchRepositoriesMock.mockResolvedValue({
      total_count: 100,
      incomplete_results: false,
      items: [createRepo()]
    })
    rateLimitRef.value = { limit: 60, remaining: 56, reset: 1700000000 }

    const wrapper = mount(SearchPage)
    wrapper.vm.searchInput = 'vue'
    await wrapper.find('[data-testid="search-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="results-list"]').exists()).toBe(true)

    routeQueryRef.value = {}
    await flushPromises()

    expect(wrapper.vm.searchInput).toBe('')
    expect(wrapper.vm.page).toBe(1)
    expect(wrapper.find('[data-testid="results-list"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="pagination"]').exists()).toBe(false)
    expect(rateLimitRef.value).toEqual({ limit: null, remaining: null, reset: null })
  })

  it('clears a leftover rate-limit banner when mounted fresh with no query', () => {
    rateLimitRef.value = { limit: 60, remaining: 55, reset: 1700000000 }

    mount(SearchPage)

    expect(rateLimitRef.value).toEqual({ limit: null, remaining: null, reset: null })
  })

  it('restores the page number from the URL on initial load', async () => {
    routeQueryRef.value = { q: 'vue', page: '3' }
    searchRepositoriesMock.mockResolvedValue({
      total_count: 100,
      incomplete_results: false,
      items: [createRepo()]
    })

    const wrapper = mount(SearchPage)
    await flushPromises()

    expect(searchRepositoriesMock).toHaveBeenCalledWith('vue', 3)
    expect(wrapper.find('[data-testid="page-indicator"]').text()).toBe('Page 3 of 4')
  })
})
