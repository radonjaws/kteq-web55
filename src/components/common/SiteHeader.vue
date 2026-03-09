<script setup lang="ts">
import { ref } from 'vue'
import { usePlayerStore } from '@/stores/player'

const player = usePlayerStore()
const mobileMenuOpen = ref(false)

const navLinks = [
  { label: 'Schedule', to: '/schedule' },
  { label: 'Shows', to: '/shows' },
  { label: 'History', to: '/history' },
  { label: 'Blog', to: '/blog' },
  { label: 'Donate', to: '/donate' },
]

function toggleMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-kteq-gray/50 bg-kteq-black/95 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
      <!-- Logo / Station ID -->
      <RouterLink to="/" class="group flex items-center gap-3" @click="mobileMenuOpen = false">
        <div class="flex h-9 w-9 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold tracking-tight text-kteq-black">
          K
        </div>
        <div class="hidden sm:block">
          <div class="font-display text-sm font-semibold leading-tight tracking-wide text-kteq-white">
            KTEQ-FM
          </div>
          <div class="font-mono text-[10px] tracking-widest text-kteq-muted">
            91.3 FM — RAPID CITY
          </div>
        </div>
      </RouterLink>

      <!-- Desktop Nav -->
      <nav class="hidden items-center gap-1 md:flex">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="rounded-md px-3 py-2 font-display text-sm font-medium text-kteq-muted transition-colors hover:text-kteq-white"
          active-class="!text-kteq-yellow"
        >
          {{ link.label }}
        </RouterLink>
      </nav>

      <!-- Listen Button + Mobile Menu Toggle -->
      <div class="flex items-center gap-3">
        <button
          @click="player.toggle()"
          class="flex items-center gap-2 rounded-full px-4 py-2 font-display text-sm font-semibold transition-all"
          :class="player.isPlaying
            ? 'bg-kteq-yellow/10 text-kteq-yellow ring-1 ring-kteq-yellow/30'
            : 'bg-kteq-yellow text-kteq-black hover:bg-kteq-yellow-bright glow-yellow'"
        >
          <!-- Animated bars when playing -->
          <span v-if="player.isPlaying" class="flex items-end gap-[2px]">
            <span class="inline-block w-[3px] animate-[eq_0.8s_ease-in-out_infinite] rounded-full bg-kteq-yellow" style="height: 12px;" />
            <span class="inline-block w-[3px] animate-[eq_0.8s_ease-in-out_0.2s_infinite] rounded-full bg-kteq-yellow" style="height: 8px;" />
            <span class="inline-block w-[3px] animate-[eq_0.8s_ease-in-out_0.4s_infinite] rounded-full bg-kteq-yellow" style="height: 14px;" />
          </span>
          <!-- Play icon when stopped -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
          </svg>
          <span class="hidden sm:inline">{{ player.isPlaying ? 'Listening' : 'Listen' }}</span>
        </button>

        <!-- Mobile hamburger -->
        <button
          @click="toggleMenu"
          class="flex h-9 w-9 items-center justify-center rounded-md text-kteq-muted transition-colors hover:text-kteq-white md:hidden"
          :aria-expanded="mobileMenuOpen"
          aria-label="Toggle navigation menu"
        >
          <svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-6 w-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Nav Drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <nav v-if="mobileMenuOpen" class="border-t border-kteq-gray/50 bg-kteq-void px-4 py-4 md:hidden">
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="block rounded-md px-3 py-3 font-display text-base font-medium text-kteq-light transition-colors hover:bg-kteq-dark hover:text-kteq-yellow"
          active-class="!text-kteq-yellow bg-kteq-dark"
          @click="mobileMenuOpen = false"
        >
          {{ link.label }}
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
@keyframes eq {
  0%, 100% { transform: scaleY(0.4); }
  50% { transform: scaleY(1); }
}
</style>
