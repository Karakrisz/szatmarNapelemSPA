<script setup>
import {
  useKivitelezesek,
  CHECKLIST,
  STATUSES,
  computeStatus,
  nextStep,
  formatMoney,
  formatDate,
  priceNet,
  priceGross,
  hasOfferPrice,
  contractMissing,
  offerMissing,
  pdfBlobUrl,
} from '~/composables/useKivitelezesek'

useHead({
  title: 'Kivitelezések | Szatmár Solar',
  meta: [
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'theme-color', content: '#155b9b' },
  ],
})

const kiv = useKivitelezesek()
const { auth, data } = kiv

// ---------- Állapot ----------
const ready = ref(false) // kliens oldalon betöltve
const loading = ref(false)
const error = ref('')
const toast = ref('')
let toastTimer

function showToast(msg) {
  toast.value = msg
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => (toast.value = ''), 2600)
}

// ---------- Belépés ----------
const loginPin = ref('')
const loginUser = ref('')
const loginError = ref('')

async function login() {
  loginError.value = ''
  if (!loginUser.value.trim()) return (loginError.value = 'Kérlek add meg a neved.')
  loading.value = true
  try {
    const res = await kiv.call('ping', { user: loginUser.value.trim() }, loginPin.value.trim())
    kiv.saveAuth(loginPin.value.trim(), res.user)
    await load()
  } catch (e) {
    loginError.value = e.message
  } finally {
    loading.value = false
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await kiv.bootstrap()
    applyHash()
  } catch (e) {
    if (e.code === 'PIN') kiv.logout()
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  ready.value = true
  window.addEventListener('hashchange', applyHash)
  if (kiv.loadAuth()) load()
})
onBeforeUnmount(() => window.removeEventListener('hashchange', applyHash))

// ---------- Navigáció (#id = megnyitott projekt, #uj = új, #szolg = éves szolgáltatások) ----------
const tab = ref('projects')
const openId = ref(null) // projekt id | 'new' | null
const form = ref(null)
const original = ref('')

function applyHash() {
  const h = decodeURIComponent(location.hash.replace('#', ''))
  if (h === 'szolg') {
    tab.value = 'services'
    openId.value = null
  } else if (h === 'uj') {
    tab.value = 'projects'
    startEdit(null)
  } else if (h && data.value.projects.some((p) => p.id === h)) {
    tab.value = 'projects'
    startEdit(h)
  } else {
    openId.value = null
    form.value = null
    tab.value = 'projects'
  }
}

function go(hash) {
  if (dirty.value && !confirm('Van nem mentett módosítás. Biztosan kilépsz?')) return
  original.value = JSON.stringify(form.value) // ne kérdezzen rá újra
  if (hash) {
    location.hash = hash
  } else {
    history.pushState('', document.title, location.pathname + location.search)
    applyHash()
  }
  window.scrollTo(0, 0)
}

function startEdit(id) {
  if (id) {
    const p = data.value.projects.find((x) => x.id === id)
    form.value = JSON.parse(JSON.stringify(p))
  } else {
    form.value = {
      ugyfel_nev: '',
      cim: '',
      telefon: '',
      email: '',
      ertekesito: auth.value.user,
      ajanlat_szam: '',
      ugyfel_tipus: 'Magánszemély',
      fizetes_modja: 'Átutalás',
      finanszirozas: 'Önerő',
      projekt_tipus: 'Új napelemes rendszer',
      uzemmod: '',
      szerzodes: false,
      megjegyzes: '',
    }
  }
  openId.value = id || 'new'
  original.value = JSON.stringify(form.value)
  sections.value = id ? { ugyfel: true, kivitelezes: true } : { ugyfel: true, ajanlat: true, rendszer: true, penz: true }
}

// Előzmények (Napló lap): megnyitáskor és mentés után töltjük be
const historyItems = ref([])
const historyLoading = ref(false)
async function loadHistory() {
  if (!form.value || !form.value.id) return (historyItems.value = [])
  historyLoading.value = true
  try {
    historyItems.value = (await kiv.call('history', { projectId: form.value.id })).items
  } catch (e) {
    historyItems.value = []
  } finally {
    historyLoading.value = false
  }
}
watch(openId, () => {
  historyItems.value = []
  if (sections.value.elozmeny) loadHistory()
})
function toggleHistory() {
  toggleSection('elozmeny')
  if (sections.value.elozmeny) loadHistory()
}

const dirty = computed(() => form.value && JSON.stringify(form.value) !== original.value)
const isNew = computed(() => openId.value === 'new')

// ---------- Lista ----------
const search = ref('')
const statusFilter = ref('aktiv')

const STATUS_ORDER = STATUSES.map((s) => s.key)
const statusColor = (s) => (STATUSES.find((x) => x.key === s) || {}).color || '#6b7280'

const counts = computed(() => {
  const c = { aktiv: 0, mind: data.value.projects.length }
  STATUSES.forEach((s) => (c[s.key] = 0))
  data.value.projects.forEach((p) => {
    c[p.allapot] = (c[p.allapot] || 0) + 1
    if (p.allapot !== 'Lezárva' && p.allapot !== 'Visszamondva') c.aktiv++
  })
  return c
})

const normalize = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

const filtered = computed(() => {
  const q = normalize(search.value)
  return data.value.projects
    .filter((p) => {
      if (statusFilter.value === 'aktiv' && (p.allapot === 'Lezárva' || p.allapot === 'Visszamondva')) return false
      if (statusFilter.value !== 'aktiv' && statusFilter.value !== 'mind' && p.allapot !== statusFilter.value)
        return false
      if (!q) return true
      return normalize([p.ugyfel_nev, p.cim, p.telefon, p.ajanlat_szam, p.email, p.ertekesito].join(' ')).includes(q)
    })
    .sort((a, b) => {
      const s = STATUS_ORDER.indexOf(a.allapot) - STATUS_ORDER.indexOf(b.allapot)
      if (s) return s
      // dátum szerint: a legközelebbi elöl, dátum nélküliek a végén
      const da = a.kivitelezes_datum || '9999'
      const db = b.kivitelezes_datum || '9999'
      return da.localeCompare(db) || String(b.letrehozva).localeCompare(String(a.letrehozva))
    })
})

const today = new Date().toISOString().slice(0, 10)
const overdue = (p) => !p.lemondva && !p.kivitelezve && p.kivitelezes_datum && p.kivitelezes_datum < today
const doneCount = (p) => CHECKLIST.filter((c) => p[c.key]).length

// ---------- Űrlap segédek ----------
const sections = ref({})
const toggleSection = (k) => (sections.value = { ...sections.value, [k]: !sections.value[k] })

const lists = computed(() => data.value.lists || {})
const uniqueValues = (key) =>
  [...new Set(data.value.projects.map((p) => String(p[key] || '').trim()).filter(Boolean))].sort()
const suggestions = computed(() => ({
  napelem: uniqueValues('napelem'),
  inverter: uniqueValues('inverter'),
  energiatarolo: uniqueValues('energiatarolo'),
  ertekesito: [...new Set([...(lists.value['Értékesítő'] || []), ...uniqueValues('ertekesito')])],
  termek: [...new Set(data.value.materials.map((m) => m.termek).filter(Boolean))].sort(),
  beszallito: [...new Set(data.value.materials.map((m) => m.beszallito).filter(Boolean))].sort(),
}))

// Bruttó megadásakor a nettó és az áfa magától számolódik (27%)
function onBrutto(v) {
  form.value.brutto = v
  if (typeof v === 'number') {
    form.value.netto = Math.round(v / 1.27)
    form.value.afa = v - form.value.netto
  }
}

const liveStatus = computed(() => (form.value ? computeStatus(form.value) : ''))

const saving = ref(false)
async function save() {
  if (!form.value.ugyfel_nev.trim()) {
    sections.value = { ...sections.value, ugyfel: true }
    return showToast('Az ügyfél neve kötelező')
  }
  saving.value = true
  try {
    const saved = await kiv.saveProject(form.value)
    form.value = JSON.parse(JSON.stringify(saved))
    original.value = JSON.stringify(form.value)
    showToast(isNew.value ? 'Ügyfél rögzítve ✓ Most add hozzá a tételeket.' : 'Mentve ✓')
    if (isNew.value) {
      openId.value = saved.id
      history.replaceState('', document.title, '#' + saved.id)
      sections.value = { ugyfel: false, anyag: true }
    }
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    saving.value = false
  }
}

const mapsLink = (cim) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(cim)
const telLink = (t) => 'tel:' + String(t).split('|')[0].replace(/[^\d+]/g, '').replace(/^(?=[1-9])/, '+36')

// ---------- Anyagok ----------
const projectMaterials = computed(() =>
  form.value && form.value.id ? data.value.materials.filter((m) => m.projekt_id === form.value.id) : [],
)
const sumOf = (list, fn) => list.reduce((s, m) => s + (isNaN(fn(m)) ? 0 : fn(m)), 0)
const materialTotals = computed(() => {
  const l = projectMaterials.value
  const listNetto = sumOf(l, (m) => priceNet(m.ajanlat_netto, m.ajanlat_brutto))
  const listBrutto = sumOf(l, (m) => priceGross(m.ajanlat_netto, m.ajanlat_brutto))
  const pct = Math.max(0, Math.min(100, Number(form.value && form.value.kedvezmeny) || 0))
  const netto = listNetto - Math.round((listNetto * pct) / 100)
  const brutto = listBrutto - Math.round((listBrutto * pct) / 100)
  const koltseg = sumOf(l, (m) => priceNet(m.beszerzes_netto, m.beszerzes_brutto))
  const haszon = netto - koltseg
  return { pct, listBrutto, netto, brutto, koltseg, haszon, szazalek: netto ? Math.round((haszon / netto) * 100) : 0 }
})
// a projekt végösszege eltér a tételek összegétől?
const totalMismatch = computed(() => {
  const t = materialTotals.value.brutto
  if (!t || !form.value) return false
  return typeof form.value.brutto !== 'number' || Math.abs(form.value.brutto - t) > 1
})
function takeItemTotal() {
  const t = materialTotals.value
  form.value.brutto = t.brutto
  form.value.netto = t.netto
  form.value.afa = t.brutto - t.netto
}
const fmtNum = (n) => (isNaN(n) ? '' : formatMoney(n))

const matForm = ref(null)
function editMaterial(m) {
  matForm.value = m
    ? { ...m }
    : { projekt_id: form.value.id, ugyfel_nev: form.value.ugyfel_nev, termek: '', db: '1 db' }
}
function fillPair(from, to, factor) {
  const v = matForm.value[from]
  if (typeof v === 'number' && (matForm.value[to] === '' || matForm.value[to] === undefined))
    matForm.value[to] = Math.round(v * factor)
}
// Ha ugyanezt a terméket már rögzítették, felajánljuk a legutóbbi árait
function prefillFromPrevious() {
  const m = matForm.value
  if (m.id || !m.termek.trim()) return
  const empty = ['ajanlat_netto', 'ajanlat_brutto', 'beszerzes_netto', 'beszerzes_brutto'].every((k) => m[k] === '' || m[k] === undefined)
  if (!empty) return
  const key = m.termek.trim().toLowerCase()
  const prev = [...data.value.materials].reverse().find((x) => String(x.termek).trim().toLowerCase() === key)
  if (!prev) return
  ;['ajanlat_netto', 'ajanlat_brutto', 'beszerzes_netto', 'beszerzes_brutto', 'beszallito'].forEach((k) => (m[k] = prev[k]))
  showToast('Árak az előző ilyen tételből – ellenőrizd')
}
async function saveMaterial() {
  if (!matForm.value.termek.trim()) return showToast('A termék megnevezése kötelező')
  saving.value = true
  try {
    await kiv.saveMaterial(matForm.value)
    matForm.value = null
    showToast('Anyag mentve ✓')
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    saving.value = false
  }
}
async function removeMaterial() {
  if (!confirm('Biztosan törlöd ezt a tételt?')) return
  saving.value = true
  try {
    await kiv.deleteMaterial(matForm.value.id)
    matForm.value = null
    showToast('Törölve')
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    saving.value = false
  }
}

// ---------- Árajánlat ----------
const missingForOffer = computed(() => (form.value ? offerMissing(form.value, projectMaterials.value) : []))
const offerBusy = ref('')
const offerUrl = ref('')
const offerMail = ref(null)
watch(openId, () => {
  if (offerUrl.value) URL.revokeObjectURL(offerUrl.value)
  offerUrl.value = ''
  offerMail.value = null
})

async function makeOffer() {
  offerBusy.value = 'create'
  try {
    const res = await kiv.createOffer(form.value.id)
    form.value = JSON.parse(JSON.stringify(res.item))
    original.value = JSON.stringify(form.value)
    if (offerUrl.value) URL.revokeObjectURL(offerUrl.value)
    offerUrl.value = pdfBlobUrl(res.pdf)
    offerMail.value = { subject: res.subject, text: res.emailText }
    showToast('Árajánlat elkészült ✓ Nézd át, mielőtt elküldöd.')
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    offerBusy.value = ''
  }
}

async function openOffer() {
  if (offerUrl.value) return window.open(offerUrl.value, '_blank')
  const w = window.open('', '_blank')
  offerBusy.value = 'open'
  try {
    const res = await kiv.offerPdf(form.value.id)
    offerUrl.value = pdfBlobUrl(res.pdf)
    if (w) w.location.href = offerUrl.value
    else window.location.href = offerUrl.value
  } catch (e) {
    if (w) w.close()
    showToast('Hiba: ' + e.message)
  } finally {
    offerBusy.value = ''
  }
}

async function sendOffer() {
  if (!confirm('Elküldöd az árajánlatot az ügyfélnek?\n' + form.value.email)) return
  offerBusy.value = 'send'
  try {
    const item = await kiv.sendOffer(form.value.id)
    form.value = JSON.parse(JSON.stringify(item))
    original.value = JSON.stringify(form.value)
    showToast('Árajánlat elküldve ✓')
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    offerBusy.value = ''
  }
}

// ---------- Szerződés ----------
const isCeg = computed(() => form.value && form.value.ugyfel_tipus === 'Cég')
const missingForContract = computed(() => (form.value ? contractMissing(form.value, projectMaterials.value) : []))
const contractBusy = ref('')
const pdfUrl = ref('')
watch(openId, () => {
  if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
  pdfUrl.value = ''
})
const fmtDateTime = (v) => (v ? String(v).replace('T', ' ').replace(/-/g, '.') : '')

function sameAsSite() {
  form.value.lakcim = form.value.cim
}

async function makeContract() {
  contractBusy.value = 'create'
  try {
    const res = await kiv.createContract(form.value.id)
    form.value = JSON.parse(JSON.stringify(res.item))
    original.value = JSON.stringify(form.value)
    if (pdfUrl.value) URL.revokeObjectURL(pdfUrl.value)
    pdfUrl.value = pdfBlobUrl(res.pdf)
    showToast('Szerződés elkészült ✓ Nézd át, mielőtt elküldöd.')
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    contractBusy.value = ''
  }
}

// Az új lapot még a kattintáskor nyitjuk meg, különben a telefon böngészője letiltja
async function openPdf() {
  if (pdfUrl.value) return window.open(pdfUrl.value, '_blank')
  const w = window.open('', '_blank')
  contractBusy.value = 'open'
  try {
    const res = await kiv.contractPdf(form.value.id)
    pdfUrl.value = pdfBlobUrl(res.pdf)
    if (w) w.location.href = pdfUrl.value
    else window.location.href = pdfUrl.value
  } catch (e) {
    if (w) w.close()
    showToast('Hiba: ' + e.message)
  } finally {
    contractBusy.value = ''
  }
}

async function sendContract() {
  if (!confirm('Elküldöd a szerződést az ügyfélnek?\n' + form.value.email)) return
  contractBusy.value = 'send'
  try {
    const item = await kiv.sendContract(form.value.id)
    form.value = JSON.parse(JSON.stringify(item))
    original.value = JSON.stringify(form.value)
    showToast('Szerződés elküldve ✓')
    if (sections.value.elozmeny) loadHistory()
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    contractBusy.value = ''
  }
}

// ---------- Éves szolgáltatások ----------
const svcForm = ref(null)
const sortedServices = computed(() => [...data.value.services].sort((a, b) => String(a.ig).localeCompare(String(b.ig))))
const daysLeft = (d) => (d ? Math.ceil((new Date(d) - new Date()) / 86400000) : null)
async function saveService() {
  if (!svcForm.value.ugyfel_nev.trim()) return showToast('Az ügyfél neve kötelező')
  saving.value = true
  try {
    await kiv.saveService(svcForm.value)
    svcForm.value = null
    showToast('Mentve ✓')
  } catch (e) {
    showToast('Hiba: ' + e.message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="kiv">
    <!-- Betöltés előtt (szerver oldali render) semmit nem mutatunk -->
    <template v-if="ready">
      <!-- ===== BELÉPÉS ===== -->
      <div v-if="!auth.pin" class="login">
        <img src="/icon-192.png" alt="" class="login-logo" />
        <div class="login-title">Kivitelezések</div>
        <div class="login-sub">Szatmár Solar belső felület</div>
        <form class="card" @submit.prevent="login">
          <label class="field">
            <span>Neved</span>
            <input v-model="loginUser" autocomplete="name" placeholder="pl. Kiss Péter" />
          </label>
          <label class="field">
            <span>Személyes belépőkód</span>
            <input v-model="loginPin" type="password" autocomplete="current-password" />
          </label>
          <div v-if="loginError" class="err">{{ loginError }}</div>
          <button class="btn primary block" :disabled="loading">{{ loading ? 'Belépés…' : 'Belépés' }}</button>
        </form>
        <div class="hint">
          Ezen az eszközön megjegyezzük, legközelebb nem kell újra beírni.<br />
          Nincs még kódod? Kérj egyet az irodától.
        </div>
      </div>

      <!-- ===== BETÖLTÉS / HIBA ===== -->
      <div v-else-if="!data.loaded" class="center">
        <div v-if="loading" class="spinner" />
        <template v-else>
          <div class="err">{{ error || 'Nem sikerült betölteni.' }}</div>
          <button class="btn primary" @click="load">Újra</button>
          <button class="btn ghost" @click="kiv.logout()">Kilépés</button>
        </template>
      </div>

      <!-- ===== PROJEKT SZERKESZTÉS ===== -->
      <div v-else-if="openId && form" class="edit">
        <header class="topbar">
          <button class="icon-btn" aria-label="Vissza" @click="go('')">‹</button>
          <div class="topbar-title">
            <div class="t1">{{ isNew ? 'Új ügyfél' : form.ugyfel_nev }}</div>
            <div v-if="!isNew" class="t2">
              <span class="badge" :style="{ background: statusColor(liveStatus) }">{{ liveStatus }}</span>
              {{ form.ajanlat_szam }}
            </div>
          </div>
        </header>

        <div v-if="!isNew" class="quick">
          <a v-if="form.telefon" :href="telLink(form.telefon)" class="quick-btn">📞 Hívás</a>
          <a v-if="form.cim" :href="mapsLink(form.cim)" target="_blank" class="quick-btn">📍 Térkép</a>
          <a v-if="form.email" :href="'mailto:' + form.email" class="quick-btn">✉️ E-mail</a>
        </div>

        <!-- Teendők: a leggyakoribb művelet, ezért legfelül -->
        <section v-if="!isNew" class="card">
          <div class="sec-title">Teendők <small>{{ doneCount(form) }}/{{ CHECKLIST.length }}</small></div>
          <label v-for="c in CHECKLIST" :key="c.key" class="check" :class="{ on: form[c.key] }">
            <input v-model="form[c.key]" type="checkbox" />
            <span class="box">✓</span>
            <span>{{ c.label }}</span>
          </label>
        </section>

        <section class="card">
          <button class="sec-head" @click="toggleSection('ugyfel')">
            Ügyfél adatai <span>{{ sections.ugyfel ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.ugyfel" class="grid">
            <div class="field full">
              <div class="chips">
                <button
                  v-for="o in ['Magánszemély', 'Cég']"
                  :key="o"
                  type="button"
                  class="chip"
                  :class="{ on: (form.ugyfel_tipus || 'Magánszemély') === o }"
                  @click="form.ugyfel_tipus = o"
                >
                  {{ o }}
                </button>
              </div>
            </div>
            <label class="field full">
              <span>{{ isCeg ? 'Cégnév *' : 'Ügyfél neve *' }}</span>
              <input v-model="form.ugyfel_nev" autocomplete="off" />
            </label>
            <label class="field full">
              <span>Telepítési cím</span>
              <input v-model="form.cim" placeholder="irányítószám, település, utca, házszám" />
            </label>
            <label class="field">
              <span>Telefon</span>
              <input v-model="form.telefon" type="tel" inputmode="tel" />
            </label>
            <label class="field">
              <span>E-mail</span>
              <input v-model="form.email" type="email" inputmode="email" autocapitalize="off" />
            </label>
            <template v-if="isCeg">
              <label class="field full">
                <span>Székhely</span>
                <input v-model="form.lakcim" />
              </label>
              <label class="field">
                <span>Cégjegyzékszám</span>
                <input v-model="form.cegjegyzekszam" placeholder="00-00-000000" />
              </label>
              <label class="field">
                <span>Adószám</span>
                <input v-model="form.adoszam" placeholder="00000000-0-00" />
              </label>
              <label class="field full">
                <span>Cég képviselője</span>
                <input v-model="form.kepviselo" placeholder="név, beosztás" />
              </label>
            </template>
            <template v-else>
              <label class="field full">
                <span class="label-row">
                  Lakcím
                  <button v-if="form.cim && form.lakcim !== form.cim" type="button" class="link-btn" @click="sameAsSite">
                    = telepítési cím
                  </button>
                </span>
                <input v-model="form.lakcim" />
              </label>
              <label class="field">
                <span>Anyja neve</span>
                <input v-model="form.anyja_neve" />
              </label>
              <label class="field">
                <span>Születési hely, idő</span>
                <input v-model="form.szul_hely_ido" placeholder="pl. Szeged, 1975. 03. 12." />
              </label>
            </template>
            <label class="field full">
              <span>Kapcsolattartó (ha nem ő maga)</span>
              <input v-model="form.kapcsolattarto" :placeholder="form.ugyfel_nev" />
            </label>
          </div>
        </section>

        <section class="card">
          <button class="sec-head" @click="toggleSection('ajanlat')">
            Ajánlat és szerződés <span>{{ sections.ajanlat ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.ajanlat" class="grid">
            <label class="field">
              <span>Ajánlat száma</span>
              <input v-model="form.ajanlat_szam" />
            </label>
            <label class="field">
              <span>Értékesítő</span>
              <input v-model="form.ertekesito" list="dl-ertekesito" />
            </label>
            <label class="field">
              <span>Szerződés dátuma</span>
              <input v-model="form.szerzodes_datum" type="date" />
            </label>
            <div class="field">
              <span>Finanszírozás</span>
              <div class="chips">
                <button
                  v-for="o in lists['Finanszírozás'] || []"
                  :key="o"
                  type="button"
                  class="chip"
                  :class="{ on: form.finanszirozas === o }"
                  @click="form.finanszirozas = o"
                >
                  {{ o }}
                </button>
              </div>
            </div>
            <div class="field full">
              <span>Fizetés módja</span>
              <div class="chips">
                <button
                  v-for="o in lists['Fizetés módja'] || ['Átutalás', 'Készpénz']"
                  :key="o"
                  type="button"
                  class="chip"
                  :class="{ on: form.fizetes_modja === o }"
                  @click="form.fizetes_modja = o"
                >
                  {{ o }}
                </button>
              </div>
            </div>
            <label class="field full">
              <span>Projekt típusa</span>
              <select v-model="form.projekt_tipus">
                <option value="">– válassz –</option>
                <option v-for="o in lists['Projekt típusa'] || []" :key="o">{{ o }}</option>
                <option v-if="form.projekt_tipus && !(lists['Projekt típusa'] || []).includes(form.projekt_tipus)">
                  {{ form.projekt_tipus }}
                </option>
              </select>
            </label>
            <label class="field full">
              <span>Üzemmód</span>
              <select v-model="form.uzemmod">
                <option value="">– válassz –</option>
                <option v-for="o in lists['Üzemmód'] || []" :key="o">{{ o }}</option>
                <option v-if="form.uzemmod && !(lists['Üzemmód'] || []).includes(form.uzemmod)">
                  {{ form.uzemmod }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="card">
          <button class="sec-head" @click="toggleSection('rendszer')">
            Rendszer <span>{{ sections.rendszer ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.rendszer" class="grid">
            <label class="field full">
              <span>Napelem</span>
              <input v-model="form.napelem" list="dl-napelem" />
            </label>
            <label class="field">
              <span>Napelem darabszám</span>
              <input v-model="form.napelem_db" type="number" inputmode="numeric" />
            </label>
            <div class="field" />
            <label class="field full">
              <span>Inverter</span>
              <input v-model="form.inverter" list="dl-inverter" />
            </label>
            <label class="field full">
              <span>Inverter sorozatszáma</span>
              <input v-model="form.inverter_sn" autocapitalize="characters" />
            </label>
            <label class="field full">
              <span>Energiatároló</span>
              <input v-model="form.energiatarolo" list="dl-energiatarolo" placeholder="ha nincs, hagyd üresen" />
            </label>
            <label class="field full">
              <span>Akkumulátor sorozatszáma</span>
              <input v-model="form.akku_sn" autocapitalize="characters" />
            </label>
          </div>
        </section>

        <section class="card">
          <button class="sec-head" @click="toggleSection('penz')">
            Pénzügy
            <span class="sec-meta">{{ formatMoney(form.brutto) }} {{ sections.penz ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.penz" class="grid">
            <label class="field full">
              <span>Bruttó végösszeg</span>
              <KivMoneyInput :model-value="form.brutto" @update:model-value="onBrutto" />
            </label>
            <label class="field">
              <span>Nettó</span>
              <KivMoneyInput v-model="form.netto" />
            </label>
            <label class="field">
              <span>Áfa (27%)</span>
              <KivMoneyInput v-model="form.afa" />
            </label>
            <label class="field">
              <span>Fizetendő kiszállításkor</span>
              <KivMoneyInput v-model="form.reszlet_kiszallitas" />
            </label>
            <label class="field">
              <span>Fizetendő kivitelezéskor</span>
              <KivMoneyInput v-model="form.reszlet_kivitelezes" />
            </label>
            <label class="field">
              <span>Díjbekérő száma</span>
              <input v-model="form.dijbekero_szam" />
            </label>
            <label class="field">
              <span>Előlegszámla száma</span>
              <input v-model="form.eloleg_szamla" />
            </label>
            <label class="field">
              <span>Végszámla száma</span>
              <input v-model="form.vegszamla" />
            </label>
          </div>
        </section>

        <section class="card">
          <button class="sec-head" @click="toggleSection('kivitelezes')">
            Kivitelezés <span>{{ sections.kivitelezes ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.kivitelezes" class="grid">
            <label class="field">
              <span>Kivitelezés dátuma</span>
              <input v-model="form.kivitelezes_datum" type="date" />
            </label>
            <label class="field">
              <span>Készre jelentés határideje</span>
              <input v-model="form.keszre_jelentes" type="date" />
            </label>
            <label class="field full">
              <span>Áramszolgáltatói ügyintézés</span>
              <textarea v-model="form.aramszolg_ugyintezes" rows="2" placeholder="ki intézi, hol tart" />
            </label>
            <label v-if="!isNew" class="check danger full" :class="{ on: form.lemondva }">
              <input v-model="form.lemondva" type="checkbox" />
              <span class="box">✓</span>
              <span>Az ügyfél visszamondta</span>
            </label>
          </div>
        </section>

        <section v-if="!isNew" class="card">
          <button class="sec-head" @click="toggleSection('anyag')">
            Tételek és költségek
            <span class="sec-meta">{{ projectMaterials.length }} tétel {{ sections.anyag ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.anyag">
            <button v-for="m in projectMaterials" :key="m.id" class="mat" @click="editMaterial(m)">
              <div class="mat-name">
                {{ m.termek }}
                <span v-if="!hasOfferPrice(m)" class="tag">belső költség</span>
              </div>
              <div class="mat-meta">
                {{ m.db }}
                <template v-if="hasOfferPrice(m)"> · ügyfélnek {{ fmtNum(priceGross(m.ajanlat_netto, m.ajanlat_brutto)) }}</template>
                <template v-if="!isNaN(priceNet(m.beszerzes_netto, m.beszerzes_brutto))">
                  · költség {{ fmtNum(priceNet(m.beszerzes_netto, m.beszerzes_brutto)) }} + áfa
                </template>
                <template v-if="m.beszallito"> · {{ m.beszallito }}</template>
              </div>
            </button>
            <div v-if="projectMaterials.length" class="totals">
              <div v-if="materialTotals.pct">
                <span>Listaár (bruttó)</span>{{ formatMoney(materialTotals.listBrutto) }}
              </div>
              <div v-if="materialTotals.pct">
                <span>Kedvezmény ({{ materialTotals.pct }}%)</span>−{{ formatMoney(materialTotals.listBrutto - materialTotals.brutto) }}
              </div>
              <div><span>Ügyfélnek nettó</span>{{ formatMoney(materialTotals.netto) }}</div>
              <div><span>Ügyfélnek bruttó</span>{{ formatMoney(materialTotals.brutto) }}</div>
              <div><span>Beszerzési költség (nettó)</span>{{ formatMoney(materialTotals.koltseg) }}</div>
              <div class="strong" :class="{ neg: materialTotals.haszon < 0 }">
                <span>Haszon (nettó)</span>{{ formatMoney(materialTotals.haszon) }} · {{ materialTotals.szazalek }}%
              </div>
            </div>
            <div v-if="totalMismatch" class="warn-box">
              <template v-if="typeof form.brutto === 'number'">
                A végösszeg ({{ formatMoney(form.brutto) }}) eltér a tételek összegétől ({{ formatMoney(materialTotals.brutto) }}).
              </template>
              <template v-else>A végösszeg még nincs kitöltve.</template>
              <button type="button" class="link-btn" @click="takeItemTotal">Végösszeg = tételek összege</button>
            </div>
            <button class="btn ghost block" @click="editMaterial(null)">+ Tétel hozzáadása</button>
            <div class="hint-s">Ajánlati ár nélküli tétel (pl. munkabér, szállítás) belső költség: nem kerül az ajánlatba és a szerződésbe.</div>
          </div>
        </section>

        <section v-if="!isNew" class="card">
          <div class="sec-title">Árajánlat</div>
          <div class="grid offer-grid">
            <label class="field">
              <span>Kedvezmény (%)</span>
              <input v-model.number="form.kedvezmeny" type="number" inputmode="decimal" min="0" max="100" placeholder="nincs" />
            </label>
            <div class="field" />
            <label class="field full">
              <span>Személyes első mondat (nem kötelező)</span>
              <textarea
                v-model="form.ajanlat_bevezeto"
                rows="2"
                placeholder="pl. Örülök, hogy telefonon is át tudtuk beszélni, pontosan mire van szüksége."
              />
            </label>
          </div>
          <div v-if="missingForOffer.length" class="warn-box">
            Hiányzik még: <b>{{ missingForOffer.join(', ') }}</b>
          </div>
          <div v-if="form.ajanlat_keszult" class="contract-status">
            <div><span>Elkészült</span>{{ fmtDateTime(form.ajanlat_keszult) }}</div>
            <div>
              <span>Elküldve</span>
              <b v-if="form.ajanlat_kuldve" class="ok">{{ fmtDateTime(form.ajanlat_kuldve) }}</b>
              <template v-else>még nem</template>
            </div>
          </div>
          <button
            class="btn primary block"
            :disabled="!!offerBusy || dirty || missingForOffer.length > 0"
            @click="makeOffer"
          >
            {{
              offerBusy === 'create'
                ? 'Készül… (kb. 10 mp)'
                : form.ajanlat_keszult
                  ? 'Árajánlat újragenerálása'
                  : 'Árajánlat elkészítése'
            }}
          </button>
          <div v-if="dirty" class="hint-s">Előbb mentsd a változásokat.</div>
          <div v-if="form.ajanlat_keszult" class="row2">
            <button class="btn ghost" :disabled="!!offerBusy" @click="openOffer">
              {{ offerBusy === 'open' ? 'Betöltés…' : '📄 Megnyitás' }}
            </button>
            <button class="btn ghost" :disabled="!!offerBusy || dirty || !form.email" @click="sendOffer">
              {{ offerBusy === 'send' ? 'Küldés…' : '✉️ Küldés' }}
            </button>
          </div>
          <details v-if="offerMail" class="mail-preview">
            <summary>A levél szövege</summary>
            <div class="mail-subject">Tárgy: {{ offerMail.subject }}</div>
            <div class="mail-body">{{ offerMail.text }}</div>
          </details>
          <div class="hint-s">A levél és az ajánlat szövegei a táblázat „Ajánlat szövegek” lapján írhatók át.</div>
        </section>

        <section v-if="!isNew" class="card">
          <div class="sec-title">Szerződés</div>
          <div v-if="missingForContract.length" class="warn-box">
            Hiányzik még: <b>{{ missingForContract.join(', ') }}</b>
          </div>
          <div v-if="form.szerzodes_keszult" class="contract-status">
            <div><span>Elkészült</span>{{ fmtDateTime(form.szerzodes_keszult) }}</div>
            <div>
              <span>Elküldve</span>
              <b v-if="form.szerzodes_kuldve" class="ok">{{ fmtDateTime(form.szerzodes_kuldve) }}</b>
              <template v-else>még nem</template>
            </div>
          </div>
          <button
            class="btn primary block"
            :disabled="!!contractBusy || dirty || missingForContract.length > 0"
            @click="makeContract"
          >
            {{
              contractBusy === 'create'
                ? 'Készül… (kb. 10 mp)'
                : form.szerzodes_keszult
                  ? 'Szerződés újragenerálása'
                  : 'Szerződés elkészítése'
            }}
          </button>
          <div v-if="dirty" class="hint-s">Előbb mentsd a változásokat.</div>
          <div v-if="form.szerzodes_keszult" class="row2">
            <button class="btn ghost" :disabled="!!contractBusy" @click="openPdf">
              {{ contractBusy === 'open' ? 'Betöltés…' : '📄 Megnyitás' }}
            </button>
            <button class="btn ghost" :disabled="!!contractBusy || dirty || !form.email" @click="sendContract">
              {{ contractBusy === 'send' ? 'Küldés…' : '✉️ Küldés' }}
            </button>
          </div>
          <div v-if="form.szerzodes_keszult && !form.email" class="hint-s">Küldéshez add meg az ügyfél e-mail címét.</div>
        </section>

        <section class="card">
          <div class="sec-title">Megjegyzés</div>
          <textarea v-model="form.megjegyzes" rows="3" class="note" placeholder="bármi, amit a többieknek tudniuk kell" />
        </section>

        <section v-if="!isNew" class="card">
          <button class="sec-head" @click="toggleHistory">
            Előzmények <span>{{ sections.elozmeny ? '−' : '+' }}</span>
          </button>
          <div v-show="sections.elozmeny" class="hist">
            <div v-if="historyLoading" class="hist-empty">Betöltés…</div>
            <div v-else-if="!historyItems.length" class="hist-empty">Még nincs bejegyzés.</div>
            <div v-for="(h, i) in historyItems" :key="i" class="hist-item">
              <div class="hist-head">
                <b>{{ h.ki }}</b> · {{ h.muvelet }}
                <span>{{ h.ido }}</span>
              </div>
              <div v-if="h.valtozasok" class="hist-body">{{ h.valtozasok }}</div>
            </div>
          </div>
        </section>

        <div v-if="!isNew" class="meta">
          Utoljára módosította: {{ form.modosito || '–' }} · {{ (form.modositva || '').replace('T', ' ') }}
        </div>

        <div class="savebar" :class="{ show: dirty || isNew }">
          <button class="btn primary block" :disabled="saving" @click="save">
            {{ saving ? 'Mentés…' : isNew ? 'Ügyfél rögzítése' : 'Változások mentése' }}
          </button>
        </div>
      </div>

      <!-- ===== LISTA ===== -->
      <div v-else class="list">
        <header class="listhead">
          <div class="brand">
            <img src="/icon-192.png" alt="" />
            <div>
              <div class="t1">Kivitelezések</div>
              <div class="t2">Szia, {{ auth.user }}!</div>
            </div>
          </div>
          <div class="head-actions">
            <a v-if="data.sheetUrl" :href="data.sheetUrl" target="_blank" class="icon-btn" title="Táblázat megnyitása">▦</a>
            <button class="icon-btn" title="Frissítés" @click="load">↻</button>
          </div>
        </header>

        <div class="tabs">
          <button :class="{ on: tab === 'projects' }" @click="go('')">Kivitelezések</button>
          <button :class="{ on: tab === 'services' }" @click="go('szolg')">Éves szolgáltatások</button>
        </div>

        <template v-if="tab === 'projects'">
          <input v-model="search" class="search" type="search" placeholder="Keresés: név, cím, telefon, ajánlatszám…" />
          <div class="filters">
            <button class="chip" :class="{ on: statusFilter === 'aktiv' }" @click="statusFilter = 'aktiv'">
              Folyamatban <b>{{ counts.aktiv }}</b>
            </button>
            <button
              v-for="s in STATUSES"
              :key="s.key"
              class="chip"
              :class="{ on: statusFilter === s.key }"
              @click="statusFilter = s.key"
            >
              {{ s.key }} <b>{{ counts[s.key] }}</b>
            </button>
            <button class="chip" :class="{ on: statusFilter === 'mind' }" @click="statusFilter = 'mind'">
              Mind <b>{{ counts.mind }}</b>
            </button>
          </div>

          <div v-if="!filtered.length" class="empty">Nincs találat.</div>
          <button v-for="p in filtered" :key="p.id" class="pcard" @click="go(p.id)">
            <div class="pc-row">
              <div class="pc-name">{{ p.ugyfel_nev }}</div>
              <span class="badge" :style="{ background: statusColor(p.allapot) }">{{ p.allapot }}</span>
            </div>
            <div class="pc-addr">{{ p.cim || 'nincs cím' }}</div>
            <div class="pc-row pc-meta">
              <span>
                <template v-if="p.kivitelezes_datum">🗓 {{ formatDate(p.kivitelezes_datum) }}</template>
                <template v-else>🗓 nincs időpont</template>
              </span>
              <span>{{ formatMoney(p.brutto) }}</span>
            </div>
            <div class="pc-progress">
              <i v-for="c in CHECKLIST" :key="c.key" :class="{ on: p[c.key] }" :title="c.label" />
              <span v-if="overdue(p)" class="pc-next warn">Időpont elmúlt – kivitelezve?</span>
              <span v-else-if="p.allapot === 'Ajánlat' && p.ajanlat_kuldve" class="pc-next">
                Ajánlat elküldve: {{ formatDate(p.ajanlat_kuldve) }}
              </span>
              <span v-else-if="nextStep(p)" class="pc-next">Következő: {{ nextStep(p) }}</span>
            </div>
          </button>

          <button class="fab" @click="go('uj')">+ Új ügyfél</button>
        </template>

        <!-- Éves szolgáltatások -->
        <template v-else>
          <div v-if="!sortedServices.length" class="empty">Még nincs éves szolgáltatás.</div>
          <button v-for="s in sortedServices" :key="s.id" class="pcard" @click="svcForm = { ...s }">
            <div class="pc-row">
              <div class="pc-name">{{ s.ugyfel_nev }}</div>
              <span
                v-if="daysLeft(s.ig) !== null"
                class="badge"
                :style="{ background: daysLeft(s.ig) < 0 ? '#c0392b' : daysLeft(s.ig) < 45 ? '#c77700' : '#1e8e3e' }"
              >
                {{ daysLeft(s.ig) < 0 ? 'Lejárt' : daysLeft(s.ig) + ' nap' }}
              </span>
            </div>
            <div class="pc-addr">{{ s.cim }}</div>
            <div class="pc-row pc-meta">
              <span>{{ s.tol }} – {{ s.ig }}</span>
              <span>{{ formatMoney(s.osszeg) }}</span>
            </div>
          </button>
          <button class="fab" @click="svcForm = { ugyfel_nev: '', cim: '', telefon: '', tol: '', ig: '', szamla: '', osszeg: '' }">
            + Új szolgáltatás
          </button>
        </template>

        <button class="logout" @click="kiv.logout()">Kilépés ({{ auth.user }})</button>
      </div>

      <!-- ===== ANYAG SZERKESZTŐ (alsó lap) ===== -->
      <div v-if="matForm" class="sheet-bg" @click.self="matForm = null">
        <div class="sheet">
          <div class="sec-title">{{ matForm.id ? 'Tétel szerkesztése' : 'Új tétel' }}</div>
          <div class="grid">
            <label class="field full"><span>Termék megnevezése *</span><input v-model="matForm.termek" list="dl-termek" @change="prefillFromPrevious" /></label>
            <label class="field"><span>Mennyiség</span><input v-model="matForm.db" /></label>
            <label class="field"><span>Beszállító</span><input v-model="matForm.beszallito" list="dl-beszallito" /></label>
            <div class="field full sub-title">Ár az ügyfélnek (ez kerül a szerződésbe)</div>
            <label class="field"><span>Nettó</span><KivMoneyInput v-model="matForm.ajanlat_netto" @blur="fillPair('ajanlat_netto', 'ajanlat_brutto', 1.27)" /></label>
            <label class="field"><span>Bruttó</span><KivMoneyInput v-model="matForm.ajanlat_brutto" @blur="fillPair('ajanlat_brutto', 'ajanlat_netto', 1 / 1.27)" /></label>
            <div class="field full sub-title">Beszerzési ár (nagyker)</div>
            <label class="field"><span>Nettó</span><KivMoneyInput v-model="matForm.beszerzes_netto" @blur="fillPair('beszerzes_netto', 'beszerzes_brutto', 1.27)" /></label>
            <label class="field"><span>Bruttó</span><KivMoneyInput v-model="matForm.beszerzes_brutto" @blur="fillPair('beszerzes_brutto', 'beszerzes_netto', 1 / 1.27)" /></label>
            <label class="field full">
              <span>Rövid leírás az ajánlatba (dőlt betűvel jelenik meg)</span>
              <input v-model="matForm.leiras" placeholder="pl. N-type, 25 év teljesítménygarancia" />
            </label>
            <div class="field full sub-title">Nyilvántartás</div>
            <label class="field"><span>Bizonylat sorszáma</span><input v-model="matForm.bizonylat" /></label>
            <label class="field"><span>Raktári kiadás</span><input v-model="matForm.raktari_kiadas" /></label>
            <label class="field"><span>Jótállási jegy</span><input v-model="matForm.jotallasi_jegy" /></label>
            <label class="field"><span>Megjegyzés</span><input v-model="matForm.megjegyzes" /></label>
          </div>
          <div class="sheet-actions">
            <button v-if="matForm.id" class="btn ghost danger-t" :disabled="saving" @click="removeMaterial">Törlés</button>
            <button class="btn ghost" @click="matForm = null">Mégse</button>
            <button class="btn primary" :disabled="saving" @click="saveMaterial">{{ saving ? '…' : 'Mentés' }}</button>
          </div>
        </div>
      </div>

      <!-- ===== SZOLGÁLTATÁS SZERKESZTŐ ===== -->
      <div v-if="svcForm" class="sheet-bg" @click.self="svcForm = null">
        <div class="sheet">
          <div class="sec-title">{{ svcForm.id ? 'Szolgáltatás' : 'Új éves szolgáltatás' }}</div>
          <div class="grid">
            <label class="field full"><span>Ügyfél neve *</span><input v-model="svcForm.ugyfel_nev" /></label>
            <label class="field full"><span>Cím</span><input v-model="svcForm.cim" /></label>
            <label class="field"><span>Telefon</span><input v-model="svcForm.telefon" type="tel" /></label>
            <label class="field"><span>Összeg</span><KivMoneyInput v-model="svcForm.osszeg" /></label>
            <label class="field"><span>Időszak -tól</span><input v-model="svcForm.tol" type="date" /></label>
            <label class="field"><span>Időszak -ig</span><input v-model="svcForm.ig" type="date" /></label>
            <label class="field full"><span>Számla sorszáma</span><input v-model="svcForm.szamla" /></label>
          </div>
          <div class="sheet-actions">
            <button class="btn ghost" @click="svcForm = null">Mégse</button>
            <button class="btn primary" :disabled="saving" @click="saveService">{{ saving ? '…' : 'Mentés' }}</button>
          </div>
        </div>
      </div>

      <datalist id="dl-napelem"><option v-for="o in suggestions.napelem" :key="o" :value="o" /></datalist>
      <datalist id="dl-inverter"><option v-for="o in suggestions.inverter" :key="o" :value="o" /></datalist>
      <datalist id="dl-energiatarolo"><option v-for="o in suggestions.energiatarolo" :key="o" :value="o" /></datalist>
      <datalist id="dl-ertekesito"><option v-for="o in suggestions.ertekesito" :key="o" :value="o" /></datalist>
      <datalist id="dl-termek"><option v-for="o in suggestions.termek" :key="o" :value="o" /></datalist>
      <datalist id="dl-beszallito"><option v-for="o in suggestions.beszallito" :key="o" :value="o" /></datalist>

      <div class="toast" :class="{ show: toast }">{{ toast }}</div>
    </template>
  </div>
</template>

<style scoped>
.kiv {
  --blue: #155b9b;
  --blue-d: #0f4677;
  --yellow: #f5c400;
  --ink: #0f1b2d;
  --muted: #6b7280;
  --line: #e5e7eb;
  --bg: #f3f5f8;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
  font-size: 16px;
  line-height: 1.4;
  -webkit-tap-highlight-color: transparent;
}
.kiv * {
  box-sizing: border-box;
}
.kiv button {
  font: inherit;
  color: inherit;
  cursor: pointer;
}
.list,
.edit {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 16px 120px;
}

/* Belépés */
.login {
  max-width: 380px;
  margin: 0 auto;
  padding: 12vh 16px 40px;
  text-align: center;
}
.login-logo {
  width: 64px;
  height: 64px;
  border-radius: 16px;
}
.login-title {
  font-size: 26px;
  font-weight: 800;
  margin-top: 12px;
}
.login-sub {
  color: var(--muted);
  margin-bottom: 24px;
}
.login .card {
  text-align: left;
}
.hint {
  color: var(--muted);
  font-size: 13px;
  margin-top: 14px;
}
.center {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px;
}
.spinner {
  width: 36px;
  height: 36px;
  border: 4px solid #d6dde6;
  border-top-color: var(--blue);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.err {
  color: #c0392b;
  font-size: 14px;
  margin: 4px 0 10px;
}

/* Elemek */
.card {
  background: #fff;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 1px 2px rgba(15, 27, 45, 0.06);
}
.btn {
  border: 0;
  border-radius: 12px;
  padding: 14px 18px;
  font-weight: 700;
  font-size: 16px;
}
.btn.block {
  width: 100%;
}
.btn.primary {
  background: var(--blue);
  color: #fff;
}
.btn.primary:disabled {
  opacity: 0.6;
}
.btn.ghost {
  background: #eef2f7;
  color: var(--blue);
}
.danger-t {
  color: #c0392b !important;
}
.icon-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 0;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  text-decoration: none;
  color: var(--blue) !important;
  box-shadow: 0 1px 2px rgba(15, 27, 45, 0.08);
}
.badge {
  display: inline-block;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  white-space: nowrap;
}
.chip {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 999px;
  padding: 8px 14px;
  font-size: 14px;
  white-space: nowrap;
}
.chip b {
  color: var(--muted);
  font-weight: 600;
  margin-left: 4px;
}
.chip.on {
  background: var(--blue);
  border-color: var(--blue);
  color: #fff;
}
.chip.on b {
  color: #cfe0f1;
}

/* Lista */
.listhead {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0 12px;
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
}
.brand img {
  width: 42px;
  height: 42px;
  border-radius: 10px;
}
.t1 {
  font-weight: 800;
  font-size: 20px;
  line-height: 1.2;
}
.t2 {
  color: var(--muted);
  font-size: 13px;
}
.head-actions {
  display: flex;
  gap: 8px;
}
.tabs {
  display: flex;
  background: #e3e8ef;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 12px;
}
.tabs button {
  flex: 1;
  border: 0;
  background: transparent;
  padding: 10px;
  border-radius: 9px;
  font-weight: 600;
  font-size: 14px;
  color: var(--muted);
}
.tabs button.on {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 1px 2px rgba(15, 27, 45, 0.1);
}
.search {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 13px 14px;
  font-size: 16px;
  background: #fff;
}
.filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 12px 0;
  margin: 0 -16px;
  padding-left: 16px;
  padding-right: 16px;
  scrollbar-width: none;
}
.filters::-webkit-scrollbar {
  display: none;
}
.pcard {
  display: block;
  width: 100%;
  text-align: left;
  background: #fff;
  border: 0;
  border-radius: 14px;
  padding: 14px 16px;
  margin-bottom: 10px;
  box-shadow: 0 1px 2px rgba(15, 27, 45, 0.06);
}
.pcard:active {
  transform: scale(0.99);
}
.pc-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}
.pc-name {
  font-weight: 700;
  font-size: 17px;
}
.pc-addr {
  color: var(--muted);
  font-size: 14px;
  margin: 2px 0 8px;
}
.pc-meta {
  font-size: 14px;
  font-weight: 600;
}
.pc-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
}
.pc-progress i {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: #e3e8ef;
}
.pc-progress i.on {
  background: #1e8e3e;
}
.pc-next {
  font-size: 12px;
  color: var(--muted);
  margin-left: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pc-next.warn {
  color: #c0392b;
  font-weight: 700;
}
.empty {
  text-align: center;
  color: var(--muted);
  padding: 40px 0;
}
.fab {
  position: fixed;
  right: 16px;
  bottom: calc(18px + env(safe-area-inset-bottom));
  background: var(--yellow);
  color: var(--ink) !important;
  border: 0;
  border-radius: 999px;
  padding: 16px 22px;
  font-weight: 800 !important;
  font-size: 16px;
  box-shadow: 0 6px 20px rgba(15, 27, 45, 0.25);
  z-index: 5;
}
.logout {
  display: block;
  margin: 30px auto 0;
  border: 0;
  background: none;
  color: var(--muted) !important;
  font-size: 13px !important;
  text-decoration: underline;
}

/* Szerkesztés */
.topbar {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--bg);
  padding: 14px 0 10px;
}
.topbar-title {
  min-width: 0;
}
.topbar-title .t1 {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.topbar-title .t2 {
  margin-top: 2px;
}
.icon-btn:first-child {
  font-size: 30px;
  flex: none;
}
.quick {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
.quick-btn {
  flex: 1;
  text-align: center;
  background: #fff;
  border-radius: 12px;
  padding: 12px 6px;
  font-weight: 600;
  font-size: 14px;
  color: var(--ink);
  text-decoration: none;
  box-shadow: 0 1px 2px rgba(15, 27, 45, 0.06);
}
.sec-title {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 10px;
}
.sec-title small {
  color: var(--muted);
  font-weight: 600;
  margin-left: 6px;
}
.sec-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 0;
  background: none;
  padding: 0;
  font-weight: 800 !important;
  font-size: 16px !important;
  text-align: left;
}
.sec-head > span {
  color: var(--muted);
  font-size: 20px;
  font-weight: 400;
}
.sec-head .sec-meta {
  font-size: 14px;
  font-weight: 600;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 14px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}
.field.full,
.check.full {
  grid-column: 1 / -1;
}
.field > span {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.kiv :deep(input:not([type='checkbox'])),
.kiv select,
.kiv textarea {
  width: 100%;
  border: 1px solid #d6dde6;
  border-radius: 10px;
  padding: 12px;
  font-size: 16px;
  background: #fff;
  color: var(--ink);
  font-family: inherit;
}
.kiv :deep(input:focus),
.kiv select:focus,
.kiv textarea:focus {
  outline: 2px solid var(--blue);
  outline-offset: -1px;
  border-color: var(--blue);
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.check {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-top: 1px solid var(--line);
  font-weight: 600;
  cursor: pointer;
  user-select: none;
}
.card > .check:first-of-type {
  border-top: 0;
}
.check input {
  display: none;
}
.check .box {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 2px solid #c5ced9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  font-weight: 800;
  transition: all 0.15s;
}
.check.on .box {
  background: #1e8e3e;
  border-color: #1e8e3e;
  color: #fff;
}
.check.on > span:last-child {
  color: var(--muted);
}
.check.danger.on .box {
  background: #c0392b;
  border-color: #c0392b;
}
.check.danger {
  border-top: 0;
}
.mat {
  display: block;
  width: 100%;
  text-align: left;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: none;
  padding: 12px 0;
}
.mat-name {
  font-weight: 600;
  font-size: 15px;
}
.mat-meta {
  font-size: 13px;
  color: var(--muted);
}
.totals {
  margin: 12px 0;
  font-size: 14px;
}
.totals div {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
}
.totals span {
  color: var(--muted);
}
.totals .strong {
  font-weight: 800;
}
.mat + .btn,
.totals + .btn {
  margin-top: 12px;
}
.note {
  resize: vertical;
}
.hist {
  margin-top: 10px;
}
.tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  color: #6b7280;
  background: #eef2f7;
  border-radius: 6px;
  padding: 1px 6px;
  margin-left: 4px;
  vertical-align: middle;
}
.totals .neg {
  color: #c0392b;
}
.warn-box {
  background: #fff7e6;
  border: 1px solid #f5d48a;
  color: #6b4a00;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  margin: 10px 0;
}
.link-btn {
  border: 0;
  background: none;
  color: var(--blue) !important;
  font-weight: 700;
  font-size: 13px !important;
  padding: 0 0 0 6px;
  text-decoration: underline;
}
.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.hint-s {
  color: var(--muted);
  font-size: 12px;
  margin-top: 8px;
}
.sub-title {
  font-size: 13px;
  font-weight: 800;
  color: var(--ink);
  margin: 4px 0 -6px;
}
.contract-status {
  font-size: 14px;
  margin-bottom: 12px;
}
.contract-status div {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
}
.contract-status span {
  color: var(--muted);
}
.contract-status .ok {
  color: #1e8e3e;
}
.offer-grid {
  margin-top: 0;
  margin-bottom: 4px;
}
.mail-preview {
  margin-top: 12px;
  font-size: 13px;
}
.mail-preview summary {
  cursor: pointer;
  color: var(--blue);
  font-weight: 700;
}
.mail-subject {
  font-weight: 700;
  margin: 8px 0 4px;
}
.mail-body {
  white-space: pre-line;
  background: var(--bg);
  border-radius: 10px;
  padding: 10px 12px;
  color: #374151;
}
.row2 {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.row2 .btn {
  flex: 1;
  padding: 12px 8px;
  font-size: 15px;
}
.hist-empty {
  color: var(--muted);
  font-size: 14px;
  padding: 6px 0;
}
.hist-item {
  border-top: 1px solid var(--line);
  padding: 10px 0;
  font-size: 14px;
}
.hist-item:first-child {
  border-top: 0;
}
.hist-head span {
  float: right;
  color: var(--muted);
  font-size: 12px;
}
.hist-body {
  white-space: pre-line;
  color: #374151;
  font-size: 13px;
  margin-top: 4px;
}
.meta {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
  margin: 8px 0 20px;
}
.savebar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: rgba(243, 245, 248, 0.94);
  backdrop-filter: blur(8px);
  transform: translateY(110%);
  transition: transform 0.2s;
  z-index: 6;
}
.savebar.show {
  transform: none;
}
.savebar .btn {
  max-width: 688px;
  margin: 0 auto;
  display: block;
}

/* Alsó lap */
.sheet-bg {
  position: fixed;
  inset: 0;
  background: rgba(15, 27, 45, 0.45);
  z-index: 10;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.sheet {
  background: #fff;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 18px 18px 0 0;
  padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
}
.sheet .grid {
  margin-top: 0;
}
.sheet-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 18px;
}

.toast {
  position: fixed;
  left: 50%;
  bottom: 90px;
  transform: translate(-50%, 20px);
  background: var(--ink);
  color: #fff;
  padding: 12px 18px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  opacity: 0;
  pointer-events: none;
  transition: all 0.2s;
  z-index: 20;
  max-width: calc(100% - 32px);
}
.toast.show {
  opacity: 1;
  transform: translate(-50%, 0);
}

@media (max-width: 420px) {
  .grid {
    grid-template-columns: 1fr;
  }
  .grid > .field:empty {
    display: none;
  }
  .sheet .grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
