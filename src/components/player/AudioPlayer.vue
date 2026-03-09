<script setup lang="ts">
import { usePlayerStore } from '@/stores/player'
import { useNowOnAir } from '@/composables/useNowOnAir'

const player = usePlayerStore()
const { currentShow } = useNowOnAir()
</script>

<template>
  <div class="fixed inset-x-0 bottom-0 z-50 border-t border-kteq-gray/50 bg-kteq-void/95 backdrop-blur-lg">
    <div class="mx-auto flex h-[var(--spacing-player)] max-w-6xl items-center gap-4 px-4">

      <!-- Play/Stop Button -->
      <button
        @click="player.toggle()"
        class="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full transition-all"
        :class="player.isPlaying
          ? 'bg-kteq-yellow/15 text-kteq-yellow ring-1 ring-kteq-yellow/30 hover:bg-kteq-yellow/25'
          : 'bg-kteq-yellow text-kteq-black hover:bg-kteq-yellow-bright'"
        :aria-label="player.isPlaying ? 'Stop listening' : 'Start listening'"
      >
        <!-- Loading spinner -->
        <svg v-if="player.isLoading" class="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25" />
          <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <!-- Stop icon -->
        <svg v-else-if="player.isPlaying" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
          <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
        </svg>
        <!-- Play icon -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
          <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
        </svg>
      </button>

      <!-- Now On Air Info -->
      <div class="flex min-w-0 flex-1 flex-col justify-center">
        <div class="flex items-center gap-2">
          <span v-if="player.isPlaying" class="on-air-dot flex-shrink-0" />
          <span class="truncate font-display text-sm font-medium text-kteq-white">
            <template v-if="player.hasError">
              {{ player.errorMessage }}
            </template>
            <template v-else-if="currentShow?.show">
              {{ currentShow.show.name }}
            </template>
            <template v-else>
              KTEQ-FM 91.3
            </template>
          </span>
        </div>
        <div class="truncate text-xs text-kteq-muted">
          <template v-if="player.isPlaying">
            Listening live
          </template>
          <template v-else-if="player.isLoading">
            Connecting...
          </template>
          <template v-else-if="currentShow?.slot">
            {{ currentShow.slot.startTime }}–{{ currentShow.slot.endTime === '00:00' ? 'Midnight' : currentShow.slot.endTime }}
          </template>
          <template v-else>
            Black Hills Alternative Radio
          </template>
        </div>
      </div>

      <!-- Volume Slider (desktop) -->
      <div class="hidden items-center gap-2 sm:flex">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4 flex-shrink-0 text-kteq-muted">
          <path d="M10.5 3.75a.75.75 0 00-1.264-.546L5.203 7H2.667a.75.75 0 00-.7.48A6.985 6.985 0 001.5 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h2.535l4.033 3.796A.75.75 0 0010.5 16.25v-12.5z" />
          <path v-if="player.volume > 0.01" d="M13.26 6.74a.75.75 0 011.06 0 5.97 5.97 0 010 8.44.75.75 0 01-1.06-1.06 4.47 4.47 0 000-6.32.75.75 0 010-1.06z" />
          <path v-if="player.volume > 0.5" d="M15.38 4.62a.75.75 0 011.06 0 9.96 9.96 0 010 14.08.75.75 0 01-1.06-1.06 8.46 8.46 0 000-11.96.75.75 0 010-1.06z" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="player.volume"
          @input="player.setVolume(parseFloat(($event.target as HTMLInputElement).value))"
          class="h-1 w-24 cursor-pointer appearance-none rounded-full bg-kteq-gray accent-kteq-yellow [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-kteq-yellow"
          aria-label="Volume"
        />
      </div>

      <!-- Frequency Badge -->
      <div class="hidden font-mono text-[10px] tracking-widest text-kteq-muted lg:block">
        91.3 FM
      </div>
    </div>
  </div>
</template>
