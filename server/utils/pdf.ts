import type { GeneratedDiet } from './openai'
import type { Patient, User } from '@prisma/client'

interface PdfOptions {
  diet: GeneratedDiet
  patient: Patient
  nutritionist: User
  dietTitle: string
  validUntil?: string | null
}

export async function generateDietPdf(options: PdfOptions): Promise<Buffer> {
  const { diet, patient, nutritionist, dietTitle, validUntil } = options

  const html = buildDietHtml({ diet, patient, nutritionist, dietTitle, validUntil })

  // Lazy-load puppeteer apenas quando necessário
  const puppeteer = await import('puppeteer')
  const browser = await puppeteer.default.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
    ],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

function buildDietHtml(options: PdfOptions): string {
  const { diet, patient, nutritionist, dietTitle, validUntil } = options

  const patientAge = patient.birthDate
    ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const genderLabel: Record<string, string> = {
    masculino: 'Masculino',
    feminino: 'Feminino',
    outro: 'Outro',
  }

  const goalLabel: Record<string, string> = {
    emagrecimento: 'Emagrecimento',
    ganho_massa: 'Ganho de Massa',
    manutencao: 'Manutenção',
    saude: 'Saúde Geral',
  }

  const activityLabel: Record<string, string> = {
    sedentario: 'Sedentário',
    leve: 'Levemente Ativo',
    moderado: 'Moderadamente Ativo',
    intenso: 'Muito Ativo',
    muito_intenso: 'Extremamente Ativo',
  }

  const bmi = (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)

  const logoHtml = nutritionist.logoUrl
    ? `<img src="${nutritionist.logoUrl}" alt="Logo" style="height:60px;max-width:200px;object-fit:contain;" />`
    : `<div style="font-size:24px;font-weight:800;color:#16a34a;letter-spacing:-0.5px;">${nutritionist.name}</div>`

  const mealsHtml = diet.meals.map(meal => `
    <div style="margin-bottom:20px;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
      <div style="background:#f0fdf4;border-bottom:1px solid #dcfce7;padding:10px 16px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <span style="font-weight:700;color:#15803d;font-size:14px;">🍽 ${meal.name}</span>
          ${meal.notes ? `<span style="font-size:11px;color:#737373;margin-left:8px;">${meal.notes}</span>` : ''}
        </div>
        <div style="text-align:right;">
          <span style="font-size:12px;color:#525252;">⏰ ${meal.time}</span>
          <span style="font-size:12px;font-weight:600;color:#16a34a;margin-left:12px;">${meal.totalCalories} kcal</span>
        </div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#fafafa;">
            <th style="padding:7px 16px;text-align:left;color:#737373;font-weight:600;border-bottom:1px solid #f5f5f5;">Alimento</th>
            <th style="padding:7px 16px;text-align:center;color:#737373;font-weight:600;border-bottom:1px solid #f5f5f5;">Quantidade</th>
            <th style="padding:7px 16px;text-align:center;color:#737373;font-weight:600;border-bottom:1px solid #f5f5f5;">Kcal</th>
            <th style="padding:7px 16px;text-align:center;color:#737373;font-weight:600;border-bottom:1px solid #f5f5f5;">Prot.</th>
            <th style="padding:7px 16px;text-align:center;color:#737373;font-weight:600;border-bottom:1px solid #f5f5f5;">Carb.</th>
            <th style="padding:7px 16px;text-align:center;color:#737373;font-weight:600;border-bottom:1px solid #f5f5f5;">Gord.</th>
          </tr>
        </thead>
        <tbody>
          ${meal.foods.map((food, i) => `
            <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'};">
              <td style="padding:8px 16px;color:#262626;font-weight:500;">${food.name}</td>
              <td style="padding:8px 16px;text-align:center;color:#525252;">${food.quantity} ${food.unit}</td>
              <td style="padding:8px 16px;text-align:center;color:#525252;">${food.calories}</td>
              <td style="padding:8px 16px;text-align:center;color:#525252;">${food.protein ?? '-'}g</td>
              <td style="padding:8px 16px;text-align:center;color:#525252;">${food.carbs ?? '-'}g</td>
              <td style="padding:8px 16px;text-align:center;color:#525252;">${food.fat ?? '-'}g</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')

  const substitutionsHtml = diet.substitutions.map(sub => `
    <tr>
      <td style="padding:8px 12px;font-size:12px;font-weight:500;color:#262626;border-bottom:1px solid #f5f5f5;">${sub.category}</td>
      <td style="padding:8px 12px;font-size:12px;color:#525252;border-bottom:1px solid #f5f5f5;">${sub.original}</td>
      <td style="padding:8px 12px;font-size:12px;color:#525252;border-bottom:1px solid #f5f5f5;">${sub.alternatives.join(' • ')}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${dietTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; color: #262626; background: #fff; }
    @page { size: A4; margin: 0; }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div style="background:linear-gradient(135deg,#15803d 0%,#16a34a 50%,#22c55e 100%);padding:32px 40px;display:flex;justify-content:space-between;align-items:center;">
    <div>
      ${logoHtml}
      ${nutritionist.crn ? `<div style="font-size:11px;color:#bbf7d0;margin-top:4px;">${nutritionist.crn}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="font-size:20px;font-weight:700;color:#fff;">${dietTitle}</div>
      <div style="font-size:11px;color:#bbf7d0;margin-top:4px;">Emitido em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
      ${validUntil ? `<div style="font-size:11px;color:#bbf7d0;">Válido até: ${new Date(validUntil).toLocaleDateString('pt-BR')}</div>` : ''}
    </div>
  </div>

  <!-- PATIENT INFO -->
  <div style="padding:24px 40px;background:#f0fdf4;border-bottom:2px solid #dcfce7;">
    <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#15803d;margin-bottom:12px;">Dados do Paciente</div>
    <div style="display:flex;gap:32px;flex-wrap:wrap;">
      <div>
        <div style="font-size:18px;font-weight:700;color:#171717;">${patient.name}</div>
        ${patientAge ? `<div style="font-size:12px;color:#737373;margin-top:2px;">${patientAge} anos • ${genderLabel[patient.gender] || patient.gender}</div>` : ''}
      </div>
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:center;">
        ${[
          { label: 'Peso', value: `${patient.weight} kg` },
          { label: 'Altura', value: `${patient.height} cm` },
          { label: 'IMC', value: bmi },
          { label: 'Objetivo', value: goalLabel[patient.goal] || patient.goal },
          { label: 'Atividade', value: activityLabel[patient.activityLevel] || patient.activityLevel },
        ].map(item => `
          <div style="text-align:center;background:white;border:1px solid #dcfce7;border-radius:8px;padding:8px 14px;">
            <div style="font-size:14px;font-weight:700;color:#15803d;">${item.value}</div>
            <div style="font-size:10px;color:#737373;margin-top:2px;">${item.label}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ${patient.restrictions && patient.restrictions.length > 0 ? `
      <div style="margin-top:10px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:11px;color:#737373;">Restrições:</span>
        ${patient.restrictions.map(r => `<span style="background:#fef3c7;color:#92400e;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:500;">${r}</span>`).join('')}
      </div>
    ` : ''}
  </div>

  <!-- MAIN CONTENT -->
  <div style="padding:28px 40px;">

    <!-- MACROS OVERVIEW -->
    <div style="display:flex;gap:16px;margin-bottom:28px;">
      ${[
        { label: 'Total Calórico', value: `${diet.totalCalories}`, unit: 'kcal/dia', color: '#15803d', bg: '#f0fdf4', border: '#dcfce7' },
        { label: 'Proteínas', value: `${diet.macros.protein}`, unit: 'g/dia', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
        { label: 'Carboidratos', value: `${diet.macros.carbs}`, unit: 'g/dia', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
        { label: 'Gorduras', value: `${diet.macros.fat}`, unit: 'g/dia', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
      ].map(m => `
        <div style="flex:1;background:${m.bg};border:1px solid ${m.border};border-radius:10px;padding:14px 18px;text-align:center;">
          <div style="font-size:22px;font-weight:800;color:${m.color};">${m.value}</div>
          <div style="font-size:11px;font-weight:500;color:${m.color};opacity:0.7;">${m.unit}</div>
          <div style="font-size:11px;color:#737373;margin-top:4px;">${m.label}</div>
        </div>
      `).join('')}
    </div>

    <!-- OBJECTIVE -->
    <div style="background:#fafafa;border-left:3px solid #22c55e;padding:12px 16px;border-radius:0 8px 8px 0;margin-bottom:24px;font-size:12px;color:#525252;line-height:1.6;">
      <strong style="color:#15803d;">Objetivo Nutricional: </strong>${diet.objective}
    </div>

    <!-- MEALS -->
    <div style="margin-bottom:10px;">
      <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#15803d;margin-bottom:16px;border-bottom:2px solid #dcfce7;padding-bottom:8px;">
        📋 Plano Alimentar Diário
      </div>
      ${mealsHtml}
    </div>

    <!-- SUBSTITUTIONS -->
    ${diet.substitutions && diet.substitutions.length > 0 ? `
      <div style="margin-top:24px;margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#15803d;margin-bottom:16px;border-bottom:2px solid #dcfce7;padding-bottom:8px;">
          🔄 Tabela de Substituições
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #e5e5e5;border-radius:10px;overflow:hidden;">
          <thead>
            <tr style="background:#f0fdf4;">
              <th style="padding:10px 12px;text-align:left;color:#15803d;font-weight:600;border-bottom:1px solid #dcfce7;width:18%;">Categoria</th>
              <th style="padding:10px 12px;text-align:left;color:#15803d;font-weight:600;border-bottom:1px solid #dcfce7;width:22%;">Alimento Base</th>
              <th style="padding:10px 12px;text-align:left;color:#15803d;font-weight:600;border-bottom:1px solid #dcfce7;">Substituições Possíveis</th>
            </tr>
          </thead>
          <tbody>
            ${substitutionsHtml}
          </tbody>
        </table>
      </div>
    ` : ''}

    <!-- HYDRATION & NOTES -->
    <div style="display:flex;gap:16px;margin-bottom:24px;">
      <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:16px;">
        <div style="font-size:12px;font-weight:700;color:#1d4ed8;margin-bottom:6px;">💧 Hidratação</div>
        <div style="font-size:12px;color:#525252;line-height:1.6;">${diet.hydration}</div>
      </div>
      ${diet.supplements && diet.supplements.length > 0 ? `
        <div style="flex:1;background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:16px;">
          <div style="font-size:12px;font-weight:700;color:#7c3aed;margin-bottom:6px;">💊 Suplementação (Opcional)</div>
          <ul style="font-size:12px;color:#525252;line-height:1.8;padding-left:16px;">
            ${diet.supplements.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    <!-- GENERAL NOTES -->
    ${diet.generalNotes ? `
      <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:16px;margin-bottom:24px;">
        <div style="font-size:12px;font-weight:700;color:#92400e;margin-bottom:6px;">⚠️ Observações Importantes</div>
        <div style="font-size:12px;color:#78350f;line-height:1.7;">${diet.generalNotes}</div>
      </div>
    ` : ''}

  </div>

  <!-- FOOTER -->
  <div style="background:#f9f9f9;border-top:1px solid #e5e5e5;padding:20px 40px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div style="font-size:11px;color:#737373;">Este plano foi elaborado por:</div>
      <div style="font-size:13px;font-weight:700;color:#171717;margin-top:2px;">${nutritionist.name}</div>
      ${nutritionist.crn ? `<div style="font-size:11px;color:#737373;">${nutritionist.crn}</div>` : ''}
      ${nutritionist.phone ? `<div style="font-size:11px;color:#737373;">${nutritionist.phone}</div>` : ''}
    </div>
    <div style="text-align:center;">
      <div style="border-top:1px solid #a3a3a3;width:180px;margin:0 auto;"></div>
      <div style="font-size:10px;color:#a3a3a3;margin-top:4px;">Assinatura do Nutricionista</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:#a3a3a3;">NutriPro — Plataforma de Nutrição</div>
      <div style="font-size:10px;color:#a3a3a3;margin-top:2px;">Este documento é de uso exclusivo do paciente</div>
    </div>
  </div>

</body>
</html>`
}
