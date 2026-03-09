<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'

const route = useRoute()
const content = useContentStore()
const dj = computed(() => content.djBySlug[route.params.slug as string])
const shows = computed(() =>
  (dj.value?.showSlugs || []).map(slug => content.showBySlug[slug]).filter(Boolean)
)
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <RouterLink to="/djs" class="font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">← All DJs</RouterLink>
    <div v-if="dj" class="mt-6">
      <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">{{ dj.name }}</h1>
      <p class="mt-1 font-mono text-xs text-kteq-muted">Since {{ dj.yearJoined }}</p>
      <div class="divider-static my-8" />
      <p class="text-kteq-light leading-relaxed">{{ dj.bio }}</p>
      <div v-if="shows.length" class="mt-8">
        <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-3">Shows</h2>
        <div class="flex flex-wrap gap-2">
          <RouterLink v-for="show in shows" :key="show.slug" :to="`/shows/${show.slug}`" class="rounded-full border border-kteq-gray/30 bg-kteq-dark px-4 py-2 font-display text-sm font-medium text-kteq-light hover:text-kteq-yellow transition-colors">
            {{ show.name }}
          </RouterLink>
        </div>
      </div>
    </div>
    <div v-else class="mt-6 text-kteq-muted">DJ not found.</div>
  </div>
</template>
