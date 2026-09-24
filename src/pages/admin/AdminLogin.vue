<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { verifyToken } from '@/composables/useGitHub'

const router = useRouter()
const token = ref('')
const loading = ref(false)
const error = ref('')

async function login() {
  if (!token.value.trim()) return
  loading.value = true
  error.value = ''
  
  const result = await verifyToken(token.value.trim())
  if (result.ok) {
    localStorage.setItem('kteq-admin-token', token.value.trim())
    if (result.login) localStorage.setItem('kteq-admin-user', result.login)
    router.push('/admin')
  } else {
    error.value = result.error || 'Sign-in failed.'
  }
  loading.value = false
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-kteq-black px-4">
    <div class="w-full max-w-sm">
      <div class="text-center mb-8">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-kteq-yellow font-display text-lg font-bold text-kteq-black">K</div>
        <h1 class="mt-4 font-display text-xl font-bold text-kteq-white">KTEQ Admin</h1>
        <p class="mt-1 text-sm text-kteq-muted">Sign in with your personal GitHub token.</p>
      </div>

      <div class="space-y-4">
        <div>
          <label for="token" class="block font-display text-xs font-semibold uppercase tracking-widest text-kteq-muted mb-2">GitHub Personal Access Token</label>
          <input
            id="token"
            v-model="token"
            type="password"
            placeholder="github_pat_..."
            @keyup.enter="login"
            class="w-full rounded-md border border-kteq-gray bg-kteq-dark px-4 py-3 font-mono text-sm text-kteq-light placeholder-kteq-muted outline-none transition-colors focus:border-kteq-yellow"
          />
        </div>
        <div v-if="error" class="rounded-md border border-kteq-red/30 bg-kteq-red/10 px-3 py-2 text-sm text-kteq-red">{{ error }}</div>
        <button
          @click="login"
          :disabled="loading || !token.trim()"
          class="w-full rounded-md bg-kteq-yellow px-4 py-3 font-display text-sm font-semibold text-kteq-black transition-all hover:bg-kteq-yellow-bright disabled:opacity-50"
        >
          {{ loading ? 'Verifying...' : 'Sign In' }}
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-kteq-muted">
        The token is stored in your browser only and is never sent anywhere except GitHub's API.
      </p>
    </div>
  </div>
</template>
