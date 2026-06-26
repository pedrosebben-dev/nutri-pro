import PDFDocument from 'pdfkit'
import type { GeneratedDiet } from './openai'
import type { Patient, User } from '@prisma/client'

interface PdfOptions {
  diet: GeneratedDiet
  patient: Patient
  nutritionist: User
  dietTitle: string
  validUntil?: string | null
}

const GREEN = '#16a34a'
const DARK_GREEN = '#15803d'
const LIGHT_GREEN = '#f0fdf4'
const BORDER_GREEN = '#dcfce7'
const GRAY = '#6b7280'
const DARK = '#111827'
const WHITE = '#ffffff'
const PAGE_W = 595.28
const MARGIN = 40
const CONTENT_W = PAGE_W - MARGIN * 2

export async function generateDietPdf(options: PdfOptions): Promise<Buffer> {
  const { diet, patient, nutritionist, dietTitle, validUntil } = options

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 0, bufferPages: true })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const patientAge = patient.birthDate
      ? Math.floor((Date.now() - new Date(patient.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null

    const goalLabel: Record<string, string> = {
      emagrecimento: 'Emagrecimento', ganho_massa: 'Ganho de Massa',
      manutencao: 'Manutenção', saude: 'Saúde Geral',
    }
    const activityLabel: Record<string, string> = {
      sedentario: 'Sedentário', leve: 'Leve', moderado: 'Moderado',
      intenso: 'Intenso', muito_intenso: 'Muito Intenso',
    }
    const bmi = (patient.weight / Math.pow(patient.height / 100, 2)).toFixed(1)

    let y = 0
    let cx = MARGIN + 8

    // ── HEADER ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, PAGE_W, 80).fill(DARK_GREEN)
    doc.fontSize(20).font('Helvetica-Bold').fillColor(WHITE)
      .text('NutriPro', MARGIN, 22, { lineBreak: false })
    doc.fontSize(10).font('Helvetica').fillColor('#bbf7d0')
      .text(`Emitido em ${new Date().toLocaleDateString('pt-BR')}`, MARGIN, 46, { lineBreak: false })
    if (nutritionist.crn) {
      doc.text(nutritionist.crn, MARGIN, 58, { lineBreak: false })
    }
    doc.fontSize(16).font('Helvetica-Bold').fillColor(WHITE)
      .text(dietTitle, PAGE_W / 2, 22, { width: PAGE_W / 2 - MARGIN, align: 'right', lineBreak: false })
    if (validUntil) {
      doc.fontSize(9).font('Helvetica').fillColor('#bbf7d0')
        .text(`Válido até: ${new Date(validUntil).toLocaleDateString('pt-BR')}`, PAGE_W / 2, 44, { width: PAGE_W / 2 - MARGIN, align: 'right', lineBreak: false })
    }
    y = 80

    // ── PATIENT INFO ────────────────────────────────────────────────────────
    doc.rect(0, y, PAGE_W, 72).fill(LIGHT_GREEN)
    doc.rect(0, y + 71, PAGE_W, 1).fill(BORDER_GREEN)
    doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK)
      .text(patient.name, MARGIN, y + 12)
    if (patientAge) {
      doc.fontSize(9).font('Helvetica').fillColor(GRAY)
        .text(`${patientAge} anos${patient.gender ? ' • ' + patient.gender : ''}`, MARGIN, y + 29)
    }

    const stats = [
      { label: 'Peso', value: `${patient.weight}kg` },
      { label: 'Altura', value: `${patient.height}cm` },
      { label: 'IMC', value: bmi },
      { label: 'Objetivo', value: goalLabel[patient.goal] || patient.goal },
      { label: 'Atividade', value: activityLabel[patient.activityLevel] || patient.activityLevel },
    ]
    const boxW = 88
    const startX = PAGE_W - MARGIN - stats.length * (boxW + 6) + 6
    stats.forEach((s, i) => {
      const bx = startX + i * (boxW + 6)
      doc.roundedRect(bx, y + 10, boxW, 50, 6).fill(WHITE)
      doc.rect(bx, y + 10, boxW, 50).stroke(BORDER_GREEN)
      doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK_GREEN)
        .text(s.value, bx, y + 20, { width: boxW, align: 'center', lineBreak: false })
      doc.fontSize(8).font('Helvetica').fillColor(GRAY)
        .text(s.label, bx, y + 36, { width: boxW, align: 'center', lineBreak: false })
    })
    y += 72

    // ── MACROS ───────────────────────────────────────────────────────────────
    y += 12
    const macros = [
      { label: 'Calorias', value: `${diet.totalCalories}`, unit: 'kcal/dia', color: GREEN },
      { label: 'Proteínas', value: `${diet.macros.protein}g`, unit: 'por dia', color: '#1d4ed8' },
      { label: 'Carboidratos', value: `${diet.macros.carbs}g`, unit: 'por dia', color: '#b45309' },
      { label: 'Gorduras', value: `${diet.macros.fat}g`, unit: 'por dia', color: '#7c3aed' },
    ]
    const mboxW = (CONTENT_W - 18) / 4
    macros.forEach((m, i) => {
      const bx = MARGIN + i * (mboxW + 6)
      doc.roundedRect(bx, y, mboxW, 52, 6).fill('#f9fafb')
      doc.fontSize(18).font('Helvetica-Bold').fillColor(m.color)
        .text(m.value, bx, y + 8, { width: mboxW, align: 'center', lineBreak: false })
      doc.fontSize(8).font('Helvetica').fillColor(GRAY)
        .text(m.unit, bx, y + 30, { width: mboxW, align: 'center', lineBreak: false })
      doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY)
        .text(m.label, bx, y + 40, { width: mboxW, align: 'center', lineBreak: false })
    })
    y += 64

    // ── SECTION LABEL helper ─────────────────────────────────────────────────
    const sectionLabel = (title: string) => {
      if (y > 760) { doc.addPage(); y = MARGIN }
      doc.rect(MARGIN, y, CONTENT_W, 22).fill(LIGHT_GREEN)
      doc.rect(MARGIN, y + 21, CONTENT_W, 1).fill(BORDER_GREEN)
      doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREEN)
        .text(title, MARGIN + 8, y + 6)
      y += 28
    }

    // ── OBJECTIVE ────────────────────────────────────────────────────────────
    if (diet.objective) {
      sectionLabel('Objetivo Nutricional')
      const objText = diet.objective
      const objH = doc.heightOfString(objText, { width: CONTENT_W - 16, fontSize: 9 }) + 16
      doc.rect(MARGIN, y, CONTENT_W, objH).fill('#fafafa')
      doc.rect(MARGIN, y, 3, objH).fill(GREEN)
      doc.fontSize(9).font('Helvetica').fillColor('#374151')
        .text(objText, MARGIN + 12, y + 8, { width: CONTENT_W - 16 })
      y += objH + 10
    }

    // ── MEALS ────────────────────────────────────────────────────────────────
    sectionLabel('Plano Alimentar Diário')

    diet.meals.forEach(meal => {
      if (y > 720) { doc.addPage(); y = MARGIN }

      // Meal header
      const mealHeaderH = 24
      doc.rect(MARGIN, y, CONTENT_W, mealHeaderH).fill(LIGHT_GREEN)
      doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK_GREEN)
        .text(`${meal.name}  ${meal.time}`, MARGIN + 8, y + 7, { lineBreak: false })
      doc.fontSize(10).font('Helvetica-Bold').fillColor(GREEN)
        .text(`${meal.totalCalories} kcal`, MARGIN, y + 7, { width: CONTENT_W - 8, align: 'right', lineBreak: false })
      y += mealHeaderH

      // Table header
      const cols = [200, 80, 55, 55, 55, 55]
      const headers = ['Alimento', 'Qtd', 'Kcal', 'Prot', 'Carb', 'Gord']
      doc.rect(MARGIN, y, CONTENT_W, 18).fill('#f9fafb')
      cx = MARGIN + 8
      headers.forEach((h, i) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(GRAY)
          .text(h, cx, y + 5, { width: cols[i], lineBreak: false, align: i === 0 ? 'left' : 'center' })
        cx += cols[i]
      })
      y += 18

      // Table rows
      meal.foods.forEach((food, fi) => {
        if (y > 780) { doc.addPage(); y = MARGIN }
        doc.rect(MARGIN, y, CONTENT_W, 18).fill(fi % 2 === 0 ? WHITE : '#fafafa')
        cx = MARGIN + 8
        const cells = [
          food.name,
          `${food.quantity} ${food.unit}`,
          `${food.calories}`,
          `${food.protein ?? '-'}g`,
          `${food.carbs ?? '-'}g`,
          `${food.fat ?? '-'}g`,
        ]
        cells.forEach((cell, i) => {
          doc.fontSize(8).font('Helvetica').fillColor(DARK)
            .text(cell, cx, y + 5, { width: cols[i], lineBreak: false, align: i === 0 ? 'left' : 'center' })
          cx += cols[i]
        })
        y += 18
      })

      // Border around meal
      doc.rect(MARGIN, y - mealHeaderH - 18 - meal.foods.length * 18, CONTENT_W, mealHeaderH + 18 + meal.foods.length * 18).stroke(BORDER_GREEN)
      y += 8
    })

    // ── SUBSTITUTIONS ────────────────────────────────────────────────────────
    if (diet.substitutions?.length) {
      if (y > 680) { doc.addPage(); y = MARGIN }
      sectionLabel('Tabela de Substituições')

      const subCols = [120, 140, CONTENT_W - 260 - 8]
      const subHeaders = ['Categoria', 'Alimento Base', 'Substituições']
      doc.rect(MARGIN, y, CONTENT_W, 18).fill(LIGHT_GREEN)
      cx = MARGIN + 8
      subHeaders.forEach((h, i) => {
        doc.fontSize(8).font('Helvetica-Bold').fillColor(DARK_GREEN).text(h, cx, y + 5, { width: subCols[i], lineBreak: false })
        cx += subCols[i]
      })
      y += 18

      diet.substitutions.forEach((sub, si) => {
        if (y > 780) { doc.addPage(); y = MARGIN }
        doc.rect(MARGIN, y, CONTENT_W, 18).fill(si % 2 === 0 ? WHITE : '#fafafa')
        cx = MARGIN + 8
        const cells = [sub.category, sub.original, sub.alternatives.join(' • ')]
        cells.forEach((cell, i) => {
          doc.fontSize(8).font('Helvetica').fillColor(DARK).text(cell, cx, y + 5, { width: subCols[i], lineBreak: false })
          cx += subCols[i]
        })
        y += 18
      })
      doc.rect(MARGIN, y - 18 - diet.substitutions.length * 18, CONTENT_W, 18 + diet.substitutions.length * 18).stroke(BORDER_GREEN)
      y += 10
    }

    // ── HYDRATION & NOTES ────────────────────────────────────────────────────
    if (diet.hydration) {
      if (y > 760) { doc.addPage(); y = MARGIN }
      doc.rect(MARGIN, y, CONTENT_W, 40).fill('#eff6ff')
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#1d4ed8').text('Hidratação', MARGIN + 8, y + 7, { lineBreak: false })
      doc.fontSize(9).font('Helvetica').fillColor('#374151').text(diet.hydration, MARGIN + 8, y + 20, { width: CONTENT_W - 16, lineBreak: false })
      y += 48
    }

    if (diet.generalNotes) {
      if (y > 760) { doc.addPage(); y = MARGIN }
      const noteH = doc.heightOfString(diet.generalNotes, { width: CONTENT_W - 16, fontSize: 9 }) + 22
      doc.rect(MARGIN, y, CONTENT_W, noteH).fill('#fefce8')
      doc.rect(MARGIN, y, 3, noteH).fill('#f59e0b')
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#92400e').text('Observações', MARGIN + 12, y + 6, { lineBreak: false })
      doc.fontSize(9).font('Helvetica').fillColor('#78350f').text(diet.generalNotes, MARGIN + 12, y + 18, { width: CONTENT_W - 20 })
      y += noteH + 10
    }

    // ── FOOTER ───────────────────────────────────────────────────────────────
    const footerY = 800
    doc.rect(0, footerY, PAGE_W, 41.89).fill('#f9fafb')
    doc.rect(0, footerY, PAGE_W, 1).fill('#e5e7eb')
    doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK).text(nutritionist.name, MARGIN, footerY + 8, { lineBreak: false })
    if (nutritionist.crn) {
      doc.fontSize(8).font('Helvetica').fillColor(GRAY).text(nutritionist.crn, MARGIN, footerY + 22, { lineBreak: false })
    }
    doc.fontSize(8).font('Helvetica').fillColor(GRAY)
      .text('NutriPro — Plataforma de Nutrição', 0, footerY + 16, { width: PAGE_W - MARGIN, align: 'right', lineBreak: false })

    doc.end()
  })
}
