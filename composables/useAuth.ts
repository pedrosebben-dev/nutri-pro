interface User {
  id: string
  email: string
  name: string
  crn?: string | null
  phone?: string | null
  logoUrl?: string | null
}

const user = ref<User | null>(null)
const token = ref<string | null>(null)
const initialized = ref(false)

export function useAuth() {
  const router = useRouter()

  async function login(email: string, password: string) {
    const data = await $fetch<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    token.value = data.token
    user.value = data.user

    if (process.client) {
      localStorage.setItem('auth_token', data.token)
    }

    await router.push('/dashboard')
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    user.value = null
    token.value = null
    if (process.client) {
      localStorage.removeItem('auth_token')
    }
    await router.push('/login')
  }

  async function fetchMe() {
    try {
      const storedToken = process.client ? localStorage.getItem('auth_token') : null
      if (storedToken) token.value = storedToken

      user.value = await $fetch<User>('/api/auth/me', {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      })
    } catch {
      user.value = null
      token.value = null
    } finally {
      initialized.value = true
    }
  }

  function apiFetch<T>(url: string, options: Record<string, unknown> = {}) {
    return $fetch<T>(url, {
      ...options,
      headers: {
        ...(options.headers as Record<string, string> || {}),
        ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
      },
    })
  }

  function setUser(u: User, t?: string) {
    user.value = u
    if (t) {
      token.value = t
      if (process.client) localStorage.setItem('auth_token', t)
    }
  }

  const isLoggedIn = computed(() => !!user.value)

  return {
    user: readonly(user),
    token: readonly(token),
    isLoggedIn,
    initialized: readonly(initialized),
    login,
    logout,
    fetchMe,
    apiFetch,
    setUser,
  }
}
