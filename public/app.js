(function () {
  'use strict';

  var T0 = performance.now();
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---------- Varianta ----------
  var params = new URLSearchParams(location.search);
  var vParam = (params.get('v') || params.get('utm_content') || 'a').toLowerCase();
  var variant = window.VARIANTS[vParam] ? vParam : 'a';
  var V = window.VARIANTS[variant];
  var utm = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    if (params.get(k)) utm[k] = params.get(k);
  });

  // ---------- Měření ----------
  // Každá událost: název, varianta, ms od načtení. window.__events čte i scripts/measure.mjs.
  window.__events = [];
  // Kroky funnelu, které se počítají i na serveru (admin stránka). Každý max. jednou za návštěvu.
  var FUNNEL = { lp_view: 1, hero_cta: 1, 'section_view:table': 1, 'section_view:calc': 1, 'section_view:form': 1,
    calc_interact: 1, unlock_click: 1, calc_cta: 1, sticky_cta: 1, form_focus: 1, form_submit: 1, form_error: 1,
    lead_success: 1, lead_fail: 1 };
  var sent = {};
  var cfg = window.APP_CONFIG || {};
  if (cfg.posthogKey) loadPosthog(cfg.posthogKey, cfg.posthogHost);

  function track(name, props) {
    var p = Object.assign({ variant: variant, t_ms: Math.round(performance.now() - T0) }, props || {});
    window.__events.push({ event: name, props: p });
    if (window.posthog && window.posthog.capture) window.posthog.capture(name, p);
    var key = name === 'section_view' ? name + ':' + p.section : name;
    if (FUNNEL[key] && !sent[key]) {
      sent[key] = true;
      var payload = JSON.stringify({ event: key, variant: variant });
      if (!(navigator.sendBeacon && navigator.sendBeacon('/api/track', payload))) {
        fetch('/api/track', { method: 'POST', body: payload, keepalive: true }).catch(function () {});
      }
    }
    if (location.hostname === 'localhost') console.debug('[track]', name, p);
  }

  function loadPosthog(key, host) {
    // Oficiální snippet, zkrácený. persistence: 'memory' = bez cookies, není potřeba cookie lišta.
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},o="capture identify reset register get_distinct_id".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    window.posthog.init(key, { api_host: host, persistence: 'memory', autocapture: false, capture_pageview: true });
    window.posthog.register({ variant: variant });
  }

  // ---------- Pořadí sekcí a texty podle varianty ----------
  var main = $('#sections');
  V.order.forEach(function (name) {
    var el = $('[data-section="' + name + '"]', main);
    if (el) main.appendChild(el);
  });
  $$('[data-variant-text]').forEach(function (el) { el.textContent = V[el.getAttribute('data-variant-text')]; });
  $$('[data-variant-show]').forEach(function (el) { el.hidden = el.getAttribute('data-variant-show') !== variant; });
  var heroCta = $('[data-variant-cta]');
  heroCta.textContent = V.cta;
  heroCta.setAttribute('href', V.target);
  $$('[data-date]').forEach(function (el) { el.textContent = window.DATA_DATE; });
  $('[data-fee-src]').href = window.FEE_SRC;

  // ---------- Formátování ----------
  var czk = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
  var pct = function (n) { return n.toLocaleString('cs-CZ', { minimumFractionDigits: 2 }) + ' %'; };
  var round1k = function (n) { return Math.round(n / 1000) * 1000; };

  // ---------- Kalkulačka ----------
  function fv(monthly, years, feePct) {
    var i = (window.ASSUMED_RETURN - feePct) / 100 / 12;
    var n = years * 12;
    return monthly * (Math.pow(1 + i, n) - 1) / i;
  }
  var calc = { monthly: 3000, years: 20, fee: 2 };
  var calcTouched = false;

  function renderCalc() {
    var fund = fv(calc.monthly, calc.years, calc.fee);
    var etf = fv(calc.monthly, calc.years, window.ETF_TER);
    var diff = round1k(etf - fund);
    var paid = calc.monthly * calc.years * 12;
    var w = function (x) { return (Math.max(x, 0) / etf * 100).toFixed(2) + '%'; };
    setBar('etfPaid', w(paid)); setBar('etfGain', w(etf - paid));
    setBar('fundPaid', w(paid)); setBar('fundGain', w(fund - paid)); setBar('fundLost', w(etf - fund));
    out('feeLabel', calc.fee.toLocaleString('cs-CZ') + ' %');
    out('fvFund', czk.format(round1k(fund)));
    out('fvEtf', czk.format(round1k(etf)));
    out('diff', czk.format(diff));
    out('paid', czk.format(paid));
    return diff;
  }
  function setBar(key, w) { $$('[data-bar="' + key + '"]').forEach(function (el) { el.style.width = w; }); }
  function out(key, val) { $$('[data-out="' + key + '"]').forEach(function (el) { el.textContent = val; }); }

  $$('[data-calc]').forEach(function (group) {
    var key = group.getAttribute('data-calc');
    group.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      $$('button', group).forEach(function (x) { x.classList.toggle('on', x === b); });
      calc[key] = parseFloat(b.getAttribute('data-val'));
      var diff = renderCalc();
      if (!calcTouched) { calcTouched = true; track('calc_interact'); }
      track('calc_change', { field: key, value: calc[key], diff: diff });
    });
  });
  // Hero B ukazuje výchozí výpočet, ať číslo v reklamě i na stránce sedí.
  var heroDiff = fv(3000, 20, window.ETF_TER) - fv(3000, 20, 2);
  $$('[data-hero-diff]').forEach(function (el) { el.textContent = czk.format(round1k(heroDiff)); });
  renderCalc();

  // ---------- Srovnání ETF ----------
  var FREE_ROWS = 2;
  var unlocked = localStorage.getItem('etf_unlocked') === '1';

  function pairHtml(p, i) {
    return '<details class="pair"' + (i === 0 ? ' open' : '') + '>' +
      '<summary class="pair-row">' +
        '<span class="pr-us"><s>' + p.us.ticker + '</s><small>' + pct(p.us.ter) + '</small></span>' +
        '<span class="pr-arrow" aria-hidden="true">→</span>' +
        '<span class="pr-eu"><b>' + p.eu.ticker + '</b><small>' + pct(p.eu.ter) + ' · ' + p.match + '</small></span>' +
        '<span class="chev" aria-hidden="true"></span>' +
      '</summary>' +
      '<div class="pair-body">' +
        '<p class="nm"><b>' + p.eu.name + '</b></p>' +
        '<dl><div><dt>ISIN</dt><dd class="isin">' + p.eu.isin + '</dd></div><div><dt>Dividendy</dt><dd>' + p.eu.policy + '</dd></div>' +
        '<div><dt>Velikost (EU)</dt><dd>' + p.eu.aum + '</dd></div><div><dt>Velikost ' + p.us.ticker + '</dt><dd>' + p.us.aum + '</dd></div></dl>' +
        '<p class="note">' + p.note + '</p>' +
        '<p class="src">Zdroje: <a href="' + p.us.src + '" rel="noopener" target="_blank">' + p.us.ticker + '</a> · ' +
          '<a href="' + p.eu.src + '" rel="noopener" target="_blank">' + p.eu.ticker + '</a></p>' +
      '</div>' +
    '</details>';
  }
  function lockedHtml(p) {
    return '<a href="#ziskat" class="pair pair-row pair-locked" data-locked>' +
      '<span class="pr-us"><s>' + p.us.ticker + '</s><small>' + pct(p.us.ter) + '</small></span>' +
      '<span class="pr-arrow" aria-hidden="true">→</span>' +
      '<span class="pr-eu"><b class="blur" aria-hidden="true">XXXX</b><small>odemknout zdarma</small></span>' +
      '<span class="lock-ico" aria-hidden="true">🔒</span>' +
    '</a>';
  }
  function renderPairs() {
    var all = window.ETF_PAIRS;
    var html = unlocked ? all.map(pairHtml).join('')
      : all.slice(0, FREE_ROWS).map(pairHtml).join('') + all.slice(FREE_ROWS).map(lockedHtml).join('');
    $('[data-pairs]').innerHTML = html;
    $('[data-lock]').hidden = unlocked;
  }
  renderPairs();

  // ---------- Formulář ----------
  var TYPO = { 'gmail.cz': 'gmail.com', 'gmial.com': 'gmail.com', 'gmail.con': 'gmail.com', 'gmai.com': 'gmail.com',
    'seznam.com': 'seznam.cz', 'seznma.cz': 'seznam.cz', 'sezam.cz': 'seznam.cz', 'centrum.com': 'centrum.cz', 'email.com': 'email.cz' };
  var form = $('[data-lead-form]');
  var input = $('#email');
  var err = $('[data-form-err]');
  var focused = false;

  input.addEventListener('focus', function () { if (!focused) { focused = true; track('form_focus'); } });

  function showErr(msg) { err.textContent = msg; err.hidden = false; }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = input.value.trim().toLowerCase();
    if (!/^[^\s@<>"']+@[^\s@<>"']+\.[a-z]{2,}$/.test(email)) {
      track('form_error', { reason: 'invalid' });
      return showErr('Zkontrolujte prosím e-mail, něco v něm chybí.');
    }
    var domain = email.split('@')[1];
    if (TYPO[domain] && input.dataset.typoShown !== domain) {
      input.dataset.typoShown = domain;
      track('form_error', { reason: 'typo', domain: domain });
      return showErr('Nemysleli jste @' + TYPO[domain] + '? Pokud ne, odešlete znovu.');
    }
    err.hidden = true;
    var btn = $('button', form);
    btn.disabled = true;
    btn.textContent = 'Odemykám…';
    var ms = Math.round(performance.now() - T0);
    track('form_submit');

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, company: form.company.value, variant: variant, utm: utm,
        calc: calc, time_to_lead_ms: ms, page: location.pathname + location.search })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      track('lead_success', { time_to_lead_ms: ms, calc_touched: calcTouched });
      unlocked = true;
      localStorage.setItem('etf_unlocked', '1');
      renderPairs();
      out('email', email);
      $('[data-form-wrap]').hidden = true;
      $('[data-thanks]').hidden = false;
      $('[data-sticky]').hidden = true;
      $('[data-thanks]').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }).catch(function (x) {
      track('lead_fail', { error: String(x) });
      showErr('Nepodařilo se odeslat. Zkuste to prosím za chvíli znovu.');
      btn.disabled = false;
      btn.textContent = 'Odemknout zdarma';
    });
  });

  // ---------- Kliky na CTA ----------
  function goTo(href) {
    $(href).scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (href === '#ziskat') setTimeout(function () { input.focus({ preventScroll: true }); }, 450);
  }
  $$('[data-track]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      track(el.getAttribute('data-track'));
      var href = el.getAttribute('href');
      if (href && href.charAt(0) === '#') { e.preventDefault(); goTo(href); }
    });
  });
  // Zamčené řádky srovnání se vykreslují dynamicky, proto delegace.
  var pairsEl = $('[data-pairs]');
  pairsEl.addEventListener('click', function (e) {
    if (!e.target.closest('[data-locked]')) return;
    e.preventDefault();
    track('unlock_click', { from: 'row' });
    goTo('#ziskat');
  });
  pairsEl.addEventListener('toggle', function (e) {
    if (e.target.open) track('pair_expand', { ticker: e.target.querySelector('.pr-us s').textContent });
  }, true);

  // ---------- Viditelnost sekcí, sticky CTA, scroll ----------
  var sticky = $('[data-sticky]');
  var heroVisible = true, formVisible = false;
  function updateSticky() { sticky.hidden = unlocked || heroVisible || formVisible; }

  var seen = {};
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var name = en.target.getAttribute('data-section');
      if (name === 'hero') heroVisible = en.isIntersecting;
      if (name === 'form') formVisible = en.isIntersecting;
      if (en.isIntersecting && !seen[name]) { seen[name] = true; track('section_view', { section: name }); }
    });
    updateSticky();
  }, { threshold: 0.25 });
  $$('[data-section]').forEach(function (s) { io.observe(s); });

  var depths = [25, 50, 75, 100], hit = {};
  addEventListener('scroll', function () {
    var h = document.documentElement;
    var d = (h.scrollTop + innerHeight) / h.scrollHeight * 100;
    depths.forEach(function (x) { if (d >= x - 1 && !hit[x]) { hit[x] = true; track('scroll_depth', { depth: x }); } });
  }, { passive: true });

  addEventListener('pagehide', function () {
    track('page_leave', { calc_touched: calcTouched, form_focused: focused, unlocked: unlocked });
  });

  track('lp_view', Object.assign({ unlocked_before: unlocked }, utm));
})();
