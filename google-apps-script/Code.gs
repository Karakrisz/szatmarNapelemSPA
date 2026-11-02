/**
 * Szatmár Solar – Kivitelezések háttérrendszer (Google Apps Script)
 *
 * Telepítés: lásd google-apps-script/README.md
 * A táblázat lapjait az első kéréskor magától létrehozza.
 */

// ===== BEÁLLÍTÁSOK =====
const CONFIG = {
  // A belépés a "Felhasználók" lapon megadott személyes kódokkal működik.
  // Új ügyfél rögzítésekor ezek kapnak értesítő e-mailt (vesszővel elválasztva). Üresen hagyva nincs e-mail.
  NOTIFY_EMAILS: '',
  // Az alkalmazás címe (az e-mailben lévő linkhez)
  APP_URL: 'https://napelem-tamogatassal.szatmarnapelem.hu/kivitelezesek/',
  // Szerződés: kelt helye, a levél feladójának neve és a válaszcím
  KELT_HELYE: 'Mátészalka',
  CEG_NEV: 'Szatmár Solar',
  REPLY_TO: 'ertekesites.szatmarsolar@gmail.com',
  // Ebbe a Drive-mappába kerülnek a szerződés PDF-ek és a szerkeszthető sablon
  SZERZODES_MAPPA: 'Kivitelezések – Szerződések',
}

// ===== ADATSZERKEZET =====
// [kulcs, fejléc, típus]  típus: text | date | money | bool | number | datetime
const PROJECT_COLS = [
  ['id', 'Azonosító', 'text'],
  ['allapot', 'Állapot', 'text'],
  ['ugyfel_nev', 'Ügyfél neve', 'text'],
  ['cim', 'Telepítési cím', 'text'],
  ['telefon', 'Telefon', 'text'],
  ['email', 'E-mail', 'text'],
  ['ugyfel_tipus', 'Ügyfél típusa', 'text'],
  ['lakcim', 'Lakcím / székhely', 'text'],
  ['anyja_neve', 'Anyja neve', 'text'],
  ['szul_hely_ido', 'Születési hely, idő', 'text'],
  ['cegjegyzekszam', 'Cégjegyzékszám', 'text'],
  ['adoszam', 'Adószám', 'text'],
  ['kepviselo', 'Cég képviselője', 'text'],
  ['kapcsolattarto', 'Kapcsolattartó', 'text'],
  ['ertekesito', 'Értékesítő', 'text'],
  ['ajanlat_szam', 'Ajánlat száma', 'text'],
  ['szerzodes_datum', 'Szerződés dátuma', 'date'],
  ['kivitelezes_datum', 'Kivitelezés dátuma', 'date'],
  ['finanszirozas', 'Finanszírozás', 'text'],
  ['fizetes_modja', 'Fizetés módja', 'text'],
  ['projekt_tipus', 'Projekt típusa', 'text'],
  ['uzemmod', 'Üzemmód', 'text'],
  ['napelem', 'Napelem', 'text'],
  ['napelem_db', 'Napelem db', 'number'],
  ['inverter', 'Inverter', 'text'],
  ['inverter_sn', 'Inverter sorozatszám', 'text'],
  ['energiatarolo', 'Energiatároló', 'text'],
  ['akku_sn', 'Akku sorozatszám', 'text'],
  ['netto', 'Nettó (Ft)', 'money'],
  ['afa', 'Áfa (Ft)', 'money'],
  ['brutto', 'Bruttó (Ft)', 'money'],
  ['reszlet_kiszallitas', 'Fizetendő kiszállításkor', 'money'],
  ['reszlet_kivitelezes', 'Fizetendő kivitelezéskor', 'money'],
  ['dijbekero_szam', 'Díjbekérő száma', 'text'],
  ['eloleg_szamla', 'Előlegszámla száma', 'text'],
  ['vegszamla', 'Végszámla száma', 'text'],
  ['aramszolg_ugyintezes', 'Áramszolg. ügyintézés', 'text'],
  ['keszre_jelentes', 'Készre jelentés határideje', 'date'],
  ['szerzodes', 'Szerződés aláírva', 'bool'],
  ['kivitelezve', 'Kivitelezve', 'bool'],
  ['teljesites_igazolas', 'Teljesítésigazolás', 'bool'],
  ['fotodok', 'Fotódokumentáció', 'bool'],
  ['aramszolg_engedely', 'Áramszolg. engedély', 'bool'],
  ['raktari_kiadas', 'Raktári kiadás', 'bool'],
  ['lemondva', 'Visszamondva', 'bool'],
  ['megjegyzes', 'Megjegyzés', 'text'],
  ['kedvezmeny', 'Kedvezmény (%)', 'number'],
  ['ajanlat_bevezeto', 'Ajánlat első mondata', 'text'],
  ['ajanlat_pdf', 'Árajánlat (PDF)', 'text'],
  ['ajanlat_keszult', 'Árajánlat készült', 'datetime'],
  ['ajanlat_kuldve', 'Árajánlat elküldve', 'datetime'],
  ['ajanlat_pdf_id', 'Árajánlat PDF azonosító', 'text'],
  ['ajanlat_ujjlenyomat', 'Árajánlat ellenőrzőkód', 'text'],
  ['szerzodes_pdf', 'Szerződés (PDF)', 'text'],
  ['szerzodes_keszult', 'Szerződés készült', 'datetime'],
  ['szerzodes_kuldve', 'Szerződés elküldve', 'datetime'],
  ['szerzodes_pdf_id', 'Szerződés PDF azonosító', 'text'],
  ['szerzodes_ujjlenyomat', 'Szerződés ellenőrzőkód', 'text'],
  ['letrehozva', 'Létrehozva', 'datetime'],
  ['modositva', 'Módosítva', 'datetime'],
  ['modosito', 'Módosította', 'text'],
]

const MATERIAL_COLS = [
  ['id', 'Azonosító', 'text'],
  ['projekt_id', 'Projekt azonosító', 'text'],
  ['ugyfel_nev', 'Ügyfél', 'text'],
  ['termek', 'Termék megnevezése', 'text'],
  ['db', 'Darabszám', 'text'],
  ['ajanlat_netto', 'Ajánlat nettó', 'money'],
  ['ajanlat_brutto', 'Ajánlat bruttó', 'money'],
  ['beszerzes_netto', 'Beszerzés nettó', 'money'],
  ['beszerzes_brutto', 'Beszerzés bruttó', 'money'],
  ['beszallito', 'Beszállító', 'text'],
  ['bizonylat', 'Bizonylat sorszáma', 'text'],
  ['raktari_kiadas', 'Raktári kiadás', 'text'],
  ['jotallasi_jegy', 'Jótállási jegy', 'text'],
  ['leiras', 'Leírás az ajánlatba', 'text'],
  ['megjegyzes', 'Megjegyzés', 'text'],
]

const SERVICE_COLS = [
  ['id', 'Azonosító', 'text'],
  ['ugyfel_nev', 'Ügyfél neve', 'text'],
  ['cim', 'Ügyfél címe', 'text'],
  ['telefon', 'Telefon', 'text'],
  ['tol', 'Időszak -tól', 'date'],
  ['ig', 'Időszak -ig', 'date'],
  ['szamla', 'Számla sorszáma', 'text'],
  ['osszeg', 'Összeg (Ft)', 'money'],
]

const SHEETS = {
  projects: { name: 'Kivitelezések', cols: PROJECT_COLS },
  materials: { name: 'Anyagok', cols: MATERIAL_COLS },
  services: { name: 'Éves szolgáltatások', cols: SERVICE_COLS },
}

const LISTS_SHEET = 'Listák'
const OFFER_SHEET = 'Ajánlat szövegek'
// [kulcs, alapszöveg, mire való]. A lapon átírt szöveg felülírja az alapot.
// Behelyettesíthető: {ugyfel} {nev} {osszeg} {osszeg_ezer} {kedvezmeny} {kedvezmeny_resz} {rendszer} {rendszer_rovid} {ertekesito} {ajanlat_szam}
const OFFER_DEFAULTS = [
  ['targy', 'Árajánlat {ugyfel} részére – {rendszer_rovid} ({ajanlat_szam})', 'Az e-mail tárgya'],
  ['bevezeto', 'Köszönöm, hogy időt szánt a beszélgetésre – így pontosan tudom, mire van szüksége.', 'Első mondat a megszólítás után (az adatlapon ügyfelenként felülírható)'],
  ['amirol_szo_van', 'Amiről szó van: {rendszer}.', 'Egy mondatban a rendszer'],
  [
    'elonyok',
    'Saját áram a tetőről – a villanyszámla jelentős része megspórolható\nMinőségi napelemek, hosszú élettartammal és gyártói teljesítménygaranciával\nKulcsrakész kivitelezés: tervezés, ügyintézés, telepítés és üzembe helyezés\nMonitoring: a telefonján követheti, mennyit termel a rendszer',
    'Felsorolás, soronként egy pont',
  ],
  ['elony_akku', 'Energiatároló: a megtermelt áram este és áramszünet esetén is rendelkezésre áll', 'Plusz pont, ha van energiatároló'],
  [
    'bizalom',
    'Nem azt kérem, hogy csak higgyen nekünk: a kivitelezésre 3 év jótállást vállalunk, a beépített berendezésekre a gyártói garancia érvényes, és a hálózati ügyintézést is mi intézzük – ha bármi kérdés adódik, nem marad magára vele.',
    'Bizalomépítés (ellenőrizd, hogy a vállalások stimmeljenek!)',
  ],
  [
    'dontes_koltsege',
    'Minden hónap, amíg nincs napelem a tetőn, a villanyszámlában fizeti meg az árát – az energiaárak pedig hosszú távon inkább emelkednek, mint csökkennek.',
    'A halogatás költsége',
  ],
  ['kedvezmeny', 'Az ajánlat már tartalmazza a {kedvezmeny}%-os kedvezményt, amit azért tudunk biztosítani, mert pontosan és gyorsan egyeztettük az igényeket.', 'Csak akkor jelenik meg, ha van kedvezmény'],
  ['egy_mondatban_cim', 'Ha otthon el kell mondania, miről van szó, ez a lényeg egy mondatban:', ''],
  ['egy_mondatban', '{rendszer_rovid}, kulcsrakész telepítéssel, garanciával – {osszeg_ezer} ezer forintért{kedvezmeny_resz}.', ''],
  ['tovabb_cim', 'A továbblépéshez két lehetőség van:', ''],
  ['opcio_1', 'Elfogadja az ajánlatot, ahogy van', ''],
  ['opcio_1_reszlet', 'egy rövid e-mailes visszaigazolással már egyeztethetjük is a szerződést és a kivitelezés időpontját.', ''],
  ['opcio_2', 'Kérdése van?', ''],
  ['opcio_2_reszlet', 'írja meg, mikor hívhatom vissza, és szívesen tisztázok bármit.', ''],
  ['ervenyesseg_nap', '15', 'Hány napig érvényes az ajánlat'],
]
const USERS_SHEET = 'Felhasználók'
const USERS_HEADERS = ['Név', 'Belépőkód', 'Aktív', 'Utolsó belépés', 'Jutalék (%)', 'Jutalék alapja']
const COMMISSION_BASES = ['Nettó ár', 'Haszon']
const LOG_SHEET = 'Napló'
const LOG_HEADERS = ['Időpont', 'Ki', 'Művelet', 'Ügyfél', 'Változások', 'Projekt azonosító']
const DEFAULT_LISTS = {
  'Finanszírozás': ['Önerő', 'Pályázat', '0% hitel', 'Lakástakarék'],
  'Fizetés módja': ['Átutalás', 'Készpénz'],
  'Projekt típusa': [
    'Új napelemes rendszer',
    'Meglévő rendszer - energiatároló',
    'Meglévő rendszer - invertercsere és energiatároló',
  ],
  'Üzemmód': [
    'Normál (hálózatpárhuzamos üzem, csak termelés esetén üzemel az inverter)',
    'Hibrid (Energiagazdálkodás: energiatároló is csatlakoztatva lesz)',
    'Szigetüzemmód: inverterbe beépített szigetüzemű leválasztó berendezés',
    'Szigetüzemmód: önálló szigetüzemi leválasztó (hálózatpárhuzamos és szigetüzemre is képes rendszer, képes a közcélú hálózatról leválni és szigetüzemi ellátásra átállni)',
  ],
  'Értékesítő': [],
  'Áramszolg. ügyintéző': ['Ági', 'Cintia'],
}

// ===== HTTP =====
function doGet(e) {
  return handle_(e.parameter || {})
}

function doPost(e) {
  let body = {}
  try {
    body = JSON.parse((e.postData && e.postData.contents) || '{}')
  } catch (err) {
    return json_({ ok: false, error: 'Hibás kérés' })
  }
  return handle_(body)
}

function handle_(req) {
  const res = handleInner_(req)
  if (WRITE_ACTIONS_.indexOf(req.action) !== -1) {
    try {
      refreshData_()
    } catch (e) {
      console.error('Áttekintés frissítése sikertelen: ' + e)
    }
  }
  return res
}

function handleInner_(req) {
  try {
    ensureSheets_()
    const user = auth_(req.user, req.pin)
    switch (req.action) {
      case 'ping':
        log_(user, 'Belépés', '', '', '')
        return json_({ ok: true, user: user })
      case 'bootstrap':
        return json_({
          ok: true,
          lists: readLists_(),
          projects: readAll_('projects'),
          materials: readAll_('materials'),
          services: readAll_('services'),
          sheetUrl: SpreadsheetApp.getActive().getUrl(),
        })
      case 'saveProject':
        return json_({ ok: true, item: saveProject_(req.item, user) })
      case 'saveMaterial':
        return json_({ ok: true, item: saveMaterial_(req.item, user) })
      case 'deleteMaterial':
        deleteMaterial_(req.id, user)
        return json_({ ok: true })
      case 'saveService':
        return json_({ ok: true, item: saveService_(req.item, user) })
      case 'history':
        return json_({ ok: true, items: history_(req.projectId) })
      case 'contractCreate':
        return json_(Object.assign({ ok: true }, createContract_(req.projectId, user)))
      case 'contractPdf':
        return json_(Object.assign({ ok: true }, contractPdf_(req.projectId)))
      case 'offerCreate':
        return json_(Object.assign({ ok: true }, createOffer_(req.projectId, user)))
      case 'offerPdf':
        return json_(Object.assign({ ok: true }, filePdf_(req.projectId, 'ajanlat_pdf_id')))
      case 'offerSend':
        return json_({ ok: true, item: sendOffer_(req.projectId, user) })
      case 'contractSend':
        return json_({ ok: true, item: sendContract_(req.projectId, user) })
      case 'import':
        return json_({ ok: true, result: importData_(req.data, user) })
      default:
        return json_({ ok: false, error: 'Ismeretlen művelet' })
    }
  } catch (err) {
    return json_({ ok: false, error: String(err.message || err) })
  }
}

// Ezek után frissül az Áttekintés és a Jutalékok (a számolás a "_adat" rejtett lapon történik)
const WRITE_ACTIONS_ = ['saveProject', 'saveMaterial', 'deleteMaterial', 'contractCreate', 'offerCreate', 'import']

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

// ===== BELÉPÉS =====
// Név + személyes kód a "Felhasználók" lapról. Védelem találgatás ellen:
// egy névre 10 percen belül 10 hibás kód után csak az a név zárolódik; ismeretlen nevekre
// összesen 300 hibás próbálkozás után átmenetileg minden belépés szünetel.
const normName_ = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')

function auth_(name, code) {
  const cache = CacheService.getScriptCache()
  const key = 'fail_' + Utilities.base64EncodeWebSafe(normName_(name)).slice(0, 200)
  const nameFails = Number(cache.get(key) || 0)
  const allFails = Number(cache.get('fail_all') || 0)
  if (nameFails >= 10 || allFails >= 300) throw new Error('Túl sok hibás próbálkozás, próbáld újra 10 perc múlva.')

  const sh = SpreadsheetApp.getActive().getSheetByName(USERS_SHEET)
  const rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues() : []
  for (let r = 0; r < rows.length; r++) {
    const n = rows[r][0]
    const c = rows[r][1]
    const active = rows[r][2]
    if (n && c && active === true && normName_(n) === normName_(name) && String(c).trim() === String(code || '').trim()) {
      cache.remove(key)
      // utolsó belépés: legfeljebb 5 percenként írjuk, hogy ne lassítsa a kéréseket
      if (!cache.get('seen_' + r)) {
        sh.getRange(r + 2, 4).setValue(new Date())
        cache.put('seen_' + r, '1', 300)
      }
      return String(n).trim()
    }
  }
  cache.put(key, String(nameFails + 1), 600)
  cache.put('fail_all', String(allFails + 1), 600)
  throw new Error('HIBAS_KOD')
}

// A jutalék oszlopok a régebben létrehozott Felhasználók lapra is felkerülnek
function ensureUserColumns_(sh) {
  const head = sh.getRange(1, 1, 1, 8).getValues()[0]
  if (head[4] === USERS_HEADERS[4]) return
  sh.getRange(1, 5, 1, 2).setValues([[USERS_HEADERS[4], USERS_HEADERS[5]]]).setFontWeight('bold').setBackground('#f5c400')
  sh.getRange(1, 8).setValue('Új kolléga: írd be a nevét, egy legalább 8 karakteres kódot, és pipáld be az Aktív oszlopot. Kilépéskor elég kivenni a pipát. Jutalék: hány százalék jár neki, és miből (nettó árból vagy a haszonból).')
  sh.getRange(2, 5, 999, 1).setNumberFormat('0.##')
  sh.getRange(2, 6, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(COMMISSION_BASES, true).setAllowInvalid(false).build())
  sh.setColumnWidth(5, 110)
  sh.setColumnWidth(6, 130)
}

function commissionTable_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(USERS_SHEET)
  const out = {}
  if (!sh || sh.getLastRow() < 2) return out
  sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().forEach((r) => {
    if (!String(r[0]).trim()) return
    out[normName_(r[0])] = { name: String(r[0]).trim(), pct: num_(r[4]) || 0, base: r[5] === 'Haszon' ? 'Haszon' : 'Nettó ár' }
  })
  return out
}

function randomCode_() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let s = ''
  for (let i = 0; i < 10; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

// ===== TÁBLÁZAT =====
function ensureSheets_() {
  const ss = SpreadsheetApp.getActive()
  Object.keys(SHEETS).forEach((key) => {
    const def = SHEETS[key]
    let sh = ss.getSheetByName(def.name)
    if (!sh) {
      sh = ss.insertSheet(def.name)
      const headers = def.cols.map((c) => c[1])
      sh.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setBackground('#155b9b')
        .setFontColor('#ffffff')
        .setWrap(true)
        .setVerticalAlignment('middle')
      sh.setFrozenRows(1)
      sh.setFrozenColumns(key === 'projects' ? 3 : 1)
      sh.setRowHeight(1, 42)
      sh.setColumnWidths(1, headers.length, 150)
      sh.hideColumns(1) // Azonosító: a rendszer kezeli
    }
  })
  if (!ss.getSheetByName(LISTS_SHEET)) {
    const sh = ss.insertSheet(LISTS_SHEET)
    const names = Object.keys(DEFAULT_LISTS)
    const height = Math.max.apply(null, names.map((n) => DEFAULT_LISTS[n].length)) + 1
    const grid = []
    for (let r = 0; r < height; r++) {
      grid.push(names.map((n) => (r === 0 ? n : DEFAULT_LISTS[n][r - 1] || '')))
    }
    sh.getRange(1, 1, grid.length, names.length).setValues(grid)
    sh.getRange(1, 1, 1, names.length).setFontWeight('bold').setBackground('#f5c400')
    sh.setFrozenRows(1)
    sh.setColumnWidths(1, names.length, 260)
  } else {
    const sh = ss.getSheetByName(LISTS_SHEET)
    const headers = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), 1)).getValues()[0]
    Object.keys(DEFAULT_LISTS).forEach((name) => {
      if (headers.indexOf(name) !== -1) return
      const col = headers.length + 1
      const values = [name].concat(DEFAULT_LISTS[name])
      sh.getRange(1, col, values.length, 1).setValues(values.map((v) => [v]))
      sh.getRange(1, col).setFontWeight('bold').setBackground('#f5c400')
      headers.push(name)
    })
  }
  if (!ss.getSheetByName(USERS_SHEET)) {
    const sh = ss.insertSheet(USERS_SHEET)
    sh.getRange(1, 1, 1, USERS_HEADERS.length).setValues([USERS_HEADERS]).setFontWeight('bold').setBackground('#f5c400')
    sh.getRange(2, 2, 999, 1).setNumberFormat('@')
    sh.getRange(2, 4, 999, 1).setNumberFormat('yyyy.mm.dd hh:mm')
    // első felhasználó, hogy legyen kivel belépni; a nevet és a kódot nyugodtan át lehet írni
    sh.getRange(2, 1, 1, 3).setValues([['Admin', randomCode_(), true]])
    sh.getRange(2, 3, 999, 1).insertCheckboxes()
    sh.getRange(2, 3).check()
    sh.setFrozenRows(1)
    sh.setColumnWidths(1, 4, 180)
  }
  ensureUserColumns_(ss.getSheetByName(USERS_SHEET))
  if (!ss.getSheetByName(LOG_SHEET)) {
    const sh = ss.insertSheet(LOG_SHEET)
    sh.getRange(1, 1, 1, LOG_HEADERS.length).setValues([LOG_HEADERS]).setFontWeight('bold').setBackground('#155b9b').setFontColor('#ffffff')
    sh.setFrozenRows(1)
    sh.setColumnWidth(1, 140)
    sh.setColumnWidth(2, 130)
    sh.setColumnWidth(3, 150)
    sh.setColumnWidth(4, 200)
    sh.setColumnWidth(5, 520)
    sh.hideColumns(6)
    // kézi szerkesztéskor figyelmeztet, hogy ezt a rendszer vezeti
    sh.protect().setDescription('A naplót a rendszer írja').setWarningOnly(true)
  }
  const offerSh = ss.getSheetByName(OFFER_SHEET)
  if (!offerSh) {
    const sh = ss.insertSheet(OFFER_SHEET)
    sh.getRange(1, 1, 1, 3).setValues([['Kulcs', 'Szöveg (szabadon átírható)', 'Mire való']]).setFontWeight('bold').setBackground('#f5c400')
    sh.getRange(2, 1, OFFER_DEFAULTS.length, 3).setValues(OFFER_DEFAULTS.map((r) => [r[0], r[1].replace(/\\n/g, '\n'), r[2]])).setWrap(true).setVerticalAlignment('top')
    sh.setColumnWidth(1, 140)
    sh.setColumnWidth(2, 560)
    sh.setColumnWidth(3, 260)
    sh.setFrozenRows(1)
  } else {
    const keys = offerSh.getLastRow() > 1 ? offerSh.getRange(2, 1, offerSh.getLastRow() - 1, 1).getValues().map((r) => String(r[0])) : []
    OFFER_DEFAULTS.filter((r) => keys.indexOf(r[0]) === -1).forEach((r) => offerSh.appendRow([r[0], r[1].replace(/\\n/g, '\n'), r[2]]))
  }
  // Az alapértelmezett üres "Munkalap1" eltávolítása
  ;['Munkalap1', 'Sheet1'].forEach((n) => {
    const sh = ss.getSheetByName(n)
    if (sh && ss.getSheets().length > 1 && sh.getLastRow() === 0) ss.deleteSheet(sh)
  })
}

function sheet_(key) {
  return SpreadsheetApp.getActive().getSheetByName(SHEETS[key].name)
}

// Fejléc alapján keresi az oszlopokat, így a lapon az oszlopok sorrendje szabadon módosítható.
function colIndex_(key) {
  const sh = sheet_(key)
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
  const map = {}
  SHEETS[key].cols.forEach((c) => {
    let i = headers.indexOf(c[1])
    if (i === -1) {
      // új mező: hozzáadjuk a végére
      i = headers.length
      sh.getRange(1, i + 1).setValue(c[1]).setFontWeight('bold').setBackground('#155b9b').setFontColor('#ffffff')
      headers.push(c[1])
    }
    map[c[0]] = { i: i, type: c[2] }
  })
  return { map: map, width: headers.length }
}

function readAll_(key) {
  const sh = sheet_(key)
  const last = sh.getLastRow()
  if (last < 2) return []
  const idx = colIndex_(key)
  const values = sh.getRange(2, 1, last - 1, idx.width).getValues()
  return values
    .filter((row) => row[idx.map.id.i])
    .map((row) => {
      const o = {}
      Object.keys(idx.map).forEach((k) => (o[k] = fromCell_(row[idx.map[k].i], idx.map[k].type)))
      return o
    })
}

function fromCell_(v, type) {
  if (v === '' || v === null) return type === 'bool' ? false : ''
  if (type === 'bool') return v === true || v === 'TRUE' || v === 'igen'
  if (v instanceof Date) {
    const tz = Session.getScriptTimeZone()
    return Utilities.formatDate(v, tz, type === 'datetime' ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd')
  }
  if (type === 'money' || type === 'number') return typeof v === 'number' ? v : String(v)
  return String(v)
}

function toCell_(v, type) {
  if (v === undefined || v === null) return type === 'bool' ? false : ''
  if (type === 'bool') return v === true || v === 'true'
  if (type === 'money' || type === 'number') {
    const s = String(v).replace(/\s|Ft/g, '').replace(',', '.')
    if (s === '') return ''
    const n = Number(s)
    return isNaN(n) ? String(v) : n
  }
  if (type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(String(v))) {
    const p = String(v).split('-')
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]))
  }
  if (type === 'datetime' && v) return new Date(v)
  return String(v)
}

const FORMATS_ = { text: '@', date: 'yyyy.mm.dd', datetime: 'yyyy.mm.dd hh:mm', money: '#,##0 "Ft"', number: '0', bool: 'General' }

function writeRow_(key, item, rowNumber) {
  const sh = sheet_(key)
  const idx = colIndex_(key)
  const existing = rowNumber ? sh.getRange(rowNumber, 1, 1, idx.width).getValues()[0] : new Array(idx.width).fill('')
  const formats = sh.getRange(rowNumber || sh.getLastRow() + 1, 1, 1, idx.width).getNumberFormats()[0]
  Object.keys(idx.map).forEach((k) => {
    if (item[k] === undefined) return
    const c = idx.map[k]
    existing[c.i] = toCell_(item[k], c.type)
    formats[c.i] = FORMATS_[c.type]
  })
  const row = rowNumber || sh.getLastRow() + 1
  const range = sh.getRange(row, 1, 1, idx.width)
  range.setNumberFormats([formats]).setValues([existing])
  Object.keys(idx.map).forEach((k) => {
    if (idx.map[k].type === 'bool') sh.getRange(row, idx.map[k].i + 1).insertCheckboxes()
  })
  return row
}

function findRow_(key, id) {
  if (!id) return 0
  const sh = sheet_(key)
  const last = sh.getLastRow()
  if (last < 2) return 0
  const idCol = colIndex_(key).map.id.i + 1
  const ids = sh.getRange(2, idCol, last - 1, 1).getValues()
  for (let r = 0; r < ids.length; r++) if (String(ids[r][0]) === String(id)) return r + 2
  return 0
}

function newId_(prefix) {
  return prefix + '-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8)
}

function saveRow_(key, item) {
  if (!item) throw new Error('Hiányzó adat')
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const row = findRow_(key, item.id)
    if (!item.id) item.id = newId_(key === 'materials' ? 'A' : 'S')
    writeRow_(key, item, row)
    return readRowById_(key, item.id)
  } finally {
    lock.releaseLock()
  }
}

function readRowById_(key, id) {
  return readAll_(key).filter((o) => o.id === id)[0]
}

function deleteRow_(key, id) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const row = findRow_(key, id)
    if (row) sheet_(key).deleteRow(row)
  } finally {
    lock.releaseLock()
  }
}

// ===== ÜZLETI LOGIKA =====
function computeStatus_(p) {
  if (p.lemondva) return 'Visszamondva'
  const papers = ['teljesites_igazolas', 'fotodok', 'aramszolg_engedely', 'raktari_kiadas']
  if (p.kivitelezve && papers.every((k) => p[k])) return 'Lezárva'
  if (p.kivitelezve) return 'Utómunka'
  if (p.szerzodes || p.szerzodes_datum) return 'Kivitelezésre vár'
  return 'Ajánlat'
}

function saveProject_(item, user) {
  if (!item) throw new Error('Hiányzó adat')
  CONTRACT_KEYS_.forEach((k) => delete item[k])
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  let isNew = false
  try {
    const row = findRow_('projects', item.id)
    let merged = item
    let current = null
    if (row) {
      current = readRowById_('projects', item.id) || {}
      merged = Object.assign({}, current, item)
    } else {
      isNew = true
      merged.id = item.id || newId_('K')
      merged.letrehozva = new Date().toISOString()
    }
    if (!String(merged.ugyfel_nev || '').trim()) throw new Error('Az ügyfél neve kötelező')
    merged.allapot = computeStatus_(merged)
    merged.modositva = new Date().toISOString()
    merged.modosito = user
    writeRow_('projects', merged, row)
    rememberListValue_('Értékesítő', merged.ertekesito)
    const saved = readRowById_('projects', merged.id)
    if (isNew) {
      log_(user, 'Új ügyfél', saved.ugyfel_nev, 'Rögzítve' + (saved.brutto !== '' ? ', bruttó ' + fmtLog_(saved.brutto, 'money') : ''), saved.id)
      notifyNew_(saved, user)
    } else {
      const changes = diff_(PROJECT_COLS, current, saved, ['modositva', 'modosito', 'letrehozva', 'id'])
      if (changes) log_(user, 'Módosítás', saved.ugyfel_nev, changes, saved.id)
    }
    return saved
  } finally {
    lock.releaseLock()
  }
}

function notifyNew_(p, user) {
  const to = String(CONFIG.NOTIFY_EMAILS || '').trim()
  if (!to) return
  const money = (n) => fmtLog_(n, 'money')
  const lines = [
    'Új ügyfél került rögzítésre' + (user ? ' (' + user + ')' : '') + ':',
    '',
    'Ügyfél: ' + p.ugyfel_nev,
    'Cím: ' + (p.cim || '-'),
    'Telefon: ' + (p.telefon || '-'),
    'E-mail: ' + (p.email || '-'),
    'Ajánlat száma: ' + (p.ajanlat_szam || '-'),
    'Bruttó: ' + money(p.brutto),
    'Finanszírozás: ' + (p.finanszirozas || '-'),
    'Rendszer: ' + [p.napelem, p.inverter, p.energiatarolo].filter(String).join(' + '),
    '',
    'Megnyitás: ' + CONFIG.APP_URL + '#' + p.id,
  ]
  MailApp.sendEmail({ to: to, subject: 'Új kivitelezés: ' + p.ugyfel_nev, body: lines.join('\n') })
}

function saveMaterial_(item, user) {
  const before = item && item.id ? readRowById_('materials', item.id) : null
  const saved = saveRow_('materials', item)
  const changes = before ? diff_(MATERIAL_COLS, before, saved, ['id', 'projekt_id', 'ugyfel_nev']) : fmtMaterial_(saved)
  if (changes) log_(user, before ? 'Anyag módosítva' : 'Anyag hozzáadva', saved.ugyfel_nev, (before ? saved.termek + ':\n' : '') + changes, saved.projekt_id)
  return saved
}

function deleteMaterial_(id, user) {
  const before = readRowById_('materials', id)
  deleteRow_('materials', id)
  if (before) log_(user, 'Anyag törölve', before.ugyfel_nev, fmtMaterial_(before), before.projekt_id)
}

function fmtMaterial_(m) {
  return [m.termek, m.db, m.beszerzes_brutto !== '' ? 'beszerzés ' + fmtLog_(m.beszerzes_brutto, 'money') : '']
    .filter(String)
    .join(', ')
}

function saveService_(item, user) {
  const before = item && item.id ? readRowById_('services', item.id) : null
  const saved = saveRow_('services', item)
  const changes = before ? diff_(SERVICE_COLS, before, saved, ['id']) : saved.tol + ' – ' + saved.ig
  if (changes) log_(user, before ? 'Szolgáltatás módosítva' : 'Új éves szolgáltatás', saved.ugyfel_nev, changes, '')
  return saved
}

// ===== NAPLÓ =====
function log_(user, action, client, changes, projectId) {
  SpreadsheetApp.getActive()
    .getSheetByName(LOG_SHEET)
    .appendRow([new Date(), user, action, client || '', String(changes || '').slice(0, 5000), projectId || ''])
}

function fmtLog_(v, type) {
  if (type === 'bool') return v ? 'igen' : 'nem'
  if (v === '' || v === null || v === undefined) return '–'
  if (type === 'money' && typeof v === 'number') return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ft'
  const s = String(v)
  return s.length > 80 ? s.slice(0, 77) + '…' : s
}

function diff_(cols, a, b, skip) {
  const out = []
  cols.forEach((c) => {
    const k = c[0]
    if (skip.indexOf(k) !== -1) return
    const x = a[k] === undefined ? '' : a[k]
    const y = b[k] === undefined ? '' : b[k]
    if (String(x) === String(y)) return
    out.push(c[1] + ': ' + fmtLog_(x, c[2]) + ' → ' + fmtLog_(y, c[2]))
  })
  return out.join('\n')
}

// Egy projekt előzményei a naplóból, legújabb elöl
function history_(projectId) {
  if (!projectId) return []
  const sh = SpreadsheetApp.getActive().getSheetByName(LOG_SHEET)
  const last = sh.getLastRow()
  if (last < 2) return []
  const tz = Session.getScriptTimeZone()
  return sh
    .getRange(2, 1, last - 1, LOG_HEADERS.length)
    .getValues()
    .filter((r) => String(r[5]) === String(projectId))
    .reverse()
    .slice(0, 100)
    .map((r) => ({
      ido: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy.MM.dd HH:mm') : String(r[0]),
      ki: r[1],
      muvelet: r[2],
      valtozasok: r[4],
    }))
}

function readLists_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(LISTS_SHEET)
  const values = sh.getDataRange().getValues()
  const out = {}
  values[0].forEach((name, c) => {
    if (!name) return
    out[name] = values
      .slice(1)
      .map((r) => String(r[c]).trim())
      .filter(String)
  })
  return out
}

function rememberListValue_(listName, value) {
  value = String(value || '').trim()
  if (!value) return
  const sh = SpreadsheetApp.getActive().getSheetByName(LISTS_SHEET)
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
  const c = headers.indexOf(listName)
  if (c === -1) return
  const col = sh.getRange(1, c + 1, Math.max(sh.getLastRow(), 1), 1).getValues().map((r) => String(r[0]).trim())
  if (col.indexOf(value) !== -1) return
  let r = col.length
  while (r > 1 && !col[r - 1]) r--
  sh.getRange(r + 1, c + 1).setValue(value)
}

// ===== EGYSZERI ADATÁTVÉTEL a régi Numbers táblából =====
function importData_(data, user) {
  if (!data) throw new Error('Nincs adat')
  if (readAll_('projects').length > 0 && !data.force) throw new Error('A táblázatban már vannak adatok, az importálás nem fut le újra.')
  const now = new Date().toISOString()
  const idByOffer = {}
  const projects = (data.projects || []).map((p) => {
    p.id = newId_('K')
    p.allapot = computeStatus_(p)
    p.letrehozva = p.letrehozva || now
    p.modositva = now
    p.modosito = user
    idByOffer[p._key] = p.id
    return p
  })
  const materials = (data.materials || []).map((m) => {
    m.id = newId_('A')
    m.projekt_id = idByOffer[m._key] || ''
    return m
  })
  const services = (data.services || []).map((s) => Object.assign(s, { id: newId_('S') }))
  bulkWrite_('projects', projects)
  bulkWrite_('materials', materials)
  bulkWrite_('services', services)
  log_(user, 'Importálás', '', projects.length + ' kivitelezés, ' + materials.length + ' anyagtétel a régi táblából', '')
  return { projects: projects.length, materials: materials.length, services: services.length }
}

function bulkWrite_(key, items) {
  if (!items.length) return
  const sh = sheet_(key)
  const idx = colIndex_(key)
  const rows = items.map((item) => {
    const row = new Array(idx.width).fill('')
    Object.keys(idx.map).forEach((k) => (row[idx.map[k].i] = toCell_(item[k], idx.map[k].type)))
    return row
  })
  const formats = new Array(idx.width).fill('General')
  Object.keys(idx.map).forEach((k) => (formats[idx.map[k].i] = FORMATS_[idx.map[k].type]))
  const start = sh.getLastRow() + 1
  const range = sh.getRange(start, 1, rows.length, idx.width)
  range.setNumberFormats(rows.map(() => formats)).setValues(rows)
  Object.keys(idx.map).forEach((k) => {
    if (idx.map[k].type === 'bool') sh.getRange(start, idx.map[k].i + 1, rows.length, 1).insertCheckboxes()
  })
}

// A szerkesztőből egyszer futtatható: létrehozza a lapokat, a szerződés sablont, és jóváhagyatja a jogosultságokat.
function setup() {
  ensureSheets_()
  styleSheets_()
  refreshData_()
  buildDashboard_()
  buildCommissionSheet_()
  renderReports_()
  const tpl = contractTemplate_()
  Logger.log('Kész. Az első belépőkód a "Felhasználók" lapon található.')
  Logger.log('Szerződés sablon (szerkeszthető): ' + tpl.getUrl())
}

// ===== SZERZŐDÉS =====
const CONTRACT_KEYS_ = [
  'szerzodes_pdf', 'szerzodes_keszult', 'szerzodes_kuldve', 'szerzodes_pdf_id', 'szerzodes_ujjlenyomat',
  'ajanlat_pdf', 'ajanlat_keszult', 'ajanlat_kuldve', 'ajanlat_pdf_id', 'ajanlat_ujjlenyomat',
]
// A sablon elrendezésének verziója: ha nő, a rendszer a régi sablont kukába teszi és újat épít
const CONTRACT_TEMPLATE_VERSION_ = '2'
const BRAND_ = { ink: '#0b0b0c', accent: '#ffd833', cream: '#f5f1e8', panel: '#f6f6f4', line: '#e5e5e1', muted: '#5d6068', text: '#141517', zebra: '#fafaf8' }
const BODY_FONT_ = 'Lato'
const HEAD_FONT_ = 'Montserrat'
const HU_MONTHS_ = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december']

const num_ = (v) => (typeof v === 'number' ? v : v === '' || v === null || v === undefined ? NaN : Number(String(v).replace(/\s|Ft/g, '').replace(',', '.')))
const ft_ = (n) => fmtLog_(Math.round(n), 'money')
const huDate_ = (d) => d.getFullYear() + '. ' + HU_MONTHS_[d.getMonth()] + ' ' + d.getDate() + '.'

// A szerződésbe az ajánlati árral rendelkező tételek kerülnek; a csak beszerzési árral rögzített tétel belső költség.
function contractItems_(projectId) {
  return readAll_('materials')
    .filter((m) => m.projekt_id === projectId)
    .map((m) => {
      let netto = num_(m.ajanlat_netto)
      let brutto = num_(m.ajanlat_brutto)
      if (isNaN(netto) && isNaN(brutto)) return null
      if (isNaN(netto)) netto = Math.round(brutto / 1.27)
      if (isNaN(brutto)) brutto = Math.round(netto * 1.27)
      return { nev: m.termek, db: m.db, netto: netto, afa: brutto - netto, brutto: brutto, leiras: m.leiras || '' }
    })
    .filter(Boolean)
}

// Tételek összege, a kedvezménnyel csökkentve (a kedvezmény a végösszegből jön le)
function totals_(items, pct) {
  const list = items.reduce((s, i) => ({ netto: s.netto + i.netto, brutto: s.brutto + i.brutto }), { netto: 0, brutto: 0 })
  const k = Math.max(0, Math.min(100, num_(pct) || 0))
  const dn = Math.round((list.netto * k) / 100)
  const db = Math.round((list.brutto * k) / 100)
  return {
    pct: k,
    list: { netto: list.netto, afa: list.brutto - list.netto, brutto: list.brutto },
    disc: { netto: dn, afa: db - dn, brutto: db },
    netto: list.netto - dn,
    afa: list.brutto - db - (list.netto - dn),
    brutto: list.brutto - db,
  }
}

function contractMissing_(p, items) {
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
  if (!items.length) miss.push('legalább egy tétel ajánlati árral')
  return miss
}

function paymentLines_(p, total) {
  const first = num_(p.reszlet_kiszallitas)
  const second = num_(p.reszlet_kivitelezes)
  const lines = []
  if (!isNaN(first) && first > 0) {
    lines.push('– A rendszer elemeinek kiszállításakor fizetendő összeg: bruttó ' + ft_(first) + '.')
  }
  const rest = !isNaN(second) && second > 0 ? second : total - (isNaN(first) ? 0 : first)
  lines.push('– A kivitelezés befejezését és a sikeres műszaki átadás-átvételt követően fizetendő összeg: bruttó ' + ft_(rest) + '.')
  return lines
}

// Minden, ami a szerződésbe kerül. Az ellenőrzőkód ebből készül: ha az adatok változnak, újra kell generálni küldés előtt.
function contractData_(p) {
  const items = contractItems_(p.id).map((i) => ({ nev: i.nev, db: i.db, netto: i.netto, afa: i.afa, brutto: i.brutto }))
  const tot = totals_(items, p.kedvezmeny)
  const ceg = p.ugyfel_tipus === 'Cég'
  const megrendelo = ceg
    ? [[['Cégnév: ', false], [p.ugyfel_nev, true]], [['Székhely: ' + p.lakcim, false]], [['Cégjegyzékszám: ' + p.cegjegyzekszam, false]], [['Adószám: ' + p.adoszam, false]], [['Képviseli: ' + p.kepviselo, false]]]
    : [[['Név: ', false], [p.ugyfel_nev, true]], [['Lakcím: ' + p.lakcim, false]], [['Anyja neve: ' + p.anyja_neve, false]], [['Születési hely, idő: ' + p.szul_hely_ido, false]]]
  const keszre = /^\d{4}-\d{2}-\d{2}$/.test(p.keszre_jelentes)
    ? huDate_(new Date(Number(p.keszre_jelentes.slice(0, 4)), Number(p.keszre_jelentes.slice(5, 7)) - 1, Number(p.keszre_jelentes.slice(8, 10))))
    : p.keszre_jelentes || '...............'
  const fields = {
    ajanlat_szam: p.ajanlat_szam,
    helyszin: p.cim,
    keszre_jelentes: keszre,
    fizetes_modja: p.fizetes_modja,
    kapcsolattarto: p.kapcsolattarto || (ceg ? p.kepviselo : p.ugyfel_nev),
    kapcsolat_tel: p.telefon || '-',
    kapcsolat_email: p.email || '-',
    alairo_megrendelo: ceg && p.kepviselo ? p.ugyfel_nev + ' – ' + p.kepviselo : p.ugyfel_nev,
  }
  const fizetes = paymentLines_(p, tot.brutto)
  const hash = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify([items, megrendelo, fields, fizetes]), Utilities.Charset.UTF_8),
  )
  fields.kelt = CONFIG.KELT_HELYE + ', ' + huDate_(new Date())
  return { items: items, tot: tot, megrendelo: megrendelo, fields: fields, fizetes: fizetes, hash: hash, missing: contractMissing_(p, items) }
}

function contractFolder_() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('FOLDER_ID')
  if (id) {
    try {
      const f = DriveApp.getFolderById(id)
      if (!f.isTrashed()) return f
    } catch (e) {}
  }
  const f = DriveApp.createFolder(CONFIG.SZERZODES_MAPPA)
  props.setProperty('FOLDER_ID', f.getId())
  return f
}

// A sablon egy közönséges Google Dokumentum a szerződés mappában. Ha törlik, a rendszer újra létrehozza.
function contractTemplate_() {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty('TEMPLATE_ID')
  const current = props.getProperty('TEMPLATE_VERSION') === CONTRACT_TEMPLATE_VERSION_
  if (id) {
    try {
      const f = DriveApp.getFileById(id)
      if (!f.isTrashed() && current) return f
      if (!f.isTrashed()) f.setTrashed(true) // régi elrendezés: újat építünk
    } catch (e) {}
  }
  const doc = DocumentApp.create('SZERZŐDÉS SABLON – szerkeszthető, ne töröld')
  try {
    buildTemplate_(doc)
  } catch (e) {
    DriveApp.getFileById(doc.getId()).setTrashed(true)
    throw e
  }
  doc.saveAndClose()
  const file = DriveApp.getFileById(doc.getId())
  file.moveTo(contractFolder_())
  props.setProperty('TEMPLATE_ID', file.getId())
  props.setProperty('TEMPLATE_VERSION', CONTRACT_TEMPLATE_VERSION_)
  return file
}

// Betűtípus, méret, szín; a félkövér szakaszok a címsor betűtípusát kapják
function applyRuns_(par, runs, opt) {
  opt = opt || {}
  const text = par.editAsText()
  if (!text.getText().length) return par
  text.setFontFamily(opt.font || BODY_FONT_).setFontSize(opt.size || 9.5).setForegroundColor(opt.color || BRAND_.text).setBold(!!opt.bold)
  let pos = 0
  runs.forEach((r) => {
    if (r[1] && r[0].length) {
      text.setBold(pos, pos + r[0].length - 1, true)
      if (!opt.font) text.setFontFamily(pos, pos + r[0].length - 1, HEAD_FONT_)
    }
    pos += r[0].length
  })
  return par
}

// Táblázatcella kitöltése sorokkal: [{ r: [[szöveg, félkövér]], size, color, font, bold, align, after }]
function fillCell_(cell, lines) {
  lines.forEach((ln, i) => {
    const text = ln.r.map((x) => x[0]).join('')
    let par
    if (i === 0) {
      par = cell.getChild(0).asParagraph()
      par.setText(text) // setText nem adja vissza a bekezdést
    } else {
      par = cell.appendParagraph(text)
    }
    par.setSpacingBefore(0).setSpacingAfter(ln.after || 0).setLineSpacing(1.15)
    if (ln.align) par.setAlignment(ln.align)
    applyRuns_(par, ln.r, ln)
  })
}

function styleCells_(table, fn) {
  for (let r = 0; r < table.getNumRows(); r++) {
    const row = table.getRow(r)
    for (let c = 0; c < row.getNumCells(); c++) fn(row.getCell(c), r, c)
  }
}

// Két adatdoboz egymás mellett (köztük keskeny elválasztó oszlop)
function twoBoxes_(body, left, right) {
  const t = body.appendTable([['', '', '']])
  t.setBorderWidth(0)
  ;[234, 13, 234].forEach((w, c) => t.setColumnWidth(c, w))
  styleCells_(t, (cell, r, c) => {
    cell.setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(12).setPaddingRight(12)
    if (c !== 1) cell.setBackgroundColor(BRAND_.panel)
  })
  fillCell_(t.getRow(0).getCell(0), left)
  fillCell_(t.getRow(0).getCell(2), right)
  return t
}

const boxLabel_ = (s) => ({ r: [[s, true]], font: HEAD_FONT_, size: 7.5, color: BRAND_.muted, after: 4 })

// Fekete fejlécsáv a logóval és az elérhetőségekkel, alatta sárga csík (szerződés és ajánlat)
function brandHeader_(body) {
  const A = DocumentApp.HorizontalAlignment
  const head = body.appendTable([['', '']])
  head.setBorderWidth(0)
  head.setColumnWidth(0, 200)
  styleCells_(head, (cell) => {
    cell.setBackgroundColor(BRAND_.ink).setPaddingTop(14).setPaddingBottom(14).setPaddingLeft(16).setPaddingRight(16)
    cell.setVerticalAlignment(DocumentApp.VerticalAlignment.CENTER)
  })
  const logoPar = head.getRow(0).getCell(0).getChild(0).asParagraph()
  logoPar.appendInlineImage(Utilities.newBlob(Utilities.base64Decode(CONTRACT_LOGO), 'image/png', 'logo.png')).setWidth(150).setHeight(62)
  fillCell_(head.getRow(0).getCell(1), [
    { r: [['R-Vill Invest Kft.', true]], color: BRAND_.cream, size: 10, align: A.RIGHT, after: 2 },
    { r: [['Napelemes rendszerek és energiatárolás', false]], color: BRAND_.cream, size: 8.5, align: A.RIGHT, after: 6 },
    { r: [['+36 70 222 5020', true]], color: BRAND_.accent, size: 9, align: A.RIGHT },
    { r: [['ertekesites.szatmarsolar@gmail.com', false]], color: BRAND_.accent, size: 8.5, align: A.RIGHT },
  ])
  const strip = body.appendTable([['']])
  strip.setBorderWidth(0)
  styleCells_(strip, (cell) => cell.setBackgroundColor(BRAND_.accent).setPaddingTop(0).setPaddingBottom(0))
  strip.getRow(0).getCell(0).getChild(0).asParagraph().setSpacingAfter(0).editAsText().setFontSize(2)

}

function brandFooter_(doc) {
  const A = DocumentApp.HorizontalAlignment
  const footer = doc.getFooter() || doc.addFooter()
  footer.clear()
  const f = footer.getParagraphs()[0] || footer.appendParagraph('')
  f.setText('Szatmár Solar  ·  R-Vill Invest Kft.  ·  4755 Ököritófülpös, Petőfi Sándor út 18/E.  ·  Adószám: 32040885-2-15  ·  Cg. 15-09-090294')
  f.setAlignment(A.CENTER)
  applyRuns_(f, [[f.getText(), false]], { size: 7, color: BRAND_.muted })
}

function buildTemplate_(doc) {
  const A = DocumentApp.HorizontalAlignment
  const body = doc.getBody()
  body.clear()
  body.setMarginTop(36).setMarginBottom(42).setMarginLeft(57).setMarginRight(57)
  const join = (runs) => runs.map((r) => r[0]).join('')
  // az üres első bekezdés minél kisebb legyen
  body.getParagraphs()[0].setSpacingAfter(0).setSpacingBefore(0).editAsText().setFontSize(1)

  brandHeader_(body)

  CONTRACT_TEMPLATE.forEach((b) => {
    if (b.t === 'title') {
      const t1 = body.appendParagraph('VÁLLALKOZÁSI SZERZŐDÉS').setAlignment(A.CENTER).setSpacingBefore(20).setSpacingAfter(2)
      applyRuns_(t1, [['VÁLLALKOZÁSI SZERZŐDÉS', true]], { font: HEAD_FONT_, size: 20, color: BRAND_.ink, bold: true })
      const t2 = body.appendParagraph('NAPELEMES RENDSZER ADÁSVÉTELÉRE ÉS TELEPÍTÉSÉRE').setAlignment(A.CENTER).setSpacingAfter(8)
      applyRuns_(t2, [[t2.getText(), false]], { font: HEAD_FONT_, size: 8.5, color: BRAND_.muted })
      const t3 = body.appendParagraph('{{ajanlat_szam}} árajánlat szerint').setAlignment(A.CENTER).setSpacingAfter(16)
      applyRuns_(t3, [[t3.getText(), true]], { size: 10, color: BRAND_.ink })
    } else if (b.t === 'parties') {
      const intro = body.appendParagraph('amely létrejött az alábbi felek között:').setSpacingAfter(6)
      applyRuns_(intro, [[intro.getText(), false]])
      twoBoxes_(
        body,
        [boxLabel_('MEGRENDELŐ'), { r: [['{{BLOCK:MEGRENDELO}}', false]] }, { r: [['mint Megrendelő (a továbbiakban: Megrendelő)', false]], size: 8.5, color: BRAND_.muted }],
        [boxLabel_('VÁLLALKOZÓ')]
          .concat(b.v.map((ln) => ({ r: ln })))
          .concat([{ r: [['mint Vállalkozó (a továbbiakban: Vállalkozó)', false]], size: 8.5, color: BRAND_.muted }]),
      )
      body.appendParagraph('').setSpacingAfter(2)
    } else if (b.t === 'p') {
      const par = body.appendParagraph(join(b.r))
      const sec = b.r.length && b.r[0][1] && /^\d+\.\s*$/.test(b.r[0][0])
      par.setAlignment(A.JUSTIFY).setSpacingBefore(sec ? 10 : 0).setSpacingAfter(6).setLineSpacing(1.2)
      applyRuns_(par, b.r)
    } else if (b.t === 'li') {
      const li = body.appendListItem(join(b.r)).setGlyphType(DocumentApp.GlyphType.BULLET)
      li.setSpacingAfter(2).setLineSpacing(1.2)
      applyRuns_(li, b.r)
    } else if (b.t === 'block') {
      const par = body.appendParagraph('{{BLOCK:' + b.k + '}}').setSpacingAfter(0).setLineSpacing(1.2)
      applyRuns_(par, [[par.getText(), false]])
    } else if (b.t === 'items') {
      const table = body.appendTable([
        ['Megnevezés', 'Mennyiség', 'Nettó', 'Áfa', 'Bruttó'],
        ['{{t_nev}}', '{{t_db}}', '{{t_netto}}', '{{t_afa}}', '{{t_brutto}}'],
        ['Mindösszesen', '', '{{o_netto}}', '{{o_afa}}', '{{o_brutto}}'],
      ])
      table.setBorderColor(BRAND_.line).setBorderWidth(0.5)
      ;[205, 56, 74, 66, 80].forEach((w, c) => table.setColumnWidth(c, w))
      styleCells_(table, (cell, r, c) => {
        cell.setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(6).setPaddingRight(6)
        const par = cell.getChild(0).asParagraph().setAlignment(c >= 2 ? A.RIGHT : A.LEFT).setSpacingAfter(0)
        if (r === 0) {
          cell.setBackgroundColor(BRAND_.ink)
          applyRuns_(par, [[par.getText(), true]], { font: HEAD_FONT_, size: 8, color: BRAND_.cream, bold: true })
        } else if (r === 2) {
          cell.setBackgroundColor(BRAND_.accent)
          applyRuns_(par, [[par.getText(), true]], { font: HEAD_FONT_, size: 9, color: BRAND_.ink, bold: true })
        } else {
          applyRuns_(par, [[par.getText(), false]], { size: 9 })
        }
      })
      body.appendParagraph('').setSpacingAfter(2)
    } else if (b.t === 'contacts') {
      twoBoxes_(
        body,
        [boxLabel_('MEGRENDELŐ KÉPVISELŐJE'), { r: [['{{kapcsolattarto}}', true]], after: 2 }, { r: [['Tel: {{kapcsolat_tel}}', false]] }, { r: [['E-mail: {{kapcsolat_email}}', false]] }],
        [boxLabel_('VÁLLALKOZÓ KÉPVISELŐJE')]
          .concat(b.v.map((s, i) => ({ r: [[s.replace(/^Vállalkozó képviselője:\s*/, ''), i === 0]], after: i === 0 ? 2 : 0 })))
      )
      body.appendParagraph('').setSpacingAfter(2)
    } else if (b.t === 'signature') {
      const m = body.appendParagraph('Mellékletek: árajánlat').setSpacingBefore(10).setSpacingAfter(0)
      applyRuns_(m, [[m.getText(), false]])
      const k = body.appendParagraph('Kelt: {{kelt}}').setSpacingAfter(36)
      applyRuns_(k, [['Kelt: ', false], ['{{kelt}}', true]])
      const sig = body.appendTable([
        ['______________________________', '', '______________________________'],
        ['Megrendelő', '', 'Vállalkozó'],
        ['{{alairo_megrendelo}}', '', 'R-Vill Invest Kft. – Ratiu Sándor ügyvezető'],
      ])
      sig.setBorderWidth(0)
      ;[234, 13, 234].forEach((w, c) => sig.setColumnWidth(c, w))
      styleCells_(sig, (cell, r) => {
        cell.setPaddingTop(1).setPaddingBottom(1)
        const par = cell.getChild(0).asParagraph().setAlignment(A.CENTER).setSpacingAfter(0)
        const opt = r === 0 ? { color: BRAND_.muted } : r === 1 ? { font: HEAD_FONT_, size: 9, bold: true } : { size: 8.5, color: BRAND_.muted }
        applyRuns_(par, [[par.getText(), false]], opt)
      })
    }
  })

  brandFooter_(doc)
}

function fillContract_(body, d) {
  const esc = (s) => String(s === undefined || s === null ? '' : s).replace(/\\/g, '\\\\').replace(/\$/g, '\\$')
  const ph = (k) => '\\{\\{' + k + '\\}\\}'
  Object.keys(d.fields).forEach((k) => body.replaceText(ph(k), esc(d.fields[k])))
  expandBlock_(body, 'MEGRENDELO', d.megrendelo)
  expandBlock_(body, 'FIZETES', d.fizetes.map((t) => [[t, false]]))
  const table = body.getTables().filter((tb) => tb.getText().indexOf('{{t_nev}}') !== -1)[0]
  if (!table) throw new Error('A szerződés sablonból hiányzik a tételtáblázat ({{t_nev}} sor).')
  let tplIdx = -1
  for (let r = 0; r < table.getNumRows(); r++) if (table.getRow(r).getText().indexOf('{{t_nev}}') !== -1) tplIdx = r
  const tplRow = table.getRow(tplIdx)
  d.items.forEach((it, i) => {
    const row = tplRow.copy()
    const vals = { t_nev: it.nev, t_db: it.db, t_netto: ft_(it.netto), t_afa: ft_(it.afa), t_brutto: ft_(it.brutto) }
    Object.keys(vals).forEach((k) => row.replaceText(ph(k), esc(vals[k])))
    table.insertTableRow(tplIdx + 1 + i, row)
    // sávos sorok a könnyebb olvashatóságért
    if (i % 2 === 1) for (let c = 0; c < row.getNumCells(); c++) row.getCell(c).setBackgroundColor(BRAND_.zebra)
  })
  if (d.tot.pct > 0) {
    const row = tplRow.copy()
    const vals = { t_nev: 'Kedvezmény (' + d.tot.pct + '%)', t_db: '', t_netto: '−' + ft_(d.tot.disc.netto), t_afa: '−' + ft_(d.tot.disc.afa), t_brutto: '−' + ft_(d.tot.disc.brutto) }
    Object.keys(vals).forEach((k) => row.replaceText(ph(k), esc(vals[k])))
    table.insertTableRow(tplIdx + 1 + d.items.length, row)
  }
  table.removeRow(tplIdx)
  const tot = { o_netto: d.tot.netto, o_afa: d.tot.afa, o_brutto: d.tot.brutto }
  Object.keys(tot).forEach((k) => table.replaceText(ph(k), esc(ft_(tot[k]))))
}

// Egy {{BLOCK:...}} helyőrző bekezdést több sorra cserél (a helyőrző formázásával); táblázatcellában is működik
function expandBlock_(body, key, lines) {
  const found = body.findText('\\{\\{BLOCK:' + key + '\\}\\}')
  if (!found) return
  const par = found.getElement().getParent().asParagraph()
  const parent = par.getParent()
  const idx = parent.getChildIndex(par)
  const after = par.getSpacingAfter()
  lines.forEach((runs, i) => {
    const np = par.copy()
    np.setText(runs.map((r) => r[0]).join(''))
    np.setSpacingAfter(i === lines.length - 1 ? Math.max(after, 4) : 0)
    parent.insertParagraph(idx + i, np)
    applyRuns_(np, runs)
  })
  par.removeFromParent()
}

function updateProjectFields_(id, fields) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const row = findRow_('projects', id)
    if (!row) throw new Error('Nincs ilyen projekt')
    writeRow_('projects', fields, row)
  } finally {
    lock.releaseLock()
  }
}

function createContract_(projectId, user) {
  const p = readRowById_('projects', projectId)
  if (!p) throw new Error('Nincs ilyen projekt')
  const d = contractData_(p)
  if (d.missing.length) throw new Error('Hiányzó adatok: ' + d.missing.join(', '))
  const folder = contractFolder_()
  const name = 'Szerződés – ' + p.ugyfel_nev + ' – ' + p.ajanlat_szam
  const copy = contractTemplate_().makeCopy(name, folder)
  try {
    const doc = DocumentApp.openById(copy.getId())
    fillContract_(doc.getBody(), d)
    doc.saveAndClose()
    const blob = copy.getAs(MimeType.PDF).setName(name + '.pdf')
    // a korábbi változat a kukába kerül, hogy ne gyűljenek a PDF-ek
    if (p.szerzodes_pdf_id) {
      try {
        DriveApp.getFileById(p.szerzodes_pdf_id).setTrashed(true)
      } catch (e) {}
    }
    const pdf = folder.createFile(blob)
    updateProjectFields_(projectId, {
      szerzodes_pdf: pdf.getUrl(),
      szerzodes_pdf_id: pdf.getId(),
      szerzodes_keszult: new Date().toISOString(),
      szerzodes_ujjlenyomat: d.hash,
      szerzodes_kuldve: '',
      szerzodes_datum: p.szerzodes_datum || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd'),
      allapot: computeStatus_(Object.assign({}, p, { szerzodes_datum: p.szerzodes_datum || 'x' })),
    })
    log_(user, 'Szerződés elkészült', p.ugyfel_nev, d.items.length + ' tétel, bruttó ' + ft_(d.tot.brutto), projectId)
    return { item: readRowById_('projects', projectId), pdf: Utilities.base64Encode(blob.getBytes()), fileName: name + '.pdf' }
  } finally {
    copy.setTrashed(true)
  }
}

function contractPdf_(projectId) {
  return filePdf_(projectId, 'szerzodes_pdf_id')
}

function filePdf_(projectId, key) {
  const p = readRowById_('projects', projectId)
  if (!p || !p[key]) throw new Error('Ehhez az ügyfélhez még nem készült ilyen dokumentum.')
  const file = DriveApp.getFileById(p[key])
  return { pdf: Utilities.base64Encode(file.getBlob().getBytes()), fileName: file.getName() }
}

// ===== ÁRAJÁNLAT =====
function offerTexts_() {
  const out = {}
  OFFER_DEFAULTS.forEach((r) => (out[r[0]] = r[1].replace(/\\n/g, '\n')))
  const sh = SpreadsheetApp.getActive().getSheetByName(OFFER_SHEET)
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 2)
      .getValues()
      .forEach((r) => {
        if (String(r[0]).trim()) out[String(r[0]).trim()] = String(r[1])
      })
  }
  return out
}

const groupNum_ = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

// A rendszer leírása a projekt adataiból (kWp a napelem teljesítményéből és darabszámából)
function systemInfo_(p) {
  const w = (String(p.napelem || '').match(/(\d{3})\s*W/i) || [])[1]
  const db = num_(p.napelem_db)
  const kwp = w && db ? String(Math.round((Number(w) * db) / 10) / 100).replace('.', ',') : ''
  const akku = String(p.energiatarolo || '').trim()
  const alap = (kwp ? kwp + ' kWp-os ' : '') + 'napelemes rendszer'
  let hosszu = alap
  if (db && p.napelem) hosszu += ' (' + db + ' db ' + p.napelem + ')'
  if (p.inverter) hosszu += ', ' + p.inverter + ' inverterrel'
  if (akku) hosszu += ', ' + akku + ' energiatárolóval'
  hosszu += ', teljes kivitelezéssel'
  const rovid = alap.charAt(0).toUpperCase() + alap.slice(1) + (akku ? ' energiatárolóval' : '')
  return { kwp: kwp, db: db, akku: akku, hosszu: hosszu, rovid: rovid }
}

function offerMissing_(p, items) {
  const miss = []
  if (!String(p.ugyfel_nev || '').trim()) miss.push('Ügyfél neve')
  if (!String(p.email || '').trim()) miss.push('E-mail')
  if (!items.length) miss.push('legalább egy tétel ajánlati árral')
  return miss
}

function offerData_(p) {
  const items = contractItems_(p.id)
  const tot = totals_(items, p.kedvezmeny)
  const sys = systemInfo_(p)
  const T = offerTexts_()
  const vars = {
    ugyfel: p.ugyfel_nev,
    nev: p.kapcsolattarto || p.ugyfel_nev,
    osszeg: ft_(tot.brutto),
    osszeg_ezer: groupNum_(tot.brutto / 1000),
    kedvezmeny: tot.pct,
    kedvezmeny_resz: tot.pct ? ', ami ' + tot.pct + '% kedvezményt tartalmaz' : '',
    rendszer: sys.hosszu,
    rendszer_rovid: sys.rovid,
    ertekesito: p.ertekesito || CONFIG.CEG_NEV,
    ajanlat_szam: p.ajanlat_szam || p.id,
  }
  const fill = (s) => String(s || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m))
  const tx = {}
  Object.keys(T).forEach((k) => (tx[k] = fill(T[k])))
  tx.bevezeto = String(p.ajanlat_bevezeto || '').trim() || tx.bevezeto
  const elonyok = tx.elonyok.split('\n').map((s) => s.trim()).filter(String)
  if (sys.akku && tx.elony_akku) elonyok.push(tx.elony_akku)
  const nap = num_(T.ervenyesseg_nap) || 15
  const ma = new Date()
  const ervenyes = new Date(ma.getTime() + nap * 86400000)
  const hash = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, JSON.stringify([items, tot, vars, tx, elonyok, p.cim, p.telefon, p.email]), Utilities.Charset.UTF_8),
  )
  return {
    items: items, tot: tot, sys: sys, vars: vars, tx: tx, elonyok: elonyok,
    kelt: huDate_(ma), ervenyes: huDate_(ervenyes), hash: hash, missing: offerMissing_(p, items),
  }
}

function buildOffer_(doc, p, d) {
  const A = DocumentApp.HorizontalAlignment
  const body = doc.getBody()
  body.clear()
  body.setMarginTop(36).setMarginBottom(42).setMarginLeft(57).setMarginRight(57)
  body.getParagraphs()[0].setSpacingAfter(0).setSpacingBefore(0).editAsText().setFontSize(1)
  brandHeader_(body)
  const para = (text, opt, runs) => {
    const par = body.appendParagraph(text)
    par.setSpacingBefore(opt.before || 0).setSpacingAfter(opt.after === undefined ? 6 : opt.after).setLineSpacing(1.25)
    par.setAlignment(opt.align || A.LEFT)
    applyRuns_(par, runs || [[text, !!opt.bold]], opt)
    if (opt.italic) par.editAsText().setItalic(true)
    return par
  }
  const heading = (text) => para(text.toUpperCase(), { font: HEAD_FONT_, size: 8.5, color: BRAND_.muted, bold: true, before: 14, after: 6 })

  para('ÁRAJÁNLAT', { font: HEAD_FONT_, size: 20, color: BRAND_.ink, bold: true, align: A.CENTER, before: 20, after: 2 })
  para('Ajánlatszám: ' + d.vars.ajanlat_szam + '   ·   Kelt: ' + d.kelt + '   ·   Érvényes: ' + d.ervenyes, { size: 8.5, color: BRAND_.muted, align: A.CENTER, after: 16 })

  const ugyfel = [boxLabel_('AJÁNLAT RÉSZÉRE'), { r: [[p.ugyfel_nev, true]], after: 2 }]
  if (p.cim) ugyfel.push({ r: [[p.cim, false]] })
  if (p.telefon) ugyfel.push({ r: [['Tel: ' + p.telefon, false]] })
  if (p.email) ugyfel.push({ r: [['E-mail: ' + p.email, false]] })
  const rendszer = [boxLabel_('AZ ÖN RENDSZERE'), { r: [[d.sys.rovid, true]], after: 2 }]
  if (d.sys.db && p.napelem) rendszer.push({ r: [['Napelem: ' + d.sys.db + ' db ' + p.napelem, false]] })
  if (p.inverter) rendszer.push({ r: [['Inverter: ' + p.inverter, false]] })
  if (d.sys.akku) rendszer.push({ r: [['Energiatároló: ' + d.sys.akku, false]] })
  if (p.uzemmod) rendszer.push({ r: [[String(p.uzemmod).split('(')[0].trim(), false]], size: 8.5, color: BRAND_.muted })
  twoBoxes_(body, ugyfel, rendszer)

  para('Kedves ' + d.vars.nev + '!', { size: 11, before: 16, after: 6 }, [['Kedves ' + d.vars.nev + '!', true]])
  para(d.tx.bevezeto, { size: 10 })
  para(d.tx.amirol_szo_van, { size: 10, after: 4 })

  // tételek: a termék neve hangsúlyos, az ár kisebb betűvel alatta (ahhoz viszonyítja az árat az olvasó)
  heading('Tételek')
  const rows = d.items.map(() => ['', ''])
  const table = body.appendTable(rows)
  table.setBorderColor(BRAND_.line).setBorderWidth(0.5)
  table.setColumnWidth(1, 120)
  d.items.forEach((it, i) => {
    const left = table.getRow(i).getCell(0)
    const right = table.getRow(i).getCell(1)
    ;[left, right].forEach((c) => c.setPaddingTop(7).setPaddingBottom(7).setPaddingLeft(8).setPaddingRight(8))
    const l = [{ r: [[it.nev, true]], size: 10.5, color: BRAND_.ink }]
    if (it.leiras) l.push({ r: [[it.leiras, false]], size: 8.5, color: BRAND_.muted, italic: true })
    fillCell_(left, l)
    if (it.leiras) left.getChild(1).asParagraph().editAsText().setItalic(true)
    fillCell_(right, [
      { r: [[it.db || '', false]], size: 8, color: BRAND_.muted, align: A.RIGHT },
      { r: [[ft_(it.brutto), false]], size: 8.5, color: BRAND_.muted, align: A.RIGHT },
    ])
  })
  body.appendParagraph('').setSpacingAfter(2)

  // összesítés
  const sumLines = []
  if (d.tot.pct > 0) {
    sumLines.push(['Listaár (bruttó)', ft_(d.tot.list.brutto), false])
    sumLines.push(['Kedvezmény (' + d.tot.pct + '%)', '−' + ft_(d.tot.disc.brutto), false])
  }
  sumLines.push(['A teljes beruházás bruttó összege', ft_(d.tot.brutto), true])
  const sum = body.appendTable(sumLines.map((s) => [s[0], s[1]]))
  sum.setBorderWidth(0)
  sum.setColumnWidth(1, 150)
  sumLines.forEach((s, i) => {
    const row = sum.getRow(i)
    const last = i === sumLines.length - 1
    ;[0, 1].forEach((c) => {
      const cell = row.getCell(c)
      cell.setPaddingTop(last ? 8 : 3).setPaddingBottom(last ? 8 : 3).setPaddingLeft(10).setPaddingRight(10)
      if (last) cell.setBackgroundColor(BRAND_.accent)
      const par = cell.getChild(0).asParagraph().setAlignment(c === 1 ? A.RIGHT : A.LEFT).setSpacingAfter(0)
      const opt = !last ? { size: 9, color: BRAND_.muted } : c === 0 ? { font: HEAD_FONT_, size: 10.5, color: BRAND_.ink, bold: true } : { size: 9.5, color: BRAND_.ink }
      applyRuns_(par, [[par.getText(), last && c === 0]], opt)
    })
  })
  if (d.tot.pct > 0) para(d.tx.kedvezmeny, { size: 9, color: BRAND_.muted, italic: true, before: 6 })

  heading('Amit ez a rendszer ad')
  d.elonyok.forEach((e) => {
    const li = body.appendListItem(e).setGlyphType(DocumentApp.GlyphType.BULLET)
    li.setSpacingAfter(3).setLineSpacing(1.2)
    applyRuns_(li, [[e, false]], { size: 10 })
  })

  heading('Miért velünk?')
  para(d.tx.bizalom, { size: 10 })
  para(d.tx.dontes_koltsege, { size: 10, italic: true, color: BRAND_.muted })

  heading('Egy mondatban')
  para(d.tx.egy_mondatban_cim, { size: 9, color: BRAND_.muted, after: 4 })
  const quote = body.appendTable([['„' + d.tx.egy_mondatban + '”']])
  quote.setBorderWidth(0)
  const qc = quote.getRow(0).getCell(0)
  qc.setBackgroundColor(BRAND_.panel).setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(14).setPaddingRight(14)
  const qp = qc.getChild(0).asParagraph().setSpacingAfter(0)
  applyRuns_(qp, [[qp.getText(), false]], { size: 10.5, color: BRAND_.ink })
  qp.editAsText().setItalic(true)

  heading('Hogyan tovább?')
  para(d.tx.tovabb_cim, { size: 10, after: 6 })
  const opts = body.appendTable([['1', '', '2']])
  opts.setBorderWidth(0)
  ;[234, 13, 234].forEach((w, c) => opts.setColumnWidth(c, w))
  ;[[0, d.tx.opcio_1, d.tx.opcio_1_reszlet], [2, d.tx.opcio_2, d.tx.opcio_2_reszlet]].forEach((o, n) => {
    const cell = opts.getRow(0).getCell(o[0])
    cell.setBackgroundColor(n === 0 ? BRAND_.ink : BRAND_.panel).setPaddingTop(10).setPaddingBottom(10).setPaddingLeft(12).setPaddingRight(12)
    fillCell_(cell, [
      { r: [[(n + 1) + '. ' + o[1], true]], size: 10, color: n === 0 ? BRAND_.accent : BRAND_.ink, after: 3 },
      { r: [['→ ' + o[2], false]], size: 9, color: n === 0 ? BRAND_.cream : BRAND_.text },
    ])
  })

  para('Üdvözlettel:', { size: 10, before: 18, after: 0 })
  para(d.vars.ertekesito, { size: 10, after: 0 }, [[d.vars.ertekesito, true]])
  para(CONFIG.CEG_NEV + ' – R-Vill Invest Kft.  ·  +36 70 222 5020  ·  ' + CONFIG.REPLY_TO, { size: 8.5, color: BRAND_.muted })
  brandFooter_(doc)
}

function createOffer_(projectId, user) {
  const p = readRowById_('projects', projectId)
  if (!p) throw new Error('Nincs ilyen projekt')
  const d = offerData_(p)
  if (d.missing.length) throw new Error('Hiányzó adatok: ' + d.missing.join(', '))
  const folder = contractFolder_()
  const name = 'Árajánlat – ' + p.ugyfel_nev + ' – ' + d.vars.ajanlat_szam
  const doc = DocumentApp.create(name)
  const file = DriveApp.getFileById(doc.getId())
  try {
    buildOffer_(doc, p, d)
    doc.saveAndClose()
    const blob = file.getAs(MimeType.PDF).setName(name + '.pdf')
    if (p.ajanlat_pdf_id) {
      try {
        DriveApp.getFileById(p.ajanlat_pdf_id).setTrashed(true)
      } catch (e) {}
    }
    const pdf = folder.createFile(blob)
    updateProjectFields_(projectId, {
      ajanlat_pdf: pdf.getUrl(),
      ajanlat_pdf_id: pdf.getId(),
      ajanlat_keszult: new Date().toISOString(),
      ajanlat_ujjlenyomat: d.hash,
      ajanlat_kuldve: '', // az új változat még nincs elküldve (a korábbi küldés a Naplóban látszik)
    })
    log_(user, 'Árajánlat elkészült', p.ugyfel_nev, d.items.length + ' tétel, bruttó ' + ft_(d.tot.brutto) + (d.tot.pct ? ' (' + d.tot.pct + '% kedvezménnyel)' : ''), projectId)
    const mail = offerMail_(d, user)
    return { item: readRowById_('projects', projectId), pdf: Utilities.base64Encode(blob.getBytes()), fileName: name + '.pdf', subject: mail.subject, emailText: mail.body }
  } finally {
    file.setTrashed(true)
  }
}

// A levél a nyílászárós minta szerkezetét követi; a szövegek az "Ajánlat szövegek" lapról jönnek
function offerMail_(d, user) {
  const tx = d.tx
  const lines = ['Kedves ' + d.vars.nev + '!', '', tx.bevezeto, tx.amirol_szo_van, '', 'A teljes beruházás bruttó összege:', d.vars.osszeg, '', 'Csatoltan küldöm a részletes ajánlatot.', '', 'Amit ez a rendszer ad:']
  d.elonyok.forEach((e) => lines.push('• ' + e))
  lines.push('', tx.bizalom)
  if (d.tot.pct > 0) lines.push('', tx.kedvezmeny)
  lines.push('', tx.dontes_koltsege, '', tx.egy_mondatban_cim, '„' + tx.egy_mondatban + '”', '', tx.tovabb_cim)
  lines.push('1️⃣ ' + tx.opcio_1, '→ ' + tx.opcio_1_reszlet, '2️⃣ ' + tx.opcio_2, '→ ' + tx.opcio_2_reszlet)
  lines.push('', 'Üdvözlettel:', user, CONFIG.CEG_NEV + ' – R-Vill Invest Kft.', '+36 70 222 5020')
  const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const html = [
    '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.55;color:#141517;max-width:620px">',
    '<p>Kedves ' + h(d.vars.nev) + '!</p>',
    '<p>' + h(tx.bevezeto) + '<br>' + h(tx.amirol_szo_van) + '</p>',
    '<p style="margin:18px 0 2px;font-size:16px"><b>A teljes beruházás bruttó összege:</b></p>',
    '<p style="margin:0 0 18px;font-size:14px;color:#3a3d42">' + h(d.vars.osszeg) + '</p>',
    '<p>Csatoltan küldöm a részletes ajánlatot.</p>',
    '<p style="margin-bottom:4px"><b>Amit ez a rendszer ad:</b></p><ul style="margin-top:0">' + d.elonyok.map((e) => '<li>' + h(e) + '</li>').join('') + '</ul>',
    '<p>' + h(tx.bizalom) + '</p>',
    d.tot.pct > 0 ? '<p>' + h(tx.kedvezmeny) + '</p>' : '',
    '<p><i>' + h(tx.dontes_koltsege) + '</i></p>',
    '<p style="margin-bottom:4px">' + h(tx.egy_mondatban_cim) + '</p>',
    '<p style="margin-top:0;padding:12px 16px;background:#f6f6f4;border-left:4px solid #ffd833"><i>„' + h(tx.egy_mondatban) + '”</i></p>',
    '<p style="margin-bottom:4px">' + h(tx.tovabb_cim) + '</p>',
    '<p style="margin:0 0 8px">1️⃣ <b>' + h(tx.opcio_1) + '</b><br>→ ' + h(tx.opcio_1_reszlet) + '</p>',
    '<p style="margin:0 0 16px">2️⃣ <b>' + h(tx.opcio_2) + '</b><br>→ ' + h(tx.opcio_2_reszlet) + '</p>',
    '<p>Üdvözlettel:<br><b>' + h(user) + '</b><br>' + h(CONFIG.CEG_NEV) + ' – R-Vill Invest Kft.<br>+36 70 222 5020</p>',
    '</div>',
  ].join('')
  return { subject: tx.targy, body: lines.join('\n'), html: html }
}

function sendOffer_(projectId, user) {
  const p = readRowById_('projects', projectId)
  if (!p || !p.ajanlat_pdf_id) throw new Error('Előbb készítsd el az árajánlatot.')
  const to = String(p.email || '').split('|').map((s) => s.trim()).filter(String).join(',')
  if (!to) throw new Error('Az ügyfélnek nincs e-mail címe.')
  const d = offerData_(p)
  if (d.hash !== p.ajanlat_ujjlenyomat) {
    throw new Error('Az adatok változtak az ajánlat elkészítése óta. Készítsd el újra, nézd át, és utána küldd el.')
  }
  const mail = offerMail_(d, user)
  const cc = String(CONFIG.NOTIFY_EMAILS || '').trim()
  const msg = {
    to: to,
    subject: mail.subject,
    body: mail.body,
    htmlBody: mail.html,
    name: CONFIG.CEG_NEV,
    replyTo: CONFIG.REPLY_TO,
    attachments: [DriveApp.getFileById(p.ajanlat_pdf_id).getBlob()],
  }
  if (cc) msg.cc = cc
  MailApp.sendEmail(msg)
  updateProjectFields_(projectId, { ajanlat_kuldve: new Date().toISOString() })
  log_(user, 'Árajánlat elküldve', p.ugyfel_nev, 'Címzett: ' + to + ', bruttó ' + ft_(d.tot.brutto) + (cc ? '\nMásolat: ' + cc : ''), projectId)
  return readRowById_('projects', projectId)
}

function sendContract_(projectId, user) {
  const p = readRowById_('projects', projectId)
  if (!p || !p.szerzodes_pdf_id) throw new Error('Előbb készítsd el a szerződést.')
  const to = String(p.email || '').split('|').map((s) => s.trim()).filter(String).join(',')
  if (!to) throw new Error('Az ügyfélnek nincs e-mail címe.')
  if (contractData_(p).hash !== p.szerzodes_ujjlenyomat) {
    throw new Error('Az adatok változtak a szerződés elkészítése óta. Készítsd el újra, nézd át, és utána küldd el.')
  }
  const cc = String(CONFIG.NOTIFY_EMAILS || '').trim()
  const body = [
    'Tisztelt ' + (p.kapcsolattarto || (p.ugyfel_tipus === 'Cég' ? 'Partnerünk' : p.ugyfel_nev)) + '!',
    '',
    'Mellékelten küldjük a napelemes rendszer telepítésére vonatkozó vállalkozási szerződést a(z) ' + p.ajanlat_szam + ' számú árajánlat alapján.',
    'Kérjük, nézze át. Ha kérdése van, válaszoljon erre a levélre, vagy hívja munkatársunkat.',
    '',
    'Üdvözlettel:',
    user,
    CONFIG.CEG_NEV + ' – R-Vill Invest Kft.',
  ].join('\n')
  const mail = {
    to: to,
    subject: 'Vállalkozási szerződés ' + p.ugyfel_nev + ' részére – ' + p.ajanlat_szam,
    body: body,
    name: CONFIG.CEG_NEV,
    replyTo: CONFIG.REPLY_TO,
    attachments: [DriveApp.getFileById(p.szerzodes_pdf_id).getBlob()],
  }
  if (cc) mail.cc = cc
  MailApp.sendEmail(mail)
  updateProjectFields_(projectId, { szerzodes_kuldve: new Date().toISOString() })
  log_(user, 'Szerződés elküldve', p.ugyfel_nev, 'Címzett: ' + to + (cc ? '\nMásolat: ' + cc : ''), projectId)
  return readRowById_('projects', projectId)
}

// ===== SZERZŐDÉS SABLON =====
// A "Szerződési minta.docx" szövegéből generálva. A rendszer ebből egyszer létrehozza a sablont Google
// Dokumentumként a Drive-on; utána a szöveg ott, a Dokumentumban szabadon szerkeszthető.
// {{...}} = a rendszer tölti ki. t: p=bekezdés, li=felsorolás, items=tételtáblázat, block=több soros mező,
// title/parties/contacts/signature = a márkás elrendezés elemei (lásd buildTemplate_)
const CONTRACT_TEMPLATE = [
  {"t": "title"},
  {"t": "parties", "v": [[["R-Vill Invest Kft.", true]], [["Székhely: 4755 Ököritófülpös, Petőfi Sándor út 18/E.", false]], [["Cégjegyzékszáma: 15-09-090294", false]], [["Adószáma: 32040885-2-15", false]], [["Bankszámlaszáma: 11744041-24440785-00000000", false]], [["Képviseli: Ratiu Sándor - ügyvezető", false]]]},
  {"t": "p", "r": [["A továbbiak együttesen, mint ", false], ["Felek", true], [", külön-külön, mint ", false], ["Fél", true], [" között, alulírott napon és helyen az alábbi feltételek szerint:", false]]},
  {"t": "p", "r": [["2. ", true], ["Megrendelő ezennel megrendeli a Vállalkozótól a Megrendelő által kiválasztott napelemes rendszer telepítését, a Vállalkozó pedig a megrendelés teljesítését a jelen szerződésben szabályozott feltételek szerint elvállalja. A telepítendő rendszer elemeit, a kapcsolódó szolgáltatások díját és a megvalósítás helyszínét az árajánlat tartalmazza.", false]], "sec": true},
  {"t": "p", "r": [["3.", true], [" Szerződő Felek megállapodnak és a Vállalkozó kötelezettséget vállal arra, hogy megvalósítja az alábbiakban meghatározott tárgyú munkákat (a továbbiakban: Munkák), s a jótállási/garanciális/szavatossági kötelezettségeinek eleget tesz minden tekintetben, a Szerződés előírásainak megfelelően. ", false]], "sec": true},
  {"t": "p", "r": [["4.", true], [" Szerződéses munka általános leírása: napelemes rendszer telepítése", false]], "sec": true},
  {"t": "p", "sec": false, "r": [["4.1. Megvalósítási helyszín: {{helyszin}}", true]]},
  {"t": "p", "r": [["4.2. Az elvégzendő munkák megnevezése: ", true]]},
  {"t": "li", "r": [["a rendszer elemeinek beszerzése; a telepítés helyszínére szállítása", false]]},
  {"t": "li", "r": [["a rendszer helyszíni összeszerelése, ellenőrzése és üzembe helyezése, a vonatkozó műszaki,", false]]},
  {"t": "li", "r": [["biztonsági és hálózati csatlakozási feltételek teljesülésével;", false]]},
  {"t": "li", "r": [["a rendszerhez kapcsolódó tervezés és hálózati elosztói ügyintézés, az elfogadott árajánlatban meghatározott tartalommal", false]]},
  {"t": "li", "r": [["monitoring rendszer kiépítése ", false]]},
  {"t": "p", "r": [["5.", true], [" Felek megállapodnak, hogy Vállalkozó a Munka tárgyát, mint Kivitelező készíti el. Felek jelen szerződés szerinti munkák maradéktalan, határidőben és a Megrendelő megelégedésére történő elvégzésének ellenértékeként", false]], "sec": true},
  {"t": "items"},
  {"t": "p", "r": [["amely a Megrendelő által jóváhagyott és mellékelt árajánlaton alapszik.", false]]},
  {"t": "p", "r": [["5.1.", true], [" ", false], ["Jótállási és garanciális feltételek", true], [": A Vállalkozó az általa elvégzett kivitelezési és telepítési munkákra azok szerződésszerű befejezésének és műszaki átadás-átvételének napjától számított 3 év jótállást vállal. A beépített berendezésekre vonatkozó gyártói garancia időtartamát és feltételeit a mellékelt árajánlat és a kapcsolódó garanciális dokumentumok tartalmazzák. A gyártói garancia mellett a Vállalkozó a jogszabály alapján fennálló szavatossági és kötelező jótállási kötelezettségeit is teljesíti. Vállalkozó a fentebb meghatározott szolgáltatásokat a jelen szerződésben foglaltaknak, a jogszabályi előírásoknak, szakmai előírásoknak megfelelően, a Megrendelő által közölt utasítások szerint, az általában elvárható I. osztályú szakértelemmel, színvonalon és minőségben köteles teljesíteni. Vállalkozó kijelenti és szavatolja, hogy a fentebb meghatározott szolgáltatások terén megfelelő szakmai hozzáértéssel rendelkezik.", false]]},
  {"t": "p", "r": [["5.3.", true], [" A Megrendelő kijelenti, hogy a szerződés tárgyát képező munka pénzügyi fedezete a rendelkezésére áll.", false]]},
  {"t": "p", "r": [["5.4.  ", true], ["A Vállalkozó a rendelkezésére bocsátott dokumentációt és a helyszíni felmérés során megismerhető adottságokat a tőle elvárható szakmai gondossággal megvizsgálta. A felismert hiányosságokról, műszaki akadályokról és a szükséges további vizsgálatokról a Megrendelőt tájékoztatja. A feltárt hiányosságokat, műszaki akadályokat és a szükséges további vizsgálatokat a Felek a felmérési dokumentációban vagy más írásbeli dokumentumban rögzítik.", false]]},
  {"t": "p", "r": [["5.5. ", true], [" A Vállalkozó a szerződésben és mellékleteiben vállalt tervezési, ügyintézési, kivitelezési és üzembe helyezési feladatokat a vonatkozó jogszabályoknak, az alkalmazandó műszaki és biztonsági követelményeknek, valamint a hálózati elosztó előírásainak megfelelően köteles teljesíteni. A Vállalkozó a vállalt ügyintézés körében köteles a szükséges dokumentumokat szakszerűen és megfelelő időben elkészíteni, benyújtani, valamint a felmerülő hiánypótlásokat teljesíteni. A Megrendelő köteles az ehhez szükséges adatokat, nyilatkozatokat és meghatalmazásokat rendelkezésre bocsátani. A hálózati elosztó és a hatóság döntése, illetve eljárási időtartama nem a Vállalkozó rendelkezésétől függ. A Vállalkozó azonban felel a vállalt ügyintézés szerződésszerű teljesítéséért, ideértve az általa igénybe vett közreműködők tevékenységét is. A Vállalkozó köteles szavatossági és jótállási kötelezettségeit teljesíteni.", false]]},
  {"t": "p", "r": [["6. ", true], ["A munkavégzés megkezdésére a Felek által előzetesen egyeztetett időpontban, a szerződés hatálybalépésétől számított legfeljebb 60 napon belül kerül sor. Ha a munkakezdést a szükséges hálózati elosztói jóváhagyás, hatósági engedély vagy hozzájárulás hiánya, illetve a szükséges fázisbővítés, amperbővítés, mérőhely-szabványosítás vagy más előkészítő munka elmaradása ténylegesen akadályozza, a munkakezdési határidő az akadályoztatás igazolható időtartamával meghosszabbodik, amennyiben a késedelemért a Vállalkozó nem felelős. Csak az adott munkafázis megkezdéséhez ténylegesen szükséges feltétel hiánya vehető figyelembe. Az egyidejűleg fennálló akadályok időtartama nem számítható fel többszörösen. A Vállalkozó az akadályról, annak okáról, várható időtartamáról és a határidőre gyakorolt hatásáról indokolatlan késedelem nélkül írásban tájékoztatja a Megrendelőt.", false]], "sec": true},
  {"t": "p", "r": [["6.1. ", true], ["A helyszíni kivitelezési munkák befejezésének és műszaki átadás-átvételének határideje a helyszíni kivitelezési munkák megkezdésétől számított 60 nap. A teljesítési határidő a munkavégzést ténylegesen akadályozó körülmény igazolható időtartamával meghosszabbodik, amennyiben az akadály miatti késedelemért a Vállalkozó nem felelős. A Vállalkozó köteles az akadály következményeinek csökkentése érdekében az észszerűen elvárható intézkedéseket megtenni, és a Megrendelőt írásban tájékoztatni. A Vállalkozó saját, illetve az általa igénybe vett közreműködő olyan késedelme vagy mulasztása, amelyért a jogszabályok szerint felelős, nem alapoz meg automatikus határidő- hosszabbítást. A határidő meghosszabbodása nem érinti a Megrendelő jogszabály alapján fennálló elállási, felmondási és egyéb igényeit. A kivitelezési munkák műszaki átadás-átvétele és a hálózati elosztó közreműködését igénylő üzembe helyezés külön esemény. A felszerelés műszaki átvétele önmagában nem jelenti a hátralévő üzembe helyezési és ügyintézési feladatok teljesítését, és nem jogosít engedély nélküli hálózati üzemeltetésre.", false]]},
  {"t": "p", "r": [["A Vállalkozó által vállalt készre jelentés benyújtásának határideje: {{keszre_jelentes}}", false]]},
  {"t": "p", "r": [["A még hátralévő ügyintézési és üzembe helyezési feladatokat, azok felelősét és teljesítésük feltételeit a Felek az átadás-átvételi jegyzőkönyvben rögzítik.", false]]},
  {"t": "p", "r": [["6.2. ", true], ["A Felek az alábbi fizetési ütemezésben állapodnak meg. A fizetési ütemezés önmagában nem módosítja a Vállalkozó által vállalt feladatokat, és nem jelenti a még el nem végzett munkák, ügyintézési vagy üzembe helyezési feladatok teljesítettnek tekintését.", false]]},
  {"t": "p", "r": [["6.3. ", true], ["A vállalkozói díj megfizetésének ütemezése:", false]]},
  {"t": "block", "k": "FIZETES"},
  {"t": "p", "r": [["Fizetés módja: ", false], ["{{fizetes_modja}}", true]]},
  {"t": "p", "r": [["A megfizetett összegek a vállalkozói díjba teljes egészében beszámítanak. A Vállalkozó a díjbekérőket és számlákat a tényleges teljesítési eseményekhez és az alkalmazandó adójogi előírásokhoz igazodva bocsátja ki, a megfizetett előlegeket elszámolja. A Megrendelő jogszabályon alapuló visszatartási és egyéb jogai fennmaradnak. A Megrendelő a teljesítési határidő előtti, előzetesen egyeztetett teljesítést elfogadja.", false]]},
  {"t": "p", "r": [["6.4. ", true], ["A Vállalkozó az átadás-átvétel során átadja a jogszabályban és a szerződésben előírt, az adott teljesítési szakaszhoz kapcsolódó dokumentumokat. A feltárt hibákat, hiányosságokat, a szükséges javításokat és azok határidejét a Felek jegyzőkönyvben rögzítik. Az átvétel olyan kisebb hiba miatt nem tagadható meg, amelynek fennállása, illetve kijavítása vagy pótlása nem akadályozza a rendeltetésszerű használatot. Az átadás-átvétel és a számlázás nem korlátozza a Megrendelő szavatossági, jótállási, visszatartási és egyéb jogszabályon alapuló jogait.", false]]},
  {"t": "p", "r": [["6.5.", true], [" A munka befejezéseként, de legkésőbb a teljesítési határidőként meghatározott időpontban a Szerződő Felek átadás-átvételi eljárást tartanak, melyről jegyzőkönyvet vesznek fel. ", false]]},
  {"t": "p", "r": [["6.6.", true], [" ", false]]},
  {"t": "p", "r": [["Ha az elvégzett kivitelezési vagy telepítési munka nem felel meg a szerződésben vállalt műszaki és minőségi követelményeknek, a Vállalkozó a hibás teljesítésért a jogszabályok és a vállalt jótállás szerint köteles helytállni. A megalapozott kijavítási igény teljesítése a Vállalkozó költségére történik. Amennyiben a megfelelő kijavítás csak az érintett munkarész újbóli elvégzésével biztosítható, a kijavítás erre is kiterjed. A feltárt hibákat és a javítás várható határidejét írásban rögzíteni kell. A jegyzőkönyv aláírásának elmaradása önmagában nem akadálya a Megrendelő igényérvényesítésének.", false]]},
  {"t": "p", "r": [["6.7.", true], ["  A Vállalkozó a szerződés és mellékletei, valamint a Megrendelő által átadott dokumentumok tartalmát a tőle elvárható szakmai gondossággal ellenőrizte. A felismerhető hiányosságokról, ellentmondásokról és a szükséges további vizsgálatokról köteles a Megrendelőt tájékoztatni.", false]]},
  {"t": "p", "r": [["6.8. ", true], ["A Vállalkozó a vállalkozói díjat az elfogadott műszaki tartalom, az átadott dokumentumok és a helyszíni felmérés során megismerhető körülmények alapján határozta meg. Ha a kivitelezés során olyan körülmény merül fel, amely megfelelő szakmai gondosság mellett előzetesen sem volt felismerhető, és a teljesítést befolyásolja, a Vállalkozó erről indokolatlan késedelem nélkül írásban tájékoztatja a Megrendelőt. E körülmény önmagában nem jogosítja fel a Vállalkozót a díj egyoldalú megemelésére. A szükséges intézkedéseket és az esetleges elszámolást a Felek a szerződés és a jogszabályok szerint rendezik.", false]]},
  {"t": "p", "r": [["6.9.  ", true], ["A Vállalkozó a szerződésben és annak mellékleteiben meghatározott műszaki tartalom teljes körű, szerződésszerű megvalósítását vállalja.", false]]},
  {"t": "p", "r": [["6.10. ", true], ["A vállalkozói díj a meghatározott műszaki tartalomra vonatkozó átalánydíj. Az e körbe tartozó munkák és anyagok árának változása önmagában nem jogosítja fel a Vállalkozót a díj egyoldalú módosítására.", false]]},
  {"t": "p", "r": [["6.11. A", true], [" vállalkozói díj tartalmazza a vállalt műszaki tartalom teljesítésének munka-, anyag- és", false]]},
  {"t": "p", "r": [["egyéb költségeit. A szükséges fázisbővítés, amperbővítés, mérőhely-szabványosítás és egyéb előkészítő munkák műszaki tartalmát, elvégzésük és ügyintézésük felelősét, valamint költségviselésüket a Felek az árajánlatban vagy külön írásbeli mellékletben rögzítik. Az esetleges külön fizetendő elosztói és hatósági díjakat, illetve azok számítási módját is fel kell tüntetni. Az ilyen munkák díjának kizárása nem mentesíti a Vállalkozót a felismerhető műszaki feltételekre vonatkozó előzetes tájékoztatási és figyelmeztetési kötelezettsége alól.", false]]},
  {"t": "p", "r": [["6.12. ", true], ["A többletmunka és a pótmunka teljesítésére, valamint elszámolására a Ptk. rendelkezései irányadók. Az utólag megrendelt pótmunkák műszaki tartalmát, díját és a határidőre gyakorolt hatását a Felek a munkák megkezdése előtt írásban rögzítik. A Vállalkozó a felmerülő többletmunkáról és annak esetleges költségkövetkezményéről a Megrendelőt indokolatlan késedelem nélkül tájékoztatja.", false]]},
  {"t": "p", "r": [["6.13.", true], ["  A Megrendelő a vállalkozói díjat a szerződésben meghatározott fizetési ütemezés szerint köteles megfizetni. A díj megfizetése nem érinti a Vállalkozó fennmaradó teljesítési, szavatossági és jótállási kötelezettségeit, valamint a Megrendelő jogszabályon alapuló visszatartási és egyéb jogait.", false]]},
  {"t": "p", "r": [["7.", true], [" A Vállalkozó a kivitelezési munkák szerződés szerinti befejezési határidejének olyan okból történő elmulasztása esetén, amelyért felelős, a nettó vállalkozói díj 0,5%-ának megfelelő késedelmi kötbért köteles fizetni minden késedelmes naptári nap után. A késedelmi kötbér teljes összege legfeljebb a nettó vállalkozói díj 10%-a. A késedelem megállapításakor a szerződés alapján indokoltan meghosszabbított teljesítési határidő az irányadó. A Vállalkozó mentesül a kötbérfizetési kötelezettség alól, ha szerződésszegését a jogszabályok szerint kimenti. A Vállalkozó 30 napot meghaladó késedelme esetén a Megrendelő jogosult a szerződéstől elállni, illetve – ha az eredeti állapot természetben nem állítható helyre – azt felmondani. Ha a Vállalkozó pénzügyi helyzetében olyan lényeges változás következik be, amely a szerződés teljesítését ténylegesen veszélyezteti, erről a Megrendelőt 8 napon belül írásban tájékoztatja. A Megrendelő az ilyen körülményből eredő jogait az alkalmazandó jogszabályok szerint gyakorolhatja. Egyéb szerződésszegés esetén a Megrendelő a jogszabályban meghatározott feltételekkel jogosult elállásra vagy felmondásra. Ahol jogszabály megfelelő póthatáridő biztosítását írja elő, annak eredménytelenül kell eltelnie. E rendelkezések nem korlátozzák a Megrendelő jogszabály alapján fennálló további megszüntetési jogait. A szerződés megszűnésekor a Felek a megszűnés jogcímének megfelelően elszámolnak. Az elszámolás során figyelembe kell venni a megfizetett összegeket, a teljesített szolgáltatásokat, a berendezések visszaadásának vagy megtartásának körülményeit, valamint az adott megszűnési jogcímhez kapcsolódó kötelező jogszabályi rendelkezéseket. A Megrendelő a késedelmi kötbér mellett a kötbért meghaladó kárát is érvényesítheti.", false]], "sec": true},
  {"t": "p", "r": [["8.", true], [" A Vállalkozó az általa elvégzett kivitelezési és telepítési munkákra azok szerződésszerű befejezésének és műszaki átadás-átvételének napjától számított 3 év jótállást vállal.", false]], "sec": true},
  {"t": "p", "r": [["9.  ", true], ["A Vállalkozó felel az árajánlatban meghatározott rendszer szerződésszerű kialakításáért és működéséért. A jótállás körébe tartozó meghibásodás esetén a hibabejelentéstől számított 3 munkanapon belül megkezdi a hiba elhárítását. Ez nem érinti a Megrendelő jogszabály alapján fennálló jogait..", false]], "sec": true},
  {"t": "p", "r": [["10.  ", true], ["A Megrendelő a szerződés teljesítésével kapcsolatban utasítást adhat a Vállalkozónak. Az utasítás nem terjedhet ki a munkavégzés megszervezésére, és nem teheti a teljesítést terhesebbé. Célszerűtlen vagy szakszerűtlen utasítás esetén a Vállalkozó köteles a Megrendelőt figyelmeztetni. Ha a Megrendelő a figyelmeztetés ellenére fenntartja az utasítását, a Vállalkozó a Ptk. 6:240. § (2) bekezdésében foglaltak szerint elállhat a szerződéstől, vagy a feladatot a Megrendelő utasítása szerint, a Megrendelő kockázatára végezheti el. A Vállalkozó köteles megtagadni az utasítás teljesítését, ha annak végrehajtása jogszabály vagy hatósági határozat megsértéséhez vezetne, illetve mások személyét vagy vagyonát veszélyeztetné. A szerződésben meghatározott műszaki tartalom módosítását, annak díját és a teljesítési határidőre gyakorolt hatását a Felek írásban rögzítik.", false]], "sec": true},
  {"t": "p", "r": [["11.", true], [" Az ajánlatban feltüntetett termékek és berendezések beszerzése a Vállalkozó kötelezettsége. Ha valamely termék a kellő időben leadott megrendelés ellenére nem szerezhető be, a Vállalkozó erről a Megrendelőt haladéktalanul írásban tájékoztatja, megjelölve a beszerzés várható időpontját és az esetleges helyettesítési lehetőséget. Helyettesítő termék kizárólag a Megrendelő előzetes írásbeli hozzájárulásával építhető be. A helyettesítő termék műszaki paraméterei, minősége és jótállási feltételei az eredetileg meghatározottnál nem lehetnek kedvezőtlenebbek, és a helyettesítés a vállalkozói díj növekedésével nem járhat. A Felek a beszerzési akadály megoldása érdekében együttműködnek. Szükség esetén az eredeti termék későbbi szállításáról vagy helyettesítő termék alkalmazásáról, valamint az ezekhez igazodó teljesítési határidőről írásban állapodnak meg. A késedelmet a Felek által írásban módosított határidő figyelembevételével kell megítélni. Ha a határidő módosításakor már késedelem áll fenn, a Felek annak következményeit a megállapodásban külön rendezik. Megállapodás hiányában a beszerzési akadály határidőre gyakorolt hatását és a késedelemért való felelősséget a szerződés és a jogszabályok alapján kell megítélni. A kivitelezés során keletkező hulladékok jogszabályoknak megfelelő elszállításáról és az arra jogosult átvevő részére történő átadásáról a Vállalkozó gondoskodik.", false]], "sec": true},
  {"t": "p", "r": [["12.", true], [" A megvalósítási  helyszínen a Felek közötti kapcsolattartás a Felek képviselői útján történik. ", false]], "sec": true},
  {"t": "contacts", "v": ["Vállalkozó képviselője: Ratiu Sándor", "Tel: +36702225020", "E-mail: ertekesites.szatmarsolar@gmail.com"]},
  {"t": "p", "r": [["A Felek kijelölt képviselői jogosultak a kivitelezéssel kapcsolatos minden olyan jognyilatkozat megtételére, ami nem igényli a jelen szerződés módosítását.", false]]},
  {"t": "p", "r": [["13.", true], [" Felek a szerződés teljesítése során kölcsönösen együttműködve kötelesek eljárni. Mindkét felet tájékoztatási és figyelmeztetési kötelezettség terheli a szerződés teljesítését befolyásoló bármely körülményt illetően. Mindkét fél köteles a károk megelőzése és az esetleg már bekövetkezett károk enyhítése érdekében minden tőle elvárható intézkedést megtenni.", false]], "sec": true},
  {"t": "p", "r": [["14.", true], [" Felek jelen szerződést - amely 2 (kettő) egymással szó szerint megegyező eredeti példányban készült – elolvasása, értelmezése és megértése után, mint akaratukkal mindenben megegyezőt írják alá.", false]], "sec": true},
  {"t": "signature"},
]

// Az oldal logója (fekete alapon), a fekete fejlécsávba kerül
const CONTRACT_LOGO = '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/WL33zJ46+2ymQWf64bSCFYiuqDihgTFsSgp5CJpEBHjIIcBMCdJsJrgILAg4QUXfd+jaNv99+2Uqa0OWxYIABlBg2yvFsIKy7kICHjWWac7tpVOGiFQirgZ7RBRac9DRbGiYrScvEeks5mM62ZFxLIsv+RkjImVlD/xwMO//fbbGokFsVj0umuvKSouAXAXeUCyBoo8/vjj77//Pq6JjHE/ZbztNlu98MIzHas61s6fF4uEAEQbI0iu60WjUScSHf3Jx//5z7Uff/J54bGxGucE/UbUTdctfuX+XXp00+m508KWg7YBMYAMbNuc85KIbQA7PwjJrIYQIAiY1u6x53zZqdueW29W4dbMdygkCNrWSlvEq7w2geBycmLWHdR3l522Tafjtk0KSVgIgBFACJVyXS9aVJpIJD7/asy06TOamhqjkWj37t0HrjOwe+dOaIUy8SbPc5VtKaJUPHnPPffhGto6wobjDbVg0sbo5odo2BSXdUgkm9bghpChe+313DOP2LZKxGtDISXILKIFDFN5Zbdp0ybfeNPFD9z/gNam0GS5GpOlCYEFOlbaj9y5d4+ubrpxnhONoEEAXjjacg0Sr2cRIqxPZ0ee+tHrT+6xTp9G05RREiHXH/Eua3zD08477VpUWtFYt8CxncK1iwCCYAwXlZS8+957V1xx1bhx441Z6Nx17dZ1i003PnD//YfutWdFx051CxaUVlQ+/+xT48f/sKaGhIhoKWUphSjNgR4NrOKds8tvDY31bNgDsGwHEbUxIlBSXplKuXfffdd1110/a9asQgPJ6t07jHlH9rp/b7b+oMZs41TLXpghW1ONWZTCP2bFjz3js9rGnhALGyPKAAqv2WlBH/I22WRTAMFFWxFFQFicUGjs2LGHHjr822+/ZxZfLkEphYhzZs959fW3Rh57wrY77vLfG24EImVbd9x5p88jhMDWnLuDlVJffPHVeedfFCspc12jtThOpKS86qMPP9p99z1OO+30WbNmKaUKycHVHAQVMsvOG/c8clhXXT8qZCcRXUK1xl/UxohS+PXEeYee9K2LA40DrJKrY4C/VH6Nf8n26tVDjMZFp536F7QTitz5v7vicddx7EL5zxjTXEXml19/O+eiS/bca++LL7zo6zHjAOSfWULFNfnuMEqphx554qknnymv6hSJFc+ZPffE40/cfY+9P//8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eV7nzp2323bbdDxBSM0RUIQRlee5RcXlr7708onHnlodry18fSabfeHFV955572bbr7hpOOPSiYSuNwakiLCxpSUlj7y8CNn/uucRCLp/372nDkTf/zpqaefvff+R/r161NbW7tso0uCnOBKrJYQARH+Ojvx79u/2mn/Nw448rs7H9DjfqlIS7dYZXmorFRFolYkSo6DloOg0AczZjaatWbPY63FGDFajBY2hY2bbcIsYpTlhKIc61Sms5tfe0ndWVd8l/F1wFeOkISf72OWF55/affd99n/gEM++/zz0pKScChkjMHFsbgJmpL1p59xco8e3Qt5OmzL/OEk/3f22dvtuFtTQ0PIsZlNLiWF6PerhsLR8d+Oveb6G5qTb/xbevDg3QCVItXafTZGFxWX3n333RdfejVKTvbZ/1KllFLWW+9+dPQxR3ieZ1nWnw4XLbQSK6V4SS+jQmNya/mGxSkURIqK3nv3valTp1uW5Xme37KmtbYsa9LPv73yymvhopJFQwQCQG1MpKTkvXfemfjHZEsp3eyNtm3//vsfTz/9dKS4RGvdPOTP/0CSJ9hvttnmnTp31drzCYCFTmQR8TzPCcc+++yLQ484qimdKI4WNz9x4XA4kUydcsoZ73/wQSwWY14u+WG/6zlWXPz1V1+feOIpiUQyEokUmqyVUkTWt9+Nffa55xCtZVNksJZBXMSv5wsCrPLz1OHvJhICCCEgUWPKe3PUjDdHzSh2cGD/ko3WVesP7NlnrYpOHctLY1JcbIXDWaWaLMtSyim0SSIKAedSZYX6QyGz7Z8CNsCScMv+mBr/7PMpTzz96dhfG/yMuqzMyN/3DoiIjXntjXdff/PdEcOHXX3lFWv17RNvalLYqkggYJNiI9269DjkkP1uueUuImWMbn3h+n7QuusMPP+Cc5ON1USkGYCU79MJICplWLTAGWednclm/Kl4uTICMxEOWrsfuyknZAmb5g0zzBIOxyZN+umif19FREZAtG4xM9Nx7A8++e7uex44///OjcebFPkjBqnNaom/876DTACLAU2fSCLt6KUtZIiRWYCsr8d+56fDWmda33t/1LEnnsjMZCnM8/XEn4uNNPa775u1IS7yxk9Hf3b6GadYlqWNwbxbrbXO1XDzgyE33Gh9yg/P8t/oLyCR8lmS/3fhRZlsRlkqm8o2Z7/78MrM5533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'

// ===== ÁTTEKINTÉS, JUTALÉK =====
const DATA_SHEET = '_adat'
const DASH_SHEET = 'Áttekintés'
const COMM_SHEET = 'Jutalékok'
const DATA_HEADERS = [
  'Azonosító', 'Ügyfél', 'Értékesítő', 'Hónap', 'Év', 'Hó', 'Állapot', 'Szerződött',
  'Nettó árbevétel', 'Bruttó árbevétel', 'Beszerzési költség', 'Haszon', 'Jutalék (%)', 'Jutalék (Ft)',
  'Ajánlat elküldve', 'Ajánlat hónap', 'Ajánlat év',
]
const HU_MONTH_NAMES_ = ['Január', 'Február', 'Március', 'Április', 'Május', 'Június', 'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December']

// Projektenként egy sor a kimutatásokhoz. Árbevétel: a tételek ajánlati ára kedvezménnyel (ha nincs tétel, a projekt nettó összege).
// Szerződött = van szerződés dátuma vagy pipa, és nincs visszamondva; a hónap a szerződés dátumából jön.
function refreshData_() {
  const ss = SpreadsheetApp.getActive()
  let sh = ss.getSheetByName(DATA_SHEET)
  if (!sh) {
    sh = ss.insertSheet(DATA_SHEET)
    sh.hideSheet()
  }
  const comm = commissionTable_()
  const materials = readAll_('materials')
  const byProject = {}
  materials.forEach((m) => (byProject[m.projekt_id] = byProject[m.projekt_id] || []).push(m))
  const ym = (v) => {
    const s = String(v || '')
    return /^\d{4}-\d{2}/.test(s) ? s.slice(0, 7) : ''
  }
  const rows = readAll_('projects').map((p) => {
    const ms = byProject[p.id] || []
    const priced = ms
      .map((m) => {
        let n = num_(m.ajanlat_netto)
        let b = num_(m.ajanlat_brutto)
        if (isNaN(n) && isNaN(b)) return null
        if (isNaN(n)) n = Math.round(b / 1.27)
        if (isNaN(b)) b = Math.round(n * 1.27)
        return { netto: n, afa: b - n, brutto: b }
      })
      .filter(Boolean)
    let netto
    let brutto
    if (priced.length) {
      const tot = totals_(priced, p.kedvezmeny)
      netto = tot.netto
      brutto = tot.brutto
    } else {
      netto = num_(p.netto) || 0
      brutto = num_(p.brutto) || Math.round(netto * 1.27)
    }
    const koltseg = ms.reduce((s, m) => {
      let c = num_(m.beszerzes_netto)
      if (isNaN(c)) c = Math.round((num_(m.beszerzes_brutto) || 0) / 1.27)
      return s + (isNaN(c) ? 0 : c)
    }, 0)
    const haszon = netto - koltseg
    const szerzodott = !p.lemondva && (!!p.szerzodes || !!p.szerzodes_datum) ? 1 : 0
    const honap = szerzodott ? ym(p.szerzodes_datum) || ym(p.letrehozva) : ''
    const raw = String(p.ertekesito || '').trim()
    const c = comm[normName_(raw)] || { pct: 0, base: 'Nettó ár' }
    // a Felhasználók lapon szereplő írásmóddal, hogy egy ember egy sorban szerepeljen
    const nev = c.name || raw || '(nincs megadva)'
    const jutalek = szerzodott ? Math.round(((c.base === 'Haszon' ? haszon : netto) * c.pct) / 100) : 0
    const ajHonap = ym(p.ajanlat_kuldve)
    return [
      p.id, p.ugyfel_nev, nev, honap, honap ? Number(honap.slice(0, 4)) : '', honap ? Number(honap.slice(5, 7)) : '', p.allapot, szerzodott,
      netto, brutto, koltseg, haszon, c.pct, jutalek,
      ajHonap ? 1 : 0, ajHonap, ajHonap ? Number(ajHonap.slice(0, 4)) : '',
    ]
  })
  sh.clearContents()
  // a "2026-11" formájú hónapokat szövegként tároljuk, különben a táblázat dátummá alakítaná
  ;['Hónap', 'Ajánlat hónap'].forEach((h) => sh.getRange(1, DATA_HEADERS.indexOf(h) + 1, sh.getMaxRows(), 1).setNumberFormat('@'))
  sh.getRange(1, 1, 1, DATA_HEADERS.length).setValues([DATA_HEADERS])
  if (rows.length) sh.getRange(2, 1, rows.length, DATA_HEADERS.length).setValues(rows)
  // választólisták forrása: évek és hónapok
  const years = {}
  const months = {}
  rows.forEach((r) => {
    if (r[4]) years[r[4]] = 1
    if (r[16]) years[r[16]] = 1
    if (r[3]) months[r[3]] = 1
  })
  const thisYear = new Date().getFullYear()
  years[thisYear] = 1
  months[Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM')] = 1
  const yl = Object.keys(years).sort().reverse()
  const ml = Object.keys(months).sort().reverse()
  sh.getRange(1, 20, Math.max(sh.getMaxRows(), 2), 2).clearContent()
  sh.getRange(1, 20, yl.length + 1, 1).setValues([['Évek']].concat(yl.map((y) => [Number(y)])))
  sh.getRange(1, 21, ml.length + 1, 1).setNumberFormat('@').setValues([['Hónapok']].concat(ml.map((m) => [m])))
  renderReports_(rows)
}

// Az _adat lap sorai objektumként
function dataRows_(rows) {
  if (!rows) {
    const sh = SpreadsheetApp.getActive().getSheetByName(DATA_SHEET)
    rows = sh && sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, DATA_HEADERS.length).getValues() : []
  }
  return rows
    .filter((r) => r[0])
    .map((r) => ({
      ugyfel: r[1], ertekesito: r[2], honap: String(r[3] || ''), ev: Number(r[4]) || 0, ho: Number(r[5]) || 0, allapot: r[6],
      szerzodott: Number(r[7]) === 1, netto: Number(r[8]) || 0, koltseg: Number(r[10]) || 0, haszon: Number(r[11]) || 0,
      pct: Number(r[12]) || 0, jutalek: Number(r[13]) || 0, ajanlat: Number(r[14]) === 1, ajEv: Number(r[16]) || 0,
    }))
}

function renderReports_(rows) {
  const d = dataRows_(rows)
  if (SpreadsheetApp.getActive().getSheetByName(DASH_SHEET)) renderDashboard_(d)
  if (SpreadsheetApp.getActive().getSheetByName(COMM_SHEET)) renderCommission_(d)
}

// Egyszerű trigger: az év vagy a jutalék hónapjának átváltásakor újraszámol
function onEdit(e) {
  try {
    const sh = e.range.getSheet()
    if (sh.getName() !== DASH_SHEET) return
    const a1 = e.range.getA1Notation()
    if (a1 === 'C4' || a1 === 'K4') renderDashboard_(dataRows_())
  } catch (err) {}
}

const DASH_ = { monthTop: 13, statusRows: ['Ajánlat', 'Kivitelezésre vár', 'Utómunka', 'Lezárva', 'Visszamondva'], sellerTop: 21, sellerMax: 15 }
// A csempék helye: értékcellák B7 E7 H7 K7 / B10 E10 H10 K10
const KPI_ = [
  ['Szerződött ügyfelek', '0" db"'],
  ['Nettó árbevétel', '#,##0" Ft"'],
  ['Beszerzési költség', '#,##0" Ft"'],
  ['Haszon (nettó)', '#,##0" Ft"'],
  ['Haszonkulcs', '0.0%'],
  ['Fizetendő jutalék', '#,##0" Ft"'],
  ['Kiküldött ajánlatok', '0" db"'],
  ['Ajánlatból szerződés', '0%'],
]
const kpiCell_ = (i) => ({ row: i < 4 ? 7 : 10, col: 2 + (i % 4) * 3 })
const headStyle_ = (rng) => rng.setBackground(BRAND_.ink).setFontColor(BRAND_.cream).setFontWeight('bold').setFontFamily('Montserrat').setFontSize(9)

function buildDashboard_() {
  const ss = SpreadsheetApp.getActive()
  const old = ss.getSheetByName(DASH_SHEET)
  if (old) ss.deleteSheet(old)
  const sh = ss.insertSheet(DASH_SHEET, 0)
  sh.setHiddenGridlines(true)
  sh.setColumnWidth(1, 18)
  sh.setColumnWidths(2, 12, 112)
  sh.setColumnWidth(14, 18)
  const ink = BRAND_.ink
  const accent = BRAND_.accent
  const font = 'Montserrat'
  sh.getRange('A1:N80').setFontFamily('Lato').setFontSize(10).setFontColor(BRAND_.text).setVerticalAlignment('middle')

  sh.setRowHeight(1, 52)
  sh.getRange('A1:N1').setBackground(ink)
  sh.getRange('B1:M1').merge().setValue('SZATMÁR SOLAR ONE  ·  ÁTTEKINTÉS').setFontFamily(font).setFontSize(16).setFontWeight('bold').setFontColor(BRAND_.cream)
  sh.setRowHeight(2, 5)
  sh.getRange('A2:N2').setBackground(accent)
  sh.setRowHeight(3, 14)

  sh.setRowHeight(4, 30)
  sh.getRange('B4').setValue('Év').setFontWeight('bold').setFontColor(BRAND_.muted)
  const year = sh.getRange('C4')
  year.setValue(new Date().getFullYear()).setBackground(accent).setFontWeight('bold').setHorizontalAlignment('center').setFontFamily(font)
  year.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(ss.getSheetByName(DATA_SHEET).getRange('T2:T'), true).build())
  sh.getRange('D4:G4').merge().setValue('← válaszd ki az évet').setFontColor(BRAND_.muted).setFontSize(9)
  sh.getRange('I4:J4').merge().setValue('Jutalék hónapja').setFontWeight('bold').setFontColor(BRAND_.muted).setHorizontalAlignment('right')
  const month = sh.getRange('K4')
  month.setNumberFormat('@').setValue(Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM'))
  month.setBackground(accent).setFontWeight('bold').setHorizontalAlignment('center').setFontFamily(font)
  month.setDataValidation(SpreadsheetApp.newDataValidation().requireValueInRange(ss.getSheetByName(DATA_SHEET).getRange('U2:U'), true).build())

  KPI_.forEach((k, i) => {
    const c = kpiCell_(i)
    sh.getRange(c.row - 1, c.col, 1, 2).merge().setValue(k[0]).setFontSize(8.5).setFontWeight('bold').setFontColor(BRAND_.muted)
    sh.getRange(c.row, c.col, 1, 2).merge().setNumberFormat(k[1]).setFontFamily(font).setFontSize(15).setFontWeight('bold').setFontColor(ink)
    sh.getRange(c.row - 1, c.col, 2, 2).setBackground(BRAND_.panel).setBorder(true, true, true, true, false, false, BRAND_.line, SpreadsheetApp.BorderStyle.SOLID)
    sh.getRange(c.row - 1, c.col, 2, 1).setBorder(null, true, null, null, null, null, accent, SpreadsheetApp.BorderStyle.SOLID_THICK)
  })
  ;[6, 9].forEach((r) => sh.setRowHeight(r, 22))
  ;[7, 10].forEach((r) => sh.setRowHeight(r, 34))

  const mt = DASH_.monthTop
  sh.getRange(mt - 1, 2).setValue('HAVI BONTÁS').setFontFamily(font).setFontWeight('bold')
  headStyle_(sh.getRange(mt, 2, 1, 6).setValues([['Hónap', 'Szerződés', 'Nettó árbevétel', 'Költség', 'Haszon', 'Jutalék']]))
  sh.getRange(mt + 1, 2, 12, 1).setValues(HU_MONTH_NAMES_.map((m) => [m]))
  for (let m = 2; m <= 12; m += 2) sh.getRange(mt + m, 2, 1, 6).setBackground(BRAND_.zebra)
  sh.getRange(mt + 13, 2).setValue('Összesen')
  sh.getRange(mt + 13, 2, 1, 6).setBackground(accent).setFontWeight('bold')
  sh.getRange(mt + 1, 4, 13, 4).setNumberFormat('#,##0" Ft"')
  sh.getRange(mt + 1, 3, 13, 1).setNumberFormat('0').setHorizontalAlignment('center')

  sh.getRange(mt - 1, 9).setValue('ÁLLAPOTOK (ÖSSZES)').setFontFamily(font).setFontWeight('bold')
  headStyle_(sh.getRange(mt, 9, 1, 2).setValues([['Állapot', 'Ügyfél']]))
  sh.getRange(mt + 1, 9, DASH_.statusRows.length, 1).setValues(DASH_.statusRows.map((s) => [s]))
  sh.getRange(mt + 1, 10, DASH_.statusRows.length, 1).setHorizontalAlignment('center')

  const st = DASH_.sellerTop
  sh.getRange(st - 1, 9).setValue('ÉRTÉKESÍTŐK – A KIVÁLASZTOTT HÓNAPBAN').setFontFamily(font).setFontWeight('bold')
  headStyle_(sh.getRange(st, 9, 1, 5).setValues([['Értékesítő', 'Szerződés', 'Nettó árbevétel', 'Jutalék %', 'Jutalék (Ft)']]))
  sh.getRange(st + 1, 10, DASH_.sellerMax, 1).setHorizontalAlignment('center')
  sh.getRange(st + 1, 11, DASH_.sellerMax, 1).setNumberFormat('#,##0" Ft"')
  sh.getRange(st + 1, 12, DASH_.sellerMax, 1).setNumberFormat('0.##"%"').setHorizontalAlignment('center')
  sh.getRange(st + 1, 13, DASH_.sellerMax, 1).setNumberFormat('#,##0" Ft"')

  const colors = [ink, accent, '#9aa0a6']
  sh.insertChart(
    sh.newChart().setChartType(Charts.ChartType.COLUMN)
      .addRange(sh.getRange(mt, 2, 13, 1)).addRange(sh.getRange(mt, 4, 13, 1)).addRange(sh.getRange(mt, 6, 13, 1))
      .setNumHeaders(1).setPosition(39, 2, 0, 0)
      .setOption('title', 'Nettó árbevétel és haszon havonta').setOption('colors', colors).setOption('legend', { position: 'bottom' })
      .setOption('width', 660).setOption('height', 320)
      .build(),
  )
  sh.insertChart(
    sh.newChart().setChartType(Charts.ChartType.PIE)
      .addRange(sh.getRange(mt, 9, 6, 2)).setNumHeaders(1).setPosition(39, 9, 30, 0)
      .setOption('title', 'Ügyfelek állapot szerint').setOption('pieHole', 0.45)
      .setOption('colors', ['#9aa0a6', '#155b9b', '#c77700', '#1e8e3e', '#c0392b'])
      .setOption('width', 420).setOption('height', 320)
      .build(),
  )
  sh.insertChart(
    sh.newChart().setChartType(Charts.ChartType.LINE)
      .addRange(sh.getRange(mt, 2, 13, 1)).addRange(sh.getRange(mt, 3, 13, 1))
      .setNumHeaders(1).setPosition(56, 2, 0, 0)
      .setOption('title', 'Szerződések száma havonta').setOption('colors', [accent]).setOption('legend', { position: 'none' })
      .setOption('width', 660).setOption('height', 260).setOption('pointSize', 6)
      .build(),
  )
  sh.setFrozenRows(2)
  ss.setActiveSheet(sh)
}

// A műszerfal számai (a kiválasztott év és hónap szerint)
function renderDashboard_(d) {
  const sh = SpreadsheetApp.getActive().getSheetByName(DASH_SHEET)
  if (!sh) return
  const year = Number(sh.getRange('C4').getValue()) || new Date().getFullYear()
  const month = String(sh.getRange('K4').getDisplayValue() || '')
  const sum = (list, k) => list.reduce((s, x) => s + x[k], 0)
  const yr = d.filter((x) => x.szerzodott && x.ev === year)
  const netto = sum(yr, 'netto')
  const haszon = sum(yr, 'haszon')
  const offers = d.filter((x) => x.ajanlat && x.ajEv === year)
  const kpis = [
    yr.length, netto, sum(yr, 'koltseg'), haszon, netto ? haszon / netto : 0, sum(yr, 'jutalek'),
    offers.length, offers.length ? offers.filter((x) => x.szerzodott).length / offers.length : 0,
  ]
  kpis.forEach((v, i) => {
    const c = kpiCell_(i)
    sh.getRange(c.row, c.col).setValue(v)
  })
  const mt = DASH_.monthTop
  const months = []
  for (let m = 1; m <= 12; m++) {
    const l = yr.filter((x) => x.ho === m)
    months.push([l.length, sum(l, 'netto'), sum(l, 'koltseg'), sum(l, 'haszon'), sum(l, 'jutalek')])
  }
  months.push([0, 1, 2, 3, 4].map((c) => months.reduce((s, r) => s + r[c], 0)))
  sh.getRange(mt + 1, 3, 13, 5).setValues(months)
  sh.getRange(mt + 1, 10, DASH_.statusRows.length, 1).setValues(DASH_.statusRows.map((s) => [d.filter((x) => x.allapot === s).length]))

  const st = DASH_.sellerTop
  const area = sh.getRange(st + 1, 9, DASH_.sellerMax, 5)
  area.clearContent().setFontStyle('normal').setFontColor(BRAND_.text)
  const by = {}
  d.filter((x) => x.szerzodott && x.honap === month).forEach((x) => {
    const s = (by[x.ertekesito] = by[x.ertekesito] || [x.ertekesito, 0, 0, x.pct, 0])
    s[1]++
    s[2] += x.netto
    s[4] += x.jutalek
  })
  const sellers = Object.keys(by).map((k) => by[k]).sort((a, b) => b[2] - a[2]).slice(0, DASH_.sellerMax)
  if (sellers.length) sh.getRange(st + 1, 9, sellers.length, 5).setValues(sellers)
  else sh.getRange(st + 1, 9).setValue('Ebben a hónapban még nincs szerződés.').setFontStyle('italic').setFontColor(BRAND_.muted)
}

// Havi jutalékkimutatás: sorok a hónapok, oszlopok az értékesítők
function buildCommissionSheet_() {
  const ss = SpreadsheetApp.getActive()
  const old = ss.getSheetByName(COMM_SHEET)
  if (old) ss.deleteSheet(old)
  const sh = ss.insertSheet(COMM_SHEET, 1)
  sh.setHiddenGridlines(true)
  sh.setColumnWidth(1, 18)
  sh.setColumnWidths(2, 14, 140)
  sh.setRowHeight(1, 44)
  sh.getRange('A1:P1').setBackground(BRAND_.ink)
  sh.getRange('B1:H1').merge().setValue('JUTALÉKOK HAVONTA').setFontFamily('Montserrat').setFontSize(14).setFontWeight('bold').setFontColor(BRAND_.cream)
  sh.setRowHeight(2, 5)
  sh.getRange('A2:P2').setBackground(BRAND_.accent)
  sh.getRange('B3:H3').merge().setValue('A szerződés hónapja számít (1-jétől a hónap végéig). A jutalék mértéke és alapja a Felhasználók lapon állítható.').setFontSize(9).setFontColor(BRAND_.muted)
  sh.setFrozenRows(5)
}

function renderCommission_(d) {
  const sh = SpreadsheetApp.getActive().getSheetByName(COMM_SHEET)
  if (!sh) return
  sh.getRange(5, 2, Math.max(sh.getMaxRows() - 4, 1), 15).clear()
  const list = d.filter((x) => x.szerzodott && x.honap)
  if (!list.length) {
    sh.getRange(5, 2).setValue('Még nincs szerződés.').setFontStyle('italic').setFontColor(BRAND_.muted)
    return
  }
  const sellers = Array.from(new Set(list.map((x) => x.ertekesito))).sort().slice(0, 13)
  const months = Array.from(new Set(list.map((x) => x.honap))).sort().reverse()
  const table = [['Hónap'].concat(sellers).concat(['Összesen'])]
  months.forEach((m) => {
    const row = sellers.map((s) => list.filter((x) => x.honap === m && x.ertekesito === s).reduce((a, x) => a + x.jutalek, 0))
    table.push([m].concat(row).concat([row.reduce((a, b) => a + b, 0)]))
  })
  const w = table[0].length
  sh.getRange(5, 2, table.length, w).setValues(table)
  headStyle_(sh.getRange(5, 2, 1, w))
  sh.getRange(6, 2, table.length - 1, 1).setNumberFormat('@').setFontWeight('bold')
  sh.getRange(6, 3, table.length - 1, w - 1).setNumberFormat('#,##0" Ft"').setFontFamily('Lato').setFontSize(10)
  sh.getRange(6, 1 + w, table.length - 1, 1).setFontWeight('bold').setBackground(BRAND_.panel)
  for (let r = 7; r < 5 + table.length; r += 2) sh.getRange(r, 2, 1, w - 1).setBackground(BRAND_.zebra)
}

// A rendszerlapok kinézete: márkás fejléc, sávos sorok, színes állapot, szűrő, technikai oszlopok elrejtve
function styleSheets_() {
  const ss = SpreadsheetApp.getActive()
  Object.keys(SHEETS).forEach((key) => {
    const sh = sheet_(key)
    const idx = colIndex_(key)
    const width = idx.width
    const head = sh.getRange(1, 1, 1, width)
    head.setBackground(BRAND_.ink).setFontColor(BRAND_.cream).setFontWeight('bold').setFontFamily('Montserrat').setFontSize(9).setWrap(true).setVerticalAlignment('middle')
    sh.setRowHeight(1, 44)
    const rows = Math.max(sh.getMaxRows() - 1, 1)
    const body = sh.getRange(2, 1, rows, width)
    body.setFontFamily('Lato').setFontSize(10).setVerticalAlignment('middle')
    sh.getBandings().forEach((b) => b.remove())
    const band = sh.getRange(1, 1, sh.getMaxRows(), width).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
    band.setHeaderRowColor(BRAND_.ink).setFirstRowColor('#ffffff').setSecondRowColor(BRAND_.zebra)
    if (sh.getFilter()) sh.getFilter().remove()
    sh.getRange(1, 1, sh.getMaxRows(), width).createFilter()
    // technikai oszlopok elrejtése
    ;['id', 'projekt_id', 'szerzodes_pdf_id', 'szerzodes_ujjlenyomat', 'ajanlat_pdf_id', 'ajanlat_ujjlenyomat'].forEach((k) => {
      if (idx.map[k]) sh.hideColumns(idx.map[k].i + 1)
    })
    if (key === 'projects') {
      const col = idx.map.allapot.i + 1
      const rng = sh.getRange(2, col, rows, 1)
      const colorOf = { Ajánlat: ['#eef0f2', '#3a3d42'], 'Kivitelezésre vár': ['#dbe8f5', '#155b9b'], Utómunka: ['#fdecd3', '#8a5200'], Lezárva: ['#dcf1e2', '#1e6b34'], Visszamondva: ['#f8dcd8', '#a12d21'] }
      const rules = sh.getConditionalFormatRules().filter((r) => !r.getRanges().some((x) => x.getColumn() === col))
      Object.keys(colorOf).forEach((s) => {
        rules.push(SpreadsheetApp.newConditionalFormatRule().whenTextEqualTo(s).setBackground(colorOf[s][0]).setFontColor(colorOf[s][1]).setBold(true).setRanges([rng]).build())
      })
      sh.setConditionalFormatRules(rules)
      ;['ugyfel_nev', 'cim', 'napelem', 'inverter', 'energiatarolo', 'aramszolg_ugyintezes', 'megjegyzes', 'uzemmod'].forEach((k) => {
        if (idx.map[k]) sh.setColumnWidth(idx.map[k].i + 1, k === 'ugyfel_nev' ? 190 : 230)
      })
    }
  })
}
