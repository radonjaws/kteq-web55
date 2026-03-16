import { ref } from 'vue'

const OWNER = 'radonjaws'
const REPO = 'kteq-web55'
const BRANCH = 'main'

interface GitHubFile {
  content: any
  sha: string
}

function getToken(): string | null {
  return localStorage.getItem('kteq-admin-token')
}

function headers(): Record<string, string> {
  const token = getToken()
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
  }
}

/**
 * Verify a GitHub PAT has access to the repo
 */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Read a content file from the repo
 */
export async function getContent(path: string): Promise<GitHubFile> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  const data = await res.json()
  // atob() produces a binary (Latin-1) string. Use the escape/decodeURIComponent
  // trick to correctly reconstruct the UTF-8 text before parsing JSON.
  // This is the exact inverse of the btoa(unescape(encodeURIComponent(...))) write path.
  const content = JSON.parse(decodeURIComponent(escape(atob(data.content))))
  return { content, sha: data.sha }
}

/**
 * Write/update a content file in the repo
 */
export async function putContent(
  path: string,
  content: any,
  sha: string,
  message: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
        sha,
        branch: BRANCH
      })
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || `Failed to update ${path}`)
  }
  const data = await res.json()
  return data.content.sha
}

/**
 * Create a new file in the repo
 */
export async function createContent(
  path: string,
  content: any,
  message: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        message,
        content: btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2)))),
        branch: BRANCH
      })
    }
  )
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.message || `Failed to create ${path}`)
  }
  const data = await res.json()
  return data.content.sha
}

/**
 * Delete a file from the repo
 */
export async function deleteContent(
  path: string,
  sha: string,
  message: string
): Promise<void> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`,
    {
      method: 'DELETE',
      headers: headers(),
      body: JSON.stringify({
        message,
        sha,
        branch: BRANCH
      })
    }
  )
  if (!res.ok) throw new Error(`Failed to delete ${path}`)
}

/**
 * List files in a directory
 */
export async function listContent(path: string): Promise<{ name: string; path: string; sha: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`Failed to list ${path}`)
  const data = await res.json()
  return Array.isArray(data) ? data.map((f: any) => ({ name: f.name, path: f.path, sha: f.sha })) : []
}

/**
 * Composable for use in admin components
 */
export function useGitHub() {
  const saving = ref(false)
  const error = ref<string | null>(null)
  const lastSaved = ref<Date | null>(null)

  async function save(path: string, content: any, sha: string, message: string): Promise<string | null> {
    saving.value = true
    error.value = null
    try {
      const newSha = await putContent(path, content, sha, message)
      lastSaved.value = new Date()
      return newSha
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      saving.value = false
    }
  }

  async function create(path: string, content: any, message: string): Promise<string | null> {
    saving.value = true
    error.value = null
    try {
      const newSha = await createContent(path, content, message)
      lastSaved.value = new Date()
      return newSha
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      saving.value = false
    }
  }

  async function destroy(path: string, sha: string, message: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      await deleteContent(path, sha, message)
      return true
    } catch (e: any) {
      error.value = e.message
      return false
    } finally {
      saving.value = false
    }
  }

  return { saving, error, lastSaved, save, create, destroy, getContent, putContent, createContent, deleteContent, listContent }
}
