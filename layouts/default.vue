<template>
  <div class="min-h-screen bg-neutral-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 flex flex-col fixed inset-y-0 left-0 z-30 shadow-2xl">
      <!-- Brand -->
      <div class="px-5 py-5 border-b border-white/5 flex-shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg flex-shrink-0">
            <i class="pi pi-heart text-white" style="font-size: 0.85rem"></i>
          </div>
          <div class="min-w-0">
            <p class="text-base font-bold text-white tracking-tight leading-none">NutriPro</p>
            <p v-if="user?.crn" class="text-[10px] text-slate-500 font-medium mt-0.5">CRN: {{ user.crn }}</p>
            <p v-else class="text-[10px] text-slate-500 mt-0.5">Nutricionista</p>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-3 py-4 overflow-y-auto space-y-px">
        <p class="sidebar-section-label">Geral</p>
        <NuxtLink
          to="/dashboard"
          class="nav-item"
          :class="route.path === '/dashboard' ? 'nav-item-active' : 'nav-item-inactive'"
        >
          <i class="pi pi-th-large"></i>
          <span>Dashboard</span>
        </NuxtLink>

        <p class="sidebar-section-label mt-5">Clínica</p>
        <NuxtLink
          to="/dashboard/patients"
          class="nav-item"
          :class="isActive('/dashboard/patients') && route.path !== '/dashboard/patients/new' ? 'nav-item-active' : 'nav-item-inactive'"
        >
          <i class="pi pi-users"></i>
          <span class="flex-1">Pacientes</span>
          <span
            v-if="sidebarPatients.length"
            class="text-[10px] bg-white/10 text-slate-400 px-1.5 py-0.5 rounded-full font-semibold leading-none"
          >
            {{ sidebarPatients.length }}
          </span>
        </NuxtLink>

        <NuxtLink
          to="/dashboard/patients/new"
          class="nav-item"
          :class="route.path === '/dashboard/patients/new' ? 'nav-item-active' : 'nav-item-inactive'"
        >
          <i class="pi pi-user-plus"></i>
          <span>Novo Paciente</span>
        </NuxtLink>

        <!-- Recent patients -->
        <div v-if="sidebarPatients.length" class="space-y-px pt-0.5">
          <NuxtLink
            v-for="p in sidebarPatients.slice(0, 5)"
            :key="p.id"
            :to="`/dashboard/patients/${p.id}`"
            class="flex items-center gap-2.5 pl-8 pr-3 py-1.5 rounded-lg text-[12px] transition-all"
            :class="route.path === `/dashboard/patients/${p.id}` ? 'text-emerald-400 bg-white/5' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'"
          >
            <div class="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-[8px] font-bold text-slate-300">
              {{ p.name[0].toUpperCase() }}
            </div>
            <span class="truncate">{{ p.name }}</span>
          </NuxtLink>
        </div>

        <p class="sidebar-section-label mt-5">Planos</p>
        <NuxtLink
          to="/dashboard/diets"
          class="nav-item"
          :class="route.path === '/dashboard/diets' ? 'nav-item-active' : 'nav-item-inactive'"
        >
          <i class="pi pi-clipboard"></i>
          <span>Todos os Planos</span>
        </NuxtLink>

        <!-- Recent diets -->
        <div v-if="sidebarDiets.length" class="space-y-px pt-0.5">
          <NuxtLink
            v-for="diet in sidebarDiets"
            :key="diet.id"
            :to="`/dashboard/diets/${diet.id}`"
            class="flex items-center gap-2.5 pl-8 pr-3 py-1.5 rounded-lg text-[12px] transition-all"
            :class="route.path === `/dashboard/diets/${diet.id}` ? 'text-emerald-400 bg-white/5' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'"
          >
            <i class="pi pi-eye flex-shrink-0" style="font-size:0.6rem"></i>
            <span class="truncate">{{ diet.patient.name }}</span>
          </NuxtLink>
        </div>

        <p class="sidebar-section-label mt-5">Conta</p>
        <NuxtLink
          to="/dashboard/settings"
          class="nav-item"
          :class="route.path === '/dashboard/settings' ? 'nav-item-active' : 'nav-item-inactive'"
        >
          <i class="pi pi-cog"></i>
          <span>Configurações</span>
        </NuxtLink>
      </nav>

      <!-- Bottom user card -->
      <div class="flex-shrink-0 px-3 pb-4 pt-2 border-t border-white/5">
        <div class="bg-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 shadow">
            <span class="text-xs font-bold text-white">{{ user?.name?.[0]?.toUpperCase() ?? 'N' }}</span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-white truncate leading-none">{{ user?.name }}</p>
            <p class="text-[10px] text-slate-500 truncate mt-0.5">{{ user?.crn || user?.email }}</p>
          </div>
          <button
            @click="logout"
            title="Sair"
            class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <i class="pi pi-sign-out text-slate-500 hover:text-red-400 transition-colors" style="font-size: 0.75rem"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 ml-64">
      <main class="p-8 max-w-7xl mx-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const { user, logout, apiFetch } = useAuth()
const route = useRoute()

interface SidebarPatient { id: string; name: string }
interface SidebarDiet { id: string; patient: { id: string; name: string } }

const sidebarPatients = ref<SidebarPatient[]>([])
const sidebarDiets = ref<SidebarDiet[]>([])

function isActive(path: string) {
  return route.path.startsWith(path)
}

async function loadSidebarData() {
  try {
    const [patients, diets] = await Promise.all([
      apiFetch<SidebarPatient[]>('/api/patients'),
      apiFetch<SidebarDiet[]>('/api/diet'),
    ])
    sidebarPatients.value = patients
    sidebarDiets.value = diets.slice(0, 5)
  } catch {
    // sidebar data is non-critical
  }
}

onMounted(loadSidebarData)
provide('refreshSidebar', loadSidebarData)
</script>
