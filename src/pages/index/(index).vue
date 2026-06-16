<template>
  <q-page class="q-pa-md">
    <div class="text-h5 q-mb-md">Search GitHub Repositories</div>

    <div class="row q-mb-md">
      <q-input
        v-model="searchInput"
        outlined
        dense
        clearable
        placeholder="Search repositories..."
        class="col"
        @keyup.enter="performSearch"
        @clear="onClear"
      />
      <q-btn
        color="primary"
        class="q-ml-sm"
        style="height: 40px"
        data-testid="search-button"
        @click="performSearch"
        >Search</q-btn
      >
    </div>

    <rate-limit-banner :rate-limit="rateLimit" />

    <div v-if="loading" class="text-grey text-center q-pa-lg" data-testid="loading-state">
      Loading...
    </div>

    <q-banner v-else-if="error" class="bg-negative text-white q-mb-md" data-testid="error-state">
      {{ error.message }}
    </q-banner>

    <div
      v-else-if="hasSearched && results.length === 0"
      class="text-grey text-center q-pa-lg"
      data-testid="no-results-state"
    >
      No repositories found for "{{ query }}".
    </div>

    <q-list v-else-if="results.length > 0" bordered separator data-testid="results-list">
      <q-item
        v-for="repo in results"
        :key="repo.id"
        clickable
        :to="{
          name: '//repo/[owner]/[name]',
          params: { owner: repo.owner?.login ?? '', name: repo.name },
          query: query ? { q: query } : {}
        }"
      >
        <q-item-section avatar>
          <q-avatar>
            <img :src="repo.owner?.avatar_url ?? ''" :alt="repo.owner?.login ?? ''" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label class="ellipsis">{{ repo.full_name }}</q-item-label>
          <q-item-label v-if="repo.description" caption lines="2">
            {{ repo.description }}
          </q-item-label>
          <q-item-label caption>
            {{ repo.stargazers_count }} stars
            <span v-if="repo.language"> · {{ repo.language }}</span>
            · Updated {{ formatDate(repo.pushed_at) }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>

    <div v-else class="text-grey text-center q-pa-lg" data-testid="idle-state">
      Enter a keyword above to search for GitHub repositories.
    </div>

    <div v-if="results.length > 0 && !loading" class="q-mt-md" data-testid="pagination">
      <div class="text-center text-grey q-mb-sm" data-testid="page-indicator">
        Page {{ page }} of {{ totalPages }}
      </div>
      <div class="row items-center justify-center q-gutter-sm">
        <q-btn
          flat
          dense
          color="primary"
          label="First"
          :disable="!hasPrevPage"
          data-testid="first-page-button"
          @click="firstPage"
        />
        <q-btn
          flat
          dense
          color="primary"
          label="Previous"
          :disable="!hasPrevPage"
          data-testid="prev-page-button"
          @click="prevPage"
        />
        <q-btn
          flat
          dense
          color="primary"
          label="Next"
          :disable="!hasNextPage"
          data-testid="next-page-button"
          @click="nextPage"
        />
        <q-btn
          flat
          dense
          color="primary"
          label="Last"
          :disable="!hasNextPage"
          data-testid="last-page-button"
          @click="lastPage"
        />
      </div>
      <div
        v-if="isCapped"
        class="text-caption text-grey text-center q-mt-xs"
        data-testid="cap-note"
      >
        GitHub limits search results to 1,000 entries.
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  useGithubApi,
  SEARCH_RESULTS_MAX,
  SEARCH_RESULTS_PER_PAGE
} from '@/composables/useGithubApi'
import RateLimitBanner from '@/components/RateLimitBanner.vue'
import type { Repository } from '@/types/github'

const route = useRoute()
const router = useRouter()
const { error, loading, rateLimit, searchRepositories } = useGithubApi()

function queryParamToString(value: string | null | (string | null)[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? ''
}

function queryParamToPage(value: string | null | (string | null)[] | undefined): number {
  const parsed = Number.parseInt(queryParamToString(value), 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

const initialQuery = queryParamToString(route.query.q)
const initialPage = queryParamToPage(route.query.page)

const searchInput = ref(initialQuery)
const query = ref('')
const page = ref(1)
const totalCount = ref(0)
const results = ref<Repository[]>([])
const hasSearched = ref(false)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(Math.min(totalCount.value, SEARCH_RESULTS_MAX) / SEARCH_RESULTS_PER_PAGE))
)

const hasPrevPage = computed(() => page.value > 1)
const hasNextPage = computed(() => page.value < totalPages.value)
const isCapped = computed(() => totalCount.value > SEARCH_RESULTS_MAX)

watch(
  () => route.query,
  (newQuery) => {
    if (queryParamToString(newQuery.q) !== '') return

    if (
      searchInput.value !== '' ||
      query.value !== '' ||
      page.value !== 1 ||
      hasSearched.value ||
      error.value !== null ||
      rateLimit.value.limit !== null
    ) {
      searchInput.value = ''
      query.value = ''
      page.value = 1
      results.value = []
      totalCount.value = 0
      hasSearched.value = false
      error.value = null
      rateLimit.value = { limit: null, remaining: null, reset: null }
    }
  }
)

function syncQuery() {
  void router.replace({
    query: {
      ...(query.value ? { q: query.value } : {}),
      ...(page.value > 1 ? { page: String(page.value) } : {})
    }
  })
}

async function runSearch() {
  hasSearched.value = true
  const result = await searchRepositories(query.value, page.value)
  results.value = result?.items ?? []
  totalCount.value = result?.total_count ?? 0
}

async function performSearch() {
  const value = searchInput.value.trim()
  query.value = value
  page.value = 1
  syncQuery()

  if (!value) {
    hasSearched.value = false
    results.value = []
    totalCount.value = 0
    return
  }

  await runSearch()
}

async function goToPage(newPage: number) {
  page.value = newPage
  syncQuery()
  await runSearch()
}

function nextPage() {
  void goToPage(page.value + 1)
}

function prevPage() {
  void goToPage(page.value - 1)
}

function firstPage() {
  void goToPage(1)
}

function lastPage() {
  void goToPage(totalPages.value)
}

if (initialQuery) {
  query.value = initialQuery
  page.value = initialPage
  void runSearch()
} else if (rateLimit.value.limit !== null) {
  rateLimit.value = { limit: null, remaining: null, reset: null }
}

function onClear() {
  searchInput.value = ''
  void performSearch()
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

defineExpose({
  searchInput,
  performSearch,
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  isCapped,
  nextPage,
  prevPage,
  firstPage,
  lastPage
})
</script>
