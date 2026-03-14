<script setup lang="ts">
// AdminCampaigns — editor for campaign name, hero image, and headline overrides
// Fields: campaignName, campaignHeroImage, campaignHeadline, campaignSubhead,
//         campaignCtaPrimary, campaignCtaSecondary
// Empty override fields fall through to phase defaults in useCampaignPhase.ts
// Full implementation coming in next phase
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin" class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Campaigns</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>
    <div class="mx-auto max-w-4xl px-4 py-8">
      <h1 class="font-display text-2xl font-bold text-kteq-white">Campaigns</h1>
      <p class="mt-1 text-sm text-kteq-muted">Campaign name, hero image, and headline overrides. Empty fields fall through to phase defaults.</p>
      <div class="mt-8 rounded-lg border border-kteq-gray/30 bg-kteq-dark p-8 text-center">
        <p class="text-kteq-muted">Editor coming soon. Edit <code class="rounded bg-kteq-void px-2 py-0.5 font-mono text-xs text-kteq-yellow">content/settings.json</code> directly for now — see <code class="rounded bg-kteq-void px-2 py-0.5 font-mono text-xs text-kteq-yellow">campaignName</code>, <code class="rounded bg-kteq-void px-2 py-0.5 font-mono text-xs text-kteq-yellow">campaignHeroImage</code>, and <code class="rounded bg-kteq-void px-2 py-0.5 font-mono text-xs text-kteq-yellow">campaignHeadline</code>.</p>
      </div>
    </div>
  </div>
</template>
