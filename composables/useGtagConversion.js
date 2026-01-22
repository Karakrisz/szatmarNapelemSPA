export const useGtagConversion = () => {
  const reportConversion = (url) => {
    if (window.gtag) {
      const callback = () => {
        if (url) {
          window.location = url
        }
      }
      window.gtag('event', 'conversion', {
        send_to: 'AW-17861229415/Ig-OCNm1muobEOf28sRC',
        event_callback: callback,
      })
    }
    return false
  }

  return { reportConversion }
}

