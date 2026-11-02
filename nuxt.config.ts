// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  css: ['~/assets/css/app.scss'],
  ssr: true,

  app: {
    head: {
      title: 'Szatmár Napelemes - Ingyenes Felmérés | Szatmárnapelem',
      htmlAttrs: {
        lang: 'hu',
      },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          hid: 'description',
          name: 'description',
          content:
            'Szatmár Napelemes - Ingyenes Felmérés | Szatmárnapelem',
        },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#0b0b0c' },
        { name: 'apple-mobile-web-app-title', content: 'Szatmár Solar' },
        { hid: 'robots', name: 'robots', content: 'index, follow' },
        {
          'http-equiv': 'Content-Security-Policy',
          content: `
            default-src 'self' https: data:;
            img-src 'self' https: http: data:;
            font-src 'self' https: data:;
            style-src 'self' https: 'unsafe-inline';
            script-src 'self' https: 'unsafe-inline' 'unsafe-eval';
          `,
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://napelem-tamogatassal.szatmarnapelem.hu/' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap',
        },
      ],
    },
  },

  modules: [
    '@nuxt/image',
    '@nuxtjs/sitemap',
  ],

  // A képek generáláskor készülnek el statikus fájlként (így a Vercel képoptimalizálója nem számláz)
  image: {
    provider: 'ipxStatic',
  },

  site: {
    url: 'https://napelem-tamogatassal.szatmarnapelem.hu/',
    trailingSlash: true,
  },

  // Belső kivitelezés-kezelő (/kivitelezesek): ne kerüljön a sitemapbe, de generáláskor készüljön el
  sitemap: {
    exclude: ['/kivitelezesek/**', '/kivitelezesek'],
  },

  nitro: {
    prerender: {
      routes: ['/kivitelezesek'],
    },
  },

  runtimeConfig: {
    public: {
      // A Google Apps Script webalkalmazás URL-je (google-apps-script/README.md)
      kivApiUrl:
        process.env.NUXT_PUBLIC_KIV_API_URL ||
        'https://script.google.com/macros/s/AKfycbw7hadRl--o90hZtiInanij_gOBEiJJPAgB8Ip6KngIxWsY1tjzzvutnW0ob92EpV1X/exec',
    },
  },

  compatibilityDate: '2025-01-21',
})