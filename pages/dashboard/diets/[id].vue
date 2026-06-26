<template>
  <div>
    <!-- Breadcrumbs -->
    <nav class="breadcrumbs">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <i class="pi pi-chevron-right"></i>
      <NuxtLink to="/dashboard/diets">Planos</NuxtLink>
      <i class="pi pi-chevron-right"></i>
      <span class="text-neutral-600 font-medium truncate max-w-xs">{{ diet?.title || '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div class="h-24 bg-white rounded-xl border border-neutral-100 animate-pulse"></div>
      <div class="grid grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="h-24 bg-white rounded-xl border border-neutral-100 animate-pulse"></div>
      </div>
      <div class="h-64 bg-white rounded-xl border border-neutral-100 animate-pulse"></div>
    </div>

    <div v-else-if="diet && content">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 class="page-title">{{ diet.title }}</h1>
          <p class="page-subtitle flex items-center gap-2 flex-wrap">
            <NuxtLink :to="`/dashboard/patients/${diet.patient.id}`" class="hover:text-primary-600 transition-colors">
              <i class="pi pi-user mr-1" style="font-size:0.75rem"></i>{{ diet.patient.name }}
            </NuxtLink>
            <span class="text-neutral-300">•</span>
            <span>
              <i class="pi pi-calendar mr-1" style="font-size:0.75rem"></i>
              {{ new Date(diet.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) }}
            </span>
            <span v-if="diet.validUntil" :class="isExpired(diet.validUntil) ? 'text-red-500' : isExpiring(diet.validUntil) ? 'text-amber-500' : 'text-neutral-400'">
              <span class="text-neutral-300 mr-2">•</span>
              <i class="pi pi-clock mr-1" style="font-size:0.75rem"></i>
              Válido até {{ new Date(diet.validUntil).toLocaleDateString('pt-BR') }}
            </span>
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button @click="showEmailModal = true" class="btn-secondary">
            <i class="pi pi-envelope"></i>
            Enviar por e-mail
          </button>
          <button @click="downloadPdf" class="btn-primary" :disabled="downloading">
            <span v-if="downloading" class="spinner w-4 h-4"></span>
            <i v-else class="pi pi-download"></i>
            {{ downloading ? 'Gerando PDF...' : 'Baixar PDF' }}
          </button>
          <button @click="confirmDelete" class="btn-ghost !text-red-500 hover:!bg-red-50">
            <i class="pi pi-trash"></i>
          </button>
        </div>
      </div>

      <!-- Macro cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="card text-center !py-5">
          <div class="text-3xl font-bold text-primary-600">{{ content.totalCalories }}</div>
          <div class="text-xs text-neutral-400 mt-1 font-medium uppercase tracking-wide">kcal / dia</div>
        </div>
        <div class="card text-center !py-5">
          <div class="text-3xl font-bold text-blue-600">{{ content.macros.protein }}g</div>
          <div class="text-xs text-neutral-400 mt-1 font-medium uppercase tracking-wide">Proteínas</div>
        </div>
        <div class="card text-center !py-5">
          <div class="text-3xl font-bold text-amber-500">{{ content.macros.carbs }}g</div>
          <div class="text-xs text-neutral-400 mt-1 font-medium uppercase tracking-wide">Carboidratos</div>
        </div>
        <div class="card text-center !py-5">
          <div class="text-3xl font-bold text-purple-600">{{ content.macros.fat }}g</div>
          <div class="text-xs text-neutral-400 mt-1 font-medium uppercase tracking-wide">Gorduras</div>
        </div>
      </div>

      <!-- Objective -->
      <div class="card mb-5 !py-4 border-l-4 border-primary-400">
        <p class="text-sm text-neutral-600">
          <strong class="text-primary-700">Objetivo Nutricional:</strong> {{ content.objective }}
        </p>
      </div>

      <!-- Meals -->
      <div class="card mb-5">
        <h2 class="text-base font-bold text-neutral-900 mb-4">
          <i class="pi pi-list text-primary-500 mr-2" style="font-size:0.9rem"></i>
          Plano Alimentar Diário
        </h2>
        <div class="space-y-4">
          <div v-for="meal in content.meals" :key="meal.name" class="border border-neutral-100 rounded-xl overflow-hidden">
            <div class="bg-gradient-to-r from-primary-50 to-transparent px-4 py-3 flex items-center justify-between">
              <div>
                <span class="font-bold text-primary-800">{{ meal.name }}</span>
                <span v-if="meal.notes" class="text-xs text-neutral-500 ml-2">— {{ meal.notes }}</span>
              </div>
              <div class="flex items-center gap-3 text-right">
                <span class="text-xs text-neutral-500 hidden sm:block">
                  <i class="pi pi-clock mr-1" style="font-size:0.65rem"></i>{{ meal.time }}
                </span>
                <span class="text-sm font-bold text-primary-700 bg-primary-100 px-2.5 py-0.5 rounded-full">
                  {{ meal.totalCalories }} kcal
                </span>
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-neutral-50">
                    <th class="text-left px-4 py-2 text-xs text-neutral-400 font-semibold">Alimento</th>
                    <th class="text-center px-3 py-2 text-xs text-neutral-400 font-semibold">Qtd</th>
                    <th class="text-center px-3 py-2 text-xs text-neutral-400 font-semibold">Kcal</th>
                    <th class="text-center px-3 py-2 text-xs text-neutral-400 font-semibold hidden sm:table-cell">Prot.</th>
                    <th class="text-center px-3 py-2 text-xs text-neutral-400 font-semibold hidden sm:table-cell">Carb.</th>
                    <th class="text-center px-3 py-2 text-xs text-neutral-400 font-semibold hidden sm:table-cell">Gord.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(food, i) in meal.foods"
                    :key="i"
                    class="border-t border-neutral-50 hover:bg-neutral-50/80 transition-colors"
                  >
                    <td class="px-4 py-2.5 font-medium text-neutral-800">{{ food.name }}</td>
                    <td class="px-3 py-2.5 text-center text-neutral-500 text-xs">{{ food.quantity }} {{ food.unit }}</td>
                    <td class="px-3 py-2.5 text-center font-semibold text-neutral-700">{{ food.calories }}</td>
                    <td class="px-3 py-2.5 text-center text-neutral-400 text-xs hidden sm:table-cell">{{ food.protein ?? '—' }}g</td>
                    <td class="px-3 py-2.5 text-center text-neutral-400 text-xs hidden sm:table-cell">{{ food.carbs ?? '—' }}g</td>
                    <td class="px-3 py-2.5 text-center text-neutral-400 text-xs hidden sm:table-cell">{{ food.fat ?? '—' }}g</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Substitutions -->
      <div v-if="content.substitutions?.length" class="card mb-5">
        <h2 class="text-base font-bold text-neutral-900 mb-4">
          <i class="pi pi-sync text-primary-500 mr-2" style="font-size:0.9rem"></i>
          Tabela de Substituições
        </h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-primary-50">
                <th class="text-left px-4 py-3 text-xs font-bold text-primary-700 rounded-tl-lg">Categoria</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-primary-700">Alimento Base</th>
                <th class="text-left px-4 py-3 text-xs font-bold text-primary-700 rounded-tr-lg">Pode Substituir Por</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sub, i) in content.substitutions" :key="i" class="border-t border-neutral-100 hover:bg-neutral-50">
                <td class="px-4 py-3 font-semibold text-neutral-700">{{ sub.category }}</td>
                <td class="px-4 py-3 text-neutral-600">{{ sub.original }}</td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="alt in sub.alternatives" :key="alt" class="badge-green">{{ alt }}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Notes + Hydration + Supplements -->
      <div class="grid md:grid-cols-2 gap-5">
        <div class="card border-l-4 border-blue-400 !py-4">
          <h3 class="font-bold text-blue-800 mb-2 text-sm">
            <i class="pi pi-chart-pie mr-1.5"></i>Hidratação
          </h3>
          <p class="text-sm text-neutral-600">{{ content.hydration }}</p>
        </div>
        <div v-if="content.generalNotes" class="card border-l-4 border-amber-400 !py-4">
          <h3 class="font-bold text-amber-800 mb-2 text-sm">
            <i class="pi pi-exclamation-circle mr-1.5"></i>Observações
          </h3>
          <p class="text-sm text-neutral-600">{{ content.generalNotes }}</p>
        </div>
      </div>

      <div v-if="content.supplements?.length" class="card mt-5 border-l-4 border-purple-400 !py-4">
        <h3 class="font-bold text-purple-800 mb-2 text-sm">
          <i class="pi pi-heart-fill mr-1.5"></i>Suplementação (Opcional)
        </h3>
        <ul class="text-sm text-neutral-600 space-y-1">
          <li v-for="s in content.supplements" :key="s" class="flex items-start gap-2">
            <i class="pi pi-check-circle text-purple-400 mt-0.5 flex-shrink-0" style="font-size:0.75rem"></i>
            {{ s }}
          </li>
        </ul>
      </div>
    </div>

    <!-- Email Modal -->
    <div v-if="showEmailModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" @click.self="showEmailModal = false">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div class="flex items-center justify-between p-6 border-b border-neutral-100">
          <div>
            <h3 class="text-lg font-bold">Enviar Plano por E-mail</h3>
            <p class="text-xs text-neutral-400 mt-0.5">PDF será enviado como anexo</p>
          </div>
          <button @click="showEmailModal = false" class="btn-ghost btn-sm !px-2">
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="label">
              <i class="pi pi-envelope mr-1.5 text-neutral-400" style="font-size:0.75rem"></i>
              E-mail do destinatário
            </label>
            <input
              v-model="emailTo"
              type="email"
              class="input"
              :class="{ 'input-error': emailError }"
              placeholder="paciente@email.com"
            />
            <p v-if="emailError" class="text-xs text-red-500 mt-1">{{ emailError }}</p>
          </div>
          <div>
            <label class="label">Mensagem personalizada <span class="text-neutral-400 font-normal">(opcional)</span></label>
            <textarea
              v-model="emailMessage"
              class="textarea"
              rows="3"
              placeholder="Ex: Olá! Segue seu plano alimentar personalizado. Qualquer dúvida estou à disposição."
            ></textarea>
          </div>
          <div v-if="emailSent" class="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <i class="pi pi-check-circle text-green-500"></i>
            E-mail enviado com sucesso!
          </div>
          <div v-if="emailSendError" class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            <i class="pi pi-times-circle mr-1.5"></i>{{ emailSendError }}
          </div>
        </div>
        <div class="px-6 pb-6 flex gap-3">
          <button @click="showEmailModal = false" class="btn-secondary flex-1">Cancelar</button>
          <button @click="sendEmail" class="btn-primary flex-1" :disabled="sendingEmail || emailSent">
            <span v-if="sendingEmail" class="spinner w-4 h-4"></span>
            <i v-else-if="emailSent" class="pi pi-check"></i>
            <i v-else class="pi pi-send"></i>
            {{ sendingEmail ? 'Enviando...' : emailSent ? 'Enviado!' : 'Enviar' }}
          </button>
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
const dietId = route.params.id as string

const loading = ref(true)
const downloading = ref(false)
const showEmailModal = ref(false)
const emailTo = ref('')
const emailMessage = ref('')
const emailError = ref('')
const sendingEmail = ref(false)
const emailSent = ref(false)
const emailSendError = ref('')

const diet = ref<{
  id: string
  title: string
  createdAt: string
  validUntil?: string
  patient: { id: string; name: string; email?: string }
  content: unknown
} | null>(null)

const content = computed(() => diet.value?.content as {
  totalCalories: number
  objective: string
  macros: { protein: number; carbs: number; fat: number }
  meals: Array<{
    name: string
    time: string
    totalCalories: number
    notes?: string
    foods: Array<{ name: string; quantity: string; unit: string; calories: number; protein?: number; carbs?: number; fat?: number }>
  }>
  substitutions: Array<{ category: string; original: string; alternatives: string[] }>
  hydration: string
  generalNotes?: string
  supplements?: string[]
} | null)

function isExpired(validUntil: string) {
  return new Date(validUntil).getTime() < Date.now()
}

function isExpiring(validUntil: string) {
  const days = (new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  return days >= 0 && days <= 7
}

onMounted(async () => {
  try {
    diet.value = await apiFetch(`/api/diet/${dietId}`)
    if (diet.value?.patient.email) emailTo.value = diet.value.patient.email
  } finally {
    loading.value = false
  }
})

async function downloadPdf() {
  downloading.value = true
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
    a.download = `${diet.value?.title.toLowerCase().replace(/\s+/g, '-')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('Erro ao gerar o PDF. Tente novamente.')
  } finally {
    downloading.value = false
  }
}

async function sendEmail() {
  emailError.value = ''
  emailSendError.value = ''
  if (!emailTo.value || !emailTo.value.includes('@')) {
    emailError.value = 'Informe um e-mail válido.'
    return
  }
  sendingEmail.value = true
  try {
    await apiFetch(`/api/diet/${dietId}/email`, {
      method: 'POST',
      body: { email: emailTo.value, message: emailMessage.value || undefined },
    })
    emailSent.value = true
    setTimeout(() => { showEmailModal.value = false; emailSent.value = false }, 2000)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    emailSendError.value = e?.data?.statusMessage || 'Erro ao enviar o e-mail. Verifique as configurações SMTP.'
  } finally {
    sendingEmail.value = false
  }
}

async function confirmDelete() {
  if (!confirm('Excluir este plano alimentar?')) return
  await apiFetch(`/api/diet/${dietId}`, { method: 'DELETE' })
  router.push('/dashboard/diets')
}
</script>
