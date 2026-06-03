export const useCallConversion = () => {
  const reportCallConversion = (url) => {
    if (typeof window === 'undefined') return false

    const callback = () => {
      if (typeof url !== 'undefined') {
        window.location = url
      }
    }

    if (window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'AW-17861229415/i2zOCLq7jbgcEOf28sRC',
        event_callback: callback,
      })
      return false
    }

    callback()
    return false
  }

  return { reportCallConversion }
}



