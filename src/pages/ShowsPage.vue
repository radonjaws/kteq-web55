<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()
const activeShows = computed(() => content.shows.filter(s => s.isActive && !s.isAutomation))
const automationShows = computed(() => content.shows.filter(s => s.isActive && s.isAutomation))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">Shows</h1>
    <p class="mt-2 text-kteq-muted">The voices of KTEQ.</p>

    <!-- Live shows -->
    <div v-if="activeShows.length" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="show in activeShows"
        :key="show.slug"
        :to="`/shows/${show.slug}`"
        class="group rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5 transition-colors hover:border-kteq-yellow/30"
      >
        <h2 class="font-display text-lg font-semibold text-kteq-white group-hover:text-kteq-yellow transition-colors">
          {{ show.name }}
        </h2>
        <p v-if="show.tagline" class="mt-1 text-sm text-kteq-muted">{{ show.tagline }}</p>
        <span class="mt-3 inline-block rounded-full bg-kteq-void px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-kteq-muted">
          {{ show.genre }}
        </span>
      </RouterLink>
    </div>

    <div v-else class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-8 text-center">
      <p class="text-kteq-muted">Shows will be listed here as they're added. Check the <RouterLink to="/schedule" class="text-kteq-yellow hover:underline">schedule</RouterLink> for current programming.</p>
    </div>

    <!-- Automation -->
    <div v-if="automationShows.length" class="mt-12">
      <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-4">Automated Programming</h2>
      <div v-for="show in automationShows" :key="show.slug" class="rounded-lg border border-kteq-gray/20 bg-kteq-void p-4">
        <h3 class="font-display text-sm font-semibold text-kteq-light">{{ show.name }}</h3>
        <p class="mt-1 text-xs text-kteq-muted">{{ show.description }}</p>
      </div>
    </div>
  </div>
</template>
