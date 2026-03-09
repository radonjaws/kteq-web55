<script setup lang="ts">
import { useContentStore } from '@/stores/content'

const content = useContentStore()
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-12">
    <h1 class="font-display text-3xl font-bold text-kteq-white sm:text-4xl">Support KTEQ</h1>
    <p class="mt-4 text-lg text-kteq-muted leading-relaxed">
      KTEQ has been independent, student-run radio since 1971. We're funded in part by the South Dakota Mines Student Association, but the cost of licensing, royalties, equipment, and operations adds up. Your support keeps the signal strong.
    </p>

    <div class="mt-8 rounded-lg border border-kteq-yellow/20 bg-kteq-yellow/5 p-8 text-center">
      <h2 class="font-display text-xl font-bold text-kteq-white">Make a Tax-Deductible Donation</h2>
      <p class="mt-2 text-sm text-kteq-muted">
        Donations are made through the South Dakota Mines Center for Alumni Relations &amp; Advancement (CARA). Please designate your gift for <strong class="text-kteq-yellow">KTEQ-FM</strong>.
      </p>
      <a
        :href="content.settings.donateUrl"
        target="_blank"
        rel="noopener"
        class="glow-yellow mt-6 inline-flex items-center gap-2 rounded-full bg-kteq-yellow px-8 py-3 font-display text-base font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright"
      >
        Donate Now
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
          <path fill-rule="evenodd" d="M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z" clip-rule="evenodd" />
        </svg>
      </a>
    </div>

    <div class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
      <h2 class="font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-4">Your Donations Help Fund</h2>
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="text-sm text-kteq-light">FCC licensing &amp; compliance</div>
        <div class="text-sm text-kteq-light">Music royalty fees (BMI, ASCAP, SESAC)</div>
        <div class="text-sm text-kteq-light">Studio equipment &amp; maintenance</div>
        <div class="text-sm text-kteq-light">Transmitter &amp; antenna upkeep</div>
        <div class="text-sm text-kteq-light">Streaming infrastructure</div>
        <div class="text-sm text-kteq-light">Student training &amp; programming</div>
      </div>
    </div>

    <div class="mt-8 text-sm text-kteq-muted">
      Questions about donations? Contact us at
      <a :href="`mailto:${content.settings.email}`" class="text-kteq-yellow hover:underline">{{ content.settings.email }}</a>.
    </div>
  </div>
</template>
