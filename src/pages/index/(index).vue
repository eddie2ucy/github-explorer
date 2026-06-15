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
          name: '/repo/[owner]/[name]',
          params: { owner: repo.owner.login, name: repo.name }
        }"
      >
        <q-item-section avatar>
          <q-avatar>
            <img :src="repo.owner.avatar_url" :alt="repo.owner.login" />
          </q-avatar>
        </q-item-section>

        <q-item-section>
          <q-item-label>{{ repo.full_name }}</q-item-label>
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
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGithubApi } from '@/composables/useGithubApi'
import RateLimitBanner from '@/components/RateLimitBanner.vue'
import type { Repository } from '@/types/github'

const route = useRoute()
const router = useRouter()
const { error, loading, rateLimit, searchRepositories } = useGithubApi()

function queryParamToString(value: string | null | (string | null)[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? ''
}

const initialQuery = queryParamToString(route.query.q)

const searchInput = ref(initialQuery)
const query = ref('')
const results = ref<Repository[]>([])
const hasSearched = ref(false)

async function performSearch() {
  const value = searchInput.value.trim()
  query.value = value
  void router.replace({ query: value ? { q: value } : {} })

  if (!value) {
    hasSearched.value = false
    results.value = []
    return
  }

  hasSearched.value = true
  const result = await searchRepositories(value)
  results.value = result?.items ?? []
}

if (initialQuery) {
  void performSearch()
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

defineExpose({ searchInput, performSearch })
</script>
