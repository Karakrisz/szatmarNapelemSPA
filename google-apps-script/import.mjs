// Egyszeri adatátvétel a régi Numbers táblából a Google táblázatba.
// Használat: node google-apps-script/import.mjs <webalkalmazás URL> <név> <belépőkód> <data.json>
// (név + kód: egy aktív felhasználó a Felhasználók lapról)
// A data.json-t a Numbers-exportból készített átalakító állítja elő (ügyféladatok, ne kerüljön a repóba).
import { readFileSync } from 'node:fs'

const [url, user, pin, file] = process.argv.slice(2)
if (!url || !user || !pin || !file) {
  console.error('Használat: node google-apps-script/import.mjs <URL> <név> <kód> <data.json>')
  process.exit(1)
}

const data = JSON.parse(readFileSync(file, 'utf8'))
const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ action: 'import', pin, user, data }),
})
console.log(await res.text())
