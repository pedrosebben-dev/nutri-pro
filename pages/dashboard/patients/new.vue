<template>
  <div class="max-w-2xl">
    <div class="page-header">
      <NuxtLink to="/dashboard/patients" class="text-sm text-neutral-400 hover:text-primary-600 flex items-center gap-1 mb-3">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        Voltar
      </NuxtLink>
      <h1 class="page-title">Novo Paciente</h1>
      <p class="page-subtitle">Preencha os dados para cadastrar um novo paciente.</p>
    </div>

    <div class="card">
      <PatientForm :loading="loading" :error="errorMsg" @submit="handleSubmit" />
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })
const { apiFetch } = useAuth()
const router = useRouter()

const loading = ref(false)
const errorMsg = ref('')

async function handleSubmit(formData: Record<string, unknown>) {
  loading.value = true
  errorMsg.value = ''
  try {
    const patient = await apiFetch<{ id: string }>('/api/patients', {
      method: 'POST',
      body: formData,
    })
    await router.push(`/dashboard/patients/${patient.id}`)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e?.data?.statusMessage || 'Erro ao cadastrar paciente.'
  } finally {
    loading.value = false
  }
}
</script>
