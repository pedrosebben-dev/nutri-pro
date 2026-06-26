export default defineNuxtRouteMiddleware(async (to) => {
  const { isLoggedIn, initialized, fetchMe } = useAuth()

  if (!initialized.value) {
    await fetchMe()
  }

  if (!isLoggedIn.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  if (isLoggedIn.value && to.path === '/login') {
    return navigateTo('/dashboard')
  }
})
