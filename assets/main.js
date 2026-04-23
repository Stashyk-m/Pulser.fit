// Pulser.fit shared interactions

/* ── i18n engine ─────────────────────────────────────────────── */
const SUPPORTED_LANGS = ['en','de','fr','es','it','pl','nl','pt','zh','ja','ko','ar','hi','sv','da','fi','no','cs','ro'];
const RTL_LANGS = ['ar'];
const LANG_LABELS = {en:'English',de:'Deutsch',fr:'Français',es:'Español',it:'Italiano',pl:'Polski',nl:'Nederlands',pt:'Português',zh:'中文',ja:'日本語',ko:'한국어',ar:'العربية',hi:'हिन्दी',sv:'Svenska',da:'Dansk',fi:'Suomi',no:'Norsk',cs:'Čeština',ro:'Română'};

let _i18nCache = {};
let _currentLang = localStorage.getItem('pulser_lang') || 'en';

async function loadLang(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';
  if (!_i18nCache[lang]) {
    try {
      const r = await fetch('assets/i18n/' + lang + '.json');
      if (!r.ok) throw new Error(r.status);
      _i18nCache[lang] = await r.json();
    } catch (e) {
      console.warn('i18n: could not load ' + lang + ', falling back to en');
      if (lang !== 'en') return loadLang('en');
      _i18nCache['en'] = {};
    }
  }
  return _i18nCache[lang];
}

function applyLang(dict, lang) {
  _currentLang = lang;
  localStorage.setItem('pulser_lang', lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang) ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      // handle placeholder and title attributes
      if (el.hasAttribute('placeholder') && dict[key + '_placeholder']) {
        el.setAttribute('placeholder', dict[key + '_placeholder']);
      }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.setAttribute('placeholder', dict[key]);
      } else {
        el.innerHTML = dict[key];
      }
    }
  });

  // Update switcher label
  const codeEl = document.querySelector('.lang-code');
  if (codeEl) codeEl.textContent = lang.toUpperCase();
}

async function switchLang(lang) {
  const dict = await loadLang(lang);
  applyLang(dict, lang);
  // Close dropdown
  document.querySelectorAll('.lang-dropdown').forEach(d => d.classList.remove('is-open'));
}

function buildLangSwitcher() {
  const container = document.querySelector('.lang-switcher');
  if (!container) return;
  const btn = container.querySelector('.lang-btn');
  const dropdown = container.querySelector('.lang-dropdown');
  if (!btn || !dropdown) return;

  // Populate dropdown
  dropdown.innerHTML = '';
  SUPPORTED_LANGS.forEach(code => {
    const item = document.createElement('button');
    item.className = 'lang-option';
    item.setAttribute('data-lang', code);
    item.innerHTML = '<span class="lang-option-code">' + code.toUpperCase() + '</span> ' + LANG_LABELS[code];
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      switchLang(code);
    });
    dropdown.appendChild(item);
  });

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('is-open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('is-open'));
}

document.addEventListener('DOMContentLoaded', () => {
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

  // ── i18n init ──
  buildLangSwitcher();
  if (_currentLang !== 'en') {
    loadLang(_currentLang).then(dict => applyLang(dict, _currentLang));
  }
});
