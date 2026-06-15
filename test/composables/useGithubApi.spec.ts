import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGithubApi } from '@/composables/useGithubApi'
import type { Repository, SearchResult } from '@/types/github'

function createHeaders(headers: Record<string, string>) {
  return {
    get: (name: string) => headers[name] ?? null
  }
}

function mockFetchResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {}
) {
  const { status = 200, headers = {} } = init

  return {
    ok: status >= 200 && status < 300,
    status,
    headers: createHeaders(headers),
    json: () => Promise.resolve(body)
  } as unknown as Response
}

function createMockRepository(overrides: Partial<Repository> = {}): Repository {
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

describe('useGithubApi', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('searches repositories and tracks rate limit headers', async () => {
    const searchResult: SearchResult = {
      total_count: 1,
      incomplete_results: false,
      items: [createMockRepository()]
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        mockFetchResponse(searchResult, {
          headers: {
            'X-RateLimit-Limit': '60',
            'X-RateLimit-Remaining': '59',
            'X-RateLimit-Reset': '1700000000'
          }
        })
      )
    )

    const { data, error, loading, rateLimit, searchRepositories } = useGithubApi()
    const result = await searchRepositories('vue')

    expect(result).toEqual(searchResult)
    expect(data.value).toEqual(searchResult)
    expect(error.value).toBeNull()
    expect(loading.value).toBe(false)
    expect(rateLimit.value).toEqual({ limit: 60, remaining: 59, reset: 1700000000 })
  })

  it('sets an error when the rate limit is exceeded (403)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({}, { status: 403 })))

    const { error, searchRepositories } = useGithubApi()
    const result = await searchRepositories('vue')

    expect(result).toBeNull()
    expect(error.value).toEqual({
      status: 403,
      message: 'GitHub API rate limit exceeded. Please try again later.'
    })
  })

  it('sets a network error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))

    const { error, loading, searchRepositories } = useGithubApi()
    const result = await searchRepositories('vue')

    expect(result).toBeNull()
    expect(loading.value).toBe(false)
    expect(error.value).toEqual({
      status: 0,
      message: 'Network error. Please check your connection and try again.'
    })
  })

  it('fetches a single repository', async () => {
    const repo = createMockRepository()

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(repo)))

    const { data, getRepository } = useGithubApi()
    const result = await getRepository('vuejs', 'vue')

    expect(result).toEqual(repo)
    expect(data.value).toEqual(repo)
  })

  it('sets a not-found error when the repository does not exist (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse({}, { status: 404 })))

    const { error, getRepository } = useGithubApi()
    const result = await getRepository('vuejs', 'does-not-exist')

    expect(result).toBeNull()
    expect(error.value).toEqual({ status: 404, message: 'Repository not found.' })
  })
})
