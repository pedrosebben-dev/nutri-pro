<template>
  <div class="min-h-screen flex bg-white">

    <!-- ─── Left panel ─── -->
    <div class="flex-1 flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-[400px]">

        <!-- Brand -->
        <div class="flex items-center gap-3 mb-8">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow">
            <i class="pi pi-heart text-white" style="font-size:0.85rem"></i>
          </div>
          <span class="text-xl font-bold text-neutral-900">NutriPro</span>
        </div>

        <!-- Error box reusable -->
        <template v-if="false"><div id="error-anchor"></div></template>

        <!-- ── STEP: Login ── -->
        <Transition name="slide-fade" mode="out-in">
          <div v-if="step === 'login'" key="login">
            <h1 class="text-2xl font-bold text-neutral-900 mb-1">Bem-vindo de volta</h1>
            <p class="text-neutral-500 text-sm mb-7">Entre com suas credenciais para acessar o painel.</p>

            <form @submit.prevent="handleLogin" class="space-y-4">
              <div>
                <label class="label">E-mail</label>
                <input v-model="f.email" type="email" class="input" placeholder="seu@email.com" required autocomplete="email" />
              </div>
              <div>
                <label class="label">Senha</label>
                <div class="relative">
                  <input v-model="f.password" :type="showPwd ? 'text' : 'password'" class="input pr-10" placeholder="••••••••" required autocomplete="current-password" />
                  <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'" style="font-size:0.85rem"></i>
                  </button>
                </div>
              </div>
              <div class="text-right -mt-1">
                <button type="button" @click="step = 'forgot'" class="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Esqueci minha senha
                </button>
              </div>
              <div v-if="errorMsg" class="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
                <i class="pi pi-exclamation-circle flex-shrink-0 mt-0.5" style="font-size:0.85rem"></i>
                <span>{{ errorMsg }}</span>
              </div>
              <button type="submit" class="btn-primary w-full !py-3 text-base" :disabled="loading">
                <span v-if="loading" class="spinner w-4 h-4"></span>
                {{ loading ? 'Entrando...' : 'Entrar' }}
              </button>
            </form>

            <p class="mt-6 text-center text-sm text-neutral-500">
              Não tem uma conta?
              <button @click="step = 'register'" class="text-primary-600 hover:text-primary-700 font-semibold ml-1">
                Criar conta grátis
              </button>
            </p>
          </div>

          <!-- ── STEP: Register ── -->
          <div v-else-if="step === 'register'" key="register">
            <button @click="step = 'login'" class="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 mb-6">
              <i class="pi pi-arrow-left" style="font-size:0.75rem"></i> Voltar ao login
            </button>
            <h1 class="text-2xl font-bold text-neutral-900 mb-1">Criar sua conta</h1>
            <p class="text-neutral-500 text-sm mb-7">Preencha seus dados para começar.</p>

            <form @submit.prevent="handleRegister" class="space-y-4">
              <div>
                <label class="label">Nome completo</label>
                <input v-model="f.name" type="text" class="input" placeholder="Dr. João Silva" required />
              </div>
              <div>
                <label class="label">E-mail profissional</label>
                <input v-model="f.email" type="email" class="input" placeholder="seu@email.com" required autocomplete="email" />
              </div>
              <div>
                <label class="label">CRN <span class="text-neutral-400 font-normal">(opcional)</span></label>
                <input v-model="f.crn" type="text" class="input" placeholder="CRN-3 12345" />
              </div>
              <div>
                <label class="label">Senha</label>
                <div class="relative">
                  <input v-model="f.password" :type="showPwd ? 'text' : 'password'" class="input pr-10" placeholder="Mínimo 6 caracteres" required autocomplete="new-password" />
                  <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'" style="font-size:0.85rem"></i>
                  </button>
                </div>
              </div>
              <div>
                <label class="label">Confirmar senha</label>
                <input v-model="f.confirmPassword" :type="showPwd ? 'text' : 'password'" class="input" placeholder="Repita a senha" required />
              </div>
              <div v-if="errorMsg" class="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
                <i class="pi pi-exclamation-circle flex-shrink-0 mt-0.5" style="font-size:0.85rem"></i>
                <span>{{ errorMsg }}</span>
              </div>
              <button type="submit" class="btn-primary w-full !py-3 text-base" :disabled="loading">
                <span v-if="loading" class="spinner w-4 h-4"></span>
                {{ loading ? 'Criando conta...' : 'Criar conta' }}
              </button>
            </form>
          </div>

          <!-- ── STEP: Verify email ── -->
          <div v-else-if="step === 'verify'" key="verify">
            <div class="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-6">
              <i class="pi pi-envelope-open text-emerald-600" style="font-size:1.4rem"></i>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 mb-1">Verifique seu e-mail</h1>
            <p class="text-neutral-500 text-sm mb-1">Enviamos um código de 6 dígitos para</p>
            <p class="font-semibold text-neutral-800 text-sm mb-7">{{ f.email }}</p>

            <div v-if="devCode" class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
              <i class="pi pi-info-circle text-amber-500 mt-0.5 flex-shrink-0" style="font-size:0.85rem"></i>
              <div>
                <p class="text-xs font-semibold text-amber-800">Modo dev — SMTP não configurado</p>
                <p class="text-lg font-mono font-bold text-amber-700 mt-1 tracking-widest">{{ devCode }}</p>
              </div>
            </div>

            <!-- OTP inputs -->
            <div class="flex gap-2 justify-center mb-6">
              <input
                v-for="(_, i) in otpValues"
                :key="i"
                :ref="(el) => { if (el) (otpRefs as HTMLInputElement[])[i] = el as HTMLInputElement }"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none"
                :class="otpValues[i] ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-neutral-200 focus:border-emerald-400'"
                :value="otpValues[i]"
                @input="handleOtpInput(i, $event as InputEvent)"
                @keydown="handleOtpKeydown(i, $event)"
                @paste.prevent="handleOtpPaste($event as ClipboardEvent)"
              />
            </div>

            <div v-if="errorMsg" class="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100 mb-4">
              <i class="pi pi-exclamation-circle flex-shrink-0 mt-0.5" style="font-size:0.85rem"></i>
              <span>{{ errorMsg }}</span>
            </div>

            <button @click="handleVerify" class="btn-primary w-full !py-3 text-base mb-4" :disabled="loading || otpCode.length < 6">
              <span v-if="loading" class="spinner w-4 h-4"></span>
              {{ loading ? 'Verificando...' : 'Confirmar e-mail' }}
            </button>

            <p class="text-center text-sm text-neutral-500">
              Não recebeu?
              <button @click="handleResend('verify_email')" :disabled="resendCooldown > 0" class="text-primary-600 hover:text-primary-700 font-semibold ml-1 disabled:opacity-40 disabled:cursor-not-allowed">
                {{ resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código' }}
              </button>
            </p>
          </div>

          <!-- ── STEP: Forgot password ── -->
          <div v-else-if="step === 'forgot'" key="forgot">
            <button @click="step = 'login'" class="flex items-center gap-1.5 text-sm text-neutral-400 hover:text-neutral-600 mb-6">
              <i class="pi pi-arrow-left" style="font-size:0.75rem"></i> Voltar ao login
            </button>
            <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <i class="pi pi-lock text-blue-600" style="font-size:1.4rem"></i>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 mb-1">Esqueceu a senha?</h1>
            <p class="text-neutral-500 text-sm mb-7">
              Informe seu e-mail e enviaremos um código para redefinir a senha.
            </p>

            <form @submit.prevent="handleForgot" class="space-y-4">
              <div>
                <label class="label">E-mail cadastrado</label>
                <input v-model="f.email" type="email" class="input" placeholder="seu@email.com" required />
              </div>
              <div v-if="errorMsg" class="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
                <i class="pi pi-exclamation-circle flex-shrink-0 mt-0.5" style="font-size:0.85rem"></i>
                <span>{{ errorMsg }}</span>
              </div>
              <button type="submit" class="btn-primary w-full !py-3 text-base" :disabled="loading">
                <span v-if="loading" class="spinner w-4 h-4"></span>
                {{ loading ? 'Enviando...' : 'Enviar código' }}
              </button>
            </form>
          </div>

          <!-- ── STEP: Reset password ── -->
          <div v-else-if="step === 'reset'" key="reset">
            <div class="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-6">
              <i class="pi pi-key text-blue-600" style="font-size:1.4rem"></i>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 mb-1">Redefinir senha</h1>
            <p class="text-neutral-500 text-sm mb-1">Código enviado para</p>
            <p class="font-semibold text-neutral-800 text-sm mb-7">{{ f.email }}</p>

            <div v-if="devCode" class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 flex items-start gap-2">
              <i class="pi pi-info-circle text-amber-500 mt-0.5 flex-shrink-0" style="font-size:0.85rem"></i>
              <div>
                <p class="text-xs font-semibold text-amber-800">Modo dev — SMTP não configurado</p>
                <p class="text-lg font-mono font-bold text-amber-700 mt-1 tracking-widest">{{ devCode }}</p>
              </div>
            </div>

            <!-- OTP inputs -->
            <div class="flex gap-2 justify-center mb-6">
              <input
                v-for="(_, i) in otpValues"
                :key="i"
                :ref="(el) => { if (el) (otpRefs as HTMLInputElement[])[i] = el as HTMLInputElement }"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl transition-all focus:outline-none"
                :class="otpValues[i] ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-neutral-200 focus:border-blue-400'"
                :value="otpValues[i]"
                @input="handleOtpInput(i, $event as InputEvent)"
                @keydown="handleOtpKeydown(i, $event)"
                @paste.prevent="handleOtpPaste($event as ClipboardEvent)"
              />
            </div>

            <form @submit.prevent="handleReset" class="space-y-4">
              <div>
                <label class="label">Nova senha</label>
                <div class="relative">
                  <input v-model="f.newPassword" :type="showPwd ? 'text' : 'password'" class="input pr-10" placeholder="Mínimo 6 caracteres" required />
                  <button type="button" @click="showPwd = !showPwd" class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                    <i :class="showPwd ? 'pi pi-eye-slash' : 'pi pi-eye'" style="font-size:0.85rem"></i>
                  </button>
                </div>
              </div>
              <div>
                <label class="label">Confirmar nova senha</label>
                <input v-model="f.confirmPassword" :type="showPwd ? 'text' : 'password'" class="input" placeholder="Repita a senha" required />
              </div>
              <div v-if="errorMsg" class="flex items-start gap-2 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 border border-red-100">
                <i class="pi pi-exclamation-circle flex-shrink-0 mt-0.5" style="font-size:0.85rem"></i>
                <span>{{ errorMsg }}</span>
              </div>
              <button type="submit" class="btn-primary w-full !py-3 text-base" :disabled="loading || otpCode.length < 6">
                <span v-if="loading" class="spinner w-4 h-4"></span>
                {{ loading ? 'Salvando...' : 'Redefinir senha' }}
              </button>
            </form>

            <p class="text-center text-sm text-neutral-500 mt-4">
              Não recebeu?
              <button @click="handleResend('reset_password')" :disabled="resendCooldown > 0" class="text-primary-600 hover:text-primary-700 font-semibold ml-1 disabled:opacity-40 disabled:cursor-not-allowed">
                {{ resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar código' }}
              </button>
            </p>
          </div>

          <!-- ── STEP: Success ── -->
          <div v-else-if="step === 'success'" key="success" class="text-center py-4">
            <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-check text-emerald-600" style="font-size:1.5rem"></i>
            </div>
            <h1 class="text-2xl font-bold text-neutral-900 mb-2">Senha redefinida!</h1>
            <p class="text-neutral-500 text-sm mb-8">Sua senha foi atualizada com sucesso.</p>
            <button @click="step = 'login'; resetForm()" class="btn-primary w-full !py-3 text-base">
              Fazer login agora
            </button>
          </div>
        </Transition>

      </div>
    </div>

    <!-- ─── Right panel ─── -->
    <div class="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 items-center justify-center p-12 relative overflow-hidden">
      <div class="absolute inset-0 opacity-10 pointer-events-none">
        <div class="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl"></div>
        <div class="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white blur-2xl"></div>
      </div>
      <div class="max-w-md relative z-10">
        <Transition name="slide-fade" mode="out-in">
          <div :key="step">
            <h2 class="text-3xl font-bold text-white mb-4 leading-tight">{{ rightPanel.title }}</h2>
            <p class="text-emerald-200 text-lg mb-10">{{ rightPanel.subtitle }}</p>
            <div class="space-y-4">
              <div v-for="feat in rightPanel.features" :key="feat" class="flex items-start gap-3">
                <div class="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow">
                  <i class="pi pi-check text-white" style="font-size:0.55rem;font-weight:900"></i>
                </div>
                <p class="text-emerald-100 text-sm">{{ feat }}</p>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: false })
const { login, setUser } = useAuth()

interface User {
  id: string; email: string; name: string; crn?: string | null; logoUrl?: string | null
}

type Step = 'login' | 'register' | 'verify' | 'forgot' | 'reset' | 'success'
const step = ref<Step>('login')
const loading = ref(false)
const errorMsg = ref('')
const showPwd = ref(false)
const devCode = ref<string | undefined>()
const pendingUserId = ref('')
const resendCooldown = ref(0)

const f = reactive({
  name: '', email: '', password: '', confirmPassword: '',
  crn: '', newPassword: '',
})

const otpRefs: HTMLInputElement[] = []
const otpValues = ref(['', '', '', '', '', ''])
const otpCode = computed(() => otpValues.value.join(''))

function resetOtp() { otpValues.value = ['', '', '', '', '', ''] }

function resetForm() {
  Object.assign(f, { name: '', email: '', password: '', confirmPassword: '', crn: '', newPassword: '' })
  errorMsg.value = ''
  devCode.value = undefined
  resetOtp()
}

watch(step, () => { errorMsg.value = ''; resetOtp() })

// OTP
function handleOtpInput(idx: number, e: InputEvent) {
  const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1)
  otpValues.value[idx] = val;
  (e.target as HTMLInputElement).value = val
  if (val && idx < 5) otpRefs[idx + 1]?.focus()
}
function handleOtpKeydown(idx: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !otpValues.value[idx] && idx > 0) otpRefs[idx - 1]?.focus()
}
function handleOtpPaste(e: ClipboardEvent) {
  const digits = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  digits.split('').forEach((d, i) => { otpValues.value[i] = d })
  nextTick(() => otpRefs[Math.min(digits.length, 5)]?.focus())
}

// Cooldown timer
function startCooldown() {
  resendCooldown.value = 60
  const t = setInterval(() => { resendCooldown.value--; if (resendCooldown.value <= 0) clearInterval(t) }, 1000)
}

// Handlers
async function handleLogin() {
  loading.value = true; errorMsg.value = ''
  try {
    await login(f.email, f.password)
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string; data?: { userId?: string; needsVerification?: boolean } } }
    if (e?.data?.data?.needsVerification && e?.data?.data?.userId) {
      pendingUserId.value = e.data.data.userId
      step.value = 'verify'
      return
    }
    errorMsg.value = e?.data?.statusMessage || 'Credenciais inválidas.'
  } finally { loading.value = false }
}

async function handleRegister() {
  errorMsg.value = ''
  if (f.password !== f.confirmPassword) { errorMsg.value = 'As senhas não coincidem.'; return }
  loading.value = true
  try {
    const res = await $fetch<{ userId: string; email: string; devCode?: string }>('/api/auth/register', {
      method: 'POST',
      body: { name: f.name, email: f.email, password: f.password, crn: f.crn },
    })
    pendingUserId.value = res.userId
    devCode.value = res.devCode
    step.value = 'verify'
    startCooldown()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e?.data?.statusMessage || 'Erro ao criar conta.'
  } finally { loading.value = false }
}

async function handleVerify() {
  if (otpCode.value.length < 6) return
  loading.value = true; errorMsg.value = ''
  try {
    const res = await $fetch<{ token: string; user: User }>('/api/auth/verify-email', {
      method: 'POST',
      body: { userId: pendingUserId.value, code: otpCode.value },
    })
    setUser(res.user, res.token)
    await navigateTo('/dashboard')
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e?.data?.statusMessage || 'Código inválido.'
    resetOtp(); otpRefs[0]?.focus()
  } finally { loading.value = false }
}

async function handleForgot() {
  loading.value = true; errorMsg.value = ''
  try {
    const res = await $fetch<{ userId: string | null; devCode?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: f.email },
    })
    if (res.userId) { pendingUserId.value = res.userId; devCode.value = res.devCode }
    step.value = 'reset'
    startCooldown()
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e?.data?.statusMessage || 'Erro ao enviar o código.'
  } finally { loading.value = false }
}

async function handleReset() {
  errorMsg.value = ''
  if (f.newPassword !== f.confirmPassword) { errorMsg.value = 'As senhas não coincidem.'; return }
  if (otpCode.value.length < 6) { errorMsg.value = 'Digite o código de 6 dígitos.'; return }
  loading.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: { userId: pendingUserId.value, code: otpCode.value, newPassword: f.newPassword },
    })
    step.value = 'success'
  } catch (err: unknown) {
    const e = err as { data?: { statusMessage?: string } }
    errorMsg.value = e?.data?.statusMessage || 'Erro ao redefinir senha.'
    resetOtp()
  } finally { loading.value = false }
}

async function handleResend(type: 'verify_email' | 'reset_password') {
  try {
    const res = await $fetch<{ devCode?: string }>('/api/auth/resend-code', {
      method: 'POST',
      body: { userId: pendingUserId.value, type },
    })
    devCode.value = res.devCode
    startCooldown(); resetOtp(); nextTick(() => otpRefs[0]?.focus())
  } catch { errorMsg.value = 'Erro ao reenviar o código.' }
}

// Right panel content
const panels = {
  login:    { title: 'Gerencie pacientes com IA', subtitle: 'A plataforma completa para nutricionistas modernos.', features: ['Dietas geradas por IA em segundos', 'PDFs profissionais com sua logo', 'Envio por e-mail ao paciente', 'Histórico completo de planos'] },
  register: { title: 'Comece gratuitamente hoje', subtitle: 'Crie sua conta e gere seu primeiro plano em minutos.', features: ['Cadastre pacientes com foto e histórico', 'IA gera planos alimentares completos', 'Tabela de substituições automática', 'Export em PDF profissional'] },
  verify:   { title: 'Quase lá!', subtitle: 'Confirme seu e-mail para ativar sua conta com segurança.', features: ['Código expira em 10 minutos', 'Solicite um novo código se necessário', 'Conta protegida contra acessos não autorizados'] },
  forgot:   { title: 'Recupere seu acesso', subtitle: 'Enviamos um código seguro para redefinir sua senha.', features: ['Código válido por 10 minutos', 'Processo 100% seguro', 'Sem necessidade de dados adicionais'] },
  reset:    { title: 'Crie uma nova senha', subtitle: 'Escolha uma senha forte para proteger sua conta.', features: ['Mínimo de 6 caracteres', 'Senha criptografada com bcrypt', 'Seus dados estão seguros'] },
  success:  { title: 'Tudo pronto!', subtitle: 'Sua conta está segura e pronta para usar.', features: ['Acesse seu painel agora', 'Comece a cadastrar pacientes', 'Gere planos com IA'] },
}
const rightPanel = computed(() => panels[step.value])
</script>

<style scoped>
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(16px);
}
.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
