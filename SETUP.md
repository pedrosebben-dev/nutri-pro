# NutriPro — Guia de Instalação

## Requisitos

- Node.js 18+
- PostgreSQL 14+ (ou conta no [Supabase](https://supabase.com) gratuito)
- Chave de API da OpenAI

---

## Passo a passo

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# PostgreSQL — crie um banco de dados e cole a URL aqui
DATABASE_URL="postgresql://usuario:senha@localhost:5432/nutripro"

# JWT — gere uma string aleatória longa
JWT_SECRET="minha-chave-super-secreta-aqui"

# OpenAI — acesse platform.openai.com para gerar
OPENAI_API_KEY="sk-..."
```

### 3. Configurar banco de dados

```bash
# Cria as tabelas no PostgreSQL
npm run db:migrate

# Gera o cliente Prisma
npm run db:generate

# Popula com dados iniciais (nutricionista e paciente de exemplo)
npm run db:seed
```

### 4. Iniciar o projeto

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Credenciais iniciais

Após o seed:

| Campo | Valor |
|-------|-------|
| E-mail | `nutricionista@nutripro.com` |
| Senha | `admin123` |

> ⚠️ Troque a senha em **Configurações** após o primeiro login!

---

## Funcionalidades

| Feature | Status |
|---------|--------|
| Login / Logout seguro (JWT + HttpOnly cookie) | ✅ |
| Cadastro de pacientes com dados completos | ✅ |
| Geração de dietas com GPT-4o | ✅ |
| Tabela de substituições na dieta | ✅ |
| Download de PDF profissional | ✅ |
| Upload de logo do consultório | ✅ |
| Dashboard com estatísticas | ✅ |
| Edição e exclusão de pacientes | ✅ |
| Histórico de dietas por paciente | ✅ |

---

## Estrutura do projeto

```
nutri-pro/
├── prisma/
│   ├── schema.prisma       # Modelos do banco de dados
│   └── seed.js             # Dados iniciais
├── server/
│   ├── api/
│   │   ├── auth/           # Login, logout, perfil, logo
│   │   ├── patients/       # CRUD de pacientes
│   │   ├── diet/           # Geração e listagem de dietas
│   │   ├── pdf/            # Geração de PDF
│   │   └── dashboard/      # Estatísticas
│   ├── middleware/
│   │   └── auth.ts         # Proteção de rotas via JWT
│   └── utils/
│       ├── prisma.ts       # Instância do Prisma
│       ├── openai.ts       # Integração OpenAI + prompt
│       └── pdf.ts          # Template HTML → PDF (Puppeteer)
├── pages/
│   ├── login.vue
│   └── dashboard/
│       ├── index.vue       # Dashboard
│       ├── patients/       # Lista, novo, detalhes
│       ├── diets/[id].vue  # Visualizar dieta
│       └── settings.vue    # Perfil + logo + senha
├── components/
│   └── PatientForm.vue     # Formulário reutilizável
├── layouts/
│   └── default.vue         # Sidebar + layout principal
├── composables/
│   └── useAuth.ts          # Autenticação global
└── assets/css/main.css     # Estilos Tailwind customizados
```

---

## Deploy (produção)

### Recomendado: Railway + Supabase

1. **Banco de dados:** Crie um projeto no [Supabase](https://supabase.com) e copie a `DATABASE_URL`
2. **App:** Suba o código no [Railway](https://railway.app) e configure as variáveis de ambiente
3. **Build:** Railway detecta Nuxt automaticamente e roda `npm run build`

### Variáveis adicionais para produção

```env
NODE_ENV=production
NUXT_HOST=0.0.0.0
NUXT_PORT=3000
```

---

## Customização do PDF

O template do PDF está em `server/utils/pdf.ts` na função `buildDietHtml()`.

- **Cores:** Altere o gradiente no header (`linear-gradient(...)`)  
- **Logo:** Faça upload em **Configurações** → aparece automaticamente em todos os PDFs  
- **Rodapé:** Adicione informações extras no bloco `FOOTER`  
- **Fontes:** Troque a URL do Google Fonts para outra fonte

---

## Suporte

Dúvidas? Abra uma issue ou entre em contato.
