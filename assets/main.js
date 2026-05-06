// Pulser.fit shared interactions

/* ── i18n engine ─────────────────────────────────────────────── */
const SUPPORTED_LANGS = ['en', 'pl'];
const DEFAULT_LANG = 'en';
let _translations = null;
let _currentLang = DEFAULT_LANG;

function detectLang() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get('lang');
  if (urlLang && SUPPORTED_LANGS.includes(urlLang)) return urlLang;
  const stored = localStorage.getItem('pulser_lang');
  if (stored && SUPPORTED_LANGS.includes(stored)) return stored;
  const browser = (navigator.language || '').slice(0, 2).toLowerCase();
  if (SUPPORTED_LANGS.includes(browser)) return browser;
  return DEFAULT_LANG;
}

async function loadTranslations(lang) {
  if (lang === 'en') { _translations = null; return; }
  try {
    const base = document.querySelector('script[src*="main.js"]')?.src.replace('main.js', '') || 'assets/';
    const resp = await fetch(base + 'i18n/' + lang + '.json');
    if (resp.ok) _translations = await resp.json();
  } catch (e) { _translations = null; }
}

function applyTranslations() {
  if (!_translations) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (_translations[key]) el.innerHTML = _translations[key];
  });
  document.querySelectorAll('[data-i18n-meta]').forEach(el => {
    const key = el.getAttribute('data-i18n-meta');
    if (_translations[key]) el.setAttribute('content', _translations[key]);
  });
  document.documentElement.lang = _currentLang;
}

function updateLangSwitcher() {
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    const lang = btn.getAttribute('data-lang-btn');
    btn.classList.toggle('is-active-lang', lang === _currentLang);
  });
}

async function switchLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) return;
  _currentLang = lang;
  localStorage.setItem('pulser_lang', lang);
  if (lang === 'en') {
    // Reload page to restore original English HTML
    const url = new URL(window.location);
    url.searchParams.delete('lang');
    window.location = url.toString();
    return;
  }
  await loadTranslations(lang);
  applyTranslations();
  updateLangSwitcher();
}

document.addEventListener('DOMContentLoaded', async () => {
  // Mobile menu toggle
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      menu.classList.toggle('is-open');
      const open = menu.classList.contains('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }

  // Highlight current nav link based on file name
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('is-active');
    }
  });

  // Intersection reveal
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));

  // ── Language switcher click handlers ──
  document.querySelectorAll('[data-lang-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      switchLang(btn.getAttribute('data-lang-btn'));
    });
  });

  // ── i18n: load and apply ──
  _currentLang = detectLang();
  if (_currentLang !== 'en') {
    await loadTranslations(_currentLang);
    applyTranslations();
  }
  updateLangSwitcher();

  // ── Language notice tooltip ──
  document.querySelectorAll('.lang-switch').forEach(sw => {
    const notice = _currentLang === 'pl'
      ? 'Więcej języków wkrótce'
      : 'More languages coming soon';
    sw.setAttribute('data-lang-notice', notice);
  });

  // ── Billing toggle (monthly / annual) ──
  initBillingToggle();
});

/* ── Billing toggle (Gym section only) ───────────────────────── */
let _isAnnual = false;

function initBillingToggle() {
  const toggle = document.getElementById('billing-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    _isAnnual = !_isAnnual;
    updateBillingUI();
    updateAllPrices();
  });
}

function updateBillingUI() {
  const knob = document.getElementById('billing-knob');
  const labels = document.querySelectorAll('.billing-label');
  if (knob) {
    knob.style.transform = _isAnnual ? 'translateX(1.5rem)' : 'translateX(0)';
  }
  labels.forEach(l => {
    const mode = l.getAttribute('data-billing');
    if (mode === 'annual') {
      l.style.color = _isAnnual ? '#fff' : 'rgba(255,255,255,0.5)';
    } else {
      l.style.color = _isAnnual ? 'rgba(255,255,255,0.5)' : '#fff';
    }
  });
  const toggleBtn = document.getElementById('billing-toggle');
  if (toggleBtn) {
    toggleBtn.style.backgroundColor = _isAnnual ? '#FF3B47' : 'rgba(255,255,255,0.15)';
  }
}

function updateAllPrices() {
  // Annual discount only kicks in for elements that have data-price-annual (Gym only)
  document.querySelectorAll('[data-price]').forEach(el => {
    const monthly = parseFloat(el.getAttribute('data-price'));
    const annualAttr = el.getAttribute('data-price-annual');
    const base = (_isAnnual && annualAttr) ? parseFloat(annualAttr) : monthly;
    const display = base % 1 !== 0 ? base.toFixed(2) : Math.round(base);
    el.textContent = '\u20ac' + display;
  });

  // Update per-unit addon prices (annual only if data-addon-annual exists)
  document.querySelectorAll('[data-addon-price]').forEach(el => {
    const monthly = parseFloat(el.getAttribute('data-addon-price'));
    const annualAttr = el.getAttribute('data-addon-annual');
    const base = (_isAnnual && annualAttr) ? parseFloat(annualAttr) : monthly;
    const adjusted = Math.round(base);
    const origText = el.getAttribute('data-original-text') || el.textContent;
    if (!el.getAttribute('data-original-text')) el.setAttribute('data-original-text', origText);
    el.textContent = origText.replace(/[€$£]\d+/, '\u20ac' + adjusted);
  });

  // Update Gym billing suffix only (has billing-suffix class)
  document.querySelectorAll('.billing-suffix').forEach(el => {
    el.textContent = _isAnnual ? '/mo \u00b7 billed annually' : '/mo';
  });

  // Update Gym example calculation
  const gymEx = document.getElementById('gym-example');
  if (gymEx) {
    const base = _isAnnual ? 254 : 299;
    const per = _isAnnual ? 127 : 149;
    const total = base + (3 * per);
    gymEx.innerHTML = 'a 4-location chain pays \u20ac' + base + ' + (3 \u00d7 \u20ac' + per + ') = <span class="text-white">\u20ac' + total + '/mo</span>';
  }
}
