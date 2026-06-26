import OpenAI from 'openai'

export function getOpenAI(): OpenAI {
  const config = useRuntimeConfig()
  const apiKey = (config.groqApiKey as string) || (config.openaiApiKey as string)
  const baseURL = config.groqApiKey ? 'https://api.groq.com/openai/v1' : undefined
  return new OpenAI({ apiKey, baseURL })
}

export interface DietFood {
  name: string
  quantity: string
  unit: string
  calories: number
  protein?: number
  carbs?: number
  fat?: number
}

export interface DietMeal {
  name: string
  time: string
  foods: DietFood[]
  totalCalories: number
  notes?: string
}

export interface SubstitutionGroup {
  category: string
  original: string
  alternatives: string[]
}

export interface GeneratedDiet {
  title: string
  objective: string
  totalCalories: number
  macros: {
    protein: number
    carbs: number
    fat: number
  }
  meals: DietMeal[]
  substitutions: SubstitutionGroup[]
  hydration: string
  generalNotes: string
  supplements?: string[]
}

export interface PatientData {
  name: string
  gender: string
  age: number
  weight: number
  height: number
  activityLevel: string
  goal: string
  restrictions: string[]
  pathologies: string[]
  notes?: string
}

const activityLabels: Record<string, string> = {
  sedentario: 'Sedentário (sem exercício)',
  leve: 'Levemente ativo (1-3x/semana)',
  moderado: 'Moderadamente ativo (3-5x/semana)',
  intenso: 'Muito ativo (6-7x/semana)',
  muito_intenso: 'Extremamente ativo (atleta/2x/dia)',
}

const goalLabels: Record<string, string> = {
  emagrecimento: 'Emagrecimento / Perda de gordura',
  ganho_massa: 'Ganho de massa muscular',
  manutencao: 'Manutenção do peso',
  saude: 'Melhora da saúde geral',
}

export async function generateDietWithAI(patient: PatientData): Promise<GeneratedDiet> {
  const openai = getOpenAI()

  const bmi = patient.weight / Math.pow(patient.height / 100, 2)
  const activityLabel = activityLabels[patient.activityLevel] || patient.activityLevel
  const goalLabel = goalLabels[patient.goal] || patient.goal
  const restrictionsText = patient.restrictions.length > 0
    ? patient.restrictions.join(', ')
    : 'nenhuma'
  const pathologiesText = patient.pathologies.length > 0
    ? patient.pathologies.join(', ')
    : 'nenhuma'

  const prompt = `Você é um nutricionista especialista. Crie um plano alimentar completo, personalizado e detalhado para o seguinte paciente:

DADOS DO PACIENTE:
- Nome: ${patient.name}
- Gênero: ${patient.gender}
- Idade: ${patient.age} anos
- Peso: ${patient.weight} kg
- Altura: ${patient.height} cm
- IMC: ${bmi.toFixed(1)} kg/m²
- Nível de atividade: ${activityLabel}
- Objetivo: ${goalLabel}
- Restrições alimentares: ${restrictionsText}
- Patologias: ${pathologiesText}
${patient.notes ? `- Observações: ${patient.notes}` : ''}

INSTRUÇÕES:
1. Crie um plano com 5-6 refeições diárias (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar e opcional ceia)
2. Calcule as calorias totais baseado nas necessidades do paciente e objetivo
3. Defina macronutrientes adequados (proteínas, carboidratos, gorduras) em gramas
4. Para cada refeição, liste os alimentos com quantidade precisa e calorias
5. Crie uma tabela de substituições para os principais alimentos
6. Respeite TODAS as restrições alimentares listadas
7. Adapte ao objetivo do paciente
8. Inclua orientações de hidratação

Responda APENAS com um JSON válido seguindo exatamente esta estrutura:
{
  "title": "Plano Alimentar Personalizado",
  "objective": "descrição do objetivo e estratégia nutricional",
  "totalCalories": 2000,
  "macros": {
    "protein": 150,
    "carbs": 200,
    "fat": 65
  },
  "meals": [
    {
      "name": "Café da Manhã",
      "time": "07:00",
      "foods": [
        {
          "name": "Ovos mexidos",
          "quantity": "3",
          "unit": "unidades",
          "calories": 210,
          "protein": 18,
          "carbs": 1,
          "fat": 15
        }
      ],
      "totalCalories": 450,
      "notes": "observação opcional"
    }
  ],
  "substitutions": [
    {
      "category": "Carboidratos",
      "original": "Arroz branco",
      "alternatives": ["Arroz integral", "Quinoa", "Batata doce", "Mandioca cozida"]
    }
  ],
  "hydration": "Beba pelo menos 35ml de água por kg de peso corporal por dia, totalizando ${Math.round(patient.weight * 35 / 1000)}L",
  "generalNotes": "observações gerais importantes sobre o plano",
  "supplements": ["Whey protein 30g pós-treino (opcional)"]
}`

  const config = useRuntimeConfig()
  const model = config.groqApiKey ? 'llama-3.3-70b-versatile' : 'gpt-4o'

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: 'Você é um nutricionista clínico especialista. Sempre responda com JSON válido, sem markdown, sem texto extra.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('OpenAI não retornou conteúdo')

  return JSON.parse(content) as GeneratedDiet
}
