// Data ověřena 12. 10. 2026. Každý řádek má zdroj; při aktualizaci změňte DATA_DATE.
// US ETF: stockanalysis.com (cena k uzávěrce 9. 10. 2026), UCITS ETF: justETF.com.
window.DATA_DATE = '12. 10. 2026';

window.ETF_PAIRS = [
  {
    us: { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', ter: 0.03, aum: '1,06 bil. USD', exchange: 'NYSE Arca',
          src: 'https://stockanalysis.com/etf/voo/' },
    eu: { ticker: 'VUAA', name: 'Vanguard S&P 500 UCITS ETF (Acc)', isin: 'IE00BFMXXD54', ter: 0.07,
          aum: '33,4 mld. EUR', policy: 'akumulační', src: 'https://www.justetf.com/cz/etf-profile.html?isin=IE00BFMXXD54' },
    match: 'stejný index',
    note: 'Nejčastější volba. Stejný index S&P 500, dividendy se automaticky reinvestují.'
  },
  {
    us: { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', ter: 0.09, aum: '817 mld. USD', exchange: 'NYSE Arca',
          src: 'https://stockanalysis.com/etf/spy/' },
    eu: { ticker: 'SPYL', name: 'SPDR S&P 500 UCITS ETF (Acc)', isin: 'IE000XZSV718', ter: 0.03,
          aum: '17,6 mld. EUR', policy: 'akumulační', src: 'https://www.justetf.com/cz/etf-profile.html?isin=IE000XZSV718' },
    match: 'stejný index',
    note: 'Evropská verze je dokonce levnější než americký originál.'
  },
  {
    us: { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', ter: 0.03, aum: '891 mld. USD', exchange: 'NYSE Arca',
          src: 'https://stockanalysis.com/etf/ivv/' },
    eu: { ticker: 'CSPX / SXR8', name: 'iShares Core S&P 500 UCITS ETF (Acc)', isin: 'IE00B5BMR087', ter: 0.07,
          aum: '141,2 mld. EUR', policy: 'akumulační', src: 'https://www.justetf.com/cz/etf-profile.html?isin=IE00B5BMR087' },
    match: 'stejný index',
    note: 'Největší evropský ETF na S&P 500. V eurech na Xetře pod tickerem SXR8.'
  },
  {
    us: { ticker: 'VT', name: 'Vanguard Total World Stock ETF', ter: 0.06, aum: '82,2 mld. USD', exchange: 'NYSE Arca',
          src: 'https://stockanalysis.com/etf/vt/' },
    eu: { ticker: 'VWCE', name: 'Vanguard FTSE All-World UCITS ETF (Acc)', isin: 'IE00BK5BQT80', ter: 0.14,
          aum: '55,4 mld. EUR', policy: 'akumulační', src: 'https://www.justetf.com/cz/etf-profile.html?isin=IE00BK5BQT80' },
    match: 'podobný index',
    note: 'Celý svět v jednom fondu. VT sleduje FTSE Global All Cap, VWCE FTSE All-World (bez nejmenších firem). Rozdíl je malý.'
  },
  {
    us: { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', ter: 0.03, aum: '701 mld. USD', exchange: 'NYSE Arca',
          src: 'https://stockanalysis.com/etf/vti/' },
    eu: { ticker: 'CSPX / SXR8', name: 'iShares Core S&P 500 UCITS ETF (Acc)', isin: 'IE00B5BMR087', ter: 0.07,
          aum: '141,2 mld. EUR', policy: 'akumulační', src: 'https://investingintheweb.com/blog/vti-europe-uk-alternatives/' },
    match: 'nejbližší náhrada',
    note: 'Přesné dvojče v EU neexistuje. S&P 500 pokrývá velké americké firmy (asi 80 % trhu), chybí střední a malé.'
  },
  {
    us: { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', ter: 0.06, aum: '111 mld. USD', exchange: 'NYSE Arca',
          src: 'https://stockanalysis.com/etf/schd/' },
    eu: { ticker: 'VHYL', name: 'Vanguard FTSE All-World High Dividend Yield UCITS ETF (Dist)', isin: 'IE00B8GKDB10', ter: 0.29,
          aum: '10,0 mld. EUR', policy: 'distribuční', src: 'https://www.justetf.com/cz/etf-profile.html?isin=IE00B8GKDB10' },
    match: 'nejbližší náhrada',
    note: 'Jiný index (dividendové firmy z celého světa). Dividendy vyplácí, v ČR je musíte zdanit.'
  }
];

// Kalkulačka: srovnávací poplatek aktivního fondu banky.
// Příklad: Erste Top Stocks, celková nákladovost (TER) 2,17 % p.a., vstupní poplatek až 3 %.
window.FEE_SRC = 'https://finex.cz/fond/erste-top-stocks/';
window.ETF_TER = 0.07; // VUAA / CSPX
window.ASSUMED_RETURN = 7; // % ročně před poplatky, předpoklad, ne slib
