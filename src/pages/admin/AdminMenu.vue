<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useGitHub } from '@/composables/useGitHub'

const { saving, error, lastSaved, save, getContent } = useGitHub()

const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
const rawContent = ref<any>(null)

const form = reactive({
  logoUrl: '',
  navLinks: {
    listen:   true,
    schedule: true,
    shows:    true,
    djs:      false,
    history:  true,
    blog:     true,
    donate:   true,
  }
})

const navItems = [
  { key: 'listen',   label: 'Listen Button', hint: 'The "Listen" play button in the header' },
  { key: 'schedule', label: 'Schedule',       hint: '/schedule' },
  { key: 'shows',    label: 'Shows',          hint: '/shows' },
  { key: 'djs',      label: 'DJs',            hint: '/djs' },
  { key: 'history',  label: 'History',        hint: '/history' },
  { key: 'blog',     label: 'Blog',           hint: '/blog' },
  { key: 'donate',   label: 'Donate',         hint: '/donate' },
] as const

onMounted(async () => {
  try {
    const { content, sha: fileSha } = await getContent('content/settings.json')
    sha.value = fileSha
    rawContent.value = content

    form.logoUrl = content.logoUrl || ''

    // Merge stored navLinks over defaults (preserves any new keys)
    if (content.navLinks && typeof content.navLinks === 'object') {
      for (const key of Object.keys(form.navLinks) as Array<keyof typeof form.navLinks>) {
        if (key in content.navLinks) {
          form.navLinks[key] = content.navLinks[key]
        }
      }
    }
  } catch (e: any) {
    loadError.value = e.message
  } finally {
    loading.value = false
  }
})

async function handleSave() {
  const newSha = await save('content/settings.json', {
    ...rawContent.value,
    logoUrl: form.logoUrl,
    navLinks: { ...form.navLinks },
  }, sha.value, 'Update menu settings')
  if (newSha) sha.value = newSha
}
</script>

<template>
  <div class="min-h-dvh bg-kteq-black">

    <!-- Admin header -->
    <header class="border-b border-kteq-gray/50 bg-kteq-void px-4 py-4">
      <div class="mx-auto flex max-w-4xl items-center justify-between">
        <div class="flex items-center gap-3">
          <RouterLink to="/admin" class="flex h-8 w-8 items-center justify-center rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">K</RouterLink>
          <span class="font-display text-sm font-semibold text-kteq-white">KTEQ Admin</span>
          <span class="font-display text-sm text-kteq-muted">/ Menu</span>
        </div>
        <RouterLink to="/admin" class="font-display text-xs text-kteq-muted transition-colors hover:text-kteq-white">← Dashboard</RouterLink>
      </div>
    </header>

    <div class="mx-auto max-w-4xl px-4 py-8">

      <!-- Page title + save -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="font-display text-2xl font-bold text-kteq-white">Menu</h1>
          <p class="mt-1 text-sm text-kteq-muted">Logo image and nav link visibility. Changes deploy automatically (~60 seconds).</p>
        </div>
        <div class="flex items-center gap-3">
          <span v-if="lastSaved && !error" class="text-xs text-kteq-green">Saved {{ lastSaved.toLocaleTimeString() }}</span>
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

      <div v-if="loading" class="mt-8 text-center text-sm text-kteq-muted">Loading…</div>
      <div v-else-if="loadError" class="mt-8 rounded-lg border border-kteq-red/30 bg-kteq-dark p-6 text-sm text-kteq-red">{{ loadError }}</div>

      <form v-else @submit.prevent="handleSave" class="mt-8 space-y-6">

        <!-- ── Logo ──────────────────────────────────────────────────────── -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-5 font-display text-base font-semibold text-kteq-white">Logo</h2>
          <div class="flex items-start gap-6">

            <!-- Live preview of the mark -->
            <div class="shrink-0">
              <p class="mb-2 font-display text-xs text-kteq-muted">Preview</p>
              <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-sm bg-kteq-yellow font-display text-sm font-bold text-kteq-black">
                <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo preview" class="h-full w-full object-cover" />
                <span v-else>K</span>
              </div>
            </div>

            <!-- URL field -->
            <div class="flex-1">
              <label class="mb-1.5 block font-display text-sm font-medium text-kteq-light">
                Logo Image URL <span class="font-normal text-kteq-muted">(optional)</span>
              </label>
              <input
                type="url"
                v-model="form.logoUrl"
                placeholder="https://…"
                class="w-full rounded-md border border-kteq-gray/50 bg-kteq-void px-3 py-2 font-body text-sm text-kteq-white placeholder-kteq-muted/50 transition-colors focus:border-kteq-yellow/50 focus:outline-none focus:ring-1 focus:ring-kteq-yellow/50"
              />
              <p class="mt-1.5 text-xs text-kteq-muted">
                If set, this image replaces the "K" mark in the site header. Square images work best. Leave empty to use the default text mark.
              </p>
            </div>

          </div>
        </section>

        <!-- ── Navigation ────────────────────────────────────────────────── -->
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">
          <h2 class="mb-1 font-display text-base font-semibold text-kteq-white">Navigation</h2>
          <p class="mb-5 text-xs text-kteq-muted">Toggle which links appear in the site header and mobile menu.</p>

          <div class="divide-y divide-kteq-gray/20">
            <div
              v-for="item in navItems"
              :key="item.key"
              class="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p class="font-display text-sm font-medium text-kteq-light">{{ item.label }}</p>
                <p class="text-xs text-kteq-muted">{{ item.hint }}</p>
              </div>
              <button
                type="button"
                @click="form.navLinks[item.key] = !form.navLinks[item.key]"
                class="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-kteq-yellow/50 focus:ring-offset-2 focus:ring-offset-kteq-dark"
                :class="form.navLinks[item.key] ? 'bg-kteq-yellow' : 'bg-kteq-gray'"
                role="switch"
                :aria-checked="form.navLinks[item.key]"
                :aria-label="`Toggle ${item.label}`"
              >
                <span
                  class="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform"
                  :class="form.navLinks[item.key] ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
            </div>
          </div>

          <!-- Live nav preview -->
          <div class="mt-5 rounded-md border border-kteq-gray/20 bg-kteq-void px-4 py-3">
            <p class="mb-2 font-display text-xs text-kteq-muted">Header preview</p>
            <div class="flex items-center gap-1">
              <!-- Logo mark -->
              <div class="mr-2 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-kteq-yellow font-display text-xs font-bold text-kteq-black">
                <img v-if="form.logoUrl" :src="form.logoUrl" alt="" class="h-full w-full object-cover" />
                <span v-else>K</span>
              </div>
              <!-- Nav links -->
              <template v-for="item in navItems" :key="item.key">
                <span
                  v-if="item.key !== 'listen' && form.navLinks[item.key]"
                  class="rounded-md px-2 py-1 font-display text-xs font-medium text-kteq-muted"
                >{{ item.label }}</span>
              </template>
              <!-- Listen button -->
              <span class="ml-auto">
                <span
                  v-if="form.navLinks.listen"
                  class="inline-flex items-center gap-1.5 rounded-full bg-kteq-yellow px-3 py-1 font-display text-xs font-semibold text-kteq-black"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="h-2.5 w-2.5">
                    <path d="M3 3.732a1.5 1.5 0 0 1 2.305-1.265l6.706 4.268a1.5 1.5 0 0 1 0 2.53l-6.706 4.268A1.5 1.5 0 0 1 3 12.268V3.732Z" />
                  </svg>
                  Listen
                </span>
              </span>
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
