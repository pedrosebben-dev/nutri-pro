<template>
  <div>
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <i class="pi pi-chevron-right"></i>
      <span class="text-neutral-600 font-medium">Planos Alimentares</span>
    </nav>

    <!-- Page header -->
    <div class="page-header flex items-start justify-between">
      <div>
        <h1 class="page-title">Planos Alimentares</h1>
        <p class="page-subtitle">
          <span v-if="!loading">{{ diets.length }} plano{{ diets.length !== 1 ? 's' : '' }} criado{{ diets.length !== 1 ? 's' : '' }}</span>
          <span v-else>Carregando...</span>
        </p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-5 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 max-w-sm">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style="font-size:0.8rem"></i>
        <input
          v-model="search"
          type="search"
          class="input pl-9"
          placeholder="Buscar por paciente ou título..."
        />
      </div>
      <select v-model="filterStatus" class="select w-full sm:w-48">
        <option value="">Todos os status</option>
        <option value="active">Ativos</option>
        <option value="expiring">Expirando em 7 dias</option>
        <option value="expired">Expirados</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="card p-0 overflow-hidden">
      <div v-for="i in 6" :key="i" class="flex items-center gap-4 px-6 py-4 border-b border-neutral-50">
        <div class="w-10 h-10 rounded-full bg-neutral-100 animate-pulse flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-neutral-100 rounded animate-pulse w-1/3"></div>
          <div class="h-3 bg-neutral-100 rounded animate-pulse w-1/5"></div>
        </div>
        <div class="h-5 w-16 bg-neutral-100 rounded-full animate-pulse hidden md:block"></div>
        <div class="h-8 w-20 bg-neutral-100 rounded animate-pulse"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredDiets.length === 0" class="card py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
        <i class="pi pi-clipboard text-neutral-300" style="font-size:1.6rem"></i>
      </div>
      <h3 class="text-base font-semibold text-neutral-700 mb-1">
        {{ search || filterStatus ? 'Nenhum plano encontrado' : 'Nenhum plano ainda' }}
      </h3>
      <p class="text-sm text-neutral-400 mb-6 max-w-xs mx-auto">
        {{ search || filterStatus ? 'Tente outros filtros.' : 'Os planos gerados para seus pacientes aparecem aqui.' }}
      </p>
      <NuxtLink v-if="!search && !filterStatus" to="/dashboard/patients" class="btn-primary mx-auto">
        <i class="pi pi-users"></i>
        Ver pacientes
      </NuxtLink>
    </div>

    <!-- Diets list -->
    <div v-else class="card p-0 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-neutral-50 border-b border-neutral-100">
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Plano</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden sm:table-cell">Paciente</th>
            <th class="text-center px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Validade</th>
            <th class="text-center px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
            <th class="text-right px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="diet in filteredDiets"
            :key="diet.id"
            class="border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors group last:border-0"
          >
            <!-- Diet title -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-file-edit text-primary-500" style="font-size:0.85rem"></i>
                </div>
                <div class="min-w-0">
                  <NuxtLink
                    :to="`/dashboard/diets/${diet.id}`"
                    class="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors block truncate"
                  >
                    {{ diet.title }}
                  </NuxtLink>
                  <p class="text-xs text-neutral-400 mt-0.5">
                    {{ new Date(diet.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }}
                  </p>
                </div>
              </div>
            </td>

            <!-- Patient -->
            <td class="px-4 py-4 hidden sm:table-cell">
              <NuxtLink
                :to="`/dashboard/patients/${diet.patient.id}`"
                class="flex items-center gap-2 group/patient"
              >
                <div
                  class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  :style="{ background: avatarGradient(diet.patient.name) }"
                >
                  {{ diet.patient.name[0].toUpperCase() }}
                </div>
                <span class="text-sm text-neutral-600 group-hover/patient:text-primary-600 transition-colors truncate">
                  {{ diet.patient.name }}
                </span>
              </NuxtLink>
            </td>

            <!-- Valid until -->
            <td class="px-4 py-4 text-center hidden md:table-cell">
              <span v-if="diet.validUntil" class="text-xs text-neutral-500">
                {{ new Date(diet.validUntil).toLocaleDateString('pt-BR') }}
              </span>
              <span v-else class="text-neutral-300 text-xs">—</span>
            </td>

            <!-- Status -->
            <td class="px-4 py-4 text-center hidden lg:table-cell">
              <span :class="statusBadge(diet.validUntil).cls" class="badge">
                {{ statusBadge(diet.validUntil).label }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-right">
              <div class="flex items-center justify-end gap-2">
                <NuxtLink :to="`/dashboard/diets/${diet.id}`" class="btn-secondary btn-sm">
                  <i class="pi pi-eye" style="font-size:0.75rem"></i>
                  Ver
                </NuxtLink>
                <button @click="downloadPdf(diet.id, diet.title)" class="btn-ghost btn-sm !px-2" title="Baixar PDF">
                  <i class="pi pi-download" style="font-size:0.8rem"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })
const { apiFetch } = useAuth()

interface Diet {
  id: string
  title: string
  createdAt: string
  validUntil?: string | null
  patient: { id: string; name: string }
}

const search = ref('')
const filterStatus = ref('')
const loading = ref(true)
const diets = ref<Diet[]>([])

const avatarGradients = [
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #3b82f6, #2563eb)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
]

function avatarGradient(name: string) {
  const idx = name.charCodeAt(0) % avatarGradients.length
  return avatarGradients[idx]
}

function statusBadge(validUntil?: string | null) {
  if (!validUntil) return { cls: 'badge-gray', label: 'Sem validade' }
  const days = (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (days < 0) return { cls: 'badge-red', label: 'Expirado' }
  if (days <= 7) return { cls: 'badge-yellow', label: 'Expirando' }
  return { cls: 'badge-green', label: 'Ativo' }
}

function dietStatusKey(validUntil?: string | null) {
  if (!validUntil) return 'noexpiry'
  const days = (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  if (days < 0) return 'expired'
  if (days <= 7) return 'expiring'
  return 'active'
}

const filteredDiets = computed(() => {
  return diets.value.filter(d => {
    const matchSearch = !search.value || (
      d.title.toLowerCase().includes(search.value.toLowerCase()) ||
      d.patient.name.toLowerCase().includes(search.value.toLowerCase())
    )
    const matchStatus = !filterStatus.value || dietStatusKey(d.validUntil) === filterStatus.value
    return matchSearch && matchStatus
  })
})

async function fetchDiets() {
  loading.value = true
  try {
    diets.value = await apiFetch('/api/diet')
  } finally {
    loading.value = false
  }
}

async function downloadPdf(dietId: string, title: string) {
  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/pdf/${dietId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) throw new Error()
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('Erro ao gerar o PDF.')
  }
}

onMounted(fetchDiets)
</script>
