import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import Chart from 'primevue/chart'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Tooltip from 'primevue/tooltip'

export default defineNuxtPlugin(nuxtApp => {
  nuxtApp.vueApp.use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        prefix: 'p',
        darkModeSelector: '.dark',
        cssLayer: {
          name: 'primevue',
          order: 'tailwind-base, primevue, tailwind-utilities',
        },
      },
    },
  })
  nuxtApp.vueApp.use(ToastService)
  nuxtApp.vueApp.directive('tooltip', Tooltip)
  nuxtApp.vueApp.component('PvChart', Chart)
  nuxtApp.vueApp.component('PvToast', Toast)
  nuxtApp.vueApp.component('PvDialog', Dialog)
  nuxtApp.vueApp.component('PvMenu', Menu)
})
