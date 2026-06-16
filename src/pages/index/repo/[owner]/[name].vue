<template>
  <q-page class="q-pa-md">
    <q-btn flat color="primary" class="q-mb-md q-px-none" :to="backLink" data-testid="back-link">
      Back to search
    </q-btn>

    <rate-limit-banner :rate-limit="rateLimit" />

    <div v-if="loading" class="text-grey text-center q-pa-lg" data-testid="loading-state">
      Loading...
    </div>

    <div
      v-else-if="error?.status === 404"
      class="text-center q-pa-xl"
      data-testid="not-found-state"
    >
      <q-icon name="search_off" size="xl" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-7">Repository not found</div>
      <div class="text-body2 text-grey q-mt-sm">
        This repository may have been renamed, deleted, or never existed.
      </div>
    </div>

    <q-banner v-else-if="error" class="bg-negative text-white q-mb-md" data-testid="error-state">
      {{ error.message }}
    </q-banner>

    <q-card v-else-if="repository" flat bordered data-testid="repository-detail">
      <q-card-section>
        <div class="row items-center q-gutter-sm">
          <div class="text-h5 text-break">{{ repository.full_name }}</div>
          <q-badge v-if="repository.private" color="grey-7" data-testid="private-badge">
            Private
          </q-badge>
        </div>
        <p class="text-body1 q-mt-sm q-mb-none">
          {{ repository.description || 'No description provided.' }}
        </p>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-grey">
        <div>
          <q-icon name="star" size="xs" class="q-mr-xs" />{{ repository.stargazers_count }} stars ·
          <q-icon name="call_split" size="xs" class="q-mr-xs" />{{ repository.forks_count }} forks ·
          <q-icon name="visibility" size="xs" class="q-mr-xs" />{{ repository.watchers_count }}
          watchers ·
          <q-icon name="radio_button_unchecked" size="xs" class="q-mr-xs" />{{
            repository.open_issues_count
          }}
          open issues
        </div>
        <div v-if="repository.language" class="q-mt-sm">Language: {{ repository.language }}</div>
        <div v-if="repository.topics.length > 0" class="q-mt-sm">
          Topics: {{ repository.topics.join(', ') }}
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-grey">
        <div>License: {{ repository.license?.name ?? 'No license' }}</div>
        <div>Last push: {{ formatDate(repository.pushed_at) }}</div>
      </q-card-section>

      <q-separator />

      <q-card-actions>
        <q-btn
          v-if="repository.homepage"
          flat
          color="primary"
          :href="repository.homepage"
          target="_blank"
          rel="noopener noreferrer"
          label="Visit homepage"
          data-testid="homepage-link"
        />
        <q-btn
          flat
          color="primary"
          :href="repository.html_url"
          target="_blank"
          rel="noopener noreferrer"
          label="View on GitHub"
          data-testid="github-link"
        />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useGithubApi } from '@/composables/useGithubApi'
import RateLimitBanner from '@/components/RateLimitBanner.vue'
import type { Repository } from '@/types/github'

const route = useRoute()
const { error, loading, rateLimit, getRepository } = useGithubApi()

const repository = ref<Repository | null>(null)

async function loadRepository() {
  repository.value = await getRepository(route.params.owner, route.params.name)
}

void loadRepository()

function queryParamToString(value: string | null | (string | null)[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? ''
}

const backLink = computed(() => {
  const q = queryParamToString(route.query.q)
  return q ? { name: '//(index)', query: { q } } : { name: '//(index)' }
})

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value))
}

defineExpose({ backLink })
</script>
