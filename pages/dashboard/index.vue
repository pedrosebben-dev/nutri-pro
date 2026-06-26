<template>
  <div>
    <!-- Welcome banner -->
    <div class="flex items-start justify-between mb-8">
      <div>
        <p class="text-sm font-medium text-primary-600 mb-1">{{ formattedDate }}</p>
        <h1 class="text-2xl font-bold text-neutral-900">Olá, {{ firstName }}!</h1>
        <p class="text-neutral-500 mt-1 text-sm">Aqui está o resumo do seu consultório.</p>
      </div>
      <div class="flex items-center gap-3">
        <img
          v-if="user?.logoUrl"
          :src="user.logoUrl"
          alt="Logo do consultório"
          class="h-14 w-auto object-contain rounded-xl border border-neutral-100 shadow-sm"
        />
        <NuxtLink to="/dashboard/patients/new" class="btn-primary">
          <i class="pi pi-user-plus"></i>
          Novo Paciente
        </NuxtLink>
      </div>
    </div>

    <!-- Stats cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Pacientes</span>
          <div class="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
            <i class="pi pi-users text-primary-600" style="font-size: 1rem"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-neutral-900">{{ loading ? '—' : (statsData?.totalPatients ?? 0) }}</div>
        <p class="text-xs text-neutral-400 mt-1">total cadastrados</p>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Dietas</span>
          <div class="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <i class="pi pi-file-edit text-blue-600" style="font-size: 1rem"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-neutral-900">{{ loading ? '—' : (statsData?.totalDiets ?? 0) }}</div>
        <p class="text-xs text-neutral-400 mt-1">planos gerados</p>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Expirando</span>
          <div class="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <i class="pi pi-clock text-amber-500" style="font-size: 1rem"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-neutral-900">{{ loading ? '—' : (statsData?.dietStatus?.expiringSoon ?? 0) }}</div>
        <p class="text-xs text-neutral-400 mt-1">nos próximos 30 dias</p>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-neutral-500 uppercase tracking-wide">Este Mês</span>
          <div class="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <i class="pi pi-chart-line text-purple-600" style="font-size: 1rem"></i>
          </div>
        </div>
        <div class="text-3xl font-bold text-neutral-900">{{ loading ? '—' : (statsData?.dietsThisMonth ?? 0) }}</div>
        <p class="text-xs text-neutral-400 mt-1">dietas este mês</p>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Bar chart - patient growth -->
      <div class="card lg:col-span-2">
        <div class="flex items-center justify-between mb-5">
          <div>
            <h2 class="text-sm font-semibold text-neutral-900">Evolução de Pacientes</h2>
            <p class="text-xs text-neutral-400 mt-0.5">Novos cadastros nos últimos 6 meses</p>
          </div>
          <span class="badge-green">
            <i class="pi pi-arrow-up-right mr-1" style="font-size: 0.65rem"></i>
            Crescimento
          </span>
        </div>
        <ClientOnly>
          <PvChart
            v-if="statsData"
            type="bar"
            :data="barChartData"
            :options="barChartOptions"
            style="height: 210px"
          />
          <div v-else class="h-[210px] bg-neutral-50 rounded-xl animate-pulse"></div>
        </ClientOnly>
      </div>

      <!-- Donut chart - diet status -->
      <div class="card flex flex-col">
        <div class="mb-4">
          <h2 class="text-sm font-semibold text-neutral-900">Status das Dietas</h2>
          <p class="text-xs text-neutral-400 mt-0.5">Validade dos planos</p>
        </div>
        <div class="flex-1 flex items-center justify-center">
          <ClientOnly>
            <PvChart
              v-if="statsData && statsData.totalDiets > 0"
              type="doughnut"
              :data="donutChartData"
              :options="donutChartOptions"
              style="height: 180px; width: 100%"
            />
            <div v-else-if="!loading" class="flex flex-col items-center justify-center text-neutral-300 py-8">
              <i class="pi pi-chart-pie mb-3" style="font-size: 2.5rem"></i>
              <p class="text-sm text-neutral-400">Nenhuma dieta ainda</p>
            </div>
            <div v-else class="h-[180px] bg-neutral-50 rounded-xl animate-pulse w-full"></div>
          </ClientOnly>
        </div>
      </div>
    </div>

    <!-- Bottom row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Expiring soon alert -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-neutral-900">Dietas Expirando</h2>
          <span class="badge-yellow">
            <i class="pi pi-exclamation-triangle mr-1" style="font-size: 0.65rem"></i>
            Próximos 30 dias
          </span>
        </div>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 3" :key="i" class="h-10 bg-neutral-100 rounded-lg animate-pulse"></div>
        </div>
        <div v-else-if="!statsData?.dietStatus?.expiringSoon" class="py-8 text-center">
          <div class="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center mx-auto mb-3">
            <i class="pi pi-check text-primary-600" style="font-size: 1rem"></i>
          </div>
          <p class="text-sm font-medium text-neutral-700">Tudo em dia!</p>
          <p class="text-xs text-neutral-400 mt-1">Nenhuma dieta expirando nos próximos 30 dias.</p>
        </div>
        <div v-else class="space-y-2">
          <div class="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <i class="pi pi-clock text-amber-500" style="font-size: 1.1rem"></i>
            <div>
              <p class="text-sm font-semibold text-amber-800">
                {{ statsData.dietStatus.expiringSoon }} dieta{{ statsData.dietStatus.expiringSoon !== 1 ? 's' : '' }} expirando
              </p>
              <p class="text-xs text-amber-600">Renove os planos para manter os pacientes ativos.</p>
            </div>
          </div>
          <NuxtLink to="/dashboard/patients" class="btn-secondary btn-sm w-full justify-center mt-2">
            <i class="pi pi-arrow-right"></i>
            Ver pacientes
          </NuxtLink>
        </div>
      </div>

      <!-- Recent patients -->
      <div class="card">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-neutral-900">Pacientes Recentes</h2>
          <NuxtLink to="/dashboard/patients" class="text-xs text-primary-600 hover:text-primary-700 font-medium">
            Ver todos
          </NuxtLink>
        </div>
        <div v-if="loading" class="space-y-3">
          <div v-for="i in 4" :key="i" class="h-10 bg-neutral-100 rounded-lg animate-pulse"></div>
        </div>
        <div v-else-if="!statsData?.recentPatients?.length" class="py-8 text-center">
          <i class="pi pi-users mb-3 block" style="font-size: 2rem; color: #e5e7eb"></i>
          <p class="text-sm text-neutral-400">Nenhum paciente cadastrado ainda.</p>
          <NuxtLink to="/dashboard/patients/new" class="btn-primary btn-sm mt-3 mx-auto">
            Cadastrar paciente
          </NuxtLink>
        </div>
        <div v-else class="space-y-1">
          <NuxtLink
            v-for="p in statsData.recentPatients"
            :key="p.id"
            :to="`/dashboard/patients/${p.id}`"
            class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-neutral-50 transition-colors group"
          >
            <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span class="text-xs font-bold text-primary-700">{{ p.name[0].toUpperCase() }}</span>
            </div>
            <span class="flex-1 text-sm font-medium text-neutral-800 group-hover:text-primary-600 transition-colors truncate">
              {{ p.name }}
            </span>
            <span class="badge-gray flex-shrink-0">
              {{ p._count.diets }} dieta{{ p._count.diets !== 1 ? 's' : '' }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'default' })

const { user, apiFetch } = useAuth()

interface StatsData {
  totalPatients: number
  totalDiets: number
  dietsThisMonth: number
  recentPatients: Array<{ id: string; name: string; _count: { diets: number } }>
  dietStatus: { active: number; expiringSoon: number; expired: number; noExpiry: number }
  monthlyPatients: { labels: string[]; data: number[] }
}

const loading = ref(true)
const statsData = ref<StatsData | null>(null)

const firstName = computed(() => user.value?.name?.split(' ')[0] || 'Nutricionista')

const formattedDate = computed(() =>
  new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
)

const barChartData = computed(() => ({
  labels: statsData.value?.monthlyPatients.labels || [],
  datasets: [{
    label: 'Novos pacientes',
    data: statsData.value?.monthlyPatients.data || [],
    backgroundColor: '#16a34a',
    borderRadius: 6,
    borderSkipped: false,
  }],
}))

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: number }) => ` ${ctx.raw} paciente${ctx.raw !== 1 ? 's' : ''}`,
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: { stepSize: 1, precision: 0, color: '#a3a3a3', font: { size: 11 } },
      grid: { color: '#f5f5f5' },
      border: { display: false },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#a3a3a3', font: { size: 11 } },
      border: { display: false },
    },
  },
}

const donutChartData = computed(() => ({
  labels: ['Ativas', 'Expirando (30d)', 'Expiradas', 'Sem prazo'],
  datasets: [{
    data: [
      statsData.value?.dietStatus.active || 0,
      statsData.value?.dietStatus.expiringSoon || 0,
      statsData.value?.dietStatus.expired || 0,
      statsData.value?.dietStatus.noExpiry || 0,
    ],
    backgroundColor: ['#16a34a', '#f59e0b', '#ef4444', '#e5e7eb'],
    borderWidth: 0,
    hoverOffset: 4,
  }],
}))

const donutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 10, padding: 12, font: { size: 11 }, color: '#525252' },
    },
  },
  cutout: '68%',
}

onMounted(async () => {
  try {
    statsData.value = await apiFetch<StatsData>('/api/dashboard/stats')
  } finally {
    loading.value = false
  }
})
</script>
