export interface Owner {
  login: string
  id: number
  node_id: string
  avatar_url: string
  html_url: string
  type: string
}

export interface License {
  key: string
  name: string
  spdx_id: string | null
  url: string | null
}

export interface Repository {
  id: number
  node_id: string
  name: string
  full_name: string
  owner: Owner
  private: boolean
  html_url: string
  description: string | null
  fork: boolean
  url: string
  homepage: string | null
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  language: string | null
  license: License | null
  topics: string[]
  default_branch: string
  archived: boolean
  disabled: boolean
  visibility: string
  created_at: string
  updated_at: string
  pushed_at: string
}

export interface SearchResult {
  total_count: number
  incomplete_results: boolean
  items: Repository[]
}
