import nodemailer from 'nodemailer'

interface EmailPayload {
  to: string
  subject: string
  html: string
  attachments?: Array<{ filename: string; content: Buffer }>
}

export async function sendEmail(payload: EmailPayload) {
  const config = useRuntimeConfig()

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: config.gmailUser as string,
      pass: config.gmailPass as string,
    },
  })

  await transporter.sendMail({
    from: (config.smtpFrom as string) || `NutriPro <${config.gmailUser}>`,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
    attachments: payload.attachments?.map(a => ({
      filename: a.filename,
      content: a.content,
    })),
  })
}
