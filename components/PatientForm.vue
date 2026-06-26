<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Basic info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group md:col-span-2">
        <label class="label">Nome completo *</label>
        <input v-model="form.name" class="input" required placeholder="Ex: Maria Oliveira" />
      </div>

      <div class="form-group">
        <label class="label">E-mail</label>
        <input v-model="form.email" type="email" class="input" placeholder="paciente@email.com" />
      </div>

      <div class="form-group">
        <label class="label">Telefone</label>
        <input v-model="form.phone" class="input" placeholder="(11) 99999-9999" />
      </div>

      <div class="form-group">
        <label class="label">Data de nascimento</label>
        <input v-model="form.birthDate" type="date" class="input" />
      </div>

      <div class="form-group">
        <label class="label">Gênero *</label>
        <select v-model="form.gender" class="select" required>
          <option value="">Selecionar...</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro / Prefiro não informar</option>
        </select>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Anthropometric data -->
    <h3 class="text-sm font-semibold text-neutral-700">Dados Antropométricos</h3>
    <div class="grid grid-cols-2 gap-4">
      <div class="form-group">
        <label class="label">Peso (kg) *</label>
        <input v-model="form.weight" type="number" step="0.1" min="20" max="300" class="input" required placeholder="Ex: 70.5" />
      </div>
      <div class="form-group">
        <label class="label">Altura (cm) *</label>
        <input v-model="form.height" type="number" step="1" min="100" max="250" class="input" required placeholder="Ex: 170" />
      </div>
    </div>

    <!-- IMC preview -->
    <div v-if="form.weight && form.height" class="text-sm text-neutral-500 bg-neutral-50 rounded-lg p-3">
      IMC calculado: <strong :class="bmiClass">{{ bmi }} kg/m²</strong>
      <span class="ml-2 text-neutral-400">{{ bmiLabel }}</span>
    </div>

    <div class="divider"></div>

    <!-- Activity & Goal -->
    <h3 class="text-sm font-semibold text-neutral-700">Estilo de vida e Objetivo</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="form-group">
        <label class="label">Nível de atividade física *</label>
        <select v-model="form.activityLevel" class="select" required>
          <option value="">Selecionar...</option>
          <option value="sedentario">Sedentário (sem exercício)</option>
          <option value="leve">Levemente ativo (1-3x/semana)</option>
          <option value="moderado">Moderadamente ativo (3-5x/semana)</option>
          <option value="intenso">Muito ativo (6-7x/semana)</option>
          <option value="muito_intenso">Extremamente ativo (atleta)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="label">Objetivo principal *</label>
        <select v-model="form.goal" class="select" required>
          <option value="">Selecionar...</option>
          <option value="emagrecimento">Emagrecimento / Perda de gordura</option>
          <option value="ganho_massa">Ganho de massa muscular</option>
          <option value="manutencao">Manutenção do peso atual</option>
          <option value="saude">Melhora da saúde geral</option>
        </select>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Restrictions -->
    <h3 class="text-sm font-semibold text-neutral-700">Restrições e Patologias</h3>
    <div class="form-group">
      <label class="label">Restrições alimentares</label>
      <div class="flex flex-wrap gap-2">
        <label v-for="opt in restrictionOptions" :key="opt" class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :value="opt"
            v-model="form.restrictions"
            class="w-4 h-4 rounded text-primary-600 border-neutral-300 focus:ring-primary-500"
          />
          <span class="text-sm text-neutral-700">{{ opt }}</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label class="label">Patologias / Condições de saúde</label>
      <div class="flex flex-wrap gap-2">
        <label v-for="opt in pathologyOptions" :key="opt" class="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            :value="opt"
            v-model="form.pathologies"
            class="w-4 h-4 rounded text-primary-600 border-neutral-300 focus:ring-primary-500"
          />
          <span class="text-sm text-neutral-700">{{ opt }}</span>
        </label>
      </div>
    </div>

    <div class="form-group">
      <label class="label">Observações adicionais</label>
      <textarea v-model="form.notes" class="textarea" rows="3"
        placeholder="Histórico alimentar, preferências, horários, medicamentos..."></textarea>
    </div>

    <!-- Error -->
    <div v-if="error" class="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
      {{ error }}
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <button type="submit" class="btn-primary" :disabled="loading">
        <span v-if="loading" class="spinner w-4 h-4"></span>
        {{ loading ? 'Salvando...' : (isEdit ? 'Salvar alterações' : 'Cadastrar paciente') }}
      </button>
      <button type="button" @click="$emit('cancel')" class="btn-secondary">Cancelar</button>
    </div>
  </form>
</template>

<script setup lang="ts">
interface PatientData {
  name?: string; email?: string; phone?: string; birthDate?: string; gender?: string
  weight?: number; height?: number; activityLevel?: string; goal?: string
  restrictions?: string[]; pathologies?: string[]; notes?: string
}

const props = defineProps<{
  initial?: PatientData | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  submit: [data: PatientData]
  cancel: []
}>()

const isEdit = computed(() => !!props.initial)

const form = reactive<Required<PatientData>>({
  name: props.initial?.name || '',
  email: props.initial?.email || '',
  phone: props.initial?.phone || '',
  birthDate: props.initial?.birthDate
    ? new Date(props.initial.birthDate).toISOString().slice(0, 10)
    : '',
  gender: props.initial?.gender || '',
  weight: props.initial?.weight || ('' as unknown as number),
  height: props.initial?.height || ('' as unknown as number),
  activityLevel: props.initial?.activityLevel || '',
  goal: props.initial?.goal || '',
  restrictions: [...(props.initial?.restrictions || [])],
  pathologies: [...(props.initial?.pathologies || [])],
  notes: props.initial?.notes || '',
})

const restrictionOptions = [
  'Glúten', 'Lactose', 'Vegetariano', 'Vegano', 'Frutos do mar',
  'Amendoim', 'Ovos', 'Soja', 'Frutose',
]

const pathologyOptions = [
  'Diabetes tipo 1', 'Diabetes tipo 2', 'Hipertensão', 'Hipotireoidismo',
  'Hipertireoidismo', 'Doença celíaca', 'Síndrome do intestino irritável',
  'Gastrite', 'Colesterol alto', 'Obesidade',
]

const bmi = computed(() => {
  if (!form.weight || !form.height) return null
  return (Number(form.weight) / Math.pow(Number(form.height) / 100, 2)).toFixed(1)
})

const bmiLabel = computed(() => {
  const b = Number(bmi.value)
  if (b < 18.5) return '— Abaixo do peso'
  if (b < 25) return '— Peso normal'
  if (b < 30) return '— Sobrepeso'
  if (b < 35) return '— Obesidade grau I'
  if (b < 40) return '— Obesidade grau II'
  return '— Obesidade grau III'
})

const bmiClass = computed(() => {
  const b = Number(bmi.value)
  if (b < 18.5 || b >= 30) return 'text-red-600'
  if (b < 25) return 'text-primary-600'
  return 'text-amber-500'
})

function handleSubmit() {
  emit('submit', { ...form })
}
</script>
