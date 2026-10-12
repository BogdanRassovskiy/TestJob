// Nastavení měření a variant reklamy.
// posthogKey: projektový klíč z PostHog EU (https://eu.posthog.com). Prázdný = události jen v konzoli.
window.APP_CONFIG = {
  posthogKey: '',
  posthogHost: 'https://eu.i.posthog.com'
};

// Varianta A = reklama „VOO z Česka nekoupíte“, varianta B = reklama „kalkulačka poplatků“.
// Volí se parametrem ?v=b (nebo utm_content=b). První obrazovka opakuje slib reklamy.
window.VARIANTS = {
  a: {
    eyebrow: 'Srovnání ETF z NYSE pro české investory',
    h1: 'VOO ani SPY z Česka nekoupíte. Jejich evropská dvojčata ano.',
    lead: 'Ukážeme vám, co koupit místo 6 nejoblíbenějších ETF z NYSE.',
    cta: 'Ukázat srovnání',
    target: '#srovnani',
    order: ['hero', 'table', 'calc', 'form', 'faq', 'sources']
  },
  b: {
    eyebrow: 'Kalkulačka poplatků pro české investory',
    h1: 'Bankovní fond, nebo ETF? Rozdíl dělá statisíce.',
    lead: 'Spočítejte si za 10 sekund, kolik vám vezmou poplatky.',
    cta: 'Spočítat můj rozdíl',
    target: '#kalkulacka',
    order: ['hero', 'calc', 'table', 'form', 'faq', 'sources']
  }
};
