import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['nuxt-auth-utils'],
  css: ['~/assets/style.css'],
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 12
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/webp', href: '/favicon.webp' }]
    }
  }
})
