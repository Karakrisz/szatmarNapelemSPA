# Kivitelezések – Google háttér beállítása

Az oldal (`/kivitelezesek`) egy Google táblázatba ír és onnan olvas. A táblázat mögött ez az Apps Script fut.

Táblázat: https://docs.google.com/spreadsheets/d/18uajJ0zgYGyVBueVRa36ya0aoWis_FsfUgoyqOuxKkU/edit

## Egyszeri beállítás (kb. 5 perc)

1. Nyisd meg a táblázatot → **Bővítmények → Apps Script**.
2. Töröld ki a `Code.gs` tartalmát, és másold be ennek a mappának a `Code.gs` fájlját.
3. A fájl tetején a `CONFIG` résznél a `NOTIFY_EMAILS`-hez írd be, kik kapjanak e-mailt új ügyfél rögzítésekor (vesszővel elválasztva).
4. Mentés (💾), majd felül a függvényválasztóban válaszd a `setup` függvényt → **Futtatás** → engedélyezd a hozzáférést.
   (Ez létrehozza a lapokat: Kivitelezések, Anyagok, Éves szolgáltatások, Listák, Felhasználók, Napló.)
5. A **Felhasználók** lapon már van egy `Admin` sor egy generált kóddal. Írd át a saját nevedre, és vedd fel a kollégákat is: név, legalább 8 karakteres kód, Aktív pipa.
6. **Telepítés → Új telepítés** → típus: **Webalkalmazás**
   - Végrehajtás mint: **Én**
   - Hozzáférés: **Bárki**
   - Telepítés → másold ki a **webalkalmazás URL-jét** (`https://script.google.com/macros/s/.../exec`).
7. Az URL kerüljön a buildbe: `NUXT_PUBLIC_KIV_API_URL=<URL> npm run generate`
   (vagy írd be közvetlenül a `nuxt.config.ts` `runtimeConfig.public.kivApiUrl` értékének).

## Régi adatok átvétele (egyszer)

```bash
node google-apps-script/import.mjs "<webalkalmazás URL>" "<név>" "<kód>" <data.json>
```

Csak üres táblázatba importál, így véletlenül sem duplikál.

## Áttekintés és jutalék

- Az **Áttekintés** lap (a táblázat első lapja): fent választható év, mutatócsempék (szerződések, nettó árbevétel, beszerzési költség, haszon, haszonkulcs, jutalék, kiküldött ajánlatok, ajánlatból szerződés arány), havi bontás, állapotok, értékesítők a kiválasztott hónapban, grafikonok.
- **Jutalék:** a Felhasználók lapon mindenkinél megadható a „Jutalék (%)” és a „Jutalék alapja” (Nettó ár vagy Haszon). A **Jutalékok** lap havonta (1-jétől a hónap végéig) összesíti értékesítőnként; a szerződés hónapja számít, a visszamondott ügy nem.
- Árbevétel = a tételek ajánlati ára kedvezménnyel (ha nincs tétel, a projekt nettó összege). Költség = a rögzített beszerzési árak, ezért a haszon csak annyira pontos, amennyire a beszerzési árak fel vannak víve.
- Minden mentéskor és az év / hónap átváltásakor magától frissül. A számokat a script számolja (képletek nélkül, így a magyar nyelvi beállítás nem zavarja); a nyers adat a rejtett „_adat” lapon van. Ha az Áttekintés vagy a Jutalékok lap elromlik, a `setup` újra felépíti.

## Árajánlat

- Az ügyfél adatlapján az **Árajánlat** résznél: tételek (ügyfélárral), opcionális **kedvezmény %** és személyes első mondat → **Árajánlat elkészítése** → **Megnyitás** → **Küldés**. Az ajánlathoz elég a név, az e-mail és legalább egy tétel.
- A levél és a PDF a bevált nyílászárós levél szerkezetét követi. A szövegek a táblázat **Ajánlat szövegek** lapján szabadon átírhatók; a `{nev}`, `{osszeg}`, `{kedvezmeny}` stb. jelöléseket a rendszer tölti ki.
- A tételeknél a termék neve hangsúlyos, az ár kisebb betűvel alatta áll. A tételhez írt „Rövid leírás az ajánlatba” dőlt betűvel jelenik meg.
- A kedvezmény a szerződésbe is átkerül (külön „Kedvezmény” sor a tételtáblázatban).
- A táblázat „Árajánlat elküldve” oszlopában és a Naplóban látszik, kinek mikor ment ajánlat.
- Az e-mail tárgya: „Árajánlat *Ügyfél neve* részére – …”, illetve „Vállalkozási szerződés *Ügyfél neve* részére – …”.

## Szerződés

- Az ügyfél adatlapján a **Szerződés** résznél készül el egy gombnyomásra. A rendszer kiírja, ha még hiányzik hozzá adat (magánszemélynél lakcím, anyja neve, születési hely és idő; cégnél székhely, cégjegyzékszám, adószám, képviselő; valamint telepítési cím, ajánlatszám, fizetés módja és legalább egy tétel ajánlati árral).
- A tételtáblázatba az **ajánlati árral** rögzített tételek kerülnek. A csak beszerzési árral felvitt tétel (például munkabér) belső költség: számol vele a haszon, de nem jelenik meg a szerződésben.
- Menete: **Szerződés elkészítése** → **Megnyitás** (átnézés) → **Küldés**. Az e-mail az ügyfélnek megy, másolatban a `NOTIFY_EMAILS` címekre, PDF melléklettel. Ha elkészülte után változik valami, a rendszer nem engedi elküldeni a régit, előbb újra kell generálni.
- A PDF-ek a Drive **Kivitelezések – Szerződések** mappájába kerülnek, a linkjük a táblázat „Szerződés (PDF)” oszlopában van.
- **A szerződés szövege szerkeszthető:** ugyanebben a mappában van a „SZERZŐDÉS SABLON – szerkeszthető, ne töröld” Google Dokumentum. A szöveget szabadon át lehet benne írni, csak a `{{…}}` jelöléseket és a tételtáblázat `{{t_nev}}` sorát kell meghagyni. Ha a sablont törlik, a rendszer a következő szerződésnél az eredeti mintából újra létrehozza.

## Ha módosul a Code.gs

Apps Script → **Telepítés → Telepítések kezelése** → ceruza → Verzió: **Új verzió** → Telepítés.
Így az URL ugyanaz marad.

## Belépés és napló

- Mindenki a **saját nevével és kódjával** lép be (a név kis- és nagybetűtől függetlenül egyezzen a Felhasználók lappal). Az eszköz megjegyzi.
- **Kilépő kolléga vagy elveszett telefon:** vedd ki az Aktív pipát, vagy cseréld a kódját. Azonnal nem fér hozzá, a többieket nem érinti.
- Egy névre 10 hibás kód után csak az a név zárolódik 10 percre.
- A **Napló** lapra minden belépés és változás bekerül (ki, mikor, mit: „Kivitelezve: nem → igen”). Az ügyfél adatlapján az „Előzmények” résznél is látszik.

## Jó tudni

- A **Listák** lapon szabadon bővíthetők a legördülő értékek (finanszírozás, projekt típusa, üzemmód, értékesítők) – az oldal ezeket kínálja fel.
- Az oszlopok sorrendje a táblázatban átrendezhető, a rendszer a fejléc neve alapján találja meg őket. A fejléc szövegét ne írd át.
- Az **Állapot** oszlopot a rendszer számolja a pipákból: Ajánlat → Kivitelezésre vár → Utómunka → Lezárva (vagy Visszamondva).
