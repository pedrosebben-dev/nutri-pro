import { prisma } from '~/server/utils/prisma'
import { generateDietPdf } from '~/server/utils/pdf'
import { sendEmail } from '~/server/utils/email'
import type { GeneratedDiet } from '~/server/utils/openai'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.user
  const dietId = getRouterParam(event, 'id')!
  const { email, message } = await readBody(event)

  if (!email) throw createError({ statusCode: 400, statusMessage: 'E-mail do destinatário é obrigatório.' })

  const config = useRuntimeConfig()
  if (!config.brevoApiKey) {
    throw createError({ statusCode: 503, statusMessage: 'Serviço de e-mail não configurado. Adicione BREVO_API_KEY no .env.' })
  }

  const diet = await prisma.diet.findFirst({
    where: { id: dietId, patient: { userId } },
    include: { patient: true },
  })
  if (!diet) throw createError({ statusCode: 404, statusMessage: 'Dieta não encontrada.' })

  const nutritionist = await prisma.user.findUnique({ where: { id: userId } })
  if (!nutritionist) throw createError({ statusCode: 404, statusMessage: 'Nutricionista não encontrado.' })

  let pdfBuffer: Buffer
  try {
    pdfBuffer = await generateDietPdf({
      diet: diet.content as unknown as GeneratedDiet,
      patient: diet.patient,
      nutritionist,
      dietTitle: diet.title,
      validUntil: diet.validUntil?.toISOString() || null,
    })
  } catch (err: any) {
    console.error('[diet/email] PDF generation failed:', err)
    throw createError({ statusCode: 500, statusMessage: `Erro ao gerar PDF: ${err?.message || 'erro desconhecido'}` })
  }

  try {
    await sendEmail({
      to: email,
      subject: `Seu Plano Alimentar — ${diet.title}`,
      html: `
        <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: #16a34a; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h1 style="color: white; margin: 0; font-size: 20px;">🥗 NutriPro</h1>
            <p style="color: #bbf7d0; margin: 4px 0 0;">Plano Alimentar Personalizado</p>
          </div>
          <p style="font-size: 16px; color: #1f2937;">Olá, <strong>${diet.patient.name}</strong>!</p>
          <p style="color: #4b5563;">Segue em anexo seu plano alimentar personalizado: <strong>${diet.title}</strong>.</p>
          ${message ? `<p style="color: #4b5563; background: #f9fafb; padding: 12px; border-radius: 8px; border-left: 3px solid #16a34a;">${message}</p>` : ''}
          <p style="color: #4b5563;">Qualquer dúvida, entre em contato com seu nutricionista.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 13px;">Atenciosamente,<br><strong>${nutritionist.name}</strong>${nutritionist.crn ? ` • CRN: ${nutritionist.crn}` : ''}</p>
        </div>
      `,
      attachments: [{
        filename: `plano-${diet.patient.name.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        content: pdfBuffer,
      }],
    })
  } catch (err: any) {
    console.error('[diet/email] Email send failed:', err)
    throw createError({ statusCode: 500, statusMessage: `Erro ao enviar e-mail: ${err?.message || 'erro desconhecido'}` })
  }

  return { success: true, message: `Plano enviado para ${email}` }
})
