export default defineNuxtPlugin(() => {
  if (process.client) {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://www.googletagmanager.com/gtag/js?id=AW-17861229415'
    document.head.appendChild(script)

    window.dataLayer = window.dataLayer || []
    function gtag() {
      dataLayer.push(arguments)
    }
    window.gtag = gtag

    gtag('js', new Date())
    // gtag('config', 'G-8KSXMM6EG5')
    gtag('config', 'AW-17861229415')

    gtag('config', 'AW-17861229415/i2zOCLq7jbgcEOf28sRC', {
      phone_conversion_number: '+36 30 630 882 4830',
    })
  }
})
