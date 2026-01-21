// plugins/chaosWaves.client.js
import { ChaosWavesBg } from '~/jsm/ChaosWavesBg.module.js'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      ChaosWavesBg,
    },
  }
})
