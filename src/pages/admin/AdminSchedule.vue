<script setup lang="ts">
import { useContentStore } from '@/stores/content'
import { computed } from 'vue'
const _contentStore = useContentStore()
const adminLogoUrl = computed(() => (_contentStore.settings as any).logoUrl || '')
// AdminSchedule — full implementation coming in Phase 4
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin">
            <img v-if="adminLogoUrl" :src="adminLogoUrl" alt="KTEQ" class="h-8 w-auto object-contain" />
            <span v-else class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</span>
          </RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Schedule</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted hover:text-kteq-white transition-colors">← Dashboard</RouterLink>
      </div>
    </header>
    <div class="mx-auto max-w-4xl px-4 py-8">
      <h1 class="font-display text-2xl font-bold text-kteq-white">Schedule</h1>
      <div class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-8 text-center">
        <p class="text-kteq-muted">Editor coming soon. Content can be edited directly in the repo at <code class="rounded bg-kteq-void px-2 py-0.5 font-mono text-xs text-kteq-yellow">content/</code> for now.</p>
      </div>
    </div>
  </div>
</template>
