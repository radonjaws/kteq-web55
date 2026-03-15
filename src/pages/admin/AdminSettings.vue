<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useGitHub } from '@/composables/useGitHub'

const { saving, error, lastSaved, save, getContent } = useGitHub()

const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
// Full loaded content — spread into save payload so fields owned by other
// editors (Campaigns, Menu) are preserved across Settings saves.
const rawContent = ref<any>(null)

const form = reactive({
  streamUrl: '',
  streamFallbackUrl: '',
  stationName: '',
  stationTagline: '',
  stationDescription: '',
  requestLine: '',
  email: '',
  donateUrl: '',
  socialLinks: {
    facebook: '',
    instagram: '',
    tunein: ''
  },
  bannerText: '',
  bannerUrl: '',
  bannerDismissible: true
})

onMounted(async () => {
  try {
    const { content, sha: fileSha } = await getContent('content/settings.json')
    sha.value = fileSha
    rawContent.value = content
    Object.assign(form, {
      streamUrl: content.streamUrl,
      streamFallbackUrl: content.streamFallbackUrl,
      stationName: content.stationName,
      stationTagline: content.stationTagline,
      stationDescription: content.stationDescription,
      requestLine: content.requestLine,
      email: content.email,
      donateUrl: content.donateUrl,
      socialLinks: { ...content.socialLinks },
      bannerText: content.bannerText,
      bannerUrl: content.bannerUrl,
      bannerDismissible: content.bannerDismissible
    })
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  const newSha = await save('content/settings.json', {
    // Preserve all fields (including those owned by other editors)
    ...rawContent.value,
    // Override with this editor's fields
    streamUrl: form.streamUrl,
    streamFallbackUrl: form.streamFallbackUrl,
    stationName: form.stationName,
    stationTagline: form.stationTagline,
    stationDescription: form.stationDescription,
    requestLine: form.requestLine,
    email: form.email,
    donateUrl: form.donateUrl,
    socialLinks: { ...form.socialLinks },
    bannerText: form.bannerText,
    bannerUrl: form.bannerUrl,
    bannerDismissible: form.bannerDismissible
  }, sha.value, 'Update site settings')
  if (newSha) sha.value = newSha
}

</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink
            to="/admin"
            class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black"
          >K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Settings</span>
        </div>
        <RouterLink
          to="/admin"
          class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white"
        >← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Settings</h1>
          <p class="mt-1 text-sm text-kteq-muted">Stream, station info, banner, and social links. Saves commit directly to the repo.</p>
        </div>

        <!-- Save button + status -->
        <div class="flex items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">
            Saved {{ lastSaved.toLocaleTimeString() }}
          </span>
          <span v-if="error" class="max-w-xs truncate text-xs text-kteq-red">{{ error }}</span>
          <button
            @click="handleSave"
            :disabled="saving || loading"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading settings…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <form v-else @submit.prevent="handleSave" class="mt-8 space-y-6">

        <!-- Announcement Banner -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Announcement Banner</h2>
          <div class="space-y-4">

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Banner Text</label>
              <input
                type="text"
                v-model="form.bannerText"
                placeholder="Leave empty to hide the banner"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Banner Link URL <span class="font-normal text-kteq-muted">(optional)</span>
              </label>
              <input
                type="url"
                v-model="form.bannerUrl"
                placeholder="https://…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <label class="flex cursor-pointer items-center gap-3">
              <div class="relative">
                <input type="checkbox" v-model="form.bannerDismissible" class="sr-only peer" />
                <div class="h-5 w-9 rounded-full border border-kteq-gray/50 bg-kteq-void transition-colors peer-checked:border-kteq-yellow/50 peer-checked:bg-kteq-yellow/20" />
                <div class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-kteq-muted transition-all peer-checked:translate-x-4 peer-checked:bg-kteq-yellow" />
              </div>
              <span class="font-display text-sm text-kteq-light">Visitors can dismiss the banner</span>
            </label>

          </div>
        </section>

        <!-- Station Info -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Station Info</h2>
          <div class="space-y-4">

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Station Name</label>
                <input
                  type="text"
                  v-model="form.stationName"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Tagline</label>
                <input
                  type="text"
                  v-model="form.stationTagline"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Station Description</label>
              <textarea
                v-model="form.stationDescription"
                rows="3"
                class="w-full resize-none rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Used in the footer and meta description.</p>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Request Line</label>
                <input
                  type="tel"
                  v-model="form.requestLine"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
              <div>
                <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Email</label>
                <input
                  type="email"
                  v-model="form.email"
                  class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
                />
              </div>
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Donate URL</label>
              <input
                type="url"
                v-model="form.donateUrl"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

          </div>
        </section>

        <!-- Stream -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Stream</h2>
          <div class="space-y-4">

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Primary Stream URL</label>
              <input
                type="url"
                v-model="form.streamUrl"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Cloudflare Worker proxy (HTTPS). Change with care — this is what the player uses.</p>
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Fallback Stream URL</label>
              <input
                type="url"
                v-model="form.streamFallbackUrl"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-mono text-sm text-kteq-white focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">Direct Icecast URL (HTTP, may not work in all browsers).</p>
            </div>

          </div>
        </section>

        <!-- Social Links -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Social Links</h2>
          <div class="space-y-4">

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Facebook</label>
              <input
                type="url"
                v-model="form.socialLinks.facebook"
                placeholder="https://facebook.com/…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">Instagram</label>
              <input
                type="url"
                v-model="form.socialLinks.instagram"
                placeholder="https://instagram.com/…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

            <div>
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">TuneIn</label>
              <input
                type="url"
                v-model="form.socialLinks.tunein"
                placeholder="https://tunein.com/…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50 transition-colors"
              />
            </div>

          </div>
        </section>

        <!-- Bottom save -->
        <div class="flex items-center justify-end gap-3 pb-8">
          <span v-if="error" class="text-xs text-kteq-red">{{ error }}</span>
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
          <button
            type="submit"
            :disabled="saving || loading"
            class="inline-flex items-center gap-2 rounded-md bg-kteq-yellow px-4 py-2 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>
