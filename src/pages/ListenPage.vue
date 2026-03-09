<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useNowOnAir } from '@/composables/useNowOnAir'
import { useContentStore } from '@/stores/content'

const player = usePlayerStore()
const content = useContentStore()
const { currentShow } = useNowOnAir()
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-16">
    <!-- Big Play Button -->
    <div class="text-center">
      <button
        @click="player.toggle()"
        class="group relative inline-flex h-32 w-32 items-center justify-center rounded-full transition-all sm:h-40 sm:w-40"
        :class="player.isPlaying
          ? 'bg-kteq-yellow/10 ring-2 ring-kteq-yellow/40'
          : 'bg-kteq-dark ring-2 ring-kteq-gray hover:ring-kteq-yellow/50'"
        :aria-label="player.isPlaying ? 'Stop listening' : 'Start listening'"
      >
        <!-- Pulse ring when playing -->
        <span
          v-if="player.isPlaying"
          class="absolute inset-0 animate-ping rounded-full bg-kteq-yellow/10"
          style="animation-duration: 3s;"
        />
        <!-- Loading -->
        <svg v-if="player.isLoading" class="h-12 w-12 animate-spin text-kteq-yellow" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" class="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
        <!-- Stop -->
        <svg v-else-if="player.isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-12 w-12 text-kteq-yellow">
          <path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clip-rule="evenodd" />
        </svg>
        <!-- Play -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-12 w-12 text-kteq-light transition-colors group-hover:text-kteq-yellow">
          <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
        </svg>
      </button>

      <!-- Status text -->
      <div class="mt-6">
        <h1 class="font-display text-2xl font-bold text-kteq-white sm:text-3xl">
          <template v-if="player.isPlaying">Listening Live</template>
          <template v-else-if="player.isLoading">Connecting...</template>
          <template v-else>Listen to KTEQ</template>
        </h1>
        <p class="mt-1 font-mono text-sm text-kteq-muted">91.3 FM — Black Hills Alternative Radio</p>
      </div>

      <!-- Error message -->
      <div v-if="player.hasError" class="mt-4 rounded-lg border border-kteq-red/30 bg-kteq-red/10 px-4 py-3 text-sm text-kteq-red">
        {{ player.errorMessage }}
      </div>
    </div>

    <!-- Now On Air -->
    <div class="mt-12 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="on-air-dot" />
        <span class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted">On Air Now</span>
      </div>
      <div v-if="currentShow">
        <RouterLink :to="`/shows/${currentShow.show.slug}`" class="group">
          <h2 class="font-display text-xl font-bold text-kteq-white group-hover:text-kteq-yellow transition-colors">
            {{ currentShow.show.name }}
          </h2>
        </RouterLink>
        <p v-if="currentShow.show.tagline" class="mt-1 text-kteq-muted">{{ currentShow.show.tagline }}</p>
        <p class="mt-2 font-mono text-xs text-kteq-muted">
          {{ currentShow.slot.startTime }}–{{ currentShow.slot.endTime === '00:00' ? 'Midnight' : currentShow.slot.endTime }}
        </p>
      </div>
      <div v-else>
        <p class="text-kteq-muted">No scheduled programming right now.</p>
      </div>
    </div>

    <!-- Other ways to listen -->
    <div class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
      <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-4">Other Ways to Listen</h2>
      <div class="grid gap-3 sm:grid-cols-2">
        <div class="rounded-md border border-kteq-gray/30 bg-kteq-void p-4">
          <div class="font-display text-sm font-semibold text-kteq-white">FM Radio</div>
          <p class="mt-1 text-sm text-kteq-muted">Tune to 91.3 FM in the Rapid City / Black Hills area</p>
        </div>
        <a
          v-if="content.settings.socialLinks.tunein"
          :href="content.settings.socialLinks.tunein"
          target="_blank"
          rel="noopener"
          class="rounded-md border border-kteq-gray/30 bg-kteq-void p-4 transition-colors hover:border-kteq-yellow/30"
        >
          <div class="font-display text-sm font-semibold text-kteq-white">TuneIn</div>
          <p class="mt-1 text-sm text-kteq-muted">Listen via the TuneIn app or website</p>
        </a>
      </div>
    </div>
  </div>
</template>
