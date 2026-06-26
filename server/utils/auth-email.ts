import { getMailTransporter } from './email'

interface SendResult {
  devMode: boolean
  code?: string
}

export async function sendVerificationEmail(email: string, name: string, code: string): Promise<SendResult> {
  const config = useRuntimeConfig()
  if (!config.smtpUser) {
    console.log(`\n[DEV] Código de verificação para ${email}: ${code}\n`)
    return { devMode: true, code }
  }
  const transporter = getMailTransporter()
  await transporter.sendMail({
    from: (config.smtpFrom as string) || `NutriPro <${config.smtpUser}>`,
    to: email,
    subject: 'Confirme seu e-mail — NutriPro',
    html: buildEmailHtml({
      title: 'Confirme seu e-mail',
      greeting: `Olá, ${name}!`,
      body: 'Use o código abaixo para confirmar seu endereço de e-mail. Ele expira em <strong>10 minutos</strong>.',
      code,
      footer: 'Se você não criou uma conta no NutriPro, ignore este e-mail.',
    }),
  })
  return { devMode: false }
}

export async function sendPasswordResetEmail(email: string, name: string, code: string): Promise<SendResult> {
  const config = useRuntimeConfig()
  if (!config.smtpUser) {
    console.log(`\n[DEV] Código de redefinição para ${email}: ${code}\n`)
    return { devMode: true, code }
  }
  const transporter = getMailTransporter()
  await transporter.sendMail({
    from: (config.smtpFrom as string) || `NutriPro <${config.smtpUser}>`,
    to: email,
    subject: 'Redefinição de senha — NutriPro',
    html: buildEmailHtml({
      title: 'Redefina sua senha',
      greeting: `Olá, ${name}!`,
      body: 'Use o código abaixo para redefinir sua senha. Ele expira em <strong>10 minutos</strong>.',
      code,
      footer: 'Se você não solicitou a redefinição de senha, ignore este e-mail.',
    }),
  })
  return { devMode: false }
}

function buildEmailHtml(opts: { title: string; greeting: string; body: string; code: string; footer: string }) {
  return `
    <div style="font-family: Inter, Arial, sans-serif; background: #f9fafb; padding: 40px 20px; min-height: 100vh;">
      <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #16a34a, #059669); padding: 32px; text-align: center;">
          <div style="display:inline-flex; align-items:center; gap:10px;">
            <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:18px;">🥗</span>
            </div>
            <span style="color:white;font-size:20px;font-weight:700;">NutriPro</span>
          </div>
        </div>
        <div style="padding: 40px 32px;">
          <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">${opts.title}</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">${opts.greeting}</p>
          <p style="margin:0 0 32px;color:#374151;font-size:15px;">${opts.body}</p>
          <div style="background:#f0fdf4;border:2px dashed #86efac;border-radius:12px;padding:24px;text-align:center;margin-bottom:32px;">
            <p style="margin:0 0 4px;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600;">Seu código</p>
            <p style="margin:0;font-size:36px;font-weight:800;color:#16a34a;letter-spacing:8px;">${opts.code}</p>
          </div>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 24px;"/>
          <p style="margin:0;color:#9ca3af;font-size:12px;">${opts.footer}</p>
        </div>
      </div>
    </div>
  `
}
