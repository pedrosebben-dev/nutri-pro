import nodemailer from 'nodemailer'

export function getMailTransporter() {
  const config = useRuntimeConfig()
  return nodemailer.createTransport({
    host: config.smtpHost as string || 'smtp.gmail.com',
    port: Number(config.smtpPort) || 587,
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser as string,
      pass: config.smtpPass as string,
    },
  })
}
