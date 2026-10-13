# ETFmapa.cz: lead magnet „ETF z NYSE pro českého investora“

**Web:** https://etf-landing-flax.vercel.app (reklama A: `/?v=a`, reklama B: `/?v=b`)
**Administrace (leady + funnel):** https://etf-landing-flax.vercel.app/admin.html (heslo předám zvlášť)

**Shrnutí**
- Klíčový poznatek: ETF z NYSE (VOO, SPY…) si český drobný investor **koupit nemůže** (PRIIPs/KID). Stránka proto srovnává 6 nejoblíbenějších ETF z NYSE s jejich evropskými UCITS náhradami, které český broker prodá.
- Hodnota je vidět před formulářem (odpověď na první obrazovce, 2 dvojice, kalkulačka). Za e-mail se okamžitě odemknou zbylé 4 dvojice a návod na první nákup.
- Od vstupu k odeslanému kontaktu stačí **3 dotyky**. Stránka má 17 kB a první obsah se zobrazí za ~0,5 s na mobilním 4G.
- Očekávaná konverze **6–9 %** z návštěvy na e-mail. Celý funnel se měří ve vlastní administraci.

Technologie: statické HTML/CSS/JS, serverless funkce na Vercelu, Upstash Redis. Lokálně: `npm run dev`; měření cesty: `npm run measure`.

---

## 1. Cílová skupina

Čech 25–40 let, začínající nebo mírně pokročilý investor. O S&P 500 a VOO slyšel na YouTube nebo od známých, peníze má často na spořicím účtu nebo v bankovním fondu. Přichází z Instagramu/Facebooku na mobilu a stránce dá pár sekund.

Zadání chce „srovnání ETF z NYSE“. Dodržel jsem ho, ale odpovídám na skutečnou otázku tohoto člověka: *„co koupit místo nich?“* Stránka typu „top 10 ETF“ by mu nebyla k ničemu, protože žádný z nich nekoupí.

## 2. Co návštěvník dostane a kdy žádáme kontakt

| Zdarma, před formulářem | Za e-mail (odemkne se hned na stránce) |
|---|---|
| Odpověď na první obrazovce (A: „VOO → VUAA, 0,07 %“, B: „rozdíl 316 000 Kč“) | Zbylé 4 dvojice (IVV, VT, VTI, SCHD) |
| 2 kompletní dvojice (VOO, SPY) se zdroji; u zbylých 4 je náhrada rozmazaná | Návod „první ETF v 5 krocích“ |
| Kalkulačka poplatků s grafem, bez omezení | |

**Kdy:** hlavní tlačítko na první obrazovce vede **rovnou k poli pro e-mail**. Pod ním je napsáno, co za e-mail dostanu. Další výzvy jsou pod kalkulačkou, na zamčených řádcích srovnání a na lepicím tlačítku dole. Kdo se nechce rozhodnout hned, scrolluje k obsahu.

**Formulář:** jedno pole (e-mail), bez zaškrtávacího políčka, s upozorněním na překlepy (`gmail.cz`, `seznam.com` → „Nemysleli jste…?“).

**Po odeslání** se obsah odemkne okamžitě a zůstane odemčený i při další návštěvě; stránka doscrolluje k návodu. E-mail s výsledkem záměrně neslibuji: odesílání (Resend) je v kódu připravené, ale vyžaduje ověřenou doménu. E-mail slouží k občasným tipům.

## 3. Dvě reklamy

Podrobně, včetně odkazů s UTM a popisu vizuálu: [`reklamy.md`](reklamy.md).

**A: „problém“** (zná ETF)
> **VOO ani SPY z Česka nekoupíte.** Evropská dvojčata ale ano, se stejným indexem a poplatkem od 0,03 %. Podívejte se, které to jsou. *[Zobrazit srovnání]*
> Vizuál: přeškrtnuté „VOO“ → zelené „VUAA“.

**B: „peníze“** (má peníze v bance)
> **Bankovní fond, nebo ETF? Při 3 000 Kč měsíčně je rozdíl 316 000 Kč.** Za 20 let, jen na poplatcích. Spočítejte si to sami. *[Spočítat rozdíl]*
> Vizuál: velké číslo „316 000 Kč“ na tmavém pozadí.

Varianta se volí parametrem `?v=a|b`. První obrazovka opakuje přesně slib reklamy, včetně stejného vizuálu a stejného čísla (počítá ho stejný kód jako kalkulačku).

## 4. Pořadí sekcí

1. **První obrazovka:** slib reklamy → důkaz → tlačítko k e-mailu → co za něj dostanu → řádek důvěry (zdroje, datum, „nejsme broker“). Návštěvník má pár sekund, proto odpověď stojí před tlačítkem a tlačítko vede rovnou ke kontaktu.
2. **Prvek slíbený v reklamě:** A srovnání, B kalkulačka.
3. **Druhý interaktivní prvek** pro ty, kdo zůstali.
4. **Formulář** s výčtem toho, co člověk získá.
5. **Časté otázky** (proč nejde VOO, je evropská verze horší, co bude s e-mailem). Jsou za formulářem, aby rozhodnutí nemuseli scrollovat přes ně.
6. **Zdroje a upozornění** (nutné pro finanční reklamu).

Design: jeden sloupec, velké dotykové plochy, žádná externí písma ani obrázky. Srovnání je po řádcích „~~VOO~~ 0,03 % → VUAA 0,07 %“ s detailem na klepnutí, takže je na mobilu vidět celé. Kalkulačka ukazuje graficky, kolik vezmou poplatky.

## 5. Data a zdroje (ověřeno 12. 10. 2026)

| ETF z NYSE | TER | UCITS náhrada | ISIN | TER | Shoda |
|---|---|---|---|---|---|
| VOO | 0,03 % | VUAA | IE00BFMXXD54 | 0,07 % | stejný index |
| SPY | 0,09 % | SPYL | IE000XZSV718 | 0,03 % | stejný index |
| IVV | 0,03 % | CSPX / SXR8 | IE00B5BMR087 | 0,07 % | stejný index |
| VT | 0,06 % | VWCE | IE00BK5BQT80 | 0,14 % | podobný index |
| VTI | 0,03 % | CSPX / SXR8 | IE00B5BMR087 | 0,07 % | nejbližší náhrada |
| SCHD | 0,06 % | VHYL | IE00B8GKDB10 | 0,29 % | nejbližší náhrada |

Zdroje: [stockanalysis.com](https://stockanalysis.com/etf/) (americké ETF), [justETF](https://www.justetf.com/cz/) (UCITS), [investingintheweb.com](https://investingintheweb.com/blog/vti-europe-uk-alternatives/) (náhrady za VTI/SCHD). Odkazy jsou i u každé dvojice na stránce. Kalkulačka srovnává s fondem za 2 % ročně (příklad: Erste Top Stocks, TER 2,17 %, [finex.cz](https://finex.cz/fond/erste-top-stocks/)) a počítá s výnosem 7 % ročně; obojí je na stránce uvedeno jako předpoklad. QQQ chybí záměrně: obchoduje se na Nasdaqu.

## 6. Měření cesty uživatele

**Skuteční návštěvníci.** Stránka posílá anonymní počítadla kroků (bez cookies a osobních údajů): vstup, kliky na tlačítka, zobrazení srovnání/kalkulačky/formuláře, použití kalkulačky, kliknutí do pole, odeslání, chyby. U každého leadu se navíc ukládá varianta, UTM, přes které tlačítko přišel a zda použil kalkulačku. Vše je vidět v administraci: funnel o 14 krocích pro A a B vedle sebe, konverze po dnech, seznam leadů, export CSV a výmaz leadu (GDPR). Ověřeno end-to-end na produkci.

**Laboratorní měření** (`npm run measure`, Playwright, iPhone 13, rychlé 4G, CPU 4× pomalejší):

| | A | B |
|---|---|---|
| FCP / LCP | 488 / 540 ms | 464 / 516 ms |
| Přenos (gzip) | 17 kB | 17 kB |
| Nadpis i tlačítko na první obrazovce | ✓ | ✓ |
| Odeslaný kontakt | 3 dotyky, 2,6 s | 3 dotyky, 2,6 s |

## 7. Očekávaná konverze

Unbounce Benchmark (Q4 2024): finanční služby medián **8,3 %**, *investing* **3,9 %**, placené sociální sítě ve financích **9,3 %** ([zdroj](https://unbounce.com/industry/finance/)).

**Odhad: 6–9 %** (cíl 7 %). Nad mediánem *investing*, protože nežádáme investici, ale e-mail za bezplatný nástroj, formulář má jedno pole a hodnota je vidět předem. Ne výš, protože jde o studený provoz z reklamy, finanční téma a část lidí dostane odpověď už na první obrazovce.

## 8. Hypotézy pro A/B test (podle očekávaného efektu)

1. **Nabídka A vs. B** (reklama + stránka, už zabudováno). Mění sdělení i publikum. Porovnávat cenu za lead, ne jen konverzi. Očekávám rozdíl 15–30 %.
2. **Hlavní tlačítko k formuláři (teď) vs. k obsahu.** Kratší cesta proti budování důvěry; směr nejistý, ±10–25 %. Měřitelné v administraci (tlačítko a kalkulačka u každého leadu).
3. **Pole pro e-mail přímo na první obrazovce.** Ušetří jeden dotyk, +5–15 %.

Pro zachycení +20 % při základu 7 % je potřeba ~5 700 návštěv na variantu, proto začít hypotézou 1.

## 9. Jak jsem pracoval s AI (Claude Code)

**Postup:** jedna relace Claude Code, úkoly po krocích: sběr dat se zdroji → stránka → měřicí skript → opravy podle screenshotů → administrace → kontrola proti zadání.

**Instrukce agentovi:** jen skutečná data s odkazem a datem; mobile-first, jedno pole ve formuláři; české texty bez marketingových frází a slibů výnosu; po každé změně spustit měření a zkontrolovat screenshoty.

**Ověřování:** čísla ETF proti justETF/stockanalysis; cesta uživatele skriptem na emulaci iPhonu a podle screenshotů každého kroku; API a administrace end-to-end na produkci; administrace i na XSS.

**Kde AI chybovala:**
1. **Data:** VT → VWCE označila jako „stejný index“; ve skutečnosti jde o různé indexy FTSE. Opraveno.
2. **Daně:** tvrzení „irské fondy 15 % místo 30 % srážkové daně“ je pro Čecha s W‑8BEN zavádějící. Odstraněno; k daňovému limitu 2026 se zdroje rozcházely, proto zmiňuji jen tříletý časový test.
3. **Tlačítko mimo první obrazovku:** odhalil to až měřicí skript; první obrazovka přestavěna.
4. **Poděkování mimo obrazovku:** po odemčení ho tabulka vytlačila pryč; vidět jen na screenshotu. Doplněn scroll.
5. **Nesplnitelný slib:** stránka slibovala výsledek e-mailem, ale odesílání nebylo nastavené. Nalezeno při kontrole proti zadání a odstraněno.
6. **Cache:** JS a CSS se ukládaly na hodinu, takže po úpravě telefon ukazoval staré tlačítko. Opraveno.
7. **Zkreslená data v administraci:** každý lead měl „výpočet z kalkulačky“, i když ji nepoužil. Opraveno, teď se ukládá jen skutečné použití.

## 10. Co chybí

- **Údaje provozovatele v `zasady.html`.** Správcem osobních údajů je ten, kdo kampaň provozuje, tedy zadavatel, ne uchazeč. Firmu ani IČO nemám a vymyšlené údaje by porušily GDPR. Doplnění je jeden řádek.
- **Meta pixel / Conversions API** pro optimalizaci kampaně na leady.
- **E-mail s výsledkem** (připraveno, chybí ověřená doména) a dlouhé heslo administrace.
- **Kontrola na skutečném telefonu** v prohlížeči Instagramu/Facebooku (ověřena jen emulace).

---
*Nejde o investiční doporučení.*
