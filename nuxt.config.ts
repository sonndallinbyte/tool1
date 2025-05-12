// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  modules: ["@vite-pwa/nuxt", "@nuxtjs/tailwindcss", "@element-plus/nuxt"],
  elementPlus: {
    /** Options */
  },
  pwa: {
    /* PWA options */
  },
});
