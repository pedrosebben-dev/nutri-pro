// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css', 'primeicons/primeicons.css'],

  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    groqApiKey: process.env.GROQ_API_KEY || '',
    databaseUrl: process.env.DATABASE_URL || '',
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    smtpFrom: process.env.SMTP_FROM || '',
    gmailUser: process.env.GMAIL_USER || '',
    gmailPass: process.env.GMAIL_PASS || '',
    public: {
      appName: 'NutriPro',
    },
  },

  nitro: {
    experimental: {
      wasm: true,
    },
  },

  app: {
    head: {
      title: 'NutriPro — Sistema de Dietas',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Plataforma profissional para nutricionistas gerenciarem pacientes e dietas com IA.' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap' },
      ],
    },
  },

  compatibilityDate: '2024-08-14',
})
