<script setup lang="ts">
import { ref, computed } from 'vue'
import { useContentStore } from '@/stores/content'

const content = useContentStore()

const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
const dayLabels: Record<string, string> = {
  sunday: 'Sun', monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat'
}
const dayLabelsFull: Record<string, string> = {
  sunday: 'Sunday', monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday'
}

// Mobile: show one day at a time
const today = new Date().getDay()
const selectedDay = ref(days[today])

function getShowName(slug: string): string {
  return content.showBySlug[slug]?.name || slug
}

function isNow(day: string, startTime: string, endTime: string): boolean {
  const now = new Date()
  const currentDay = days[now.getDay()]
  if (day !== currentDay) return false
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  if (endTime === '00:00') return time >= startTime
  return time >= startTime && time < endTime
}

function formatTime(t: string): string {
  if (t === '00:00') return '12a'
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'p' : 'a'
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`
}
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">Schedule</h1>
    <p class="mt-2 text-kteq-muted">
      KTEQ programming runs 24/7. Live shows are highlighted below.
    </p>

    <!-- Mobile: Day selector tabs -->
    <div class="mt-8 flex gap-1 overflow-x-auto pb-2 md:hidden">
      <button
        v-for="day in days"
        :key="day"
        @click="selectedDay = day"
        class="flex-shrink-0 rounded-md px-3 py-2 font-display text-xs font-medium transition-colors"
        :class="selectedDay === day
          ? 'bg-kteq-yellow text-kteq-black'
          : 'bg-kteq-dark text-kteq-muted hover:text-kteq-light'"
      >
        {{ dayLabels[day] }}
      </button>
    </div>

    <!-- Mobile: Single day view -->
    <div class="mt-4 space-y-2 md:hidden">
      <h2 class="font-display text-lg font-semibold text-kteq-white">{{ dayLabelsFull[selectedDay] }}</h2>
      <div
        v-for="slot in content.getScheduleForDay(selectedDay)"
        :key="slot.id"
        class="rounded-lg border p-4 transition-colors"
        :class="isNow(selectedDay, slot.startTime, slot.endTime)
          ? 'border-kteq-yellow/40 bg-kteq-yellow/5'
          : 'border-kteq-gray/30 bg-kteq-dark'"
      >
        <div class="flex items-center gap-2">
          <span v-if="isNow(selectedDay, slot.startTime, slot.endTime)" class="on-air-dot" />
          <span class="font-mono text-xs text-kteq-muted">
            {{ formatTime(slot.startTime) }}–{{ formatTime(slot.endTime) }}
          </span>
          <span v-if="slot.isAutomation" class="rounded bg-kteq-gray px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-kteq-muted">Auto</span>
        </div>
        <RouterLink
          :to="`/shows/${slot.showSlug}`"
          class="mt-1 block font-display text-base font-semibold text-kteq-white hover:text-kteq-yellow transition-colors"
        >
          {{ getShowName(slot.showSlug) }}
        </RouterLink>
        <p v-if="slot.notes" class="mt-1 text-xs text-kteq-muted">{{ slot.notes }}</p>
      </div>
    </div>

    <!-- Desktop: Full grid -->
    <div class="mt-8 hidden overflow-x-auto md:block">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th
              v-for="day in days"
              :key="day"
              class="border-b border-kteq-gray/30 px-3 py-3 text-left font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted"
              :class="{ '!text-kteq-yellow': days[today] === day }"
            >
              {{ dayLabelsFull[day] }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              v-for="day in days"
              :key="day"
              class="border-b border-kteq-gray/20 align-top p-1"
            >
              <div
                v-for="slot in content.getScheduleForDay(day)"
                :key="slot.id"
                class="mb-1 rounded-md border p-2.5 transition-colors"
                :class="isNow(day, slot.startTime, slot.endTime)
                  ? 'border-kteq-yellow/40 bg-kteq-yellow/5'
                  : 'border-kteq-gray/20 bg-kteq-dark hover:border-kteq-gray/40'"
              >
                <div class="flex items-center gap-1.5">
                  <span v-if="isNow(day, slot.startTime, slot.endTime)" class="on-air-dot" />
                  <span class="font-mono text-[10px] text-kteq-muted">{{ formatTime(slot.startTime) }}</span>
                </div>
                <RouterLink
                  :to="`/shows/${slot.showSlug}`"
                  class="mt-0.5 block font-display text-xs font-semibold text-kteq-light hover:text-kteq-yellow transition-colors leading-tight"
                >
                  {{ getShowName(slot.showSlug) }}
                </RouterLink>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="mt-6 text-xs text-kteq-muted">
      Last updated: {{ new Date(content.schedule.lastUpdated).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }}
    </p>
  </div>
</template>
