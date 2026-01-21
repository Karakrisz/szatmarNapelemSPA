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
    serviceType: '',
    roofType: '',
    urgency: '',
    name: '',
    email: '',
    phone: '',
    address: '',
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
      const serviceName = getServiceDisplayName(formData.value.serviceType)
  
      const payload = {
        name: formData.value.name,
        email: formData.value.email,
        phone: formData.value.phone,
        address: formData.value.address,
        service_type: formData.value.serviceType,
        roof_type: formData.value.roofType,
        urgency: formData.value.urgency,
        message: formData.value.message,
        gclid,
        wbraid,
        gbraid,
        source: 'Napelem árajánlatkérési űrlap',
        form_type: 'solar_panel_inquiry',
        submission_date: new Date().toISOString(),
        custom_field_1: serviceName,
        custom_field_2: formData.value.roofType,
        custom_field_3: formData.value.urgency,
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
          serviceType: '',
          roofType: '',
          urgency: '',
          name: '',
          email: '',
          phone: '',
          address: '',
          message: '',
        }
      } else {
        throw new Error('Hiba történt a küldés során')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      submitMessage.value = '❌ Hiba történt. Kérjük próbálja újra, vagy hívjon minket!'
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
    <div class="about-content about-content--subpage-next-format position-relative no-header-footer-page">
      <div class="subpage-content">
        <!-- HERO BANNER -->
        <div class="trust-banner trust-banner--with-image">
          <div class="banner-bg-image">
            <NuxtImg
              src="/img/hero.svg"
              alt="Napelemes Rendszer Szatmárban - Ingyenes Felmérés"
              class="banner-image"
              width="1200"
              height="600"
            />
          </div>

          <div class="banner-content">
            <h1 class="main-title">NAPELEMES RENDSZER + ENERGIATÁROLÁS</h1>
            <p class="banner-subtitle">
              <i class="supage-content__p__i">Megjelent az állami energiatárolási pályázat • Teljes ügyintézés • Felmérés ingyenes</i>
            </p>
            <p class="banner-value-prop">
              2025-ben nyílt meg az <strong>Otthoni Energiatárolás Program</strong> pályázati kiírása. Az energia függetlenség most már elérhető. Napelemes rendszer + akkumulátor = valódi megoldás. Mi gondoskodunk a teljes ügyintézésről – csak egy rövid formanyomtatvány!
            </p>
          </div>
        </div>

        <!-- 3 KIEMELT ÉRVELÉS -->
        <div class="benefits-grid">
          <div class="benefit-card">
            <h3>🔋 Állami Támogatás – OETP Program</h3>
            <p>
              <strong>Az Otthoni Energiatárolás Program mostanra elindult.</strong>
              Azok a háztartások, amelyek rendelkeznek napelemes rendszerrel vagy vállalják annak telepítését, pályázhatnak az energiatárolásra. A kiírás egyszerű: 2,5 oldalas formanyomtatvány. Részletekről beszélgessünk.
            </p>
          </div>
          <div class="benefit-card">
            <h3>🔌 Napelem + Akkumulátor = Energiafüggetlenség</h3>
            <p>
              <strong>Az energiatárolás критична az igazi megtakarításhoz.</strong>
              Nem csak termelni kell, hanem tárolni is az áramot. Éjszaka is van energia, amikor szüksége van rá. A bruttóelszámolás miatt különösen értékes a накопитель.
            </p>
          </div>
          <div class="benefit-card">
            <h3>✅ Mi Intézünk Mindent</h3>
            <p>
              <strong>A papírmunka és felmérés a mi feladatunk.</strong>
              Helyszíni felmérés, pályázatírás, engedélyeztetés, telepítés, bejelentés – mindent mi kezelünk. Ön csak élvezi az eredményt.
            </p>
          </div>
        </div>

        <!-- BIZALOM MODUL -->
        <div class="trust-module">
          <div class="trust-item">
            <div class="trust-icon">🔋</div>
            <div class="trust-content">
              <h4>Otthoni Energiatárolás Program</h4>
              <p>Az OETP 100 milliárd forintból támogatja az energiatárólókat. Jogosultság: magyarországi lakhely, meglévő vagy tervezett napelemes rendszer.</p>
            </div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">⚙️</div>
            <div class="trust-content">
              <h4>Inverter Csere & Meglévő Rendszerek</h4>
              <p>Ha már van napeleme, az akkumulátor és az inverter csere is támogatott. Meglévő rendszerek is jelentkezhetnek.</p>
            </div>
          </div>
          <div class="trust-item">
            <div class="trust-icon">👨‍💼</div>
            <div class="trust-content">
              <h4>Szatmári Szakembercím</h4>
              <p>Helyi csapat, helyi tudás. Mi tudjuk, milyen a szatmári tetők, időjárás és áramszolgáltatás. Ingyenes konzultáció.</p>
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
                <p>Meglátogatunk Önt, felmérjük a lehetőségeket. Kötelezettségmentes.</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">2</div>
              <div class="step-content">
                <h4>Ajánlat & Pályázat</h4>
                <p>Részletes ajánlatot és pályázati tervet készítünk.</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">3</div>
              <div class="step-content">
                <h4>Ügyintézés</h4>
                <p>Összes engedély, bejelentés, papírmunka – mi gondoskodunk.</p>
              </div>
            </div>
            <div class="process-step">
              <div class="step-number">4</div>
              <div class="step-content">
                <h4>Telepítés & Üzembe</h4>
                <p>Profi csapat telepíti a rendszert. Használatbavételig mi vezetünk.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- MIT TARTALMAZ -->
        <div class="includes-section">
          <h2 class="section-heading">Mit tartalmaz a teljes körű ügyintézés?</h2>
          <div class="includes-grid">
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Ingyenes helyszíni felmérés</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Részletes ajánlat</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Pályázatírás és bejelentkezés</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Összes szükséges engedély</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Professzionális telepítés</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Bejelentés az áramszolgáltatónál</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Üzembe helyezés és oktatás</strong>
            </div>
            <div class="include-item">
              <span class="include-check">✓</span>
              <strong>Garancia és szavatosság</strong>
            </div>
          </div>
        </div>

        <!-- GYIK SZEKCIÓ -->
        <div class="faq-section">
          <h2 class="section-heading">Gyakran feltett kérdések</h2>

          <div class="faq-list">
            <details class="faq-item" :ref="(el) => (faqRefs[0] = el)" @toggle="handleFaqToggle(0)">
              <summary class="faq-question">
                <span class="faq-title">💰 Mi az OETP (Otthoni Energiatárolás Program)?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Az OETP egy új állami pályázati program, amely 100 milliárd forintot csoportosít az energiatárolók beszerzésére. Azok a háztartások jogosultak, amelyek magyarországi lakhellyel rendelkeznek, és rendelkeznek napelemes rendszerrel, vagy vállalják annak telepítését. Pontos feltételekről és lehetőségeiről személyesen konzultálunk.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[1] = el)" @toggle="handleFaqToggle(1)">
              <summary class="faq-question">
                <span class="faq-title">⏱️ Megtérül-e a napelemes rendszer?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Igen, de az pontos megtérülési idő az Ön konkrét helyzetétől függ – tetőmé, fogyasztás, áramár. Ezért szükséges a részletes felmérés. Sok háztartás kedvezően jár, különösen az akkumulátoros programmal.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[2] = el)" @toggle="handleFaqToggle(2)">
              <summary class="faq-question">
                <span class="faq-title">🏡 Jogosult vagyok-e az állami támogatásra?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Az ingatlannak Magyarországon kell lennie, és lakóingatlannak kell lennie. Vannak egyéb feltételek is, melyeket a felmérés során tisztázunk. Javasolt, hogy hívjon bennünket vagy töltse ki az űrlapot – akkor pontosan tudunk segíteni.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[3] = el)" @toggle="handleFaqToggle(3)">
              <summary class="faq-question">
                <span class="faq-title">💡 Mennyi áramot spórolhatok meg?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Ez szigorúan az Ön helyzetétől függ. Ahhoz, hogy pontos becslést adjunk, szükséges a helyszíni felmérés, a tetőméret, a jelenlegi fogyasztás és az éghajlat elemzése. Egyedi ajánlatot készítünk – ezt követően sok ügyfél meglepődik az eredményen.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[4] = el)" @toggle="handleFaqToggle(4)">
              <summary class="faq-question">
                <span class="faq-title">🔨 Mennyi idő alatt telepítik a rendszert?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">A felmérésből az üzembe helyezésig általában néhány hét szükséges – ennek függőséget sok tényezőtől. A tényleges fizikai telepítés viszonylag gyors. Pontos ütemezésről az első konzultáció során beszélünk.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[5] = el)" @toggle="handleFaqToggle(5)">
              <summary class="faq-question">
                <span class="faq-title">📋 Ki intézi az összes papírmunkát?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Mi gondoskodunk az összes szükséges engedélyről: önkormányzat, áramszolgáltató, hatósági előírások. Önnek csak annyi a feladata, hogy aláírja a szükséges dokumentumokat. A bonyolult részek a mi feladatunk.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[6] = el)" @toggle="handleFaqToggle(6)">
              <summary class="faq-question">
                <span class="faq-title">🔧 Karbantartás szükséges?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">A napelemes panelek szinte karbantartásmentes. Az eső a legtöbb szennyeződést lemossa. Évente néha szép tiszta időben érdemes ellenőrizni. A részletekről majd oktatunk, amikor üzembe helyezzük a rendszert.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[7] = el)" @toggle="handleFaqToggle(7)">
              <summary class="faq-question">
                <span class="faq-title">✅ Van garancia?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Igen, a modern napelemes rendszerek szavatossággal és garanciával járnak. A részletekről majd az ajánlatunkban írunk – mindent beépítünk az ügyintézésbe.</p>
              </div>
            </details>

            <details class="faq-item" :ref="(el) => (faqRefs[8] = el)" @toggle="handleFaqToggle(8)">
              <summary class="faq-question">
                <span class="faq-title">? Mikor lehet pályázni ?</span>
                <span class="faq-icon" aria-hidden="true"></span>
              </summary>
              <div class="faq-answer">
                <p class="faq-text">Az OETP pályázatnak több ütemezése van. A legjobb, ha minél előbb felveszi velünk a kapcsolatot – mi tudjuk, mely határidők aktívak, és hogyan lehet optimálisan jelentkezni.</p>
              </div>
            </details>
          </div>
        </div>

        <!-- ZÁRÓ CTA SECTION -->
        <div class="closing-cta-section">
          <h2 class="section-heading">Az Energiatárolás éve</h2>
          <p class="closing-message">
            Az <strong>Otthoni Energiatárolás Program</strong> most valóban elérhető. Azok a háztartások, amelyek napelemes rendszerrel rendelkeznek (vagy azt tervezik), most az energiatárolást is támogatottabbá tudják finanszírozni.
            <br><br>
            <i><strong>Ne maradjon le!</strong> Az időzítés fontos. Hívjon minket vagy töltse ki az űrlapot – beszéljük meg, hogyan jár jól az Ön helyzete.</i>
          </p>
        </div>

        <!-- CONTACT METHOD CHOICE -->
        <div class="contact-choice">
          <p class="choice-intro">Válasszon: Hívjon minket vagy töltse ki az űrlapot!</p>
          <div class="choice-buttons">
            <button class="choice-btn choice-btn--phone" :class="{ active: contactMethod === 'phone' }" @click="contactMethod = 'phone'">
              <span class="choice-icon">☎️</span>
              <span class="choice-text">Hívjon minket most!</span>
            </button>
            <button class="choice-btn choice-btn--form" :class="{ active: contactMethod === 'form' }" @click="contactMethod = 'form'">
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
            <p class="phone-card-subtitle">Beszéljen közvetlenül szakemberrel</p>
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
              <div class="benefit">✓ Pályázati kérdések</div>
            </div>
          </div>
        </div>

        <!-- FORM -->
        <div v-if="contactMethod === 'form'" class="contact-section">
          <form class="appointment-form" @submit="submitForm">
            <div class="form-section">
              <h3 class="section-title">Milyen napelemes rendszerre van szüksége?</h3>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Rendszer típusa *</label>
                <select v-model="formData.serviceType" required class="form-select" :disabled="isSubmitting">
                  <option value="">Válasszon rendszert...</option>
                  <option value="hazasitalis">Háztartási napelemes rendszer</option>
                  <option value="nagyobb">Nagyobb teljesítményű rendszer (10+ kW)</option>
                  <option value="gazdasagi">Gazdasági épületre telepítés</option>
                  <option value="korszerusites">Meglévő rendszer korszerűsítése</option>
                  <option value="pelus">Napelem + Pellet/Hőszivattyú</option>
                  <option value="energiatarolas">Energiatárolás (Akkumulátor)</option>
                  <option value="hibaelhárítás">Meglévő rendszer hibáje</option>
                  <option value="egyéb">Egyéb napelemes megoldás</option>
                </select>
              </div>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Tetőtípus *</label>
                <select v-model="formData.roofType" required class="form-select" :disabled="isSubmitting">
                  <option value="">Válasszon tetőtípust...</option>
                  <option value="tégla">Cseréptetős</option>
                  <option value="lemez">Lemeztetős</option>
                  <option value="lapos">Lapos tető</option>
                  <option value="egyéb">Egyéb</option>
                </select>
              </div>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Mikor szeretné a felmérést? *</label>
                <select v-model="formData.urgency" required class="form-select" :disabled="isSubmitting">
                  <option value="">Válasszon időpontot...</option>
                  <option value="sürgős">Minél hamarabb</option>
                  <option value="normál">Normál időtartam</option>
                  <option value="tervezett">Tervezett</option>
                </select>
              </div>
            </div>
      
            <div class="form-section">
              <h3 class="section-title">Személyes adatok</h3>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Név *</label>
                <input type="text" v-model="formData.name" required class="form-input" placeholder="Teljes név" :disabled="isSubmitting" />
              </div>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Email cím *</label>
                <input type="email" v-model="formData.email" required class="form-input" placeholder="Az árajánlatot ide küldjük" :disabled="isSubmitting" />
              </div>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Telefonszám *</label>
                <input type="tel" v-model="formData.phone" required class="form-input" placeholder="Gyors egyeztetéshez" :disabled="isSubmitting" />
              </div>
      
              <div class="form-group">
                <label class="supage-content__ul__li__strong">Cím / Helyszín *</label>
                <input type="text" v-model="formData.address" required class="form-input" placeholder="Szatmár - A felmérés helyszíne" :disabled="isSubmitting" />
              </div>
            </div>
      
            <div class="form-section">
              <h3 class="section-title">Megjegyzés (Opcionális)</h3>
              <div class="form-group">
                <label class="supage-content__ul__li__strong">További információ</label>
                <textarea v-model="formData.message" class="form-textarea" placeholder="Írja le az igényeit, kérdéseit..." rows="4" :disabled="isSubmitting"></textarea>
              </div>
            </div>
      
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span class="btn-text" v-if="!isSubmitting">Árajánlatkérés elküldése</span>
              <span class="btn-text" v-else>Küldés...</span>
            </button>
      
            <p class="privacy-text">
              <i class="supage-content__p__i">
                Az űrlap elküldésével automatikusan elfogadja az
                <NuxtLink class="supage-content__nlink" to="/adatvedelmi-tajekoztato">Adatvédelmi Szabályzatot.</NuxtLink>
              </i>
            </p>
          </form>
      
          <div v-if="submitMessage" class="submit-message" :class="{ success: submitMessage.includes('✅'), error: submitMessage.includes('❌') }">
            {{ submitMessage }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Header és footer elrejtése */
header, footer, .header, .footer, nav, .navbar, .site-header, .site-footer {
  display: none !important;
}

body > header, body > footer {
  display: none !important;
}

.subpage-content {
  padding: 3em;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  background-color: #f2f2f2;
}

/* ========== HERO BANNER ========== */
.trust-banner {
  position: relative;
  border-radius: 15px;
  margin-bottom: 40px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(19, 52, 117, 0.25);
}

.trust-banner--with-image {
  background: #fff;
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
  background: linear-gradient(180deg, #0d7b2d 0%, #055520 100%);
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

/* ========== 3 KIEMELT ÉRVELÉS ========== */
.benefits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 25px;
  margin: 45px 0 50px 0;
  padding: 0;
}

.benefit-card {
  background: #fff;
  padding: 28px;
  border-radius: 10px;
  border-left: 6px solid #0d7b2d;
  box-shadow: 0 4px 15px rgba(13, 123, 45, 0.08);
  transition: all 0.3s ease;
}

.benefit-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(13, 123, 45, 0.15);
  background: #f9faf9;
}

.benefit-card h3 {
  color: #0d7b2d;
  font-size: 1.15rem;
  margin-bottom: 15px;
  font-weight: 700;
  line-height: 1.3;
}

.benefit-card p {
  color: #333;
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.benefit-card strong {
  color: #000;
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
  background: #fff;
  padding: 25px;
  border-radius: 10px;
  border-left: 5px solid #0d7b2d;
  box-shadow: 0 3px 12px rgba(13, 123, 45, 0.08);
  display: flex;
  gap: 15px;
}

.trust-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.trust-content h4 {
  color: #0d7b2d;
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 8px 0;
}

.trust-content p {
  color: #666;
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
  background: #fff;
  padding: 25px;
  border-radius: 10px;
  border-top: 5px solid #0d7b2d;
  box-shadow: 0 3px 12px rgba(13, 123, 45, 0.08);
  text-align: center;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: #0d7b2d;
  color: #fff;
  border-radius: 50%;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 15px;
}

.process-step h4 {
  color: #0d7b2d;
  font-size: 1.05rem;
  font-weight: 700;
  margin: 0 0 10px 0;
}

.process-step p {
  color: #666;
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
  background: #fff;
  padding: 18px;
  border-radius: 8px;
  border-left: 4px solid #0d7b2d;
  box-shadow: 0 2px 8px rgba(13, 123, 45, 0.05);
  display: flex;
  gap: 12px;
  font-size: 0.95rem;
}

.include-check {
  color: #0d7b2d;
  font-weight: 700;
  flex-shrink: 0;
}

/* ========== SECTION HEADING ========== */
.section-heading {
  color: #0d7b2d;
  font-size: 2rem;
  font-weight: bold;
  margin: 1.5em 0 1.5em 0;
  text-align: center;
}

/* ========== CLOSING CTA SECTION ========== */
.closing-cta-section {
  background: linear-gradient(135deg, #0d7b2d 0%, #055520 100%);
  color: #fff;
  padding: 40px 30px;
  border-radius: 15px;
  text-align: center;
  margin: 3em 0;
  box-shadow: 0 10px 30px rgba(13, 123, 45, 0.2);
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
  background: #fff;
  padding: 40px 30px;
  border-radius: 15px;
  text-align: center;
  margin: 2.5em auto;
  max-width: 900px;
  box-shadow: 0 5px 20px rgba(13, 123, 45, 0.1);
  border: 2px solid #e0e0e0;
}

.choice-intro {
  color: #0d7b2d;
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
  border: 3px solid #ddd;
  background: #fff;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
}

.choice-btn:hover {
  border-color: #0d7b2d;
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(13, 123, 45, 0.15);
}

.choice-btn.active {
  background: linear-gradient(135deg, #0d7b2d 0%, #055520 100%);
  color: #fff;
  border-color: #0d7b2d;
  box-shadow: 0 8px 25px rgba(13, 123, 45, 0.25);
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
  background: linear-gradient(135deg, #0d7b2d 0%, #055520 100%);
  padding: 45px 35px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(13, 123, 45, 0.2);
  color: #fff;
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
  background: #fff;
  color: #0d7b2d;
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
  background: #fff;
  padding: 28px;
  margin: 2.5em 0;
  border-radius: 12px;
  box-shadow: 0 3px 12px rgba(13, 123, 45, 0.08);
  border-left: 5px solid #0d7b2d;
}

.section-title {
  color: #0d7b2d;
  font-size: 1.35rem;
  margin-bottom: 25px;
  border-bottom: 3px solid #0d7b2d;
  padding-bottom: 12px;
  font-weight: 700;
}

.form-group {
  margin-bottom: 22px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 600;
  font-size: 0.95rem;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 13px 15px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  transition: all 0.3s;
  background-color: #fff;
  color: #333;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #999;
}

.form-select {
  width: 100%;
  padding: 13px 16px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 15px;
  font-family: inherit;
  background-color: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
  color: #333;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230d7b2d' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
  padding-right: 45px;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #0d7b2d;
  outline: none;
  box-shadow: 0 0 0 4px rgba(13, 123, 45, 0.1);
}

.form-select:focus {
  border-color: #0d7b2d;
  outline: none;
  box-shadow: 0 0 0 4px rgba(13, 123, 45, 0.1);
}

.form-select:hover:not(:disabled) {
  border-color: #0d7b2d;
  background-color: #fefefe;
}

.form-input:disabled,
.form-textarea:disabled,
.form-select:disabled {
  background-color: #f0f0f0;
  opacity: 0.65;
  cursor: not-allowed;
}

/* ========== SUBMIT BUTTON ========== */
.submit-btn {
  background: linear-gradient(135deg, #0d7b2d 0%, #055520 100%);
  color: #fff;
  border: none;
  padding: 18px 45px;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(13, 123, 45, 0.3);
  margin-top: 15px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(13, 123, 45, 0.4);
  background: linear-gradient(135deg, #055520 0%, #0d7b2d 100%);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(-1px);
}

.submit-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.btn-text {
  font-size: 1.05rem;
  letter-spacing: 0.5px;
}

/* ========== PRIVACY TEXT ========== */
.privacy-text {
  color: #666;
  font-size: 0.85rem;
  margin-top: 15px;
  text-align: center;
}

.privacy-text a {
  color: #0d7b2d;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s;
}

.privacy-text a:hover {
  color: #055520;
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
  background: #fff;
  border-radius: 10px;
  border-left: 5px solid #0d7b2d;
  box-shadow: 0 3px 12px rgba(13, 123, 45, 0.08);
  transition: all 0.25s ease;
  overflow: hidden;
  width: 100%;
}

.faq-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(13, 123, 45, 0.12);
  background: #f9faf9;
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
  color: #0d7b2d;
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
  background: #0d7b2d;
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
  border-bottom: 1px solid rgba(13, 123, 45, 0.12);
}

.faq-answer {
  padding: 17px 22px 18px 22px;
}

.faq-text {
  color: #333;
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