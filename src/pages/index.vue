<template>
  <q-layout view="hHh lpr fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title
          class="cursor-pointer"
          tabindex="0"
          data-testid="home-link"
          @click="goHome"
          @keydown.enter="goHome"
        >
          <q-icon name="travel_explore" class="q-mr-sm" />
          GitHub Repository Explorer
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <div class="page-container">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

function goHome() {
  void router.push('/')
}
</script>
