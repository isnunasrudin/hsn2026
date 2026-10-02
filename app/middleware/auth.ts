export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    return navigateTo({
      path: '/admin/login',
      query: { redirect: to.fullPath }
    })
  }
})
