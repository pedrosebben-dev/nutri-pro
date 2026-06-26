<template>
  <div class="max-w-2xl">
    <div class="page-header">
      <h1 class="page-title">Configurações</h1>
      <p class="page-subtitle">Gerencie seu perfil e dados profissionais.</p>
    </div>

    <!-- Profile -->
    <div class="card mb-6">
      <h2 class="text-base font-semibold text-neutral-900 mb-5">Dados do Perfil</h2>

      <!-- Logo -->
      <div class="mb-6">
        <label class="label">Logo do Consultório</label>
        <div class="flex items-center gap-4">
          <div class="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 flex items-center justify-center overflow-hidden bg-neutral-50">
            <img v-if="user?.logoUrl" :src="user.logoUrl" alt="Logo" class="w-full h-full object-contain" />
            <svg v-else class="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="uploadLogo" />
            <button @click="fileInput?.click()" class="btn-secondary btn-sm" :disabled="logoUploading">
              {{ logoUploading ? 'Enviando...' : 'Alterar logo' }}
            </button>
            <p class="text-xs text-neutral-400 mt-1">PNG, JPG ou SVG • Aparece no PDF das dietas</p>
          </div>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div class="form-group col-span-2">
            <label class="label">Nome completo</label>
            <input v-model="form.name" class="input" required />
          </div>
          <div class="form-group">
            <label class="label">CRN (opcional)</label>
            <input v-model="form.crn" class="input" placeholder="CRN-X 12345" />
          </div>
          <div class="form-group">
            <label class="label">Telefone (opcional)</label>
            <input v-model="form.phone" class="input" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div v-if="profileSuccess" class="text-sm text-primary-600 bg-primary-50 rounded-lg px-4 py-2">
          ✅ Perfil atualizado com sucesso!
        </div>
        <div v-if="profileError" class="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
          {{ profileError }}
        </div>

        <button type="submit" class="btn-primary" :disabled="profileLoading">
          {{ profileLoading ? 'Salvando...' : 'Salvar perfil' }}
        </button>
      </form>
    </div>

    <!-- Change Password -->
    <div class="card">
      <h2 class="text-base font-semibold text-neutral-900 mb-5">Alterar Senha</h2>
      <form @submit.prevent="changePassword" class="space-y-4">
        <div class="form-group">
          <label class="label">Senha atual</label>
          <input v-model="pwForm.currentPassword" type="password" class="input" required />
        </div>
        <div class="form-group">
          <label class="label">Nova senha</label>
          <input v-model="pwForm.newPassword" type="password" class="input" minlength="8" required />
        </div>
        <div v-if="pwSuccess" class="text-sm text-primary-600 bg-primary-50 rounded-lg px-4 py-2">
          ✅ Senha alterada com sucesso!
        </div>
        <div v-if="pwError" class="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
          {{ pwError }}
        </div>
        <button type="submit" class="btn-primary" :disabled="pwLoading">
          {{ pwLoading ? 'Alterando...' : 'Alterar senha' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })
const { user, apiFetch, fetchMe } = useAuth()

const fileInput = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)

const form = reactive({
  name: user.value?.name || '',
  crn: user.value?.crn || '',
  phone: user.value?.phone || '',
})

const pwForm = reactive({ currentPassword: '', newPassword: '' })

const profileLoading = ref(false)
const profileError = ref('')
const profileSuccess = ref(false)
const pwLoading = ref(false)
const pwError = ref('')
const pwSuccess = ref(false)

watch(user, (u) => {
  if (u) {
    form.name = u.name || ''
    form.crn = u.crn || ''
    form.phone = u.phone || ''
  }
})

async function uploadLogo(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  logoUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const token = localStorage.getItem('auth_token')
    await fetch('/api/auth/logo', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: fd,
    })
    await fetchMe()
  } finally {
    logoUploading.value = false
  }
}

async function saveProfile() {
  profileLoading.value = true
  profileError.value = ''
  profileSuccess.value = false
  try {
    await apiFetch('/api/auth/settings', { method: 'PUT', body: form })
    await fetchMe()
    profileSuccess.value = true
    setTimeout(() => { profileSuccess.value = false }, 3000)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    profileError.value = e?.data?.statusMessage || 'Erro ao salvar perfil.'
  } finally {
    profileLoading.value = false
  }
}

async function changePassword() {
  pwLoading.value = true
  pwError.value = ''
  pwSuccess.value = false
  try {
    await apiFetch('/api/auth/settings', { method: 'PUT', body: pwForm })
    pwSuccess.value = true
    pwForm.currentPassword = ''
    pwForm.newPassword = ''
    setTimeout(() => { pwSuccess.value = false }, 3000)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    pwError.value = e?.data?.statusMessage || 'Erro ao alterar senha.'
  } finally {
    pwLoading.value = false
  }
}
</script>
