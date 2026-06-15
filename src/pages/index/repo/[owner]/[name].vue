<template>
  <q-page class="q-pa-md">
    <div class="text-h5">{{ route.params.owner }}/{{ route.params.name }}</div>
    <p class="text-grey">Repository details coming soon.</p>
  </q-page>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>
