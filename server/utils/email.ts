interface EmailPayload {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer }>
}

export async function sendEmail(payload: EmailPayload) {
  const config = useRuntimeConfig()
  const apiKey = config.resendApiKey as string

  if (!apiKey) throw new Error('RESEND_API_KEY não configurada')

  const body: Record<string, unknown> = {
    from: (config.smtpFrom as string) || 'NutriPro <onboarding@resend.dev>',
    to: [payload.to],
    subject: payload.subject,
    html: payload.html,
  }

  if (payload.attachments?.length) {
    body.attachments = payload.attachments.map(a => ({
      filename: a.filename,
      content: a.content.toString('base64'),
    }))
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Resend API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}
