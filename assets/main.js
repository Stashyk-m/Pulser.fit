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

const LANG_LABELS = { en: 'English', pl: 'Polski' };

function updateLangSwitcher() {
  // Update trigger label
  document.querySelectorAll('.lang-dropdown-trigger-label').forEach(el => {
    el.textContent = (_currentLang || 'en').toUpperCase();
  });
  // Update active state in menu
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

  // ── Language dropdown ──
  document.querySelectorAll('.lang-dropdown').forEach(dd => {
    const trigger = dd.querySelector('.lang-dropdown-trigger');
    if (trigger) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        // Close other open dropdowns
        document.querySelectorAll('.lang-dropdown.is-open').forEach(other => {
          if (other !== dd) other.classList.remove('is-open');
        });
        dd.classList.toggle('is-open');
      });
    }
    dd.querySelectorAll('[data-lang-btn]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        dd.classList.remove('is-open');
        switchLang(btn.getAttribute('data-lang-btn'));
      });
    });
  });
  // Close dropdown on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.lang-dropdown.is-open').forEach(dd => dd.classList.remove('is-open'));
  });

  // ── i18n: load and apply ──
  _currentLang = detectLang();
  if (_currentLang !== 'en') {
    await loadTranslations(_currentLang);
    applyTranslations();
  }
  updateLangSwitcher();

  // ── Billing toggle (monthly / annual) ──
  initBillingToggle();

  // ── Cookie consent ──
  initCookieBanner();

  // ── Auth-aware nav ──
  initAuthNav();
});

/* ── Auth-aware navigation ─────────────────────────────────────── */
async function initAuthNav() {
  // Only run if Clerk script is present on the page
  // For pages without Clerk, we load it dynamically to check session
  let clerk = window.Clerk;
  if (!clerk) {
    // Try to load Clerk lightly to check session
    try {
      const script = document.createElement('script');
      script.src = 'https://clerk.pulser.fit/npm/@clerk/clerk-js@latest/dist/clerk.browser.js';
      script.setAttribute('data-clerk-publishable-key', 'pk_live_Y2xlcmsucHVsc2VyLmZpdCQ');
      script.async = true;
      document.head.appendChild(script);
      clerk = await new Promise((resolve) => {
        script.onload = () => resolve(window.Clerk);
        script.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 5000);
      });
    } catch (e) { return; }
  }
  if (!clerk) return;

  try {
    // If Clerk not yet loaded (e.g. on login.html it loads separately), wait
    if (!clerk.user && !clerk.loaded) {
      await clerk.load();
    }
  } catch (e) { return; }

  if (!clerk.user) return;

  // User is signed in — replace "Sign In" links with user name + avatar
  const signInLinks = document.querySelectorAll('a[href*="login.html"]');
  const userName = clerk.user.firstName || clerk.user.emailAddresses?.[0]?.emailAddress?.split('@')[0] || '';
  const initial = (userName || '?')[0].toUpperCase();

  signInLinks.forEach(link => {
    // Only replace nav-level sign-in links, not footer links
    if (!link.closest('header, .nav')) return;
    link.href = 'login.html';
    link.setAttribute('data-i18n', '');
    link.className = 'nav-link hidden sm:inline-flex text-sm';
    link.style.display = '';
    link.innerHTML = '<span style="display:inline-flex;align-items:center;justify-content:center;width:1.35rem;height:1.35rem;border-radius:50%;background:#CB0020;color:#fff;font-size:0.6rem;font-weight:700;margin-right:0.35rem;flex-shrink:0;">' + initial + '</span>' + userName;
  });
}

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

/* \u2500\u2500 Cookie consent \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
const COOKIE_TEXTS = {
  en: {
    message: 'We use essential cookies to keep the site running and optional analytics cookies to improve your experience. See our <a href="cookies.html">Cookie Policy</a> for details.',
    accept: 'Accept all',
    reject: 'Essential only'
  },
  pl: {
    message: 'U\u017cywamy niezb\u0119dnych plik\u00f3w cookie do dzia\u0142ania strony oraz opcjonalnych plik\u00f3w analitycznych, aby poprawi\u0107 Twoje do\u015bwiadczenia. Szczeg\u00f3\u0142y w naszej <a href="cookies.html">Polityce cookie</a>.',
    accept: 'Akceptuj wszystkie',
    reject: 'Tylko niezb\u0119dne'
  }
};

function initCookieBanner() {
  if (localStorage.getItem('pulser_cookie_consent')) return;

  const banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookie-banner';

  const lang = _currentLang || 'en';
  const t = COOKIE_TEXTS[lang] || COOKIE_TEXTS.en;

  banner.innerHTML =
    '<div class="cookie-inner">' +
      '<div class="cookie-text">' + t.message + '</div>' +
      '<div class="cookie-actions">' +
        '<button class="cookie-btn cookie-btn-reject" id="cookie-reject">' + t.reject + '</button>' +
        '<button class="cookie-btn cookie-btn-accept" id="cookie-accept">' + t.accept + '</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(banner);

  requestAnimationFrame(() => banner.classList.add('is-visible'));

  document.getElementById('cookie-accept').addEventListener('click', () => {
    localStorage.setItem('pulser_cookie_consent', 'all');
    banner.classList.remove('is-visible');
    setTimeout(() => banner.remove(), 400);
  });
  document.getElementById('cookie-reject').addEventListener('click', () => {
    localStorage.setItem('pulser_cookie_consent', 'essential');
    banner.classList.remove('is-visible');
    setTimeout(() => banner.remove(), 400);
  });
}
