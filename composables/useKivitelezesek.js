// Kivitelezések: kommunikáció a Google Apps Script háttérrel + közös állapot

const AUTH_KEY = 'kiv_auth'

export const CHECKLIST = [
  { key: 'szerzodes', label: 'Szerződés aláírva' },
  { key: 'kivitelezve', label: 'Kivitelezve' },
  { key: 'teljesites_igazolas', label: 'Teljesítésigazolás' },
  { key: 'fotodok', label: 'Fotódokumentáció' },
  { key: 'aramszolg_engedely', label: 'Áramszolgáltatói engedély' },
  { key: 'raktari_kiadas', label: 'Raktári kiadás' },
]

export const STATUSES = [
  { key: 'Kivitelezésre vár', color: '#155b9b' },
  { key: 'Utómunka', color: '#c77700' },
  { key: 'Ajánlat', color: '#6b7280' },
  { key: 'Lezárva', color: '#1e8e3e' },
  { key: 'Visszamondva', color: '#c0392b' },
]

// Ugyanaz a szabály, mint a háttérben (Code.gs computeStatus_), hogy mentés előtt is helyes legyen
export function computeStatus(p) {
  if (p.lemondva) return 'Visszamondva'
  const papers = ['teljesites_igazolas', 'fotodok', 'aramszolg_engedely', 'raktari_kiadas']
  if (p.kivitelezve && papers.every((k) => p[k])) return 'Lezárva'
  if (p.kivitelezve) return 'Utómunka'
  if (p.szerzodes || p.szerzodes_datum) return 'Kivitelezésre vár'
  return 'Ajánlat'
}

export function nextStep(p) {
  if (p.lemondva) return ''
  const missing = CHECKLIST.find((c) => !p[c.key])
  if (!missing) return ''
  if (missing.key === 'kivitelezve' && !p.kivitelezes_datum) return 'Kivitelezés időpontja nincs megadva'
  return missing.label
}

export function formatMoney(v) {
  if (v === '' || v === null || v === undefined) return ''
  const n = Number(v)
  if (isNaN(n)) return String(v)
  return Math.round(n).toLocaleString('hu-HU') + ' Ft'
}

export function formatDate(v) {
  if (!v) return ''
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v)
  if (!m) return v
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', weekday: 'short' })
}

// Tétel árai: ha csak az egyik (nettó/bruttó) van megadva, a másikat 27% áfával számoljuk
const toNum = (v) => (typeof v === 'number' ? v : v === '' || v == null ? NaN : Number(String(v).replace(/\s|Ft/g, '').replace(',', '.')))
export function priceNet(netto, brutto) {
  const n = toNum(netto)
  if (!isNaN(n)) return n
  const b = toNum(brutto)
  return isNaN(b) ? NaN : Math.round(b / 1.27)
}
export function priceGross(netto, brutto) {
  const b = toNum(brutto)
  if (!isNaN(b)) return b
  const n = toNum(netto)
  return isNaN(n) ? NaN : Math.round(n * 1.27)
}
// Ajánlati ár nélküli tétel = belső költség (pl. munkabér), nem kerül a szerződésbe
export const hasOfferPrice = (m) => !isNaN(priceNet(m.ajanlat_netto, m.ajanlat_brutto))

// Ugyanaz, mint a háttérben (Code.gs contractMissing_): mi hiányzik még a szerződéshez
export function contractMissing(p, items) {
  const miss = []
  const need = (v, label) => {
    if (!String(v || '').trim()) miss.push(label)
  }
  const ceg = p.ugyfel_tipus === 'Cég'
  need(p.ugyfel_nev, ceg ? 'Cégnév' : 'Ügyfél neve')
  need(p.lakcim, ceg ? 'Székhely' : 'Lakcím')
  if (ceg) {
    need(p.cegjegyzekszam, 'Cégjegyzékszám')
    need(p.adoszam, 'Adószám')
    need(p.kepviselo, 'Cég képviselője')
  } else {
    need(p.anyja_neve, 'Anyja neve')
    need(p.szul_hely_ido, 'Születési hely, idő')
  }
  need(p.cim, 'Telepítési cím')
  need(p.ajanlat_szam, 'Ajánlat száma')
  need(p.fizetes_modja, 'Fizetés módja')
  if (!items.some(hasOfferPrice)) miss.push('legalább egy tétel ajánlati árral')
  return miss
}

// Ugyanaz, mint a háttérben (offerMissing_): mi kell az árajánlathoz
export function offerMissing(p, items) {
  const miss = []
  if (!String(p.ugyfel_nev || '').trim()) miss.push('Ügyfél neve')
  if (!String(p.email || '').trim()) miss.push('E-mail')
  if (!items.some(hasOfferPrice)) miss.push('legalább egy tétel ajánlati árral')
  return miss
}

export function pdfBlobUrl(base64) {
  const bin = atob(base64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
}

export function useKivitelezesek() {
  const config = useRuntimeConfig()
  const apiUrl = config.public.kivApiUrl

  const auth = useState('kiv_auth', () => ({ pin: '', user: '' }))
  const data = useState('kiv_data', () => ({
    loaded: false,
    projects: [],
    materials: [],
    services: [],
    lists: {},
    sheetUrl: '',
  }))

  function loadAuth() {
    try {
      const saved = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
      if (saved && saved.pin) auth.value = saved
    } catch (e) {}
    return !!auth.value.pin
  }

  function saveAuth(pin, user) {
    auth.value = { pin, user }
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(auth.value))
    } catch (e) {}
  }

  function logout() {
    auth.value = { pin: '', user: '' }
    data.value.loaded = false
    try {
      localStorage.removeItem(AUTH_KEY)
    } catch (e) {}
  }

  // text/plain: így a böngésző nem küld CORS előkérést, amit az Apps Script nem kezelne
  async function call(action, payload = {}, pin = auth.value.pin) {
    if (!apiUrl) throw new Error('Nincs beállítva a háttérrendszer címe (kivApiUrl).')
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, pin, user: auth.value.user, ...payload }),
    })
    const json = await res.json()
    if (!json.ok) {
      if (json.error === 'HIBAS_KOD') throw Object.assign(new Error('Hibás név vagy belépőkód'), { code: 'PIN' })
      throw new Error(json.error || 'Ismeretlen hiba')
    }
    return json
  }

  async function bootstrap() {
    const json = await call('bootstrap')
    data.value = {
      loaded: true,
      projects: json.projects,
      materials: json.materials,
      services: json.services,
      lists: json.lists || {},
      sheetUrl: json.sheetUrl,
    }
  }

  function upsert(listName, item) {
    const list = data.value[listName]
    const i = list.findIndex((x) => x.id === item.id)
    if (i === -1) list.push(item)
    else list.splice(i, 1, item)
  }

  async function saveProject(item) {
    const json = await call('saveProject', { item })
    upsert('projects', json.item)
    return json.item
  }

  async function saveMaterial(item) {
    const json = await call('saveMaterial', { item })
    upsert('materials', json.item)
    return json.item
  }

  async function deleteMaterial(id) {
    await call('deleteMaterial', { id })
    data.value.materials = data.value.materials.filter((m) => m.id !== id)
  }

  async function createContract(projectId) {
    const json = await call('contractCreate', { projectId })
    upsert('projects', json.item)
    return json
  }

  async function contractPdf(projectId) {
    return call('contractPdf', { projectId })
  }

  async function createOffer(projectId) {
    const json = await call('offerCreate', { projectId })
    upsert('projects', json.item)
    return json
  }

  async function offerPdf(projectId) {
    return call('offerPdf', { projectId })
  }

  async function sendOffer(projectId) {
    const json = await call('offerSend', { projectId })
    upsert('projects', json.item)
    return json.item
  }

  async function sendContract(projectId) {
    const json = await call('contractSend', { projectId })
    upsert('projects', json.item)
    return json.item
  }

  async function saveService(item) {
    const json = await call('saveService', { item })
    upsert('services', json.item)
    return json.item
  }

  return {
    auth,
    data,
    loadAuth,
    saveAuth,
    logout,
    call,
    bootstrap,
    saveProject,
    saveMaterial,
    deleteMaterial,
    createContract,
    createOffer,
    offerPdf,
    sendOffer,
    contractPdf,
    sendContract,
    saveService,
  }
}
