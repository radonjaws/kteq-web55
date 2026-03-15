<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useGitHub } from '@/composables/useGitHub'

const { saving, error, lastSaved, save, getContent } = useGitHub()

const loading = ref(true)
const loadError = ref<string | null>(null)
const sha = ref('')
const rawContent = ref<any>(null)

const form = reactive({
  headerCta: 'listen' as 'listen' | 'donate',
})

onMounted(async () => {
  try {
    const { content, sha: fileSha } = await getContent('content/settings.json')
    sha.value = fileSha
    rawContent.value = content

    if (content.headerCta === 'donate') {
      form.headerCta = 'donate'
    } else {
      form.headerCta = 'listen'
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
    headerCta: form.headerCta,
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
          <p class="mt-1 text-sm text-kteq-muted">Choose which CTA appears in the site header.</p>
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

      <form v-else @submit.prevent="handleSave" class="mt-8">
        <section class="rounded-lg border border-kteq-gray/30 bg-kteq-dark p-6">

          <!-- Header CTA selector -->
          <div>
            <p class="font-display text-sm font-medium text-kteq-light">Header CTA</p>
            <p class="mt-0.5 text-xs text-kteq-muted">The primary action button shown in the top-right of the site header.</p>
            <div class="mt-3 flex gap-2">

              <!-- Listen option -->
              <button
                type="button"
                @click="form.headerCta = 'listen'"
                class="flex items-center gap-2 rounded-md border px-4 py-2.5 font-display text-sm font-medium transition-colors"
                :class="form.headerCta === 'listen'
                  ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                  : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                  <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
                </svg>
                Listen
              </button>

              <!-- Donate option -->
              <button
                type="button"
                @click="form.headerCta = 'donate'"
                class="flex items-center gap-2 rounded-md border px-4 py-2.5 font-display text-sm font-medium transition-colors"
                :class="form.headerCta === 'donate'
                  ? 'border-kteq-yellow/50 bg-kteq-yellow/10 text-kteq-yellow'
                  : 'border-kteq-gray/50 bg-kteq-void text-kteq-muted hover:border-kteq-gray hover:text-kteq-light'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-4 w-4">
                  <path d="M9.653 16.915l-.005-.003-.019-.01a20.759 20.759 0 01-1.162-.682 22.045 22.045 0 01-2.582-2.025 11.566 11.566 0 01-1.95-2.656c-.242-.499-.41-1.023-.41-1.539 0-1.99 1.614-3.5 3.5-3.5.868 0 1.72.328 2.375.876A3.487 3.487 0 0112.5 6.5c1.886 0 3.5 1.51 3.5 3.5 0 .516-.168 1.04-.41 1.539a11.566 11.566 0 01-1.95 2.656 22.045 22.045 0 01-2.582 2.025 20.757 20.757 0 01-1.181.692l-.019.01-.005.002z" />
                </svg>
                Donate
              </button>

            </div>
          </div>

        </section>

        <!-- Hint -->
        <p class="mt-4 text-xs text-kteq-muted">
          Nav link visibility for Schedule, Shows, DJs, Blog, and History is managed from the
          <RouterLink to="/admin" class="text-kteq-yellow/70 transition-colors hover:text-kteq-yellow">dashboard</RouterLink>.
        </p>
      </form>
    </div>
  </div>
</template>
