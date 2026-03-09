<script setup lang="ts">
import { useCampaignPhase } from '@/composables/useCampaignPhase'
import { usePlayerStore } from '@/stores/player'

const { heroConfig, phase, daysUntilReopening, isKteqLive } = useCampaignPhase()
const player = usePlayerStore()
</script>

<template>
  <section class="noise relative overflow-hidden bg-kteq-void">
    <!-- Background texture / gradient -->
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,oklch(0.85_0.18_90_/_0.08),transparent)]" />

    <div class="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:py-32 lg:py-40">
      <!-- Frequency marker -->
      <div class="mb-6 inline-flex items-center gap-2 rounded-full border border-kteq-gray/50 bg-kteq-dark/50 px-4 py-1.5 backdrop-blur-sm">
        <span class="on-air-dot" />
        <span class="font-mono text-xs tracking-widest text-kteq-muted">91.3 FM — RAPID CITY, SD</span>
      </div>

      <!-- Headline -->
      <h1 class="text-balance font-display text-4xl font-bold leading-tight tracking-tight text-kteq-white sm:text-5xl lg:text-6xl">
        {{ heroConfig.headline }}
      </h1>

      <!-- Subhead -->
      <p class="mt-4 text-lg text-kteq-muted sm:text-xl">
        {{ heroConfig.subhead }}
      </p>

      <!-- Countdown (only during kteqlive phase) -->
      <div v-if="isKteqLive && daysUntilReopening > 0" class="mt-6">
        <span class="font-mono text-3xl font-bold text-kteq-yellow">{{ daysUntilReopening }}</span>
        <span class="ml-2 text-sm text-kteq-muted">days until reopening</span>
      </div>

      <!-- CTA buttons -->
      <div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
        <!-- Primary CTA: Listen -->
        <button
          v-if="heroConfig.cta.route === '/listen'"
          @click="player.toggle()"
          class="glow-yellow inline-flex items-center gap-2 rounded-full bg-kteq-yellow px-8 py-3 font-display text-base font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          <svg v-if="!player.isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
          </svg>
          {{ player.isPlaying ? 'Now Playing' : heroConfig.cta.text }}
        </button>

        <!-- Primary CTA: Link -->
        <RouterLink
          v-else
          :to="heroConfig.cta.route"
          class="glow-yellow inline-flex items-center gap-2 rounded-full bg-kteq-yellow px-8 py-3 font-display text-base font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
        >
          {{ heroConfig.cta.text }}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
          </svg>
        </RouterLink>

        <!-- Secondary CTA -->
        <RouterLink
          to="/schedule"
          class="inline-flex items-center gap-2 rounded-full border border-kteq-gray px-6 py-3 font-display text-sm font-medium text-kteq-light transition-colors hover:border-kteq-muted hover:text-kteq-white"
        >
          View Schedule
        </RouterLink>
      </div>
    </div>
  </section>
</template>
