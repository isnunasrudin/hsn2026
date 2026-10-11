export default defineNuxtRouteMiddleware((to) => {
  const path = to.path.replace(/\/+$/, '') || '/'
  if (path === '/timeline' || path === '/kegiatan') {
    return navigateTo('/', { replace: true, redirectCode: 302 })
  }
})
