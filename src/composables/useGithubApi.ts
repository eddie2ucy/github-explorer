import { ref } from 'vue'
import type { Ref } from 'vue'
import type { Repository, SearchResult } from '@/types/github'

const GITHUB_API_BASE_URL = 'https://api.github.com'

// GitHub's Search API only ever returns the first 1000 results for a query.
export const SEARCH_RESULTS_PER_PAGE = 30
export const SEARCH_RESULTS_MAX = 1000

export interface GithubApiError {
  status: number
  message: string
}

export interface RateLimitInfo {
  limit: number | null
  remaining: number | null
  reset: number | null
}

export interface UseGithubApiReturn {
  data: Ref<Repository | SearchResult | null>
  error: Ref<GithubApiError | null>
  loading: Ref<boolean>
  rateLimit: Ref<RateLimitInfo>
  searchRepositories: (query: string, page?: number) => Promise<SearchResult | null>
  getRepository: (owner: string, name: string) => Promise<Repository | null>
}

// Shared across all composable instances so a rate-limit indicator reflects
// the result of any request made anywhere in the app.
const rateLimit = ref<RateLimitInfo>({ limit: null, remaining: null, reset: null })

export function useGithubApi(): UseGithubApiReturn {
  const data = ref<Repository | SearchResult | null>(null)
  const error = ref<GithubApiError | null>(null)
  const loading = ref(false)

  async function request<T extends Repository | SearchResult>(path: string): Promise<T | null> {
    loading.value = true
    error.value = null

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json'
      }

      const token = import.meta.env.VITE_GITHUB_TOKEN
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(`${GITHUB_API_BASE_URL}${path}`, { headers })

      rateLimit.value = {
        limit: parseRateLimitHeader(response.headers.get('X-RateLimit-Limit')),
        remaining: parseRateLimitHeader(response.headers.get('X-RateLimit-Remaining')),
        reset: parseRateLimitHeader(response.headers.get('X-RateLimit-Reset'))
      }

      if (!response.ok) {
        error.value = {
          status: response.status,
          message: errorMessageForStatus(response.status)
        }
        return null
      }

      const json = (await response.json()) as T
      data.value = json
      return json
    } catch {
      error.value = {
        status: 0,
        message: 'Network error. Please check your connection and try again.'
      }
      return null
    } finally {
      loading.value = false
    }
  }

  function searchRepositories(query: string, page = 1) {
    return request<SearchResult>(
      `/search/repositories?q=${encodeURIComponent(query)}&page=${page}&per_page=${SEARCH_RESULTS_PER_PAGE}`
    )
  }

  function getRepository(owner: string, name: string) {
    return request<Repository>(`/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`)
  }

  return { data, error, loading, rateLimit, searchRepositories, getRepository }
}

function parseRateLimitHeader(value: string | null): number | null {
  if (value === null) return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function errorMessageForStatus(status: number): string {
  switch (status) {
    case 403:
      return 'GitHub API rate limit exceeded. Please try again later.'
    case 404:
      return 'Repository not found.'
    default:
      return `GitHub API request failed with status ${status}.`
  }
}
