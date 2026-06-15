import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import RepoDetailPage from '@/pages/index/repo/[owner]/[name].vue'
import type { Repository } from '@/types/github'
import type { GithubApiError, RateLimitInfo } from '@/composables/useGithubApi'

const getRepositoryMock = vi.fn()
const errorRef = ref<GithubApiError | null>(null)
const loadingRef = ref(false)
const rateLimitRef = ref<RateLimitInfo>({ limit: null, remaining: null, reset: null })
const routeQueryRef = ref<Record<string, string>>({})

vi.mock('@/composables/useGithubApi', () => ({
  useGithubApi: () => ({
    data: ref(null),
    error: errorRef,
    loading: loadingRef,
    rateLimit: rateLimitRef,
    searchRepositories: vi.fn(),
    getRepository: getRepositoryMock
  })
}))

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () =>
      ({
        params: { owner: 'vuejs', name: 'vue' },
        query: routeQueryRef.value
      }) as unknown as ReturnType<typeof actual.useRoute>,
    useRouter: () => ({}) as unknown as ReturnType<typeof actual.useRouter>
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
    license: {
      key: 'mit',
      name: 'MIT License',
      spdx_id: 'MIT',
      url: 'https://api.github.com/licenses/mit'
    },
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

describe('RepoDetailPage', () => {
  beforeEach(() => {
    getRepositoryMock.mockReset()
    getRepositoryMock.mockResolvedValue(null)
    errorRef.value = null
    loadingRef.value = false
    rateLimitRef.value = { limit: null, remaining: null, reset: null }
    routeQueryRef.value = {}
  })

  it('shows a loading state while a request is in flight', () => {
    loadingRef.value = true

    const wrapper = mount(RepoDetailPage)

    expect(wrapper.text()).toContain('Loading...')
  })

  it('renders repository details fetched for the route params', async () => {
    getRepositoryMock.mockResolvedValue(createRepo({ private: true }))

    const wrapper = mount(RepoDetailPage)
    await flushPromises()

    expect(getRepositoryMock).toHaveBeenCalledWith('vuejs', 'vue')
    expect(wrapper.text()).toContain('vuejs/vue')
    expect(wrapper.find('[data-testid="private-badge"]').text()).toContain('Private')
    expect(wrapper.text()).toContain('A progressive framework')
    expect(wrapper.text()).toContain('100 stars')
    expect(wrapper.text()).toContain('10 forks')
    expect(wrapper.text()).toContain('Language: TypeScript')
    expect(wrapper.text()).toContain('Topics: vue, frontend')
    expect(wrapper.text()).toContain('MIT License')
    expect(wrapper.find('[data-testid="homepage-link"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="github-link"]').exists()).toBe(true)
  })

  it('renders fallback text when optional fields are null', async () => {
    getRepositoryMock.mockResolvedValue(
      createRepo({ description: null, language: null, license: null, homepage: null, topics: [] })
    )

    const wrapper = mount(RepoDetailPage)
    await flushPromises()

    expect(wrapper.text()).toContain('No description provided.')
    expect(wrapper.text()).toContain('No license')
    expect(wrapper.text()).not.toContain('Language:')
    expect(wrapper.text()).not.toContain('Topics:')
    expect(wrapper.find('[data-testid="homepage-link"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="github-link"]').exists()).toBe(true)
  })

  it('shows a 404 error state when the repository is not found', async () => {
    getRepositoryMock.mockImplementation(async () => {
      errorRef.value = { status: 404, message: 'Repository not found.' }
      return null
    })

    const wrapper = mount(RepoDetailPage)
    await flushPromises()

    expect(wrapper.text()).toContain('Repository not found.')
  })

  it('computes the back link from the search query', () => {
    routeQueryRef.value = { q: 'vue' }
    const wrapperWithQuery = mount(RepoDetailPage)
    expect(wrapperWithQuery.vm.backLink).toEqual({ name: '//(index)', query: { q: 'vue' } })

    routeQueryRef.value = {}
    const wrapperWithoutQuery = mount(RepoDetailPage)
    expect(wrapperWithoutQuery.vm.backLink).toEqual({ name: '//(index)' })
  })
})
