<script setup lang="ts">
import { computed } from 'vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()
const activeDjs = computed(() => content.djs.filter(d => d.isActive))
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">DJs</h1>
    <p class="mt-2 text-kteq-muted">The people behind the microphone.</p>

    <div v-if="activeDjs.length" class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <RouterLink
        v-for="dj in activeDjs"
        :key="dj.slug"
        :to="`/djs/${dj.slug}`"
        class="group rounded-lg border border-kteq-gray/30 bg-kteq-dark p-5 transition-colors hover:border-kteq-yellow/30"
      >
        <h2 class="font-display text-lg font-semibold text-kteq-white group-hover:text-kteq-yellow transition-colors">{{ dj.name }}</h2>
        <p class="mt-1 text-sm text-kteq-muted line-clamp-2">{{ dj.bio }}</p>
      </RouterLink>
    </div>

    <div v-else class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-8 text-center">
      <p class="text-kteq-muted">DJ profiles will appear here as they're added.</p>
    </div>
  </div>
</template>
