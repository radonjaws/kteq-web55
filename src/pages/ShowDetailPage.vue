<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useContentStore } from '@/stores/content'

const route = useRoute()
const content = useContentStore()

const show = computed(() => content.showBySlug[route.params.slug as string])
const djs = computed(() =>
  (show.value?.djSlugs || []).map(slug => content.djBySlug[slug]).filter(Boolean)
)
const scheduleSlots = computed(() => {
  if (!show.value) return []
  const slots: { day: string; startTime: string; endTime: string }[] = []
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayLabels: Record<string, string> = {
    sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday'
  }
  for (const day of days) {
    for (const slot of content.getScheduleForDay(day)) {
      if (slot.showSlug === show.value.slug) {
        slots.push({ day: dayLabels[day], startTime: slot.startTime, endTime: slot.endTime })
      }
    }
  }
  return slots
})
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <RouterLink to="/shows" class="font-display text-sm text-kteq-yellow hover:text-kteq-yellow-bright transition-colors">
      ← All Shows
    </RouterLink>

    <div v-if="show" class="mt-6">
      <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">{{ show.name }}</h1>
      <p v-if="show.tagline" class="mt-2 text-lg text-kteq-muted">{{ show.tagline }}</p>
      <span class="mt-3 inline-block rounded-full bg-kteq-dark px-3 py-1 text-xs font-medium text-kteq-muted">{{ show.genre }}</span>

      <div class="divider-static my-8" />

      <p class="text-kteq-light leading-relaxed">{{ show.description }}</p>

      <!-- Schedule -->
      <div v-if="scheduleSlots.length" class="mt-8">
        <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-3">Schedule</h2>
        <div class="space-y-2">
          <div v-for="(slot, i) in scheduleSlots" :key="i" class="flex gap-4 rounded-md bg-kteq-dark px-4 py-3">
            <span class="font-display text-sm font-medium text-kteq-white w-28">{{ slot.day }}</span>
            <span class="font-mono text-sm text-kteq-muted">{{ slot.startTime }}–{{ slot.endTime }}</span>
          </div>
        </div>
      </div>

      <!-- DJs -->
      <div v-if="djs.length" class="mt-8">
        <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-3">Hosted by</h2>
        <div class="flex flex-wrap gap-2">
          <RouterLink
            v-for="dj in djs"
            :key="dj.slug"
            :to="`/djs/${dj.slug}`"
            class="rounded-full border border-kteq-gray/30 bg-kteq-dark px-4 py-2 font-display text-sm font-medium text-kteq-light hover:border-kteq-yellow/30 hover:text-kteq-yellow transition-colors"
          >
            {{ dj.name }}
          </RouterLink>
        </div>
      </div>
    </div>

    <div v-else class="mt-6 text-kteq-muted">Show not found.</div>
  </div>
</template>
