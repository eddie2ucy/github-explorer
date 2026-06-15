<template>
  <q-banner v-if="rateLimit.limit !== null" :class="['q-mb-md', bannerClass]">
    {{ rateLimit.remaining }} / {{ rateLimit.limit }} requests remaining
    <span v-if="resetLabel"> · Resets at {{ resetLabel }}</span>
  </q-banner>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RateLimitInfo } from '@/composables/useGithubApi'

const props = defineProps<{
  rateLimit: RateLimitInfo
}>()

const isLow = computed(() => props.rateLimit.remaining !== null && props.rateLimit.remaining <= 5)

const bannerClass = computed(() => (isLow.value ? 'bg-warning text-white' : 'bg-grey-3'))

const resetLabel = computed(() => {
  if (props.rateLimit.reset === null) return null
  return new Date(props.rateLimit.reset * 1000).toLocaleTimeString()
})
</script>
