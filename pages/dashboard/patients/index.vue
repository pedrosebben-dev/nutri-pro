<template>
  <div>
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <i class="pi pi-chevron-right"></i>
      <span class="text-neutral-600 font-medium">Pacientes</span>
    </nav>

    <!-- Page header -->
    <div class="page-header flex items-start justify-between">
      <div>
        <h1 class="page-title">Pacientes</h1>
        <p class="page-subtitle">
          <span v-if="!loading">{{ patients.length }} paciente{{ patients.length !== 1 ? 's' : '' }} cadastrado{{ patients.length !== 1 ? 's' : '' }}</span>
          <span v-else>Carregando...</span>
        </p>
      </div>
      <NuxtLink to="/dashboard/patients/new" class="btn-primary">
        <i class="pi pi-user-plus"></i>
        Novo Paciente
      </NuxtLink>
    </div>

    <!-- Search + filter bar -->
    <div class="mb-5 flex flex-col sm:flex-row gap-3">
      <div class="relative flex-1 max-w-sm">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" style="font-size:0.8rem"></i>
        <input
          v-model="search"
          type="search"
          class="input pl-9"
          placeholder="Buscar por nome ou e-mail..."
          @input="debouncedSearch"
        />
      </div>
      <select v-model="filterGoal" class="select w-full sm:w-48" @change="fetchPatients">
        <option value="">Todos os objetivos</option>
        <option value="emagrecimento">Emagrecimento</option>
        <option value="ganho_massa">Ganho de massa</option>
        <option value="manutencao">Manutenção</option>
        <option value="saude">Saúde geral</option>
      </select>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="card p-0 overflow-hidden">
      <div class="px-6 py-3 bg-neutral-50 border-b border-neutral-100 flex gap-8">
        <div class="h-3 w-24 bg-neutral-200 rounded animate-pulse"></div>
        <div class="h-3 w-16 bg-neutral-200 rounded animate-pulse hidden md:block"></div>
        <div class="h-3 w-12 bg-neutral-200 rounded animate-pulse hidden lg:block ml-auto"></div>
      </div>
      <div v-for="i in 5" :key="i" class="flex items-center gap-4 px-6 py-4 border-b border-neutral-50">
        <div class="w-10 h-10 rounded-full bg-neutral-100 animate-pulse flex-shrink-0"></div>
        <div class="flex-1 space-y-2">
          <div class="h-3.5 bg-neutral-100 rounded animate-pulse w-1/3"></div>
          <div class="h-3 bg-neutral-100 rounded animate-pulse w-1/4"></div>
        </div>
        <div class="h-5 w-20 bg-neutral-100 rounded-full animate-pulse hidden md:block"></div>
        <div class="h-5 w-8 bg-neutral-100 rounded animate-pulse"></div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredPatients.length === 0" class="card py-20 text-center">
      <div class="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
        <i class="pi pi-users text-neutral-300" style="font-size:1.6rem"></i>
      </div>
      <h3 class="text-base font-semibold text-neutral-700 mb-1">
        {{ search || filterGoal ? 'Nenhum paciente encontrado' : 'Nenhum paciente ainda' }}
      </h3>
      <p class="text-sm text-neutral-400 mb-6 max-w-xs mx-auto">
        {{ search || filterGoal ? 'Tente outros filtros de busca.' : 'Comece cadastrando seu primeiro paciente.' }}
      </p>
      <NuxtLink v-if="!search && !filterGoal" to="/dashboard/patients/new" class="btn-primary mx-auto">
        <i class="pi pi-user-plus"></i>
        Cadastrar primeiro paciente
      </NuxtLink>
    </div>

    <!-- Patient table -->
    <div v-else class="card p-0 overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="bg-neutral-50 border-b border-neutral-100">
            <th class="text-left px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Paciente</th>
            <th class="text-left px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden md:table-cell">Objetivo</th>
            <th class="text-center px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider hidden lg:table-cell">IMC</th>
            <th class="text-center px-4 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Dietas</th>
            <th class="text-right px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="patient in filteredPatients"
            :key="patient.id"
            class="border-b border-neutral-50 hover:bg-neutral-50/80 transition-colors group last:border-0"
          >
            <!-- Patient info -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3.5">
                <div class="flex-shrink-0">
                  <img
                    v-if="patient.photoUrl"
                    :src="patient.photoUrl"
                    :alt="patient.name"
                    class="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                  <div
                    v-else
                    class="w-11 h-11 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm text-sm font-bold text-white"
                    :style="{ background: avatarGradient(patient.name) }"
                  >
                    {{ patient.name[0].toUpperCase() }}
                  </div>
                </div>
                <div class="min-w-0">
                  <NuxtLink
                    :to="`/dashboard/patients/${patient.id}`"
                    class="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors block truncate"
                  >
                    {{ patient.name }}
                  </NuxtLink>
                  <p class="text-xs text-neutral-400 truncate mt-0.5">
                    {{ patient.email || 'Sem e-mail cadastrado' }}
                  </p>
                </div>
              </div>
            </td>

            <!-- Goal -->
            <td class="px-4 py-4 hidden md:table-cell">
              <span :class="goalBadgeClass(patient.goal)">
                {{ goalLabels[patient.goal] || patient.goal }}
              </span>
            </td>

            <!-- BMI -->
            <td class="px-4 py-4 text-center hidden lg:table-cell">
              <span v-if="patient.weight && patient.height" :class="bmiBadge(patient.weight, patient.height).cls">
                {{ bmiBadge(patient.weight, patient.height).value }}
              </span>
              <span v-else class="text-neutral-300 text-xs">—</span>
            </td>

            <!-- Diet count -->
            <td class="px-4 py-4 text-center">
              <span
                class="text-sm font-bold"
                :class="patient._count.diets > 0 ? 'text-primary-600' : 'text-neutral-300'"
              >
                {{ patient._count.diets }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4">
              <div class="flex items-center justify-end gap-1.5">
                <NuxtLink
                  :to="`/dashboard/patients/${patient.id}`"
                  class="btn-secondary btn-sm hidden sm:inline-flex"
                >
                  <i class="pi pi-eye" style="font-size:0.75rem"></i>
                  Ver
                </NuxtLink>
                <div class="relative">
                  <button
                    @click.stop="toggleMenu(patient.id)"
                    class="btn-ghost btn-sm !px-2 !py-1.5"
                  >
                    <i class="pi pi-ellipsis-v" style="font-size:0.85rem"></i>
                  </button>
                  <!-- Dropdown -->
                  <div
                    v-if="activeMenu === patient.id"
                    class="dropdown-menu"
                  >
                    <NuxtLink :to="`/dashboard/patients/${patient.id}`" class="dropdown-item">
                      <i class="pi pi-eye"></i>
                      Ver detalhes
                    </NuxtLink>
                    <button class="dropdown-item" @click="openEdit(patient)">
                      <i class="pi pi-pencil"></i>
                      Editar paciente
                    </button>
                    <NuxtLink :to="`/dashboard/patients/${patient.id}?tab=generate`" class="dropdown-item">
                      <i class="pi pi-bolt"></i>
                      Gerar dieta com IA
                    </NuxtLink>
                    <div class="border-t border-neutral-100 my-1"></div>
                    <button class="dropdown-item !text-red-500 hover:!bg-red-50" @click="confirmDelete(patient)">
                      <i class="pi pi-trash !text-red-400"></i>
                      Remover paciente
                    </button>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Delete confirmation modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" @click.self="showDeleteModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i class="pi pi-trash text-red-600" style="font-size:1.1rem"></i>
        </div>
        <h3 class="text-lg font-bold text-neutral-900 text-center mb-1">Remover Paciente</h3>
        <p class="text-sm text-neutral-500 text-center mb-6">
          Tem certeza que deseja remover <strong class="text-neutral-800">{{ patientToDelete?.name }}</strong>?
          Todos os planos serão excluídos permanentemente.
        </p>
        <div class="flex gap-3">
          <button @click="showDeleteModal = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="deletePatient" class="btn-danger flex-1" :disabled="deleting">
            <span v-if="deleting" class="spinner w-4 h-4"></span>
            {{ deleting ? 'Removendo...' : 'Remover' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit modal -->
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
            v-if="patientToEdit"
            :initial="patientToEdit"
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

interface Patient {
  id: string
  name: string
  email?: string
  photoUrl?: string
  weight: number
  height: number
  goal: string
  restrictions: string[]
  createdAt: string
  _count: { diets: number }
}

const search = ref('')
const filterGoal = ref('')
const loading = ref(true)
const patients = ref<Patient[]>([])
const activeMenu = ref<string | null>(null)

const showDeleteModal = ref(false)
const patientToDelete = ref<Patient | null>(null)
const deleting = ref(false)

const showEditModal = ref(false)
const patientToEdit = ref<Patient | null>(null)
const editLoading = ref(false)
const editError = ref('')

const goalLabels: Record<string, string> = {
  emagrecimento: 'Emagrecimento',
  ganho_massa: 'Ganho de massa',
  manutencao: 'Manutenção',
  saude: 'Saúde geral',
}

const filteredPatients = computed(() => {
  if (!filterGoal.value) return patients.value
  return patients.value.filter(p => p.goal === filterGoal.value)
})

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

function goalBadgeClass(goal: string) {
  const map: Record<string, string> = {
    emagrecimento: 'badge badge-yellow',
    ganho_massa: 'badge badge-blue',
    manutencao: 'badge badge-green',
    saude: 'badge badge-gray',
  }
  return map[goal] || 'badge badge-gray'
}

function bmiBadge(weight: number, height: number) {
  const bmi = weight / Math.pow(height / 100, 2)
  const value = bmi.toFixed(1)
  if (bmi < 18.5) return { value, cls: 'badge badge-yellow' }
  if (bmi < 25) return { value, cls: 'badge badge-green' }
  if (bmi < 30) return { value, cls: 'badge badge-yellow' }
  return { value, cls: 'badge badge-red' }
}

function toggleMenu(id: string) {
  activeMenu.value = activeMenu.value === id ? null : id
}

async function openEdit(patient: Patient) {
  activeMenu.value = null
  showEditModal.value = true
  editLoading.value = true
  try {
    const full = await apiFetch(`/api/patients/${patient.id}`)
    patientToEdit.value = full as Patient
  } catch {
    patientToEdit.value = patient
  } finally {
    editLoading.value = false
  }
}

function confirmDelete(patient: Patient) {
  patientToDelete.value = patient
  showDeleteModal.value = true
  activeMenu.value = null
}

async function deletePatient() {
  if (!patientToDelete.value) return
  deleting.value = true
  try {
    await apiFetch(`/api/patients/${patientToDelete.value.id}`, { method: 'DELETE' })
    patients.value = patients.value.filter(p => p.id !== patientToDelete.value!.id)
    showDeleteModal.value = false
  } finally {
    deleting.value = false
  }
}

async function handleEdit(formData: Record<string, unknown>) {
  if (!patientToEdit.value) return
  editLoading.value = true
  editError.value = ''
  try {
    const updated = await apiFetch(`/api/patients/${patientToEdit.value.id}`, {
      method: 'PUT',
      body: formData,
    })
    const idx = patients.value.findIndex(p => p.id === patientToEdit.value!.id)
    if (idx !== -1) patients.value[idx] = { ...patients.value[idx], ...(updated as Patient) }
    showEditModal.value = false
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    editError.value = e?.data?.statusMessage || 'Erro ao salvar as alterações.'
  } finally {
    editLoading.value = false
  }
}

async function fetchPatients() {
  loading.value = true
  try {
    const params = search.value ? `?search=${encodeURIComponent(search.value)}` : ''
    patients.value = await apiFetch(`/api/patients${params}`)
  } finally {
    loading.value = false
  }
}

let searchTimeout: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(fetchPatients, 400)
}

function handleDocumentClick() {
  activeMenu.value = null
}

onMounted(() => {
  fetchPatients()
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
