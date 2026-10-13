# ETFmapa.cz: lead magnet „ETF z NYSE pro českého investora“

**Web:** https://etf-landing-flax.vercel.app (varianta reklamy A: `/?v=a`, varianta B: `/?v=b`)
**Administrace:** https://etf-landing-flax.vercel.app/admin.html (heslo předám zvlášť)
**Technologie:** statické HTML/CSS/vanilla JS (15 kB gzip při prvním načtení) + serverless funkce na Vercelu + Upstash Redis (bezplatný tarif).

```
public/            stránka, styly, data ETF (data.js), texty variant (config.js), zasady.html
public/admin.html  administrace: KPI, funnel A/B, po dnech, leady, CSV, výmaz (GDPR)
api/lead.js        příjem leadu → Redis (volitelně webhook a e-mail přes Resend, nyní vypnuto)
api/track.js       anonymní počítadla kroků funnelu → Redis
api/admin.js       data pro administraci (Bearer ADMIN_PASSWORD), výmaz leadu
scripts/           dev.mjs (lokální server bez Vercel CLI), measure.mjs (měření cesty na mobilu)
```

Spuštění: `npm run dev` → http://localhost:3000. Měření: `npm i && npx playwright install chromium && npm run measure`.

---

## 1. Cílová skupina

**Čech ve věku 25–40 let, začínající nebo mírně pokročilý investor.** O S&P 500 a VOO/SPY slyšel na YouTube, Redditu nebo od známých. Často už má peníze na spořicím účtu nebo v bankovním fondu, který mu prodali na pobočce. Přichází z Meta/Instagramu nebo z vyhledávání na mobilu a stránce dá 3–5 sekund.

Klíčový poznatek, na kterém stránka stojí: **ETF obchodované na NYSE si český drobný investor koupit nemůže.** Nařízení PRIIPs (EU 1286/2014) vyžaduje dokument KID a americké fondy ho nevydávají. Člověk hledá VOO u brokera a nenajde ho. Zadání chce „srovnání ETF z NYSE“. To jsem dodržel doslova, ale srovnání odpovídá na skutečnou otázku návštěvníka: *„co koupit místo nich?“* Ke každému ze 6 nejoblíbenějších ETF z NYSE je přiřazena jeho evropská UCITS verze, kterou český broker prodá. Šablonovitá stránka „top 10 ETF“ by byla pro tuto skupinu k ničemu: nekoupí si ani jeden z nich.

## 2. Co návštěvník dostane a kdy žádáme kontakt

| Zdarma, před formulářem (hodnota je vidět hned) | Za e-mail (odemkne se okamžitě na stránce) |
|---|---|
| Hlavní odpověď na první obrazovce: VOO → VUAA, 0,07 %, lze koupit | Všech 6 dvojic (IVV→CSPX, VT→VWCE, VTI, SCHD→VHYL) |
| 2 kompletní dvojice ve srovnání (VOO, SPY) se zdroji | Návod „první ETF v 5 krocích“ |
| Kalkulačka poplatků: plný výsledek bez omezení | |

**Kdy žádáme kontakt:** ne hned, ale ve chvíli nejvyšší motivace:
1. hned pod výsledkem kalkulačky („Odemknout celé srovnání zdarma“);
2. na „zámku“ pod druhou dvojicí ETF (zvědavost: které jsou ty další 4);
3. lepicí tlačítko dole na obrazovce, když už je první obrazovka odscrollovaná a formulář není vidět.

**Formulář má jedno pole** (e-mail) + neviditelný honeypot proti botům. Bez jména, bez zaškrtávacího políčka. Klávesnice `inputmode=email`, automatické vyplnění a upozornění na překlepy v doméně (`gmail.cz`, `seznam.com` → „Nemysleli jste…?“). Je to častá chyba českých uživatelů a s překlepem je lead ztracený.

**Po odeslání** dostane návštěvník hodnotu **okamžitě na stránce**, na nic nečeká. Tabulka se odemkne a zůstane odemčená i při další návštěvě (localStorage), stránka sama doscrolluje k návodu v 5 krocích. Pokud se lead nepodaří uložit, člověk uvidí chybu a může to zkusit znovu, lead se tiše neztratí.

**Proč stránka neslibuje e-mail s výsledkem:** odesílání přes Resend je v kódu připravené (`api/lead.js`), ale vyžaduje ověřenou vlastní doménu, kterou zatím nemám. Stránka proto slibuje jen to, co opravdu splní: okamžité odemčení. E-mail slouží k pozdějšímu zasílání tipů (nejvýš 1 měsíčně). Jakmile bude doména, stačí nastavit `RESEND_API_KEY` a `MAIL_FROM` a vrátit do textu „pošleme na e-mail“.

## 3. Dvě reklamy

Obě vedou na stejnou stránku, ale první obrazovka a pořadí sekcí se přizpůsobí slibu reklamy (`?v=a|b`, případně `utm_content`).

**A: „problém“** (pro ty, kdo už ETF znají)
> **VOO ani SPY z Česka nekoupíte.**
> Evropská dvojčata ale ano, se stejným indexem a poplatkem od 0,03 %. Podívejte se, které to jsou.
> CTA: *Zobrazit srovnání*
> Vizuál: přeškrtnuté „VOO“ → zelené „VUAA“.

První obrazovka A: stejný nadpis + stejná vizuální dvojice VOO → VUAA. Dál: srovnání → kalkulačka → formulář.

**B: „peníze“** (široké publikum, lidé s penězi v bance)
> **Bankovní fond, nebo ETF? Při 3 000 Kč měsíčně je rozdíl 316 000 Kč.**
> Za 20 let, jen na poplatcích. Spočítejte si to za 10 sekund.
> CTA: *Spočítat rozdíl*
> Vizuál: velké číslo „316 000 Kč“ na tmavém pozadí.

První obrazovka B: stejná otázka a **stejné číslo**. Počítá ho stejný kód jako kalkulačku, takže reklama a stránka se nerozejdou. Dál: kalkulačka → srovnání → formulář.

## 4. Pořadí sekcí a proč

1. **Hero = slib reklamy + důkaz + CTA**, vše na první obrazovce iPhonu 13 (390×664, ověřeno skriptem `measure.mjs`: `cta_above_fold: true`). Návštěvník má pár sekund, proto je odpověď („VUAA místo VOO“ / „316 000 Kč“) před tlačítkem, ne za ním.
2. **Interaktivní prvek slíbený v reklamě**: pro A srovnání, pro B kalkulačka. Shoda sdělení (message match) snižuje okamžité odchody.
3. **Druhý interaktivní prvek.** Kdo se dostal sem, má zájem a druhý nástroj přidá hodnotu.
4. **Formulář** s výčtem toho, co člověk získá. Nežádáme e-mail bez vysvětlení, proč ho zadat.
5. **Časté otázky**: odstraňují námitky (proč nejde VOO, jestli je evropská verze horší, kdo za stránkou stojí a co bude s e-mailem). Jsou *za* formulářem: kdo je rozhodnutý, nemusí je přeskakovat.
6. **Zdroje a upozornění.** Povinné pro finanční reklamu (Meta/Google) a důležité pro důvěru.

Principy designu: jeden sloupec, velké dotykové plochy (≥ 44 px), žádná externí písma, obrázky ani frameworky (FCP ≈ 0,45 s na „rychlém 4G“ se 4× zpomaleným CPU). Barvy: červená = „nejde“, zelená = „jde / úspora“, žlutá = akce.

## 5. Data a zdroje

Všechna čísla jsou v `public/data.js`, každé s odkazem na zdroj; na stránce má každá karta odkaz „zdroj“. Datum ověření: **12. 10. 2026**.

| ETF z NYSE | TER | UCITS náhrada | ISIN | TER | Shoda |
|---|---|---|---|---|---|
| VOO | 0,03 % | VUAA | IE00BFMXXD54 | 0,07 % | stejný index |
| SPY | 0,09 % | SPYL | IE000XZSV718 | 0,03 % | stejný index |
| IVV | 0,03 % | CSPX / SXR8 | IE00B5BMR087 | 0,07 % | stejný index |
| VT | 0,06 % | VWCE | IE00BK5BQT80 | 0,14 % | podobný index |
| VTI | 0,03 % | CSPX / SXR8 | IE00B5BMR087 | 0,07 % | nejbližší náhrada |
| SCHD | 0,06 % | VHYL | IE00B8GKDB10 | 0,29 % | nejbližší náhrada |

- Americké ETF: [stockanalysis.com](https://stockanalysis.com/etf/) (TER, velikost fondu, burza NYSE Arca, uzávěrka 9. 10. 2026).
- UCITS ETF: [justETF](https://www.justetf.com/cz/) (TER, velikost fondu, akumulační/distribuční).
- Náhrady za VTI/SCHD: [investingintheweb.com](https://investingintheweb.com/blog/vti-europe-uk-alternatives/).
- Srovnávací poplatek bankovního fondu 2 %: příklad Erste Top Stocks, TER 2,17 %, vstupní poplatek až 3 % ([finex.cz](https://finex.cz/fond/erste-top-stocks/)). Zaokrouhleno dolů, ve prospěch banky, abych nepřeháněl.
- Kalkulačka: měsíční vklad, složené úročení, 7 % ročně před poplatky. Na stránce je to výslovně uvedeno jako předpoklad, ne slib. Vstupní poplatky a poplatky brokera **nejsou** započteny, takže skutečný rozdíl je spíš větší.

QQQ jsem záměrně nezařadil: obchoduje se na Nasdaqu, ne na NYSE.

## 6. Měření cesty uživatele

### Skuteční uživatelé: vlastní funnel + administrace
Zadání neříká, kde se mají leady zobrazovat, proto jsem místo externí tabulky udělal **vlastní administraci** `/admin.html`. Leady i data o cestě jsou na jednom místě, bez dalších služeb:
- **leady** jsou uložené v Redisu: e-mail, varianta, UTM, parametry kalkulačky, čas do odeslání. Když se zápis nepovede, návštěvník uvidí chybu a lead se tiše neztratí;
- **funnel**: stránka posílá anonymní počítadla kroků (`sendBeacon`, bez cookies a osobních údajů), každý krok nejvýš jednou za návštěvu. Počítadlo = počet návštěv, které se ke kroku dostaly, zvlášť pro A a B a po dnech;
- v administraci jsou KPI, funnel o 14 krocích s procenty od vstupu pro A a B vedle sebe, tabulka po dnech, leady s vyhledáváním, export CSV (otevře se v Excelu) a výmaz leadu na žádost (GDPR).

Ověřeno na produkci: skutečný prohlížeč (emulace iPhonu) odeslal formulář, lead se v administraci objevil se správnými UTM i výpočtem, funnel se započítal ve všech krocích a výmaz fungoval. Testovací data jsem pak smazal.

| Krok funnelu (událost) | Význam |
|---|---|
| `lp_view` | vstup na stránku |
| `hero_cta`, `unlock_click`, `calc_cta`, `sticky_cta` | kliky na CTA (které CTA vede k leadu) |
| `section_view:{table,calc,form}` | sekce byla vidět aspoň z 25 % |
| `calc_interact` | použití kalkulačky |
| `form_focus` → `form_submit` → `lead_success` / `form_error` / `lead_fail` | funnel formuláře a důvody chyb |

### Volitelně: PostHog
Pro záznamy relací a podrobnější analytiku lze doplnit klíč PostHog EU do `public/config.js`. Běží **bez cookies** (`persistence: 'memory'`), takže není potřeba cookie lišta, která na mobilu zabere první obrazovku a sama o sobě snižuje konverzi. Navíc posílá hloubku scrollu (`scroll_depth`), každou změnu v kalkulačce (`calc_change`) a odchod ze stránky (`page_leave`). Základní funnel funguje i bez něj.

### Laboratorní měření (`npm run measure`)
Playwright: iPhone 13, „rychlé 4G“ (RTT 150 ms, 1,6 Mbit/s), CPU 4× pomalejší. Skript projde celou cestu a uloží snímek obrazovky každého kroku do `measure-output/`.

| Krok | Varianta A | Varianta B | Dotyků |
|---|---|---|---|
| FCP / LCP (produkce) | 496 / 608 ms | 436 / 476 ms | — |
| Objem přenosu (produkce, gzip) | 15 kB | 15 kB | — |
| První obrazovka: H1 + CTA vidět | ✓ | ✓ | 0 |
| → výsledek kalkulačky | 1,7 s | 1,7 s | 3 |
| → formulář | 2,6 s | 2,5 s | 4 |
| → lead odeslán, obsah odemčen | 3,6 s | 3,3 s | 6 |

(Časy skriptu, bez čtení člověkem. Podstatné je, že cesta potřebuje **6 dotyků**, žádnou novou stránku a jedno vstupní pole.)

## 7. Očekávaná konverze

Orientační hodnoty z Unbounce Conversion Benchmark (Q4 2024): medián finančních služeb **8,3 %**, podkategorie *investing* jen **3,9 %**, placené sociální sítě ve financích **9,3 %** ([unbounce.com/industry/finance](https://unbounce.com/industry/finance/)).

**Můj odhad: 6–9 % z návštěvy na e-mail** (pracovní cíl 7 %). Proč nad mediánem *investing*:
- nežádáme otevření účtu ani investici, jen e-mail za bezplatný nástroj, což je výrazně menší krok;
- jedno pole, hodnota je vidět před formulářem, obsah se odemkne okamžitě;
- přesná shoda reklamy a první obrazovky.

Proč ne víc: studený provoz ze sociálních sítí, finanční téma (nedůvěra), část lidí dostane odpověď už na první obrazovce a odejde. To je vědomá cena za poctivou hodnotu před formulářem.

Očekávané mezikroky pro diagnostiku problémů: proklik hlavního CTA 30–40 %, podíl návštěv, které dojdou k formuláři, 25–35 %, `form_focus → lead_success` ≥ 60 %.

## 8. Hypotézy pro A/B test (podle očekávaného efektu)

1. **Pole pro e-mail přímo na první obrazovce** (pod slibem) vs. současné tlačítko se scrollem k formuláři. *Proč první:* většina lidí odejde během pár sekund a k formuláři nedoscrolluje; jednokrokový formulář odstraní celý krok funnelu. Očekávám +20–40 % relativně. Riziko: menší zapojení a „studenější“ leady, proto sledovat i otevíranost prvního e-mailu.
2. **Nabídka A („VOO nekoupíte“) vs. B („316 000 Kč“)** jako dvojice reklama + stránka. Už je to zabudované (`?v=a|b`). Porovnávat **cenu za lead (CPL)**, ne jen konverzi stránky: B pravděpodobně přinese širší zásah a levnější klik, A kvalifikovanější lidi. Očekávám rozdíl v CPL 15–30 %.
3. **Kolik ukázat zdarma:** 1 otevřená dvojice vs. 2 (současný stav) vs. 4. Méně otevřeného = víc zvědavosti, ale i méně důvěry. Očekávám ±10–15 %.

Velikost vzorku: při základu 7 % a cíli zachytit +20 % relativně je potřeba ~5 700 návštěv na variantu (α = 0,05, síla testu 80 %). Proto je hypotéza 1 první: má největší efekt a ten je vidět i s dostupným rozpočtem.

## 9. Jak jsem pracoval s AI (Claude Code)

**Postup.** Pracoval jsem v jedné relaci Claude Code. Agentovi jsem zadával úkoly po krocích: „najdi data o ETF se zdroji“, „napiš stránku“, „napiš skript na měření“, „oprav podle screenshotů“, „zkontroluj řešení proti zadání“. Subagenty jsem nepoužil: úkol je malý a provázaný, kontext je důležitější než paralelní běh.

**Instrukce pro agenta:**
- nejdřív sesbírat data, a jen skutečná: každé číslo s odkazem a datem, nic „z paměti“;
- mobile-first, jedna obrazovka = jedna akce, jedno pole ve formuláři;
- texty česky, bez marketingových frází a slibů výnosu;
- po každé změně spustit `measure.mjs` a **podívat se na screenshoty**, ne věřit kódu.

**Jak jsem výsledky ověřoval:**
- čísla TER, velikosti fondů a ISIN jsem porovnal s veřejnými stránkami justETF/stockanalysis;
- cestu uživatele jsem ověřil skriptem Playwright na emulaci iPhonu a ručně podle screenshotů každého kroku;
- API jsem testoval přes curl (platný e-mail, neplatný e-mail, honeypot, přístup do administrace bez hesla);
- administraci jsem ověřil end-to-end testem na produkci: skutečný prohlížeč odešle formulář → lead je vidět v administraci → výmaz tlačítkem → testovací data smazána;
- administraci jsem zvlášť otestoval na XSS: testovací „e-mail“ s HTML značkou v podvržených datech se zobrazil jako text;
- české texty jsem četl a upravoval sám (češtinu ovládám);
- na konci jsem nechal agenta projít řešení bod po bodu proti zadání. Tak se našel nesplnitelný slib e-mailu (bod 12).

**Kde AI chybovala (a co jsem opravil):**
1. **Věcná chyba v datech:** dvojice VT → VWCE byla označena „stejný index“. Ve skutečnosti VT sleduje FTSE Global All Cap a VWCE FTSE All‑World (bez nejmenších firem). Opraveno na „podobný index“ s vysvětlením.
2. **Zavádějící tvrzení o daních:** agent napsal do FAQ, že irské fondy platí srážkovou daň 15 % místo 30 %. Pro českého investora s formulářem W‑8BEN je to srovnání nesprávné (i tak platí 15 %). Odstraněno.
3. **Daňový limit 40 mil. Kč:** zdroje ke změnám od roku 2026 si odporují. Agent na to sám upozornil a limit jsem raději nezmiňoval. Zůstal jen obecně známý tříletý časový test s výhradou „ověřte u daňového poradce“.
4. **CTA mimo první obrazovku:** první verze hero dala tlačítko pod seznam výhod. Skript ukázal `cta_above_fold: false` na iPhonu 13. Hero jsem přestavěl.
5. **Poděkování mimo obrazovku:** po odemčení tabulka narostla a vytlačila poděkování z obrazovky, uživatel výsledek neviděl. Bylo to vidět jen na screenshotu. Doplněn automatický scroll.
6. **Text neodpovídal rozvržení:** „vlevo / vpravo“, přitom karty jsou na mobilu pod sebou.
7. **Nepravdivý slib:** „odhlásíte se jedním klikem“, i když se v e-mailu odhlašuje odpovědí. Přeformulováno.
8. **Sběr dat:** stránka Vanguardu se vykresluje JavaScriptem a agent z ní nic nezískal. Zdroj nahrazen stockanalysis.com. Ani PDF s KID bankovního fondu se nepodařilo přečíst, proto je poplatek banky z finex.cz s poznámkou „ověřte v KID“.
9. **Falešně „zelený“ test:** po zpřísnění kontroly e-mailu server stále přijal `<b>@x.cz`. Příčina: lokální dev server držel v paměti starou verzi modulu. Po restartu je požadavek odmítnut. Poučení: po úpravách restartovat prostředí, ne věřit první odpovědi.
10. **Test, který vypadal jako chyba:** počítadlo funnelu na produkci „nezapočítalo“ požadavek z curl. Curl posílal data jako form-urlencoded, kdežto prohlížeč (`sendBeacon`) posílá `text/plain`. Se správným formátem i v end-to-end testu v prohlížeči se vše počítá. Byla to chyba testu, ne kódu, ale bylo nutné ji ověřit, ne odbýt.
11. **Smetí v repozitáři:** při připojení Upstash přidal Vercel CLI do projektu pomocné soubory agenta (`.agents/`, `skills-lock.json`). Všiml jsem si toho přes `git status` a vyřadil je z commitu.
12. **Nesplnitelný slib:** stránka slibovala „kopii na e-mail“, ale odesílání nebylo nastavené (chybí ověřená doména). Slib jsem odstranil a stránka teď slibuje jen okamžité odemčení (viz oddíl 2).

## 10. Proč chybí údaje provozovatele v `zasady.html`

Stránka se zásadami ochrany osobních údajů je hotová, jen místo správce (název, IČO, sídlo, kontakt) obsahuje zástupný text. **Teď to vyplnit nejde, a to záměrně:**
- **Správcem osobních údajů je ten, kdo kampaň provozuje a leady využije**, tedy firma, pro kterou je stránka určena. To je obchodní rozhodnutí zadavatele, ne uchazeče o práci. U testového úkolu zatím žádný provozovatel neexistuje.
- **Nemám vlastní IČO ani firmu**, pod kterou by kampaň běžela. Kdybych uvedl sebe jako fyzickou osobu, stal bych se podle GDPR správcem cizích leadů se všemi povinnostmi, a to by neodpovídalo skutečnosti.
- **Vymyšlené údaje použít nelze.** Neplatná identifikace správce porušuje informační povinnost podle GDPR (čl. 13) i pravidla reklamních systémů a reklamu by to stejně zablokovalo.

Doplnění zabere pár minut: stačí v `public/zasady.html` nahradit jeden řádek údaji provozovatele. Je to první bod v seznamu níže.

## 11. Co není hotové a co je potřeba před spuštěním reklamy

Podle priority:
1. **Údaje provozovatele v `zasady.html`** (viz oddíl 10). Bez nich Meta/Google reklamu zamítnou.
2. **Před skutečným provozem změnit heslo administrace** na dlouhé náhodné (`vercel env`).
3. **Meta pixel / Conversions API nejsou připojené.** Bez nich Meta nemůže optimalizovat kampaň na leady (spustit ji ale jde, např. s optimalizací na zobrazení stránky). Doporučuji serverové CAPI z `api/lead.js`, které nepotřebuje cookie lištu.
4. **E-mail s výsledkem** (volitelně): ověřit doménu v Resend, nastavit `RESEND_API_KEY` + `MAIL_FROM` a vrátit do textu slib e-mailu. Kód je připravený.
5. (Volitelně) klíč PostHog v `public/config.js` pro záznamy relací. Základní funnel funguje i bez něj.
6. Právní kontrola formulace souhlasu (odeslání bez zaškrtávacího políčka = souhlas se zasíláním tipů). Pro MVP vědomý kompromis ve prospěch minima polí.
7. Vlastní doména (ETFmapa.cz je pracovní název).
8. Ruční kontrola na skutečném iPhonu a Androidu v prohlížečích uvnitř Instagramu/Facebooku. Ověřena byla jen emulace.
9. Data ETF se aktualizují ručně (`data.js`); pro dlouhou kampaň by stálo za to je automatizovat.

---
*Nejde o investiční doporučení.*
