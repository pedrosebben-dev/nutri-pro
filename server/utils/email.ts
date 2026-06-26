interface EmailPayload {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer }>
}

export async function sendEmail(payload: EmailPayload) {
  const config = useRuntimeConfig()
  const apiKey = config.brevoApiKey as string

  if (!apiKey) throw new Error('BREVO_API_KEY não configurada')

  const sender = parseSender((config.smtpFrom as string) || `NutriPro <${config.smtpUser}>`)

  const body: Record<string, unknown> = {
    sender,
    to: [{ email: payload.to }],
    subject: payload.subject,
    htmlContent: payload.html,
  }

  if (payload.attachments?.length) {
    body.attachment = payload.attachments.map(a => ({
      name: a.filename,
      content: a.content.toString('base64'),
    }))
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Brevo API error: ${JSON.stringify(err)}`)
  }

  return res.json()
}

function parseSender(from: string): { name: string; email: string } {
  const m = from.match(/^(.+?)\s*<(.+)>$/)
  return m ? { name: m[1].trim(), email: m[2].trim() } : { name: 'NutriPro', email: from }
}
