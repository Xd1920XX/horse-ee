# Horse Demo — Rajadisainer + Võistluste Haldus

Dokument koondab projekti olemasolev MVP ja laiendatud skoobi (võistluste korraldamine, registreerimine, hindamine). Mõeldud alusdokumendiks järgnevateks arendusfaasideks.

## 1. Visioon

Kaheosaline veebipõhine platvorm Eesti ratsaspordi klubidele ja treeneritele:

1. **Rajadisainer** — visuaalne tööriist takistussõidu radade kavandamiseks, salvestamiseks ja PDF-ina printimiseks.
2. **Võistluste haldus** — korraldaja saab luua võistluse koos erinevate klassidega (kõrguste ja reeglitega), võtta vastu registreerimisi, hallata reaalajas starti ja tulemusi, väljastada protokolli ja edetabeli (TOP N).

Mõlemad osad töötavad ühel platvormil, jagades kasutajahaldust ja takistuste/radade andmemudelit.

## 2. Põhimõisted (domeen)

| Mõiste | Selgitus |
|--------|----------|
| **Rada (Course)** | Takistuste komplekt väljakul koos start/finiši ja ratsutamise järjekorraga. |
| **Takistus (Obstacle)** | Üksik hüpe: tüüp (vertikaal, oksuur jne), kõrgus, laius, asukoht, pööre. |
| **Kombinatsioon (Combination)** | 2-3 takistust lähedal (1-2 sammu), numeratsioonis 7a / 7b / 7c. |
| **Võistlus (Competition)** | Üritus, millel toimub üks või mitu klassi. On kuupäev, koht, korraldaja. |
| **Klass (Class)** | Võistluse alavoor: nt "90 cm" või "Rist" või "Maalatt". Igal klassil kõrgus, reglement (karistuspunktide tabel, ajalimiit), rada. |
| **Osaleja/Ratsutaja (Rider)** | Isik, kes võistlusel ratsutab. Registreerub ühe või mitme klassi peale. |
| **Hobune (Horse)** | Ratsutamiseks kasutatav hobune. Üks ratsanik võib ühes klassis osaleda mitme hobusega → iga **(ratsanik, hobune, klass)** paar on eraldi stardikirje. |
| **Start (StartEntry)** | Üks stardikirje: ratsanik + hobune + klass. Omab stardinumbrit, start aega, tulemust. |
| **Karistuspunktid (Faults)** | Takistuse maha ajamine, keeldumine, kukkumine, ajakaristus. FEI standardreeglid. |
| **Protokoll** | Avalik tulemustabel, sorteeritud karistuspunktide, siis aja järgi. |

## 3. Rollid

| Roll | Õigused |
|------|---------|
| **Admin (globaalne)** | Kõik; haldab korraldajate kutseid. |
| **Korraldaja (Organizer)** | Loob võistlusi, defineerib klassid, kinnitab registreerimisi, väljastab protokolli. |
| **Kohtunik/Sekretär (Judge/Secretary)** | Konkreetse võistluse ajal sisestab starte, karistuspunkte, aega. Ei saa võistlust kustutada. |
| **Ratsutaja (Rider)** | Registreerib enda ja hobuse klassidesse, näeb oma starte ja tulemusi. |
| **Vaataja (Public)** | Avalik protokoll ja ajakava, ilma loginita. |

Juurdepääsu kontroll Firebase'is Firestore Security Rules kaudu, rollid salvestatud `users/{uid}` dokumendis ja/või custom claims.

## 4. Tehniline stack

- **Frontend**: React 18 + TypeScript + Vite
- **Canvas**: react-konva (rajadisainer)
- **State (lokaalne)**: Zustand
- **Routing**: react-router-dom v6
- **UI**: minimalne custom CSS (dark theme); vajadusel hiljem shadcn/ui või Tailwind
- **PDF**: jsPDF (klient-genereeritud)
- **DB & Auth**: Firebase
  - **Firestore** — andmemudel
  - **Firebase Auth** — e-mail/parool + Google OAuth
  - **Firebase Storage** — raja JSON eksport, võistluse pildifailid, protokollide PDF-id
  - **Cloud Functions** (hiljem) — stardilistide genereerimine, auhindade e-mailid, karistuspunktide valideerimine
  - **Firebase Hosting** — SPA deploy
- **Mobiilne tugi**: responsive layout (tehtud), touch events (react-konva natively), PWA (hiljem)

## 5. Olemasolev MVP (rajadisainer) — tehtud

Juba kodeeritud failid repos:

```
src/
  types.ts                   # Obstacle, Arena, Course, Marker, ObstacleType
  store.ts                   # Zustand store: course, undo/redo, actions
  geometry.ts                # distantside ja sammude arvutus
  pdf.ts                     # jsPDF eksport (rada + takistuste nimekiri)
  App.tsx                    # layout + file I/O
  main.tsx, styles.css
  components/
    ArenaCanvas.tsx          # Konva stage, grid, path, start/finiš markerid
    ObstacleShape.tsx        # üksiku takistuse render Konva primitiividega
    Palette.tsx              # takistuste valimine (desktop)
    Inspector.tsx            # valitud takistuse omaduste redaktor
    Toolbar.tsx              # üleval nupud (undo, nr, grid, export…)
    MobileSheet.tsx          # mobiilne bottom-sheet (palette + inspector)
```

**Toimib**:
- Takistuste lisamine (puudutuse peale või topeltklõpsuga keskele)
- Drag-drop asukoha muutmiseks (desktop + mobile touch)
- Automaatne numeratsioon (nearest-neighbor stardist)
- Distantside kuvamine meetrites + sammudes
- Grid 1m, välja mõõtmed muudetavad
- Undo/redo
- JSON salvestus/laadimine
- PDF eksport (A4 landscape + takistuste nimekiri)

**Puudu rajadisainerist (järgmine iteratsioon)**:
- Kombinatsiooni grupeerimine (7a/7b/7c automaatne)
- Reeglivalideerimine (nt FEI min distants kombos)
- Juhu-generaator parameetrite põhjal
- Rajajoone käsitsi redigeerimine (bezier)
- Mitme raja projekt (nt Grand Prix + 2.osa)
- 3D eelvaade (Three.js)

## 6. Uus skoop: võistluste haldus

### 6.1 Kasutaja teekonnad (user journeys)

**Korraldaja**:
1. Loogib sisse → "Minu võistlused" → "Loo uus"
2. Täidab: nimi, kuupäev, asukoht, kirjeldus, registreerimise tähtaeg
3. Lisab klasse: nt "Maalatt", "Rist 40 cm", "50 cm", "70 cm", "90 cm", "110 cm"
   - Igal klassil: nimi, kõrgus, reglement (A/A, A/A piiraja, Table C vms), ajalimiit, osalemistasu
   - Soovi korral lingib iga klassi juurde juba olemasolev **rada** (Rajadisainerist)
4. Avab registreerimise → ratsanikud saavad registreerida
5. Enne võistlust: genereerib stardilistide järjekorra (automaat või käsitsi), määrab stardi algusaja ja intervalli (nt iga 2 minuti tagant)
6. Võistluse ajal: tema või sekretär sisestab igale stardile karistuspunktid ja aja
7. Pärast klassi: vaatab protokolli, märgib TOP 3 / TOP 5 auhinnad, väljastab PDF

**Ratsutaja**:
1. Loogib sisse → "Avalikud võistlused" → valib võistluse
2. Vaatab klasse → klõpsab "Registreeri"
3. Täidab: hobune (loetelust või lisab uue), klassid millele registreerib
4. Saab kinnituse (status: ootel → kinnitatud)
5. Võistluse päev: näeb oma stardi aega (push/e-mail)
6. Pärast: näeb oma tulemust ja edetabeli positsiooni

**Avalik**:
- `/competitions` — tulevased ja käimasolevad võistlused
- `/competitions/:id` — ülevaade, klassid, ajakava, protokoll (live)

### 6.2 MVP skoop (esimene faas) — mida ehitada

Hoiame fookust ja ei kaota end detailidesse. MVP sisaldab:

- [ ] Firebase projekt + Auth (e-mail/parool)
- [ ] Rollid: korraldaja ja ratsutaja (admin käsitsi Firestore'is)
- [ ] CRUD: `competitions` + `classes` (korraldaja)
- [ ] Avalik võistluste nimekiri + detail-vaade
- [ ] Ratsutaja saab registreerida ennast + hobuse klassidesse
- [ ] Korraldaja saab vaadata ja kinnitada registreerimisi
- [ ] Stardilistide genereerimine (lihtne: käsitsi järjekord + algusaeg + intervall → auto arvutab)
- [ ] Live sisestus: iga stardi juurde karistuspunktid + aeg (sekundites)
- [ ] Protokolli vaade: sorteeritud faultide + aja järgi, TOP N esile tõstetud
- [ ] PDF eksport: stardileht ja protokoll
- [ ] Rajadisainerist raja linkimine klassi külge (valikuline)

**Edasi (post-MVP)**:
- Ajamõõtmise integratsioon (nupp "START"/"STOP" live)
- Push-teavitused ratsanikele (Firebase Cloud Messaging)
- Maksed (osalemistasu — Stripe)
- Automaatne stardilistide algoritm (hobuse puhkeaja järgi)
- Sarja arvestus (mitme võistluse koondseis)
- Hobuse pass / vaktsineerimiste jälgimine

### 6.3 Hindamine ja reeglid (lühikokkuvõte MVP jaoks)

Takistussõidu standardreeglid (FEI/EASL lihtsustatud):
- **Takistuse maha ajamine**: +4 karistuspunkti
- **Keeldumine (1. kord)**: +4 p; **2. kord sama klass**: elimineerimine
- **Kukkumine**: elimineerimine
- **Ajakaristus**: iga alanud sekund üle ajalimiidi = +1 p
- **Protokoll sorteeritakse**: karistuspunktid tõusvalt → aeg tõusvalt
- **Null-tulemus mitmel ratsanikul** → ümberhüpe (jump-off) — MVP-s käsitseme käsitsi

MVP vorm: korraldaja sisestab ainult **faults** (int, 0..999) + **time_seconds** (float). Kõik keerukam = post-MVP.

## 7. Firestore andmemudel

Kollektsioonid root tasandil + alamkollektsioonid. Dokumendi ID-d on genereeritud (auto) kui pole märgitud.

```
users/{uid}
  email: string
  displayName: string
  roles: { organizer: boolean, admin: boolean }   // ratsanik on default
  createdAt: timestamp

horses/{horseId}
  ownerUid: string                 // kes lisas
  name: string
  breed?: string
  birthYear?: number
  passportNumber?: string

courses/{courseId}                 // rajadisaineri salvestatud rajad
  ownerUid: string
  name: string
  arena: { width, height, indoor }
  obstacles: Obstacle[]            // sama schema nagu types.ts
  start: Marker
  finish: Marker
  heightClass: number
  createdAt: timestamp
  updatedAt: timestamp

competitions/{competitionId}
  organizerUid: string
  name: string
  venue: string
  date: timestamp
  registrationDeadline: timestamp
  description?: string
  status: 'draft' | 'open' | 'closed' | 'running' | 'finished'
  judgeUids: string[]              // sekretärid/kohtunikud
  createdAt: timestamp

  /classes/{classId}
    name: string                   // "90 cm", "Rist", "Maalatt"
    heightCm: number               // 0 = maalatt, 30 = rist jne
    rules: 'A/A' | 'A/A_piiraja' | 'TableC' | 'other'
    timeLimitSeconds: number
    entryFeeCents?: number
    courseId?: string              // link rajale (optional)
    orderIndex: number             // kuvamisjärjekord

  /registrations/{regId}
    riderUid: string
    riderDisplayName: string       // snapshot
    horseId: string
    horseName: string              // snapshot
    classId: string
    status: 'pending' | 'confirmed' | 'rejected' | 'withdrawn'
    createdAt: timestamp

  /starts/{startId}
    classId: string
    registrationId: string
    startNumber: number            // stardinumber, nt 1..N klassi sees
    startTimeScheduled: timestamp  // planeeritud algusaeg
    startTimeActual?: timestamp    // kui käivitati
    result: {
      faults: number | null
      timeSeconds: number | null
      eliminated: boolean
      withdrew: boolean
    }
    enteredByUid: string           // kes tulemuse sisestas
    enteredAt?: timestamp

  /awards/{classId}                // doc ID = classId, 1-1 klassiga
    places: [{ place: number, startId: string, riderName: string, horseName: string }]
    publishedAt: timestamp
```

### Miks snapshotid (riderDisplayName, horseName registratsioonis)?
Et protokoll jääks ajalooliselt korrektseks ka siis, kui kasutaja hiljem nime vahetab või hobuse kustutab.

### Indeksid (vajalik Firestore'is defineerida)
- `competitions` where `status in ['open','running']` orderBy `date`
- `competitions/{id}/starts` where `classId == X` orderBy `startNumber`
- `competitions/{id}/starts` where `classId == X` orderBy `result.faults`, `result.timeSeconds` (protokoll)

## 8. Security Rules põhimõtted

```
match /competitions/{cid} {
  allow read: if resource.data.status != 'draft' || isOrganizer(cid) || isAdmin();
  allow create: if hasRole('organizer');
  allow update, delete: if isOrganizer(cid) || isAdmin();

  match /classes/{clid} { ... sama ... }

  match /registrations/{rid} {
    allow read: if isSignedIn();
    allow create: if request.auth.uid == request.resource.data.riderUid
                    && getCompetition(cid).status == 'open';
    allow update: if isOrganizer(cid)                    // kinnita/keeldu
                  || (request.auth.uid == resource.data.riderUid
                       && request.resource.data.status == 'withdrawn');
  }

  match /starts/{sid} {
    allow read: if true;                                 // avalik protokoll
    allow write: if isOrganizer(cid) || isJudge(cid);
  }
}
```

Helper funktsioonid (`isOrganizer`, `isJudge`, `hasRole`) loetakse `users/{uid}` dokumendist.

## 9. Marsruudid (React Router)

```
/                              → Avaleht (promo + sissekirjutamine)
/login                         → Auth
/register                      → Konto loomine

/designer                      → Rajadisainer (olemasolev)
/designer/:courseId            → Konkreetne rada

/competitions                  → Avalik võistluste nimekiri
/competitions/:id              → Võistluse detail (klassid, ajakava, protokoll)
/competitions/:id/register     → Ratsutaja registreerumine

/my/entries                    → Minu registreeringud (ratsutaja)
/my/horses                     → Minu hobused

/manage                        → Korraldaja dashboard (minu võistlused)
/manage/competitions/new       → Uue võistluse loomine
/manage/competitions/:id       → Konkreetse võistluse haldus (tab'id: info, klassid, registreerimised, stardid, protokoll)
/manage/competitions/:id/live  → Live sisestuse režiim (sekretär)

/admin                         → Globaalne admin (roll)
```

## 10. Komponentide struktuur (uued)

```
src/
  firebase.ts                        # init: app, auth, db, storage
  auth/
    AuthProvider.tsx                 # context: user + roles
    useAuth.ts
    LoginPage.tsx
    RegisterPage.tsx
  pages/
    HomePage.tsx
    DesignerPage.tsx                 # wrapper olemasoleva ümber
    CompetitionsPublicPage.tsx
    CompetitionDetailPage.tsx
    MyEntriesPage.tsx
    MyHorsesPage.tsx
    ManageDashboard.tsx
    CompetitionEditor.tsx            # tab'idega
    LiveScoringPage.tsx
  domain/
    competitions.ts                  # Firestore CRUD + typing
    classes.ts
    registrations.ts
    starts.ts
    horses.ts
    courses.ts
  components/
    competition/
      ClassList.tsx
      ClassForm.tsx
      RegistrationList.tsx
      StartList.tsx
      ScoreEntry.tsx
      Protocol.tsx
      AwardsPanel.tsx
    designer/                        # tõsta olemasolev siia
      ArenaCanvas.tsx
      ObstacleShape.tsx
      Palette.tsx
      Inspector.tsx
      Toolbar.tsx
      MobileSheet.tsx
  utils/
    scoring.ts                       # protokolli sort, TOP N
    timeFormat.ts
    pdf/
      coursePdf.ts                   # olemasolev
      startListPdf.ts                # uus
      protocolPdf.ts                 # uus
```

## 11. Arendusjärjekord (soovitatud faasid)

**Faas 0 (tehtud)**: Rajadisainer MVP.

**Faas 1 — Firebase + Auth** (1-2 päeva):
- Firebase projekt, Hosting setup
- Auth (e-mail + Google)
- `AuthProvider`, kaitstud marsruudid
- Users kollektsioon + rollide määramine (admin käsitsi)
- Olemasolev rajadisainer liigutatud `/designer` alla
- Rajade salvestamine Firestore'i (praegu localStorage)

**Faas 2 — Korraldaja (võistluse CRUD)** (2-3 päeva):
- `/manage` dashboard
- Võistluse loomine, muutmine, kustutamine
- Klasside lisamine võistlusele
- Raja linkimine klassi külge
- Võistluse publikatsioon (`status: draft → open`)

**Faas 3 — Avalik vaade + registreerimine** (2 päeva):
- `/competitions` nimekiri
- Võistluse detail (klassid, ajakava)
- Minu hobused CRUD
- Registreerumine klassi
- Korraldaja saab kinnitada/keelduda

**Faas 4 — Startlist + Live sisestus** (2-3 päeva):
- Startlist genereerimine (algusaeg + intervall)
- Stardinumbrite määramine
- Live sisestuse ekraan (tahvelarvutile)
- Protokolli vaade (sorteeritud, live-värskendav)

**Faas 5 — Auhinnad + PDF-id + poleering** (1-2 päeva):
- Awards paneel (märgi TOP N)
- Startlist PDF
- Protokoll PDF (ametlik)
- Mobile UI poleering
- E2E testid põhiradadel

**Kokku MVP**: ~8-12 arenduspäeva.

## 12. Avatud küsimused

Enne faasi 1 algust vaja korraldajalt kinnitust:

1. **Keel**: ainult eesti, või ka inglise (i18n alates MVP-st)?
2. **E-mail saatmine** (kinnituskiri, stardi aeg): Firebase Extensions "Trigger Email" (SendGrid) või Resend?
3. **Osalemistasu**: MVP-s käsitsi kinnitus või kohe Stripe integreeritud?
4. **Hobuse andmed**: kui põhjalik (pass, vaktsiin) või lihtsalt nimi?
5. **Reeglid**: ainult A/A tabel MVP-s, või kõik FEI tabelid kohe?
6. **Ajamõõtmine**: käsitsi stopper korraldaja telefonis MVP-s, või integratsioon riistvaraga (Alge, Omega) hiljem?
7. **Mitmelt võistluselt koondseis**: vajalik MVP-s või post-MVP?
8. **Printimine**: ainult PDF või ka otse printerile (QZ Tray)?

## 13. Arenduspõhimõtted (sellele projektile)

- **Firebase emulaatorid** kohalikuks arenduseks (`firebase emulators:start`), produktsiooni ei puututa dev ajal.
- **TypeScript strict**, kõik Firestore CRUD läbi typed wrapper'ite (`domain/*.ts`), komponendid ei kutsu Firestore'i otse.
- **Validatsioon**: client-side (vorm) + server-side (Security Rules). Hiljem Cloud Function trigger'id kriitiliste äriloogika tükkide jaoks.
- **Reaalajas**: Firestore `onSnapshot` live protokolli ja startlistide jaoks. Kirjutamine `setDoc`/`updateDoc`, mitte `set`.
- **Mobile-first**: iga uus leht testitakse 375px laiusel enne desktopi.
- **Komponendid**: üks komponent = üks fail; äriloogika `domain/`, UI `components/`, lehed `pages/`.
- **Pole over-engineering**: lisame redux/tanstack-query ainult kui zustand + firestore onSnapshot ei kata vajadust.

---

Viimati uuendatud: 2026-10-25
