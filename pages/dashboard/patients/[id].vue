<template>
  <div>
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <i class="pi pi-chevron-right"></i>
      <NuxtLink to="/dashboard/patients">Pacientes</NuxtLink>
      <i class="pi pi-chevron-right"></i>
      <span class="text-neutral-600 font-medium truncate max-w-xs">{{ patient?.name || '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-36 bg-white rounded-xl border border-neutral-100 animate-pulse"></div>
      <div class="h-24 bg-white rounded-xl border border-neutral-100 animate-pulse"></div>
      <div class="h-64 bg-white rounded-xl border border-neutral-100 animate-pulse"></div>
    </div>

    <div v-else-if="patient">
      <!-- Patient header card -->
      <div class="card mb-5">
        <div class="flex flex-col sm:flex-row sm:items-start gap-5">
          <!-- Avatar with upload -->
          <div class="relative flex-shrink-0 group self-start">
            <div class="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md">
              <img
                v-if="patient.photoUrl"
                :src="patient.photoUrl"
                :alt="patient.name"
                class="w-full h-full object-cover"
              />
              <div
                v-else
                class="w-full h-full flex items-center justify-center text-2xl font-bold text-white"
                :style="{ background: avatarGradient(patient.name) }"
              >
                {{ patient.name[0].toUpperCase() }}
              </div>
            </div>
            <!-- Upload overlay -->
            <label
              class="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              :title="'Alterar foto'"
            >
              <i class="pi pi-camera text-white" style="font-size:1rem"></i>
              <input type="file" accept="image/*" class="hidden" @change="uploadPhoto" :disabled="uploadingPhoto" />
            </label>
            <div
              v-if="uploadingPhoto"
              class="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center"
            >
              <span class="spinner w-5 h-5"></span>
            </div>
          </div>

          <!-- Patient info -->
          <div class="flex-1 min-w-0">
            <div class="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <h1 class="text-xl font-bold text-neutral-900">{{ patient.name }}</h1>
                <div class="flex flex-wrap items-center gap-3 mt-1">
                  <span v-if="patient.email" class="text-sm text-neutral-400 flex items-center gap-1">
                    <i class="pi pi-envelope" style="font-size:0.75rem"></i>
                    {{ patient.email }}
                  </span>
                  <span v-if="patient.phone" class="text-sm text-neutral-400 flex items-center gap-1">
                    <i class="pi pi-phone" style="font-size:0.75rem"></i>
                    {{ patient.phone }}
                  </span>
                </div>
              </div>
              <div class="flex gap-2">
                <button @click="showEditModal = true" class="btn-secondary btn-sm">
                  <i class="pi pi-pencil" style="font-size:0.75rem"></i>
                  Editar
                </button>
                <button @click="confirmDelete" class="btn-danger btn-sm">
                  <i class="pi pi-trash" style="font-size:0.75rem"></i>
                  Excluir
                </button>
              </div>
            </div>

            <!-- Stats grid -->
            <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-neutral-100">
              <div v-for="info in patientInfo" :key="info.label" class="text-center">
                <div class="text-lg font-bold text-neutral-900">{{ info.value }}</div>
                <div class="text-[11px] text-neutral-400 mt-0.5">{{ info.label }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tags -->
        <div v-if="patient.restrictions?.length || patient.pathologies?.length" class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-neutral-100">
          <span
            v-for="r in patient.restrictions" :key="r"
            class="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-3 py-1"
          >
            <i class="pi pi-exclamation-triangle mr-1" style="font-size:0.65rem"></i>{{ r }}
          </span>
          <span
            v-for="p in patient.pathologies" :key="p"
            class="text-xs bg-red-50 text-red-700 border border-red-200 rounded-full px-3 py-1"
          >
            <i class="pi pi-heart mr-1" style="font-size:0.65rem"></i>{{ p }}
          </span>
        </div>

        <div v-if="patient.notes" class="mt-4 text-sm text-neutral-500 bg-neutral-50 rounded-xl px-4 py-3 border border-neutral-100">
          <i class="pi pi-file-edit text-neutral-400 mr-1.5" style="font-size:0.8rem"></i>
          {{ patient.notes }}
        </div>
      </div>

      <!-- Generate diet -->
      <div class="card mb-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-neutral-900">
            <i class="pi pi-bolt text-primary-500 mr-1.5" style="font-size:0.9rem"></i>
            Gerar Nova Dieta com IA
          </h2>
        </div>
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="dietTitle"
            class="input flex-1"
            placeholder="Título do plano (ex: Plano de Emagrecimento)"
          />
          <input v-model="validUntil" type="date" class="input sm:w-44" />
          <button
            @click="generateDiet"
            class="btn-primary whitespace-nowrap"
            :disabled="generating"
          >
            <span v-if="generating" class="spinner w-4 h-4"></span>
            <i v-else class="pi pi-sparkles"></i>
            {{ generating ? 'Gerando...' : 'Gerar com IA' }}
          </button>
        </div>
        <p v-if="generating" class="text-xs text-neutral-400 mt-2 animate-pulse">
          <i class="pi pi-spin pi-spinner mr-1"></i>
          Criando um plano personalizado para {{ patient.name }}. Isso pode levar até 30 segundos...
        </p>
        <div v-if="generateError" class="mt-3 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5 border border-red-100">
          <i class="pi pi-times-circle mr-1.5"></i>{{ generateError }}
        </div>
      </div>

      <!-- Diet history -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-bold text-neutral-900">
            Histórico de Planos
            <span class="ml-2 text-sm font-normal text-neutral-400">({{ patient.diets.length }})</span>
          </h2>
        </div>

        <div v-if="patient.diets.length === 0" class="text-center py-10">
          <div class="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-3">
            <i class="pi pi-clipboard text-neutral-300" style="font-size:1.1rem"></i>
          </div>
          <p class="text-sm text-neutral-400">Nenhum plano criado ainda. Use o gerador acima!</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="diet in patient.diets"
            :key="diet.id"
            class="flex items-center gap-4 p-4 border border-neutral-100 rounded-xl hover:border-primary-200 hover:bg-primary-50/30 transition-all group"
          >
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{{ diet.title }}</div>
              <div class="text-xs text-neutral-400 mt-1 flex flex-wrap gap-3">
                <span>
                  <i class="pi pi-calendar mr-1" style="font-size:0.65rem"></i>
                  {{ new Date(diet.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) }}
                </span>
                <span v-if="diet.kcalTarget">
                  <i class="pi pi-bolt mr-1" style="font-size:0.65rem"></i>
                  {{ diet.kcalTarget }} kcal/dia
                </span>
                <span v-if="diet.validUntil" :class="isExpiring(diet.validUntil) ? 'text-red-500' : ''">
                  <i class="pi pi-clock mr-1" style="font-size:0.65rem"></i>
                  Válido até {{ new Date(diet.validUntil).toLocaleDateString('pt-BR') }}
                  <span v-if="isExpiring(diet.validUntil)" class="text-red-500 font-medium"> (expirando!)</span>
                </span>
              </div>
            </div>
            <div class="flex gap-2 flex-shrink-0">
              <NuxtLink :to="`/dashboard/diets/${diet.id}`" class="btn-secondary btn-sm">
                <i class="pi pi-eye" style="font-size:0.7rem"></i>
                Ver
              </NuxtLink>
              <button @click="downloadPdf(diet.id, diet.title)" class="btn-primary btn-sm">
                <i class="pi pi-download" style="font-size:0.7rem"></i>
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" @click.self="showEditModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between p-6 border-b border-neutral-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h3 class="text-lg font-bold">Editar Paciente</h3>
          <button @click="showEditModal = false" class="btn-ghost btn-sm !px-2">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="p-6">
          <PatientForm
            :initial="patient"
            :loading="editLoading"
            :error="editError"
            @submit="handleEdit"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })
const { apiFetch } = useAuth()
const route = useRoute()
const router = useRouter()

const patientId = route.params.id as string
const loading = ref(true)
const generating = ref(false)
const generateError = ref('')
const dietTitle = ref('')
const validUntil = ref('')
const showEditModal = ref(false)
const editLoading = ref(false)
const editError = ref('')
const uploadingPhoto = ref(false)

interface Diet {
  id: string
  title: string
  kcalTarget?: number
  validUntil?: string
  createdAt: string
}

interface Patient {
  id: string
  name: string
  email?: string
  phone?: string
  gender: string
  weight: number
  height: number
  birthDate?: string
  activityLevel: string
  goal: string
  restrictions: string[]
  pathologies: string[]
  notes?: string
  photoUrl?: string
  diets: Diet[]
}

const patient = ref<Patient | null>(null)

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

function isExpiring(validUntil: string) {
  const days = (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 7
}

const goalLabels: Record<string, string> = {
  emagrecimento: 'Emagrecimento',
  ganho_massa: 'Ganho de massa',
  manutencao: 'Manutenção',
  saude: 'Saúde geral',
}
const activityLabels: Record<string, string> = {
  sedentario: 'Sedentário',
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  muito_intenso: 'Extremo',
}

const patientInfo = computed(() => {
  if (!patient.value) return []
  const age = patient.value.birthDate
    ? Math.floor((Date.now() - new Date(patient.value.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null
  const bmi = (patient.value.weight / Math.pow(patient.value.height / 100, 2)).toFixed(1)
  return [
    { label: 'Peso', value: `${patient.value.weight}kg` },
    { label: 'Altura', value: `${patient.value.height}cm` },
    { label: 'IMC', value: bmi },
    { label: 'Objetivo', value: goalLabels[patient.value.goal] || patient.value.goal },
    { label: 'Atividade', value: activityLabels[patient.value.activityLevel] || patient.value.activityLevel },
    ...(age ? [{ label: 'Idade', value: `${age} anos` }] : []),
  ]
})

async function fetchPatient() {
  loading.value = true
  try {
    patient.value = await apiFetch(`/api/patients/${patientId}`)
  } finally {
    loading.value = false
  }
}

async function uploadPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingPhoto.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`/api/patients/${patientId}/photo`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    })
    if (!res.ok) throw new Error('Falha ao enviar foto')
    const { photoUrl } = await res.json()
    if (patient.value) patient.value.photoUrl = photoUrl
  } catch {
    alert('Erro ao enviar a foto. Tente novamente.')
  } finally {
    uploadingPhoto.value = false
  }
}

async function generateDiet() {
  generating.value = true
  generateError.value = ''
  try {
    await apiFetch('/api/diet/generate', {
      method: 'POST',
      body: {
        patientId,
        title: dietTitle.value || undefined,
        validUntil: validUntil.value || undefined,
      },
    })
    dietTitle.value = ''
    validUntil.value = ''
    await fetchPatient()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    generateError.value = e?.data?.statusMessage || 'Erro ao gerar a dieta. Verifique sua chave OpenAI.'
  } finally {
    generating.value = false
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
    alert('Erro ao gerar o PDF. Tente novamente.')
  }
}

async function handleEdit(formData: Record<string, unknown>) {
  editLoading.value = true
  editError.value = ''
  try {
    await apiFetch(`/api/patients/${patientId}`, { method: 'PUT', body: formData })
    showEditModal.value = false
    await fetchPatient()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    editError.value = e?.data?.statusMessage || 'Erro ao salvar.'
  } finally {
    editLoading.value = false
  }
}

async function confirmDelete() {
  if (!confirm(`Tem certeza que deseja excluir ${patient.value?.name}? Todos os planos serão removidos.`)) return
  await apiFetch(`/api/patients/${patientId}`, { method: 'DELETE' })
  await router.push('/dashboard/patients')
}

onMounted(fetchPatient)
</script>
