<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

useHead({
  title: 'Szatmár Napelemes - Ingyenes Felmérés | Szatmárnapelem',
})

// ====== GOOGLE ADS TRACKING ======
function persistClickIdsFromUrl() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  ;['gclid', 'wbraid', 'gbraid'].forEach((key) => {
    const v = params.get(key)
    if (v) localStorage.setItem(key, v)
  })
}

function getClickIds() {
  if (typeof window === 'undefined')
    return { gclid: null, wbraid: null, gbraid: null }
  return {
    gclid: localStorage.getItem('gclid'),
    wbraid: localStorage.getItem('wbraid'),
    gbraid: localStorage.getItem('gbraid'),
  }
}

// Reactive variables
const isSubmitting = ref(false)
const submitMessage = ref('')
const submitStatus = ref('')
const formData = ref({
  financing: '',
  motivations: [],
  name: '',
  email: '',
  phone: '',
  message: '',
  package: '',
})

const motivationOptions = [
  { value: 'anyagi_megtakaritas', label: 'Alacsonyabb villanyszámla' },
  { value: 'energiaar_emelkedes', label: 'Védelem az áremelkedés ellen' },
  { value: 'bizonytalan_aramellatas', label: 'Biztonságos áramellátás' },
]

const benefits = [
  {
    icon: 'sun',
    title: 'Alacsonyabb villanyszámla – előre kiszámolva',
    text: 'Nem ígérgetünk: a saját fogyasztása alapján megmutatjuk, mennyit spórol évente, és mikor térül meg a rendszer. Így még a döntés előtt látja a számokat.',
  },
  {
    icon: 'battery',
    title: 'Biztonság, ha drágul az áram vagy változnak a szabályok',
    text: 'Energiatárolóval a nappal megtermelt áramot este is Ön használja fel. Minél több saját áramot fogyaszt, annál kevésbé függ az áraktól és az elszámolási szabályoktól.',
  },
  {
    icon: 'doc',
    title: 'Nem Önnek kell az engedélyekkel bajlódnia',
    text: 'Az áramszolgáltatói és hatósági ügyintézést teljes egészében mi visszük végig. A rendszerre gyártói garancia és kivitelezői szavatosság vonatkozik.',
  },
]

const trustItems = [
  'Ingyenes helyszíni felmérés',
  'Tételes, átlátható ajánlat',
  'Teljes körű ügyintézés',
]

// ====== Csomagok + megtakarítás-becslő ======
const packages = [
  { kw: 4, price: 2699000, fit: 'Kisebb háztartásoknak' },
  { kw: 5, price: 2799000, fit: 'Átlagos családi házhoz' },
  { kw: 6, price: 2899000, fit: 'Megnövekedett fogyasztáshoz', popular: true },
  { kw: 8, price: 3099000, fit: 'Nagycsaládnak, hőszivattyúhoz' },
  { kw: 10, price: 3299000, fit: 'Maximális teljesítmény' },
]

const packageFeatures = [
  '30 év garancia a napelemekre',
  'Magas hatásfokú panelek: akár 15%-kal nagyobb termelés',
  '10 év garancia az inverterre és az akkumulátorra',
  '5 év garancia a kivitelezésre',
  'Szünetmentes (UPS) áramellátás kiépítése',
  'Teljes körű szolgáltatói ügyintézés',
]

// A becslés feltevései – a lap alján a látogató is látja őket
const YEARLY_YIELD_PER_KW = 1100 // kWh / kWp / év
const TIER_LIMIT_KWH = 2523 // kedvezményes lakossági sáv / év
const PRICE_LOW = 36 // Ft/kWh a sávhatárig
const PRICE_HIGH = 70 // Ft/kWh a sávhatár felett
const FEED_IN_PRICE = 5 // Ft/kWh a hálózatba táplált áramért
const SELF_USE_RATE = 0.8 // akkumulátorral helyben felhasznált hányad

const monthlyBill = ref(30000)
const pickedKw = ref(null)

const formatNumber = (n) =>
  String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')

const costOf = (kwh) =>
  Math.min(kwh, TIER_LIMIT_KWH) * PRICE_LOW +
  Math.max(kwh - TIER_LIMIT_KWH, 0) * PRICE_HIGH

const yearlyKwh = computed(() => {
  const yearlyCost = monthlyBill.value * 12
  const lowTierCost = TIER_LIMIT_KWH * PRICE_LOW
  return yearlyCost <= lowTierCost
    ? yearlyCost / PRICE_LOW
    : TIER_LIMIT_KWH + (yearlyCost - lowTierCost) / PRICE_HIGH
})

const recommendedKw = computed(
  () =>
    (
      packages.find((p) => p.kw * YEARLY_YIELD_PER_KW >= yearlyKwh.value) ||
      packages[packages.length - 1]
    ).kw,
)

const activePackage = computed(() =>
  packages.find((p) => p.kw === (pickedKw.value ?? recommendedKw.value)),
)

const estimate = computed(() => {
  const pkg = activePackage.value
  const production = pkg.kw * YEARLY_YIELD_PER_KW
  const selfUsed = Math.min(production, yearlyKwh.value) * SELF_USE_RATE
  const saving =
    costOf(yearlyKwh.value) -
    costOf(yearlyKwh.value - selfUsed) +
    (production - selfUsed) * FEED_IN_PRICE
  return {
    production,
    saving: Math.round(saving / 1000) * 1000,
    payback: pkg.price / saving,
  }
})

// a csúszka mozgatásakor visszaáll az ajánlott csomagra
watch(monthlyBill, () => {
  pickedKw.value = null
})

const requestPackage = () => {
  const pkg = activePackage.value
  formData.value.package = `${pkg.kw} kWp hibrid csomag – ${formatNumber(pkg.price)} Ft`
  scrollToForm()
}

const steps = [
  {
    title: 'Ingyenes helyszíni felmérés',
    text: 'Valódi bejárás, nem műholdkép: megnézzük a tetőt, a mérőhelyet és a fogyasztását. Kötelezettség nélkül.',
  },
  {
    title: 'Méretezés és tételes ajánlat',
    text: 'Az Ön fogyasztására méretezett rendszer, megtakarítás- és megtérülés-számítással, tételes árakkal.',
  },
  {
    title: 'Engedélyeztetés',
    text: 'Az áramszolgáltatói ügyintézést mi visszük végig – Önnek csak alá kell írnia.',
  },
  {
    title: 'Telepítés és üzembe helyezés',
    text: 'Szakembereink telepítik és beüzemelik a rendszert, majd megmutatják a használatát. Garanciával.',
  },
]

const faqs = [
  {
    q: 'Megéri még a napelem a szaldó megszűnése után?',
    a: 'Igen, ha a rendszert a saját fogyasztásához méretezzük. Az új rendszerek bruttó elszámolásban működnek: a hálózatba visszatáplált áram a vásárolt áram árának csak a töredékét éri. Ezért az a cél, hogy a megtermelt áram minél nagyobb részét otthon használja fel – ebben segít a pontos méretezés és az energiatároló.',
  },
  {
    q: 'Mennyibe kerül, és mikor térül meg?',
    a: 'Az ár a fogyasztástól, a tetőtől és attól függ, kér-e energiatárolót. Az ingyenes felmérés után tételes ajánlatot és megtakarítás-kalkulációt kap, így még a döntés előtt látja, mennyit spórol évente, és hány év alatt térül meg a rendszer.',
  },
  {
    q: 'Kell akkumulátor a napelem mellé?',
    a: 'Nem kötelező, de a mai elszámolás mellett sokat javít a megtérülésen: este és borús időben is a saját áramát használja. A fogyasztási szokásai alapján megmutatjuk, megéri-e Önnek, és mekkora tároló az ideális. Meglévő napelemes rendszer mellé is telepítünk.',
  },
  {
    q: 'Működik a rendszer áramszünet idején?',
    a: 'Egy hagyományos, hálózatra kapcsolt rendszer áramszünetkor biztonsági okból leáll. Energiatárolóval és erre alkalmas inverterrel viszont a kijelölt fogyasztók tovább működhetnek. Ha ez fontos Önnek, jelezze a felméréskor, és így tervezzük meg a rendszert.',
  },
  {
    q: 'Mi lesz, ha megint változnak a szabályok?',
    a: 'A szabályozást senki nem látja előre, ezért úgy tervezünk, hogy a megtérülés a lehető legkevésbé függjön tőle. Amit a rendszer megtermel és Ön otthon elhasznál, annak az értéke nem függ az átvételi ártól – csak attól, mennyibe kerülne ugyanez az áram a hálózatról.',
  },
  {
    q: 'Ki intézi az engedélyeket, és mennyi időbe telik?',
    a: 'Az áramszolgáltatói és hatósági ügyintézést teljes egészében mi végezzük, Önnek csak alá kell írnia a dokumentumokat. Maga a telepítés gyors; az átfutás főként az engedélyezésen múlik, a pontos ütemezést az első egyeztetésen megadjuk.',
  },
]

// ====== FAQ accordion ======
const faqRefs = ref([])

const handleFaqToggle = (activeIndex) => {
  const activeEl = faqRefs.value?.[activeIndex]
  if (!activeEl?.open) return

  faqRefs.value.forEach((el, i) => {
    if (i !== activeIndex && el?.open) el.open = false
  })
}

// ====== Űrlaphoz görgetés + mobil CTA sáv ======
const formCard = ref(null)
const formInView = ref(true)
const motivationError = ref(false)

const updateFormInView = () => {
  const rect = formCard.value?.getBoundingClientRect()
  if (!rect) return
  formInView.value = rect.bottom > 80 && rect.top < window.innerHeight - 80
}

const scrollToForm = () => {
  formCard.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ====== Jelentkezési határidő visszaszámláló ======
// október 30. vége, magyar idő szerint
const DEADLINE = new Date('2026-10-31T00:00:00+01:00')
const timeLeft = ref(null)
const deadlinePassed = ref(false)
let countdownTimer = null

const pad = (n) => String(n).padStart(2, '0')

const updateCountdown = () => {
  const diff = DEADLINE.getTime() - Date.now()
  if (diff <= 0) {
    deadlinePassed.value = true
    clearInterval(countdownTimer)
    return
  }
  const totalSeconds = Math.floor(diff / 1000)
  timeLeft.value = {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const countdownUnits = computed(() => {
  const t = timeLeft.value
  return [
    { label: 'nap', value: t ? pad(t.days) : '--' },
    { label: 'óra', value: t ? pad(t.hours) : '--' },
    { label: 'perc', value: t ? pad(t.minutes) : '--' },
    { label: 'mp', value: t ? pad(t.seconds) : '--' },
  ]
})

// Form submission handler
const submitForm = async (event) => {
  event.preventDefault()

  if (isSubmitting.value) return

  if (formData.value.motivations.length === 0) {
    motivationError.value = true
    return
  }

  isSubmitting.value = true
  submitMessage.value = ''
  submitStatus.value = ''

  try {
    const webhookUrl =
      'https://services.leadconnectorhq.com/hooks/bsv1VGpQFCUeEBabknKX/webhook-trigger/30d2cccd-c034-4fe4-94e9-28e75927e7db'

    const { gclid, wbraid, gbraid } = getClickIds()

    const payload = {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      financing: formData.value.financing,
      motivations: formData.value.motivations.join(', '),
      message: formData.value.message,
      package: formData.value.package,
      monthly_bill: monthlyBill.value,
      gclid,
      wbraid,
      gbraid,
      source: 'Napelem árajánlatkérési űrlap',
      form_type: 'solar_panel_inquiry',
      submission_date: new Date().toISOString(),
      custom_field_1: 'Napelemes kivitelezés + konzultáció',
      custom_field_2: formData.value.financing,
      custom_field_3: formData.value.motivations.join(', '),
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      submitStatus.value = 'success'
      submitMessage.value =
        'Köszönjük! Hamarosan felvesszük Önnel a kapcsolatot.'

      formData.value = {
        financing: '',
        motivations: [],
        name: '',
        email: '',
        phone: '',
        message: '',
        package: '',
      }
    } else {
      throw new Error('Hiba történt a küldés során')
    }
  } catch (error) {
    console.error('Form submission error:', error)
    submitStatus.value = 'error'
    submitMessage.value =
      'Hiba történt. Kérjük, próbálja újra, vagy hívjon minket!'
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => formData.value.motivations.length,
  (count) => {
    if (count > 0) motivationError.value = false
  },
)

const initPage = () => {
  persistClickIdsFromUrl()

  document.querySelectorAll('header, footer, .lc_text-widget').forEach((el) => {
    el.style.display = 'none'
  })
}

onMounted(() => {
  initPage()

  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)

  updateFormInView()
  window.addEventListener('scroll', updateFormInView, { passive: true })
  window.addEventListener('resize', updateFormInView)
})

onBeforeUnmount(() => {
  clearInterval(countdownTimer)
  window.removeEventListener('scroll', updateFormInView)
  window.removeEventListener('resize', updateFormInView)
})
</script>

<template>
  <section class="lp">
    <span class="visually-hidden">+36 30 836 0703</span>

    <!-- FELSŐ SÁV -->
    <div class="topbar dark-surface dark-surface--slim">
      <div class="container topbar__inner">
        <img
          src="/img/logo-szatmar-solar.png"
          alt="Szatmár Solar"
          class="brand-logo"
          width="428"
          height="176"
        />
        <a href="tel:+36308360703" class="topbar__phone">
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
            />
          </svg>
          <span class="topbar__phone-number">+36 30 836 0703</span>
        </a>
      </div>
    </div>

    <!-- HERO + ŰRLAP -->
    <div class="hero">
      <div class="hero__waves" aria-hidden="true">
        <span></span><span></span><span></span>
      </div>
      <div class="container hero__grid">
        <div class="hero__text">
          <p class="eyebrow">Országos kivitelezés</p>
          <h1 class="hero__title">
            Napelemes rendszer és energiatárolás,
            <span class="mark">kulcsrakészen</span>
          </h1>
          <p class="hero__lead">
            Ingyenes helyszíni felmérés, tételes ajánlat és teljes körű
            kivitelezés – tapasztalt szakemberektől, egy kézből.
          </p>

          <ul class="check-list">
            <li>
              <svg class="icon icon--check" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Ingyenes, kötelezettségmentes helyszíni felmérés
            </li>
            <li>
              <svg class="icon icon--check" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Megtakarítás-kalkuláció a saját fogyasztása alapján
            </li>
            <li>
              <svg class="icon icon--check" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              Engedélyeztetés és ügyintézés helyett Ön csak aláír
            </li>
          </ul>

          <div class="proof">
            <span class="proof__value">1000+</span>
            <span class="proof__label"
              >kiszolgált ügyfél bízta ránk a rendszerét</span
            >
          </div>

          <div v-if="!deadlinePassed" class="deadline">
            <div class="deadline__text">
              <p class="deadline__title">
                Jelentkezési határidő: <strong>október 30.</strong>
              </p>
              <p class="deadline__note">
                A nagy érdeklődés miatt korlátozott számú felmérést tudunk
                vállalni.
              </p>
            </div>
            <div
              class="deadline__timer"
              role="timer"
              aria-label="A jelentkezési határidőig hátralévő idő"
            >
              <div
                v-for="unit in countdownUnits"
                :key="unit.label"
                class="deadline__unit"
              >
                <span class="deadline__value">{{ unit.value }}</span>
                <span class="deadline__label">{{ unit.label }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ŰRLAP -->
        <div id="ajanlat" ref="formCard" class="form-card">
          <h2 class="form-card__title">
            <em>Csökkentse a villanyszámláját saját árammal</em>
          </h2>
          <p class="form-card__lead">
            Ingyenes, kötelezettségmentes felmérés után megmutatjuk, mennyit
            spórolhat, és mekkora rendszer térül meg Önnél.
          </p>

          <form class="lead-form" @submit="submitForm">
            <div class="form-group">
              <label for="lead-name">Név *</label>
              <input
                id="lead-name"
                type="text"
                v-model="formData.name"
                required
                autocomplete="name"
                class="form-input"
                placeholder="Teljes név"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <label for="lead-phone">Telefonszám *</label>
              <input
                id="lead-phone"
                type="tel"
                v-model="formData.phone"
                required
                autocomplete="tel"
                class="form-input"
                placeholder="+36 30 123 4567"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <label for="lead-email">Email cím *</label>
              <input
                id="lead-email"
                type="email"
                v-model="formData.email"
                required
                autocomplete="email"
                class="form-input"
                placeholder="Az ajánlatot ide küldjük"
                :disabled="isSubmitting"
              />
            </div>

            <div class="form-group">
              <span class="form-label">Mi a legfontosabb Önnek? *</span>
              <div
                class="option-grid"
                :class="{ 'option-grid--error': motivationError }"
              >
                <label
                  v-for="option in motivationOptions"
                  :key="option.value"
                  class="option-pill"
                >
                  <input
                    type="checkbox"
                    name="motivations"
                    :value="option.value"
                    v-model="formData.motivations"
                    :disabled="isSubmitting"
                  />
                  <span class="option-pill__text">{{ option.label }}</span>
                </label>
              </div>
              <p v-if="motivationError" class="field-error" role="alert">
                Kérjük, válasszon legalább egyet.
              </p>
            </div>

            <div class="form-group">
              <label for="lead-message"
                >Megjegyzés <span class="optional">nem kötelező</span></label
              >
              <textarea
                id="lead-message"
                v-model="formData.message"
                class="form-textarea"
                placeholder="Pl. tető típusa, havi fogyasztás, mikor érhető el"
                rows="2"
                :disabled="isSubmitting"
              ></textarea>
            </div>

            <p v-if="formData.package" class="picked-package">
              <span>
                Kiválasztott csomag:
                <strong>{{ formData.package }}</strong>
              </span>
              <button
                type="button"
                class="picked-package__clear"
                aria-label="Csomag törlése"
                @click="formData.package = ''"
              >
                ×
              </button>
            </p>

            <button
              type="submit"
              class="btn btn--dark btn--block btn--press"
              :disabled="isSubmitting"
            >
              <span v-if="!isSubmitting">Ingyenes felmérést kérek</span>
              <span v-else>Küldés...</span>
            </button>

            <div
              v-if="submitMessage"
              class="submit-message"
              :class="submitStatus"
              role="status"
            >
              {{ submitMessage }}
            </div>

            <p class="privacy-text">
              Az űrlap elküldésével elfogadja az
              <NuxtLink to="/adatvedelmi-tajekoztato"
                >Adatvédelmi Szabályzatot</NuxtLink
              >.
            </p>
          </form>
        </div>

        <div class="hero__media">
          <NuxtImg
            src="/img/hero.webp"
            alt="Család a napelemes rendszerük előtt"
            class="hero__image"
            width="1200"
            height="600"
          />
        </div>
      </div>
    </div>

    <!-- BIZALMI SÁV -->
    <div class="trust-strip dark-surface dark-surface--slim">
      <ul class="container trust-strip__list">
        <li v-for="item in trustItems" :key="item">
          <svg class="icon icon--bolt" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12z" />
          </svg>
          {{ item }}
        </li>
      </ul>
    </div>

    <!-- ÉRVEK -->
    <div class="section section--gray">
      <div class="container">
        <h2 class="section-heading">Miért minket választanak?</h2>
        <div class="benefits-grid">
          <div v-for="benefit in benefits" :key="benefit.title" class="benefit-card">
            <span class="benefit-card__icon">
              <svg class="icon" viewBox="0 0 24 24" aria-hidden="true">
                <template v-if="benefit.icon === 'sun'">
                  <circle cx="12" cy="12" r="4" />
                  <path
                    d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
                  />
                </template>
                <template v-else-if="benefit.icon === 'battery'">
                  <rect x="2" y="7" width="18" height="10" rx="2" />
                  <path d="M22 11v2M6 10v4M10 10v4" />
                </template>
                <template v-else>
                  <path
                    d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"
                  />
                  <path d="M14 3v5h5M9 14l2 2 4-4" />
                </template>
              </svg>
            </span>
            <h3>{{ benefit.title }}</h3>
            <p>{{ benefit.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CSOMAGOK -->
    <div class="section">
      <div class="container">
        <h2 class="section-heading">Válassza ki az Önhöz illő csomagot</h2>
        <p class="section-lead">
          3 fázisú hibrid rendszerek Tongwei napelemekkel, Deye hibrid
          inverterrel és 11,8 kWh akkumulátorral.
        </p>

        <div class="bill">
          <label for="bill-range" class="bill__label">
            Mennyi a havi villanyszámlája?
          </label>
          <input
            id="bill-range"
            v-model.number="monthlyBill"
            type="range"
            min="10000"
            max="100000"
            step="1000"
            class="bill__range"
            :style="{ '--fill': ((monthlyBill - 10000) / 90000) * 100 + '%' }"
          />
          <output for="bill-range" class="bill__value">
            {{ formatNumber(monthlyBill) }} Ft
          </output>
        </div>

        <div class="packages" role="radiogroup" aria-label="Csomagok">
          <button
            v-for="pkg in packages"
            :key="pkg.kw"
            type="button"
            role="radio"
            class="package"
            :class="{ 'package--active': pkg.kw === activePackage.kw }"
            :aria-checked="pkg.kw === activePackage.kw"
            @click="pickedKw = pkg.kw"
          >
            <span v-if="pkg.kw === recommendedKw" class="package__badge">
              Önnek ajánlott
            </span>
            <span
              v-else-if="pkg.popular"
              class="package__badge package__badge--muted"
            >
              Legnépszerűbb
            </span>
            <span class="package__size">
              {{ pkg.kw }}<small>kWp</small>
            </span>
            <span class="package__fit">{{ pkg.fit }}</span>
            <span class="package__price">
              {{ formatNumber(pkg.price) }} Ft
            </span>
          </button>
        </div>

        <div class="estimate dark-surface">
          <div class="estimate__head">
            <p class="eyebrow eyebrow--light">Becsült megtakarítás</p>
            <p class="estimate__title">
              {{ activePackage.kw }} kWp csomag –
              {{ formatNumber(monthlyBill) }} Ft-os havi számlánál
            </p>
          </div>
          <dl class="estimate__stats">
            <div>
              <dt>Éves megtakarítás</dt>
              <dd>kb. {{ formatNumber(estimate.saving) }} Ft</dd>
            </div>
            <div>
              <dt>Megtérülés</dt>
              <dd v-if="estimate.payback <= 15">
                kb. {{ Math.round(estimate.payback) }} év
              </dd>
              <dd v-else class="estimate__soft">egyedi ajánlat alapján</dd>
            </div>
            <div>
              <dt>Éves termelés</dt>
              <dd>kb. {{ formatNumber(estimate.production) }} kWh</dd>
            </div>
          </dl>
          <button
            type="button"
            class="btn btn--primary"
            @click="requestPackage"
          >
            Ajánlatot kérek erre a csomagra
          </button>
        </div>

        <div class="package-includes">
          <h3 class="package-includes__title">Minden csomag tartalmazza</h3>
          <ul class="package-includes__list">
            <li v-for="feature in packageFeatures" :key="feature">
              <svg class="icon icon--check" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {{ feature }}
            </li>
          </ul>
        </div>

        <p class="fine-print">
          A feltüntetett árak tájékoztató jellegű bruttó árak, a végleges
          ajánlatot a helyszíni felmérés után adjuk. A megtakarítás becslés:
          1&nbsp;100 kWh/kWp éves termeléssel, a mai lakossági áramárakkal (36,
          illetve 70 Ft/kWh), 5 Ft/kWh átvételi árral és 80%-os saját
          felhasználással számol.
        </p>
      </div>
    </div>

    <!-- FOLYAMAT -->
    <div class="section section--dark dark-surface">
      <div class="container process">
        <div class="process__intro">
          <p class="eyebrow eyebrow--light">Így dolgozunk</p>
          <h2 class="process__title">
            Négy lépés a <span class="mark-text">saját áramig</span>
          </h2>
          <p class="process__lead">
            Átlátható folyamat, meglepetések nélkül: minden lépésnél tudja, mi
            történik, és mi következik.
          </p>
          <button type="button" class="btn btn--primary" @click="scrollToForm">
            Ingyenes felmérést kérek
          </button>
        </div>

        <ol class="process-steps">
          <li v-for="(step, index) in steps" :key="step.title" class="process-step">
            <span class="step-number">0{{ index + 1 }}</span>
            <h3>{{ step.title }}</h3>
            <p>{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </div>

    <!-- GYIK -->
    <div class="section section--gray">
      <div class="container container--narrow">
        <h2 class="section-heading">Amit a legtöbben kérdeznek</h2>
        <div class="faq-list">
          <details
            v-for="(faq, index) in faqs"
            :key="faq.q"
            class="faq-item"
            :ref="(el) => (faqRefs[index] = el)"
            @toggle="handleFaqToggle(index)"
          >
            <summary class="faq-question">
              <span class="faq-title">{{ faq.q }}</span>
              <span class="faq-icon" aria-hidden="true"></span>
            </summary>
            <p class="faq-text">{{ faq.a }}</p>
          </details>
        </div>
        <div class="section-cta">
          <button
            type="button"
            class="btn btn--dark btn--press"
            @click="scrollToForm"
          >
            Ingyenes felmérést kérek
          </button>
        </div>
      </div>
    </div>

    <!-- LÁBLÉC -->
    <div class="site-foot dark-surface dark-surface--slim">
      <div class="container site-foot__inner">
        <img
          src="/img/logo-szatmar-solar.png"
          alt="Szatmár Solar"
          class="brand-logo brand-logo--small"
          width="428"
          height="176"
          loading="lazy"
        />
        <div class="site-foot__links">
          <a href="tel:+36308360703">+36 30 836 0703</a>
          <NuxtLink to="/adatvedelmi-tajekoztato">Adatvédelem</NuxtLink>
        </div>
      </div>
    </div>

    <!-- MOBIL CTA SÁV -->
    <div class="mobile-cta" :class="{ 'mobile-cta--hidden': formInView }">
      <a href="tel:+36308360703" class="btn btn--ghost">Hívás</a>
      <button type="button" class="btn btn--dark" @click="scrollToForm">
        Ingyenes felmérést kérek
      </button>
    </div>
  </section>
</template>

<style scoped>
.visually-hidden {
  position: absolute !important;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

:global(html),
:global(body) {
  background: #fff;
}

:global(body) {
  min-height: 100vh;
}

.lp {
  /* Márkaszínek a logóból: fekete, napsárga, törtfehér – fehér alapon */
  --accent: #ffd833;
  --accent-bright: #ffe266;
  --accent-soft: rgba(255, 216, 51, 0.2);
  --ink: #0b0b0c;
  --cream: #f5f1e8;
  --panel: #f6f6f4;
  --panel-border: #e5e5e1;
  --field-border: #d4d4cf;
  --text: #141517;
  --muted: #5d6068;
  --shadow-sm: 0 1px 2px rgba(11, 11, 12, 0.04),
    0 6px 18px rgba(11, 11, 12, 0.05);
  --shadow-md: 0 2px 4px rgba(11, 11, 12, 0.04),
    0 18px 44px rgba(11, 11, 12, 0.1);
  background: #fff;
  color: var(--text);
  line-height: 1.6;
}

.lp h1,
.lp h2,
.lp h3,
.lp p,
.lp ul,
.lp ol {
  margin: 0;
  padding: 0;
}

.container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 24px;
}

.container--narrow {
  max-width: 760px;
}

.icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* ========== GOMBOK ========== */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 30px;
  border-radius: 10px;
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  text-decoration: none;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.btn--primary {
  background: var(--accent);
  color: var(--text);
  box-shadow: 0 10px 24px rgba(255, 216, 51, 0.45);
}

.btn--primary:hover:not(:disabled) {
  background: var(--accent-bright);
  transform: translateY(-2px);
  box-shadow: 0 14px 30px rgba(255, 216, 51, 0.55);
}

.btn--primary:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn--dark {
  background: var(--ink);
  color: var(--accent);
  box-shadow: 0 5px 0 var(--accent);
}

.btn--dark:hover:not(:disabled) {
  background: #1d1d20;
}

.btn--dark:active:not(:disabled) {
  transform: translateY(4px);
  box-shadow: 0 1px 0 var(--accent);
}

.btn--dark:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

/* ismétlődő „megnyomás”: gyors lenyomás a sárga peremre, rövid tartás,
   visszapattanás – közben érintés-hullám fut szét a gombon */
.btn--press {
  position: relative;
  overflow: hidden;
}

.btn--press:not(:disabled) {
  box-shadow: 0 7px 0 var(--accent);
  animation: btnPress 2.4s infinite;
}

.btn--press::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 120px;
  height: 120px;
  margin: -60px 0 0 -60px;
  border-radius: 50%;
  background: rgba(255, 216, 51, 0.38);
  opacity: 0;
  transform: scale(0);
  pointer-events: none;
}

.btn--press:not(:disabled)::after {
  animation: btnTap 2.4s infinite;
}

.btn--press:hover:not(:disabled),
.btn--press:hover:not(:disabled)::after {
  animation-play-state: paused;
}

.btn--press:active:not(:disabled) {
  animation: none;
  transform: translateY(6px) scale(0.975);
  box-shadow: 0 1px 0 var(--accent);
}

@keyframes btnPress {
  0%,
  58% {
    transform: translateY(0) scale(1);
    box-shadow: 0 7px 0 var(--accent);
    animation-timing-function: cubic-bezier(0.5, 0, 1, 0.6);
  }
  64%,
  74% {
    transform: translateY(6px) scale(0.975);
    box-shadow: 0 1px 0 var(--accent);
    animation-timing-function: cubic-bezier(0.2, 0.9, 0.3, 1.4);
  }
  84% {
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 9px 0 var(--accent);
  }
  92%,
  100% {
    transform: translateY(0) scale(1);
    box-shadow: 0 7px 0 var(--accent);
  }
}

@keyframes btnTap {
  0%,
  62% {
    transform: scale(0);
    opacity: 0;
  }
  64% {
    transform: scale(0.2);
    opacity: 1;
  }
  92%,
  100% {
    transform: scale(4.5);
    opacity: 0;
  }
}

.btn--ghost {
  background: #fff;
  color: var(--text);
  border: 1px solid var(--field-border);
}

.btn--ghost:hover {
  border-color: var(--text);
}

.btn--block {
  width: 100%;
}

.btn:focus-visible {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}

/* ========== SÖTÉT, PÖTTYÖS FELÜLET ========== */
.dark-surface {
  position: relative;
  overflow: hidden;
  background: var(--ink);
  color: var(--cream);
}

.dark-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      420px 260px at 12% 0%,
      rgba(255, 216, 51, 0.28),
      transparent 70%
    ),
    radial-gradient(
      420px 260px at 90% 100%,
      rgba(255, 216, 51, 0.18),
      transparent 70%
    ),
    radial-gradient(rgba(255, 255, 255, 0.09) 1.2px, transparent 1.2px) 0 0 /
      22px 22px;
  pointer-events: none;
}

/* keskeny sávokon visszafogottabb fény */
.dark-surface--slim::before {
  background:
    radial-gradient(
      360px 120px at 8% 0%,
      rgba(255, 216, 51, 0.2),
      transparent 70%
    ),
    radial-gradient(
      360px 120px at 94% 100%,
      rgba(255, 216, 51, 0.14),
      transparent 70%
    ),
    radial-gradient(rgba(255, 255, 255, 0.09) 1.2px, transparent 1.2px) 0 0 /
      22px 22px;
}

.dark-surface > * {
  position: relative;
}

/* ========== FELSŐ SÁV ========== */
.topbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 18px;
  padding-bottom: 18px;
}

.brand-logo {
  display: block;
  height: 58px;
  width: auto;
}

/* a logó fekete háttere beleolvad a pöttyös felületbe */
.dark-surface .brand-logo {
  mix-blend-mode: lighten;
}

.brand-logo--small {
  height: 50px;
}

.topbar__phone {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--ink);
  font-weight: 700;
  font-size: 0.95rem;
  white-space: nowrap;
  transition: background 0.2s ease;
}

.topbar__phone .icon {
  width: 17px;
  height: 17px;
}

.topbar__phone:hover {
  background: var(--accent-bright);
}

/* ========== HERO ========== */
.hero {
  position: relative;
  overflow: hidden;
  padding: 56px 0 76px;
  background: linear-gradient(180deg, #fff 0%, #fffdf2 100%);
}

/* felkelő nap az űrlap mögött: sárga korong, halvány gyűrűkkel */
.hero::before {
  content: '';
  position: absolute;
  top: -300px;
  right: -240px;
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background:
    radial-gradient(
      circle,
      rgba(255, 216, 51, 0.6) 0,
      rgba(255, 216, 51, 0.32) 26%,
      rgba(255, 216, 51, 0.12) 48%,
      transparent 68%
    ),
    repeating-radial-gradient(
      circle,
      transparent 0 62px,
      rgba(255, 216, 51, 0.55) 62px 64px
    );
  -webkit-mask-image: radial-gradient(circle, #000 22%, transparent 68%);
  mask-image: radial-gradient(circle, #000 22%, transparent 68%);
  pointer-events: none;
}

/* kifelé sugárzó körök a nap középpontjából */
.hero__waves {
  position: absolute;
  top: -300px;
  right: -240px;
  width: 900px;
  height: 900px;
  pointer-events: none;
}

.hero__waves span {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid rgba(255, 216, 51, 0.9);
  opacity: 0;
  transform: scale(0.2);
  will-change: transform, opacity;
  animation: sunWave 7.5s linear infinite;
}

.hero__waves span:nth-child(2) {
  animation-delay: -2.5s;
}

.hero__waves span:nth-child(3) {
  animation-delay: -5s;
}

@keyframes sunWave {
  0% {
    transform: scale(0.2);
    opacity: 0;
  }
  15% {
    opacity: 0.75;
  }
  100% {
    transform: scale(0.95);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero__waves span,
  .btn--press:not(:disabled),
  .btn--press:not(:disabled)::after {
    animation: none;
  }
}

/* pontrács és halvány fény bal alul */
.hero::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 60%;
  height: 70%;
  background:
    radial-gradient(
      closest-side at 12% 92%,
      rgba(255, 216, 51, 0.26),
      transparent
    ),
    radial-gradient(rgba(11, 11, 12, 0.14) 1.2px, transparent 1.2px) 0 0 / 22px
      22px;
  -webkit-mask-image: radial-gradient(
    ellipse at 0% 100%,
    #000 10%,
    transparent 70%
  );
  mask-image: radial-gradient(ellipse at 0% 100%, #000 10%, transparent 70%);
  pointer-events: none;
}

.hero__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  grid-template-areas:
    'text form'
    'media form';
  column-gap: 56px;
  row-gap: 32px;
  align-items: start;
}

.hero__text {
  grid-area: text;
}

.hero__media {
  grid-area: media;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  color: var(--text);
  margin-bottom: 14px !important;
}

.eyebrow::before {
  content: '';
  width: 28px;
  height: 3px;
  border-radius: 3px;
  background: var(--accent);
}

/* szövegkiemelő hatás a címsor kulcsszaván */
.mark {
  background: linear-gradient(
    to top,
    var(--accent) 0,
    var(--accent) 38%,
    transparent 38%
  );
  padding: 0 4px;
  margin: 0 -4px;
  border-radius: 2px;
}

.hero__title {
  font-size: 2.6rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.6px;
  text-wrap: balance;
}

.hero__lead {
  margin-top: 18px !important;
  font-size: 1.12rem;
  color: var(--muted);
  max-width: 34em;
}

.check-list {
  list-style: none;
  margin-top: 26px !important;
  display: grid;
  gap: 12px;
}

.check-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-weight: 600;
  font-size: 1rem;
}

.icon--check {
  width: 22px;
  height: 22px;
  padding: 4px;
  border-radius: 50%;
  background: var(--accent);
  color: var(--ink);
  stroke-width: 3.5;
  margin-top: 2px;
}

.proof {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 30px;
  padding-top: 24px;
  border-top: 1px solid var(--panel-border);
}

.proof__value {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.5px;
}

.proof__label {
  color: var(--muted);
  font-size: 0.95rem;
  max-width: 16em;
  line-height: 1.4;
}

/* ========== HATÁRIDŐ ========== */
.deadline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px 24px;
  margin-top: 26px;
  padding: 18px 22px;
  border-radius: 14px;
  background:
    radial-gradient(
      260px 120px at 100% 0%,
      rgba(255, 216, 51, 0.22),
      transparent 70%
    ),
    var(--ink);
  color: var(--cream);
}

.deadline__title {
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
}

.deadline__title strong {
  color: var(--accent);
  font-weight: 800;
  white-space: nowrap;
}

.deadline__note {
  margin-top: 4px !important;
  font-size: 0.84rem;
  line-height: 1.45;
  color: rgba(245, 241, 232, 0.7);
}

.deadline__timer {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.deadline__unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 52px;
  padding: 8px 6px 7px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.deadline__value {
  font-size: 1.45rem;
  font-weight: 800;
  line-height: 1.1;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.deadline__label {
  margin-top: 3px;
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.7);
}

.hero__media {
  position: relative;
  margin: 0 22px 22px 0;
}

/* eltolt fekete blokk a kép mögött */
.hero__media::before {
  content: '';
  position: absolute;
  inset: 22px -22px -22px 22px;
  border-radius: 18px;
  background: var(--ink);
}

.hero__image {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  border-radius: 14px;
}

/* ========== ŰRLAP ========== */
.form-card {
  grid-area: form;
  background: #fff;
  border: 1px solid var(--panel-border);
  border-top: 5px solid var(--accent);
  border-radius: 14px;
  padding: 30px 28px 26px;
  color: var(--text);
  box-shadow: var(--shadow-md);
  scroll-margin-top: 16px;
}

.form-card__title {
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.25;
  text-wrap: balance;
}

.form-card__title em {
  font-style: italic;
}

.form-card__lead {
  margin-top: 6px !important;
  color: var(--muted);
  font-size: 0.95rem;
}

.lead-form {
  margin-top: 22px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label,
.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.92rem;
}

.optional {
  color: var(--muted);
  font-weight: 400;
  font-size: 0.82rem;
  margin-left: 4px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 13px 14px;
  border: 1px solid var(--field-border);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: #fff;
  color: var(--text);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.form-textarea {
  resize: vertical;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #9aa0a9;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--text);
  outline: none;
  box-shadow: 0 0 0 4px rgba(255, 216, 51, 0.55);
}

.form-input:disabled,
.form-textarea:disabled {
  background: var(--panel);
  opacity: 0.6;
  cursor: not-allowed;
}

.option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-grid--error .option-pill {
  border-color: #c0392b;
}

.field-error {
  margin-top: 8px !important;
  font-size: 0.85rem;
  font-weight: 600;
  color: #c0392b;
}

.option-pill {
  position: relative;
  display: inline-flex;
  margin: 0 !important;
  padding: 9px 14px;
  border-radius: 999px;
  border: 1px solid var(--field-border);
  background: #fff;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.option-pill input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-pill__text {
  font-weight: 600;
  font-size: 0.88rem;
}

.option-pill:hover {
  border-color: var(--text);
}

.option-pill:has(input:checked) {
  border-color: var(--text);
  background: var(--accent);
}

.option-pill:has(input:focus-visible) {
  box-shadow: 0 0 0 4px rgba(255, 216, 51, 0.55);
}

.submit-message {
  padding: 14px;
  border-radius: 8px;
  margin-top: 14px;
  font-weight: 600;
  text-align: center;
  font-size: 0.95rem;
}

.submit-message.success {
  background-color: #e6f4ea;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.submit-message.error {
  background-color: #fbeaec;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.privacy-text {
  color: var(--muted);
  font-size: 0.8rem;
  margin-top: 10px !important;
  text-align: center;
}

.privacy-text a {
  color: var(--text);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

/* ========== BIZALMI SÁV ========== */
.trust-strip__list {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 12px 28px;
  padding-top: 20px !important;
  padding-bottom: 20px !important;
  padding-left: 24px !important;
  padding-right: 24px !important;
  margin: 0 auto !important;
}

.trust-strip__list li {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 0.95rem;
}

.icon--bolt {
  width: 18px;
  height: 18px;
  fill: var(--accent);
  stroke: none;
}

/* ========== SZEKCIÓK ========== */
.section {
  padding: 72px 0;
}

.section--gray {
  background: var(--panel);
}

.section-heading {
  font-size: 1.9rem;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.3px;
  text-align: center;
  text-wrap: balance;
}

.section-heading::after {
  content: '';
  display: block;
  width: 56px;
  height: 4px;
  margin: 16px auto 0;
  background: var(--accent);
  border-radius: 3px;
}

.section-cta {
  margin-top: 40px;
  text-align: center;
}

/* ========== ÉRVEK ========== */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 40px;
}

.benefit-card {
  position: relative;
  background: #fff;
  padding: 30px 28px;
  border-radius: 14px;
  border: 1px solid var(--panel-border);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;
}

.benefit-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: var(--accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.benefit-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.benefit-card:hover::before {
  transform: scaleX(1);
}

.benefit-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: var(--ink);
  color: var(--accent);
  margin-bottom: 18px;
}

.benefit-card__icon .icon {
  width: 24px;
  height: 24px;
}

.benefit-card h3 {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.3;
}

.benefit-card p {
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.96rem;
}

/* ========== CSOMAGOK ========== */
.section-lead {
  max-width: 40em;
  margin: 18px auto 0 !important;
  text-align: center;
  color: var(--muted);
  font-size: 1.02rem;
}

.bill {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px 24px;
  margin-top: 40px;
  padding: 22px 26px;
  border-radius: 14px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
}

.bill__label {
  font-weight: 700;
  font-size: 1rem;
}

.bill__value {
  min-width: 5.6em;
  text-align: right;
  font-size: 1.35rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.bill__range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 8px;
  background: linear-gradient(
    to right,
    var(--accent) var(--fill, 0%),
    var(--field-border) var(--fill, 0%)
  );
  cursor: pointer;
}

.bill__range::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--ink);
  border: 4px solid var(--accent);
  box-shadow: 0 2px 8px rgba(11, 11, 12, 0.25);
}

.bill__range::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--ink);
  border: 4px solid var(--accent);
  box-shadow: 0 2px 8px rgba(11, 11, 12, 0.25);
}

.bill__range:focus-visible {
  outline: 3px solid var(--text);
  outline-offset: 6px;
}

.packages {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-top: 26px;
}

.package {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 30px 18px 20px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid var(--panel-border);
  box-shadow: var(--shadow-sm);
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.package:hover {
  transform: translateY(-3px);
  border-color: var(--text);
}

.package:focus-visible {
  outline: 3px solid var(--text);
  outline-offset: 2px;
}

.package--active {
  border-color: var(--ink);
  box-shadow:
    0 0 0 2px var(--ink),
    0 8px 0 var(--accent);
}

.package__badge {
  position: absolute;
  top: -11px;
  left: 16px;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--accent);
  color: var(--ink);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  white-space: nowrap;
}

.package__badge--muted {
  background: var(--ink);
  color: var(--cream);
}

.package__size {
  font-size: 2.3rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
}

.package__size small {
  margin-left: 5px;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0;
  color: var(--muted);
}

.package__fit {
  min-height: 2.9em;
  font-size: 0.86rem;
  line-height: 1.45;
  color: var(--muted);
}

.package__price {
  margin-top: 6px;
  padding-top: 12px;
  width: 100%;
  border-top: 1px solid var(--panel-border);
  font-size: 1.12rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.estimate {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 22px 36px;
  margin-top: 30px;
  padding: 30px 32px;
  border-radius: 18px;
}

.estimate__title {
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.35;
  color: #fff;
}

.estimate__stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

.estimate__stats > div {
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.estimate__stats dt {
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: rgba(245, 241, 232, 0.7);
}

.estimate__stats dd {
  margin: 6px 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.estimate__stats dd.estimate__soft {
  font-size: 1.05rem;
  color: var(--cream);
}

.estimate .btn {
  grid-row: 1;
  grid-column: 2;
  box-shadow: none;
}

.estimate .btn:focus-visible {
  outline-color: #fff;
}

.package-includes {
  margin-top: 34px;
}

.package-includes__title {
  font-size: 1.1rem;
  font-weight: 700;
}

.package-includes__list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 24px;
  margin-top: 16px !important;
}

.package-includes__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.45;
}

.fine-print {
  margin-top: 26px !important;
  font-size: 0.8rem;
  line-height: 1.55;
  color: var(--muted);
}

.picked-package {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px !important;
  padding: 10px 12px 10px 14px;
  border-radius: 10px;
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  font-size: 0.88rem;
  line-height: 1.4;
}

.picked-package__clear {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-size: 1.1rem;
  line-height: 1;
  color: var(--text);
  cursor: pointer;
}

.picked-package__clear:hover {
  background: rgba(11, 11, 12, 0.1);
}

/* ========== FOLYAMAT ========== */
.process {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 64px;
  align-items: center;
}

.eyebrow--light {
  color: var(--cream);
}

.process__title {
  font-size: 2.3rem;
  font-weight: 800;
  line-height: 1.15;
  letter-spacing: -0.5px;
  color: #fff;
  text-wrap: balance;
}

.mark-text {
  color: var(--accent);
}

.process__lead {
  margin: 16px 0 30px !important;
  color: rgba(245, 241, 232, 0.75);
  font-size: 1.05rem;
  max-width: 26em;
}

.section--dark .btn--primary {
  box-shadow: none;
}

.section--dark .btn:focus-visible {
  outline-color: #fff;
}

.process-steps {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.process-step {
  position: relative;
  padding: 26px 26px 28px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
}

.process-step:hover {
  transform: translateY(-4px);
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.08);
}

.step-number {
  display: flex;
  align-items: center;
  gap: 14px;
  font-size: 2.4rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -1px;
  color: var(--accent);
  margin-bottom: 18px;
}

/* a szám után kifutó vonal */
.step-number::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(
    to right,
    rgba(255, 216, 51, 0.6),
    transparent
  );
}

.process-step h3 {
  font-size: 1.12rem;
  font-weight: 700;
  color: #fff;
}

.process-step p {
  margin-top: 8px;
  color: rgba(245, 241, 232, 0.72);
  font-size: 0.94rem;
}

/* az utolsó lépés a cél: sárga kártya */
.process-step:last-child {
  background: var(--accent);
  border-color: var(--accent);
}

.process-step:last-child:hover {
  background: var(--accent-bright);
}

.process-step:last-child .step-number,
.process-step:last-child h3 {
  color: var(--ink);
}

.process-step:last-child .step-number::after {
  background: linear-gradient(to right, rgba(11, 11, 12, 0.5), transparent);
}

.process-step:last-child p {
  color: rgba(11, 11, 12, 0.78);
}

/* ========== GYIK ========== */
.faq-list {
  margin-top: 36px;
  background: #fff;
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  overflow: hidden;
}

.faq-item + .faq-item {
  border-top: 1px solid var(--panel-border);
}

.faq-question {
  list-style: none;
  cursor: pointer;
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.faq-question::-webkit-details-marker {
  display: none;
}

.faq-item[open] {
  box-shadow: inset 4px 0 0 var(--accent);
}

.faq-title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
  transition: color 0.2s ease;
}

.faq-icon {
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  position: relative;
  border-radius: 50%;
  background: var(--panel);
  transition: background 0.2s ease;
}

.faq-question:hover .faq-icon,
.faq-item[open] .faq-icon {
  background: var(--accent);
}

.faq-icon::before,
.faq-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 2px;
  background: var(--text);
  transform: translate(-50%, -50%);
  border-radius: 2px;
  transition: transform 0.2s ease;
}

.faq-icon::after {
  transform: translate(-50%, -50%) rotate(90deg);
}

.faq-item[open] .faq-icon::after {
  transform: translate(-50%, -50%) rotate(0deg);
}

.faq-text {
  padding: 0 22px 20px !important;
  color: var(--muted);
  font-size: 0.95rem;
}

/* ========== LÁBLÉC ========== */

.site-foot__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 24px;
  padding-top: 14px;
  padding-bottom: 14px;
}

.site-foot__links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  font-size: 0.92rem;
  font-weight: 600;
}

.site-foot__links a {
  color: var(--cream);
}

.site-foot__links a:hover {
  color: var(--accent);
}

/* ========== MOBIL CTA SÁV ========== */
.mobile-cta {
  display: none;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 960px) {
  .hero {
    padding: 36px 0 52px;
  }

  .hero::before,
  .hero__waves {
    top: -260px;
    right: -320px;
    width: 720px;
    height: 720px;
  }

  .trust-strip__list {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  .hero__grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'text'
      'form'
      'media';
  }

  .hero__title {
    font-size: 2.1rem;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .process {
    grid-template-columns: 1fr;
    gap: 36px;
  }

  .bill {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .bill__range {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  .packages {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    row-gap: 22px;
  }

  .estimate {
    grid-template-columns: 1fr;
    padding: 26px 22px;
  }

  .estimate .btn {
    grid-row: auto;
    grid-column: auto;
  }

  .package-includes__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .process__title {
    font-size: 1.9rem;
  }

  .section {
    padding: 52px 0;
  }
}

@media (max-width: 768px) {
  .lp {
    padding-bottom: 84px;
  }

  .mobile-cta {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    display: flex;
    gap: 10px;
    padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
    background: #fff;
    border-top: 1px solid var(--panel-border);
    box-shadow: 0 -8px 24px rgba(11, 11, 12, 0.08);
    transition: transform 0.25s ease;
  }

  .mobile-cta--hidden {
    transform: translateY(110%);
  }

  .mobile-cta .btn {
    padding: 14px 16px;
    font-size: 0.98rem;
  }

  .mobile-cta .btn--dark {
    flex: 1;
    box-shadow: none;
  }
}

@media (max-width: 480px) {
  .container {
    padding-left: 16px;
    padding-right: 16px;
  }

  .topbar__inner {
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .brand-logo {
    height: 46px;
  }

  .topbar__phone {
    padding: 9px 13px;
    font-size: 0.85rem;
  }

  .trust-strip__list {
    grid-template-columns: 1fr;
    padding-left: 16px !important;
    padding-right: 16px !important;
  }

  .hero__title {
    font-size: 1.75rem;
  }

  .deadline {
    flex-direction: column;
    align-items: stretch;
    padding: 18px;
  }

  .deadline__unit {
    flex: 1;
  }

  .hero__lead {
    font-size: 1rem;
  }

  .form-card {
    padding: 24px 18px 20px;
  }

  .section-heading {
    font-size: 1.5rem;
  }

  .process__title {
    font-size: 1.6rem;
  }

  .bill {
    padding: 18px;
  }

  .packages {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .package__fit {
    min-height: 0;
  }

  .estimate__stats,
  .package-includes__list {
    grid-template-columns: 1fr;
  }

  .estimate__title {
    font-size: 1.1rem;
  }

  .process-steps {
    grid-template-columns: 1fr;
    gap: 14px;
  }

  .step-number {
    font-size: 2rem;
  }

}
</style>
