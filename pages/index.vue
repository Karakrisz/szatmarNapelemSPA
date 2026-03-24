<script setup>
import { ref, onMounted } from 'vue'
import { useGtagConversion } from '~/composables/useGtagConversion'

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
const contactMethod = ref('form')
const formData = ref({
  financing: '',
  monthlyBill: '',
  name: '',
  email: '',
  phone: '',
  message: '',
})

// ====== FAQ accordion ======
const faqRefs = ref([])

const handleFaqToggle = (activeIndex) => {
  const activeEl = faqRefs.value?.[activeIndex]
  if (!activeEl?.open) return

  faqRefs.value.forEach((el, i) => {
    if (i !== activeIndex && el?.open) el.open = false
  })
}

// Form submission handler
const submitForm = async (event) => {
  event.preventDefault()

  if (isSubmitting.value) return

  isSubmitting.value = true
  submitMessage.value = ''

  try {
    const webhookUrl =
      'https://services.leadconnectorhq.com/hooks/bsv1VGpQFCUeEBabknKX/webhook-trigger/30d2cccd-c034-4fe4-94e9-28e75927e7db'

    const { gclid, wbraid, gbraid } = getClickIds()

    const payload = {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      financing: formData.value.financing,
      monthly_bill: formData.value.monthlyBill,
      message: formData.value.message,
      gclid,
      wbraid,
      gbraid,
      source: 'Napelem árajánlatkérési űrlap',
      form_type: 'solar_panel_inquiry',
      submission_date: new Date().toISOString(),
      custom_field_1: 'Napelemes kivitelezés + konzultáció',
      custom_field_2: formData.value.financing,
      custom_field_3: formData.value.monthlyBill,
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      submitMessage.value =
        '✅ Köszönjük! Hamarosan felvesszük Önnel a kapcsolatot.'

      const { reportConversion } = useGtagConversion()
      reportConversion()

      formData.value = {
        financing: '',
        monthlyBill: '',
        name: '',
        email: '',
        phone: '',
        message: '',
      }
    } else {
      throw new Error('Hiba történt a küldés során')
    }
  } catch (error) {
    console.error('Form submission error:', error)
    submitMessage.value =
      '❌ Hiba történt. Kérjük próbálja újra, vagy hívjon minket!'
  } finally {
    isSubmitting.value = false
  }
}

const getServiceDisplayName = (serviceValue) => {
  const serviceMap = {
    hazasitalis: 'Háztartási napelemes rendszer',
    nagyobb: 'Nagyobb teljesítményű rendszer',
    gazdasagi: 'Gazdasági épületre telepítés',
    korszerusites: 'Meglévő rendszer korszerűsítése',
    pelus: 'Napelem + Pellet fűtés',
    energiatarolas: 'Energiatárolás (akkumulátor)',
    hibaelhárítás: 'Meglévő rendszer hibája',
    egyéb: 'Egyéb napelemes megoldás',
  }
  return serviceMap[serviceValue] || serviceValue
}

const initPage = () => {
  persistClickIdsFromUrl()

  const header = document.querySelector('header')
  const footer = document.querySelector('footer')
  const navbar = document.querySelector('nav')
  const siteChatWidget = document.querySelector('.lc_text-widget')

  if (header) header.style.display = 'none'
  if (footer) footer.style.display = 'none'
  if (navbar) navbar.style.display = 'none'
  if (siteChatWidget) siteChatWidget.style.display = 'none'

  document.querySelectorAll('header, footer, .lc_text-widget').forEach((el) => {
    el.style.display = 'none'
  })
}

onMounted(() => {
  initPage()
})
</script>

<template>
  <section>
    <div
      class="about-content about-content--subpage-next-format position-relative no-header-footer-page"
    >
      <div class="subpage-content">
        <!-- HERO BANNER -->
        <div class="trust-banner trust-banner--with-image">
          <div class="banner-bg-image">
            <NuxtImg
              src="/img/hero.webp"
              alt="Napelemes Rendszer Szatmárban - Ingyenes Felmérés"
              class="banner-image"
              width="1200"
              height="600"
            />
          </div>

          <div class="banner-content">
            <h1 class="main-title">NAPELEMES RENDSZER + ENERGIATÁROLÁS</h1>
            <p class="banner-subtitle">
              <i class="supage-content__p__i"
                >Ingyenes felmérés • Teljes körű kivitelezés • Gyors
                ügyintézés</i
              >
            </p>
            <div class="social-proof" aria-label="Vásárlói visszajelzés">
              <div class="rating">
                <span class="rating-score">4,9</span>
                <div class="stars" aria-hidden="true">
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star">★</span>
                  <span class="star star--half">★</span>
                </div>
                <span class="rating-text">értékelés</span>
              </div>
              <div class="proof-metrics">
                <div class="metric">
                  <span class="metric-value">1000+</span>
                  <span class="metric-label">kiszolgált ügyfél</span>
                </div>
              </div>
            </div>
            <p class="banner-value-prop">
              Napelemes rendszer kivitelezésben segítünk A-tól Z-ig, akár
              <strong>teljes önerőből</strong>, akár
              <strong>támogatási lehetőséggel</strong>. Rövid űrlap – gyors
              visszahívás és ingyenes felmérés.
            </p>
          </div>
        </div>

        <!-- 3 KIEMELT ÉRVELÉS -->
        <div class="benefits-grid">
          <div class="benefit-card">
            <h3>⚡ Prémium kivitelezés, helyi csapattal</h3>
            <p>
              <strong
                >Tervezés, engedélyeztetés, telepítés – egy kézben.</strong
              >
              Lakossági és kisebb vállalkozói rendszereknél is gyorsan és
              átláthatóan dolgozunk, ingyenes felméréssel.
            </p>
          </div>
          <div class="benefit-card">
            <h3>🔌 Napelem + Energiatárolás, ha valóban számít</h3>
            <p>
              <strong>Okosabb felhasználás, nagyobb önfogyasztás.</strong>
              Ha szeretné csökkenteni a hálózati függőséget, megtervezzük a
              napelemes rendszert és a tárolást is az igényeihez.
            </p>
          </div>
          <div class="benefit-card">
            <h3>✅ Mi Intézünk Mindent</h3>
            <p>
              <strong>A papírmunka és felmérés a mi feladatunk.</strong>
              Helyszíni felmérés, ügyintézés, engedélyeztetés, telepítés,
              bejelentés – mindent mi kezelünk. Ön csak élvezi az eredményt.
            </p>
          </div>
        </div>

        <!-- BIZALOM MODUL -->
        <div class="trust-module d-none">
          <div class="trust-item">
            <div class="trust-icon">🔋</div>
            <div class="trust-content">
              <h4>Energiatárolás – ha szüksége van rá</h4>
              <p>
                Energiatárolásra is tudunk javaslatot adni – akár meglévő, akár
                új napelemes rendszer mellé. Támogatási lehetőségek időszakosan
                elérhetők, de a kivitelezés egész évben megy.
              </p>
            </div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">⚙️</div>
            <div class="trust-content">
              <h4>Meglátjuk, mit bír a tető és a fogyasztás</h4>
              <p>
                Ha már van rendszere, átnézzük, optimalizáljuk, bővítjük. Ha még
                nincs: megtervezzük a legjobb megoldást.
              </p>
            </div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">👨‍💼</div>
            <div class="trust-content">
              <h4>Szatmári Szakembercím</h4>
              <p>
                Helyi csapat, helyi tudás. Mi tudjuk, milyen a szatmári tetők,
                időjárás és áramszolgáltatás. Ingyenes konzultáció.
              </p>
            </div>
          </div>
        </div>

        <!-- HOGYAN MŰKÖDIK SECTION -->
        <div class="process-section">
          <h2 class="section-heading">Hogyan működik a folyamat?</h2>
          <div class="process-steps">
            <div class="process-step">
              <div class="step-number">1</div>
              <div class="step-content">
                <h4>Felmérés</h4>
                <p>
                  Meglátogatunk Önt, felmérjük a lehetőségeket.
                  Kötelezettségmentes.
                </p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>Ajánlat & Tervezés</h4>
                <p>Részletes ajánlatot és műszaki tervet készítünk.</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>Ügyintézés</h4>
                <p>
                  Összes engedély, bejelentés, papírmunka – mi gondoskodunk.
                </p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h4>Telepítés & Üzembe</h4>
                <p>
                  Profi csapat telepíti a rendszert. Használatbavételig mi
                  vezetünk.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- MIT TARTALMAZ -->
        <div class="includes-section">
          <h2 class="section-heading">Mit kap az ingyenes felmérés során?</h2>
          <div class="includes-grid">
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Ingyenes helyszíni felmérés</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Ingyenes megtakarítás-kalkuláció</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Ajánlat + teljes körű ügyintézés</strong>
            </div>
          </div>
        </div>

        <!-- GYIK SZEKCIÓ -->
        <div class="faq-section">
          <h2 class="section-heading">Gyakran feltett kérdések</h2>

          <div class="faq-list">
            <details
              class="faq-item"
              :ref="(el) => (faqRefs[0] = el)"
              @toggle="handleFaqToggle(0)"
            >
              <summary class="faq-question">
                <span class="faq-title"
                  >💰 Mennyibe kerül egy napelemes rendszer?</span
                >
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  A pontos ár a fogyasztástól, tetőtől és a kívánt
                  teljesítménytől függ. Ingyenes felmérés után adunk korrekt,
                  tételes ajánlatot. Ha időszakosan van támogatási lehetőség,
                  abban is segítünk eligazodni, de a kivitelezés nem ettől függ.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[1] = el)"
              @toggle="handleFaqToggle(1)"
            >
              <summary class="faq-question">
                <span class="faq-title"
                  >⏱️ Megtérül-e a napelemes rendszer?</span
                >
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  Igen, de az pontos megtérülési idő az Ön konkrét helyzetétől
                  függ – tetőmé, fogyasztás, áramár. Ezért szükséges a részletes
                  felmérés. Sok háztartás kedvezően jár, különösen az
                  akkumulátoros programmal.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[2] = el)"
              @toggle="handleFaqToggle(2)"
            >
              <summary class="faq-question">
                <span class="faq-title"
                  >🏡 Mennyi idő alatt készül el a rendszer?</span
                >
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  A felméréstől a telepítésig az átfutás több tényezőtől függ,
                  de a célunk mindig a gyors, kiszámítható ütemezés. A telepítés
                  általában rövid, a szükséges adminisztrációt mi intézzük.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[3] = el)"
              @toggle="handleFaqToggle(3)"
            >
              <summary class="faq-question">
                <span class="faq-title">💡 Mennyi áramot spórolhatok meg?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  Ez szigorúan az Ön helyzetétől függ. Ahhoz, hogy pontos
                  becslést adjunk, szükséges a helyszíni felmérés, a tetőméret,
                  a jelenlegi fogyasztás és az éghajlat elemzése. Egyedi
                  ajánlatot készítünk – ezt követően sok ügyfél meglepődik az
                  eredményen.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[4] = el)"
              @toggle="handleFaqToggle(4)"
            >
              <summary class="faq-question">
                <span class="faq-title"
                  >🔨 Mennyi idő alatt telepítik a rendszert?</span
                >
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  A felmérésből az üzembe helyezésig általában néhány hét
                  szükséges – ennek függőséget sok tényezőtől. A tényleges
                  fizikai telepítés viszonylag gyors. Pontos ütemezésről az első
                  konzultáció során beszélünk.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[5] = el)"
              @toggle="handleFaqToggle(5)"
            >
              <summary class="faq-question">
                <span class="faq-title"
                  >📋 Ki intézi az engedélyeket és papírmunkát?</span
                >
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  Mi gondoskodunk az összes szükséges engedélyről: önkormányzat,
                  áramszolgáltató, hatósági előírások. Önnek csak annyi a
                  feladata, hogy aláírja a szükséges dokumentumokat. A bonyolult
                  részek a mi feladatunk.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[6] = el)"
              @toggle="handleFaqToggle(6)"
            >
              <summary class="faq-question">
                <span class="faq-title">🔧 Karbantartás szükséges?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  A napelemes panelek szinte karbantartásmentes. Az eső a
                  legtöbb szennyeződést lemossa. Évente néha szép tiszta időben
                  érdemes ellenőrizni. A részletekről majd oktatunk, amikor
                  üzembe helyezzük a rendszert.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[7] = el)"
              @toggle="handleFaqToggle(7)"
            >
              <summary class="faq-question">
                <span class="faq-title">✅ Van garancia?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  Igen, a modern napelemes rendszerek szavatossággal és
                  garanciával járnak. A részletekről majd az ajánlatunkban írunk
                  – mindent beépítünk az ügyintézésbe.
                </p>
              </div>
            </details>

            <details
              class="faq-item"
              :ref="(el) => (faqRefs[8] = el)"
              @toggle="handleFaqToggle(8)"
            >
              <summary class="faq-question">
                <span class="faq-title">💰 Van-e most elérhető támogatás?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">
                  Támogatási lehetőségek időszakosan jelennek meg és változnak.
                  Ha kitölti az űrlapot vagy felhív minket, elmondjuk az
                  aktuális helyzetet, és javaslunk olyan megoldást is, ami
                  önerőből is jól működik.
                </p>
              </div>
            </details>
          </div>
        </div>

        <!-- ZÁRÓ CTA SECTION -->
        <div class="closing-cta-section">
          <h2 class="section-heading">Kér egy ingyenes konzultációt?</h2>
          <p class="closing-message">
            <strong>Egész évben</strong> vállalunk napelemes kivitelezést és
            ingyenes felmérést. Akár <strong>teljes önerőből</strong>, akár ha
            épp van elérhető támogatási lehetőség, segítünk átlátni.
            <br /><br />
            <i
              ><strong>Gyors visszahívás</strong> – rövid űrlap, pontos
              egyeztetés.</i
            >
          </p>
        </div>

        <!-- CONTACT METHOD CHOICE -->
        <div class="contact-choice">
          <p class="choice-intro">
            Válasszon: Hívjon minket vagy töltse ki az űrlapot!
          </p>
          <div class="choice-buttons">
            <button
              class="choice-btn choice-btn--phone"
              :class="{ active: contactMethod === 'phone' }"
              @click="contactMethod = 'phone'"
            >
              <span class="choice-icon">☎️</span>
              <span class="choice-text">Hívjon minket most!</span>
            </button>
            <button
              class="choice-btn choice-btn--form"
              :class="{ active: contactMethod === 'form' }"
              @click="contactMethod = 'form'"
            >
              <span class="choice-icon">📝</span>
              <span class="choice-text">Töltse ki az űrlapot</span>
            </button>
          </div>
        </div>

        <!-- PHONE CARD -->
        <div v-if="contactMethod === 'phone'" class="contact-section">
          <div class="phone-card">
            <div class="phone-card-icon">☎️</div>
            <h3 class="phone-card-title">Hívjon Minket Most!</h3>
            <p class="phone-card-subtitle">
              Beszéljen közvetlenül szakemberrel
            </p>
            <a href="tel:+36204517238" class="phone-button">
              <span class="phone-icon">📞</span>
              <span class="phone-number">+36 20 451 7238</span>
            </a>
            <div class="phone-info">
              <p><strong>Kedvező időpontban beszélgetünk</strong></p>
              <p class="small">Helyszíni felmérést egyeztetünk</p>
            </div>
            <div class="phone-benefits">
              <div class="benefit">✓ Azonnali tanácsadás</div>
              <div class="benefit">✓ Felmérés időpontja</div>
              <div class="benefit">✓ Finanszírozási kérdések</div>
            </div>
          </div>
        </div>

        <!-- FORM -->
        <div v-if="contactMethod === 'form'" class="contact-section">
          <form class="appointment-form" @submit="submitForm">
            <div class="form-section">
              <h3 class="section-title">Pár kérdés, és visszahívjuk</h3>

              <div class="form-group">
                <label class="supage-content__ul__li__strong"
                  >Finanszírozás *</label
                >
                <select
                  v-model="formData.financing"
                  required
                  class="form-select"
                  :disabled="isSubmitting"
                >
                  <option value="">Válasszon...</option>
                  <option value="onero">Teljes önerőből</option>
                  <option value="tamogatassal">
                    Támogatással (ha elérhető)
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="supage-content__ul__li__strong"
                  >Mennyi az átlagos rezsiköltsége? *</label
                >
                <div class="option-grid" role="radiogroup">
                  <label class="option-pill">
                    <input
                      type="radio"
                      name="monthlyBill"
                      value=">200k"
                      v-model="formData.monthlyBill"
                      required
                      :disabled="isSubmitting"
                    />
                    <span class="option-pill__text">200 000 Ft felett</span>
                  </label>
                  <label class="option-pill">
                    <input
                      type="radio"
                      name="monthlyBill"
                      value=">300k"
                      v-model="formData.monthlyBill"
                      required
                      :disabled="isSubmitting"
                    />
                    <span class="option-pill__text">300 000 Ft felett</span>
                  </label>
                  <label class="option-pill">
                    <input
                      type="radio"
                      name="monthlyBill"
                      value=">400k"
                      v-model="formData.monthlyBill"
                      required
                      :disabled="isSubmitting"
                    />
                    <span class="option-pill__text">400 000 Ft felett</span>
                  </label>
                  <label class="option-pill">
                    <input
                      type="radio"
                      name="monthlyBill"
                      value="400k+"
                      v-model="formData.monthlyBill"
                      required
                      :disabled="isSubmitting"
                    />
                    <span class="option-pill__text">Ennél is több</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Személyes adatok</h3>

              <div class="form-group">
                <label class="supage-content__ul__li__strong">Név *</label>
                <input
                  type="text"
                  v-model="formData.name"
                  required
                  class="form-input"
                  placeholder="Teljes név"
                  :disabled="isSubmitting"
                />
              </div>

              <div class="form-group">
                <label class="supage-content__ul__li__strong">Email cím</label>
                <input
                  type="email"
                  v-model="formData.email"
                  class="form-input"
                  placeholder="Az árajánlatot ide küldjük"
                  :disabled="isSubmitting"
                />
              </div>

              <div class="form-group">
                <label class="supage-content__ul__li__strong"
                  >Telefonszám *</label
                >
                <input
                  type="tel"
                  v-model="formData.phone"
                  required
                  class="form-input"
                  placeholder="Gyors egyeztetéshez"
                  :disabled="isSubmitting"
                />
              </div>
            </div>

            <div class="form-section">
              <h3 class="section-title">Megjegyzés (Opcionális)</h3>
              <div class="form-group">
                <label class="supage-content__ul__li__strong"
                  >További információ</label
                >
                <textarea
                  v-model="formData.message"
                  class="form-textarea"
                  placeholder="Írja le az igényeit, kérdéseit..."
                  rows="4"
                  :disabled="isSubmitting"
                ></textarea>
              </div>
            </div>

            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span class="btn-text" v-if="!isSubmitting"
                >Visszahívást kérek</span
              >
              <span class="btn-text" v-else>Küldés...</span>
            </button>

            <p class="privacy-text">
              <i class="supage-content__p__i">
                Az űrlap elküldésével automatikusan elfogadja az
                <NuxtLink
                  class="supage-content__nlink"
                  to="/adatvedelmi-tajekoztato"
                  >Adatvédelmi Szabályzatot.</NuxtLink
                >
              </i>
            </p>
          </form>

          <div
            v-if="submitMessage"
            class="submit-message"
            :class="{
              success: submitMessage.includes('✅'),
              error: submitMessage.includes('❌'),
            }"
          >
            {{ submitMessage }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Header és footer elrejtése */
header,
footer,
.header,
.footer,
nav,
.navbar,
.site-header,
.site-footer {
  display: none !important;
}

body > header,
body > footer {
  display: none !important;
}

:global(html),
:global(body) {
  background: #0a0a0a;
}

:global(body) {
  min-height: 100vh;
}

.subpage-content {
  padding: 3em;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  background:
    radial-gradient(
      1200px 600px at 20% 0%,
      rgba(255, 218, 51, 0.14),
      transparent 55%
    ),
    radial-gradient(
      900px 500px at 90% 10%,
      rgba(255, 218, 51, 0.08),
      transparent 60%
    ),
    linear-gradient(180deg, #0a0a0a 0%, #111 100%);
  --accent: #ffda33;
  --panel: rgba(255, 255, 255, 0.06);
  --panel-border: rgba(255, 255, 255, 0.14);
  --text: rgba(255, 255, 255, 0.92);
  --muted: rgba(255, 255, 255, 0.72);
  position: relative;
  overflow: hidden;
  border-radius: 18px;
}

.subpage-content::before,
.subpage-content::after {
  content: '';
  position: absolute;
  inset: auto;
  width: 520px;
  height: 520px;
  border-radius: 50%;
  background: rgba(255, 218, 51, 0.22);
  filter: blur(90px);
  opacity: 0.9;
  pointer-events: none;
  z-index: 0;
  animation: glowFloat 12s ease-in-out infinite;
}

.subpage-content::before {
  top: -160px;
  left: -180px;
}

.subpage-content::after {
  bottom: -220px;
  right: -220px;
  width: 620px;
  height: 620px;
  background: rgba(255, 218, 51, 0.14);
  animation-duration: 16s;
}

.subpage-content > * {
  position: relative;
  z-index: 1;
}

@keyframes glowFloat {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(35px, 18px, 0) scale(1.05);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

/* ========== HERO BANNER ========== */
.trust-banner {
  position: relative;
  border-radius: 15px;
  margin-bottom: 40px;
  overflow: hidden;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  transform: translateZ(0);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease;
}

.trust-banner:hover {
  transform: translateY(-4px);
  box-shadow: 0 24px 65px rgba(0, 0, 0, 0.6);
}

.trust-banner--with-image {
  background: var(--panel);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(12px);
}

.banner-bg-image {
  position: relative;
  width: 100%;
  height: auto;
  overflow: hidden;
  z-index: 1;
  display: block;
}

.banner-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  object-position: center;
  display: block;
  opacity: 1;
}

.banner-content {
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 3.5em 2em;
  width: 100%;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.55) 100%
  );
  backdrop-filter: blur(10px);
}

.choice-btn:active {
  transform: translateY(-1px);
}

.main-title {
  font-size: 2.2rem;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}

.banner-subtitle {
  font-size: 1.1rem;
  text-align: center;
  color: #fff;
  margin-bottom: 15px;
  opacity: 0.95;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.banner-value-prop {
  font-size: 1rem;
  color: #fff;
  line-height: 1.6;
  margin-bottom: 25px;
  opacity: 0.95;
}

.social-proof {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 9px 12px;
  margin: 12px auto 14px auto;
  width: fit-content;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  backdrop-filter: blur(12px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
}

.rating {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.rating-score {
  color: var(--accent);
  font-weight: 800;
  letter-spacing: 0.2px;
  font-size: 0.98rem;
}

.stars {
  display: inline-flex;
  gap: 3px;
  line-height: 1;
}

.star {
  color: var(--accent);
  font-size: 0.95rem;
}

.star--half {
  position: relative;
  color: rgba(255, 218, 51, 0.35);
}

.star--half::before {
  content: '★';
  position: absolute;
  left: 0;
  top: 0;
  width: 50%;
  overflow: hidden;
  color: var(--accent);
}

.rating-text {
  color: var(--muted);
  font-size: 0.9rem;
}

.proof-metrics {
  display: inline-flex;
  align-items: center;
}

.metric {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  padding-left: 14px;
  border-left: 1px solid rgba(255, 255, 255, 0.14);
}

.metric-value {
  color: var(--text);
  font-weight: 800;
  font-size: 0.95rem;
}

.metric-label {
  color: var(--muted);
  font-size: 0.9rem;
}

/* ========== 3 KIEMELT ÉRVELÉS ========== */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin: 45px 0 50px 0;
  padding: 0;
}

.benefit-card {
  background: var(--panel);
  padding: 28px;
  border-radius: 10px;
  border-left: 6px solid var(--accent);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(12px);
  transform: translateZ(0);
  transition:
    transform 0.35s ease,
    box-shadow 0.35s ease,
    background 0.35s ease;
}

.benefit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.55);
  background: rgba(255, 255, 255, 0.08);
}

.benefit-card h3 {
  color: var(--accent);
  font-size: 1.15rem;
  margin-bottom: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.benefit-card p {
  color: var(--muted);
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.benefit-card strong {
  color: var(--text);
  font-weight: 700;
}

/* ========== BIZALOM MODUL ========== */
.trust-module {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 25px;
  margin: 4em 0;
  padding: 0;
}

.trust-item {
  background: var(--panel);
  padding: 25px;
  border-radius: 10px;
  border-left: 5px solid var(--accent);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(12px);
  display: flex;
  gap: 15px;
}

.trust-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.trust-content h4 {
  color: var(--accent);
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.trust-content p {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* ========== PROCESS SECTION ========== */
.process-section {
  margin: 4em 0;
}

.process-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
  margin-top: 30px;
}

.process-step {
  background: var(--panel);
  padding: 25px;
  border-radius: 10px;
  border-top: 5px solid var(--accent);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(12px);
  text-align: center;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: var(--accent);
  color: #000;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 15px;
}

.process-step h4 {
  color: var(--accent);
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 10px 0;
}

.process-step p {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

/* ========== INCLUDES SECTION ========== */
.includes-section {
  margin: 4em 0;
}

.includes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-top: 25px;
}

.include-item {
  background: var(--panel);
  padding: 18px;
  border-radius: 8px;
  border-left: 4px solid var(--accent);
  box-shadow: 0 14px 35px rgba(0, 0, 0, 0.35);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(12px);
  display: flex;
  gap: 12px;
  font-size: 0.95rem;
  color: var(--text);
}

.include-check {
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
}

/* ========== SECTION HEADING ========== */
.section-heading {
  color: var(--accent);
  font-size: 2rem;
  font-weight: bold;
  margin: 1.5em 0 1.5em 0;
  text-align: center;
}

/* ========== CLOSING CTA SECTION ========== */
.closing-cta-section {
  background:
    linear-gradient(
      135deg,
      rgba(255, 218, 51, 0.12) 0%,
      rgba(0, 0, 0, 0.65) 65%
    ),
    var(--panel);
  color: var(--text);
  padding: 40px 30px;
  border-radius: 15px;
  text-align: center;
  margin: 3em 0;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px);
}

.closing-cta-section .section-heading {
  color: #fff;
  margin-top: 0;
}

.closing-message {
  font-size: 1.05rem;
  line-height: 1.6;
  margin-bottom: 30px;
  opacity: 0.95;
}

/* ========== CONTACT CHOICE ========== */
.contact-choice {
  background: var(--panel);
  padding: 40px 30px;
  border-radius: 15px;
  text-align: center;
  margin: 2.5em auto;
  max-width: 900px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px);
}

.choice-intro {
  color: var(--accent);
  font-size: 1.3rem;
  font-weight: 700;
  margin: 0 0 30px 0;
}

.choice-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 25px 20px;
  border: 1px solid var(--panel-border);
  background: rgba(0, 0, 0, 0.25);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
  backdrop-filter: blur(10px);
}

.choice-btn:hover {
  border-color: var(--accent);
  transform: translateY(-3px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
}

.choice-btn.active {
  background:
    linear-gradient(
      135deg,
      rgba(255, 218, 51, 0.18) 0%,
      rgba(0, 0, 0, 0.35) 55%
    ),
    rgba(0, 0, 0, 0.25);
  color: var(--text);
  border-color: var(--accent);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
}

.choice-icon {
  font-size: 2rem;
}

.choice-text {
  text-align: center;
  line-height: 1.3;
}

/* ========== CONTACT SECTION ========== */
.contact-section {
  margin: 2em auto;
  max-width: 900px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ========== PHONE CARD ========== */
.phone-card {
  background:
    linear-gradient(
      135deg,
      rgba(255, 218, 51, 0.12) 0%,
      rgba(0, 0, 0, 0.8) 70%
    ),
    var(--panel);
  padding: 45px 35px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  color: var(--text);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px);
}

.phone-card-icon {
  font-size: 3.5rem;
  margin-bottom: 15px;
}

.phone-card-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #fff;
}

.phone-card-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
  margin: 0 0 30px 0;
}

.phone-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: var(--accent);
  color: #000;
  padding: 18px 35px;
  border-radius: 50px;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.15rem;
  margin: 0 0 30px 0;
  transition: all 0.3s ease;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  border: none;
  cursor: pointer;
}

.phone-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  background: #f0f0f0;
}

.phone-button:active {
  transform: translateY(-1px);
}

.phone-icon {
  font-size: 1.4rem;
}

.phone-number {
  letter-spacing: 0.5px;
}

.phone-info {
  background: rgba(255, 255, 255, 0.15);
  padding: 18px 16px;
  border-radius: 10px;
  margin-bottom: 25px;
}

.phone-info p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.phone-info p strong {
  display: block;
  font-weight: 700;
}

.phone-info p.small {
  font-size: 0.85rem;
  opacity: 0.9;
  margin-top: 6px;
}

.phone-benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phone-benefits .benefit {
  font-size: 0.95rem;
  line-height: 1.4;
  color: #fff;
}

/* ========== FORM STYLES ========== */
.appointment-form {
  max-width: 900px;
  margin: 0 auto;
}

.submit-message {
  padding: 18px;
  border-radius: 10px;
  margin-top: 20px;
  font-weight: bold;
  text-align: center;
  font-size: 1rem;
}

.submit-message.success {
  background-color: #d4edda;
  color: #155724;
  border: 2px solid #c3e6cb;
}

.submit-message.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 2px solid #f5c6cb;
}

.form-section {
  background: var(--panel);
  padding: 28px;
  margin: 2.5em 0;
  border-radius: 12px;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  border-left: 5px solid var(--accent);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px);
}

.section-title {
  color: var(--accent);
  font-size: 1.35rem;
  margin-bottom: 25px;
  border-bottom: 3px solid var(--accent);
  padding-bottom: 12px;
  font-weight: 700;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: var(--text);
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 13px 15px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s;
  background-color: rgba(0, 0, 0, 0.35);
  color: var(--text);
  backdrop-filter: blur(8px);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #999;
}

.form-select {
  width: 100%;
  padding: 13px 16px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  background-color: rgba(0, 0, 0, 0.35);
  transition: all 0.3s ease;
  cursor: pointer;
  color: var(--text);
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffda33' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  padding-right: 45px;
}

.form-input:focus,
.form-textarea:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 4px rgba(255, 218, 51, 0.18);
}

.form-select:focus {
  border-color: var(--accent);
  outline: none;
  box-shadow: 0 0 0 4px rgba(255, 218, 51, 0.18);
}

.form-select:hover:not(:disabled) {
  border-color: var(--accent);
  background-color: rgba(0, 0, 0, 0.45);
}

.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  background-color: rgba(0, 0, 0, 0.25);
  opacity: 0.55;
  cursor: not-allowed;
}

/* ========== SUBMIT BUTTON ========== */
.submit-btn {
  background: var(--accent);
  color: #000;
  border: none;
  padding: 18px 45px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  margin-top: 15px;
  animation: ctaPulse 1.9s ease-in-out infinite;
  position: sticky;
  bottom: 14px;
  z-index: 3;
  will-change: transform;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.55);
  background: #ffd44a;
}

.submit-btn:active:not(:disabled) {
  transform: translateY(-1px) scale(0.99);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
  animation: none;
}

@keyframes ctaPulse {
  0% {
    transform: translateY(0);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  }
  55% {
    transform: translateY(-2px);
    box-shadow:
      0 26px 75px rgba(0, 0, 0, 0.65),
      0 0 0 6px rgba(255, 218, 51, 0.12);
  }
  100% {
    transform: translateY(0);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  }
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.option-pill {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 12px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(0, 0, 0, 0.35);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease,
    border-color 0.2s ease;
}

.option-pill input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.option-pill__text {
  color: var(--text);
  font-weight: 700;
  font-size: 0.95rem;
  text-align: center;
}

.option-pill:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.55);
  border-color: var(--accent);
}

.option-pill:has(input:checked) {
  border-color: var(--accent);
  background: rgba(255, 218, 51, 0.14);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.6);
}

.btn-text {
  font-size: 1.05rem;
  letter-spacing: 0.5px;
}

/* ========== PRIVACY TEXT ========== */
.privacy-text {
  color: var(--muted);
  font-size: 0.85rem;
  margin-top: 15px;
  text-align: center;
}

.privacy-text a {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.privacy-text a:hover {
  color: #ffd44a;
  text-decoration: underline;
}

/* ========== FAQ SECTION ========== */
.faq-section {
  margin: 3em 0;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 30px;
}

.faq-item {
  background: var(--panel);
  border-radius: 10px;
  border-left: 5px solid var(--accent);
  box-shadow: 0 18px 45px rgba(0, 0, 0, 0.45);
  border: 1px solid var(--panel-border);
  backdrop-filter: blur(14px);
  transition: all 0.25s ease;
  overflow: hidden;
  width: 100%;
}

.faq-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 22px 55px rgba(0, 0, 0, 0.55);
  background: rgba(255, 255, 255, 0.08);
}

.faq-question {
  list-style: none;
  cursor: pointer;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.faq-question::-webkit-details-marker {
  display: none;
}

.faq-title {
  color: var(--accent);
  font-size: 1.05rem;
  font-weight: 700;
  line-height: 1.4;
}

.faq-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 18px;
  position: relative;
}

.faq-icon::before,
.faq-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 11px;
  height: 2px;
  background: var(--accent);
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

.faq-item[open] .faq-question {
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.faq-answer {
  padding: 17px 22px 18px 22px;
}

.faq-text {
  color: var(--muted);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

/* ========== RESPONSIVE ========== */
@media (max-width: 768px) {
  .choice-buttons {
    grid-template-columns: 1fr;
  }

  .choice-btn {
    padding: 20px 15px;
  }

  .phone-card {
    padding: 30px 25px;
  }

  .phone-card-icon {
    font-size: 2.5rem;
  }

  .phone-button {
    padding: 16px 28px;
    font-size: 1rem;
  }

  .main-title {
    font-size: 1.8rem;
  }

  .banner-subtitle {
    font-size: 0.95rem;
  }

  .banner-content {
    padding: 2.5em 1.5em;
  }

  .benefits-grid {
    grid-template-columns: 1fr;
  }

  .benefit-card {
    padding: 20px;
  }

  .form-section {
    padding: 20px;
  }

  .section-heading {
    font-size: 1.6rem;
  }

  .section-title {
    font-size: 1.15rem;
  }

  .subpage-content {
    padding: 1.5em;
  }

  .option-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .trust-banner {
    border-radius: 10px;
  }

  .main-title {
    font-size: 1.5rem;
    margin-bottom: 8px;
  }

  .banner-subtitle {
    font-size: 0.9rem;
  }

  .banner-content {
    padding: 2em 1em;
  }

  .benefits-grid {
    gap: 15px;
  }

  .benefit-card {
    padding: 15px;
  }

  .benefit-card h3 {
    font-size: 1rem;
  }

  .subpage-content {
    padding: 1em;
  }

  .section-heading {
    font-size: 1.3rem;
  }

  .faq-title {
    font-size: 0.95rem;
  }

  .faq-text {
    font-size: 0.85rem;
  }

  .contact-choice {
    padding: 25px 20px;
  }

  .choice-intro {
    font-size: 1.1rem;
  }
}
</style>
