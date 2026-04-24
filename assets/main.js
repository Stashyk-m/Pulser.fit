// Pulser.fit shared interactions

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

  // ── Billing toggle (monthly / annual) ──
  initBillingToggle();

  // ── Geo-pricing ──
  initGeoPricing();
});

/* ── Billing toggle (Gym section only) ───────────────────────── */
let _isAnnual = false;
let _currencySymbol = '€';
let _geoMultiplier = 1;

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
  const sym = _currencySymbol;
  const mult = _geoMultiplier;

  // Update ALL price elements (geo applies to all)
  // Annual discount only kicks in for elements that have data-price-annual (Gym only)
  document.querySelectorAll('[data-price]').forEach(el => {
    const monthly = parseFloat(el.getAttribute('data-price'));
    const annualAttr = el.getAttribute('data-price-annual');
    const base = (_isAnnual && annualAttr) ? parseFloat(annualAttr) : monthly;
    const val = base * mult;
    const display = val % 1 !== 0 ? val.toFixed(2) : Math.round(val);
    el.textContent = sym + display;
  });

  // Update per-unit addon prices (geo applies to all, annual only if data-addon-annual exists)
  document.querySelectorAll('[data-addon-price]').forEach(el => {
    const monthly = parseFloat(el.getAttribute('data-addon-price'));
    const annualAttr = el.getAttribute('data-addon-annual');
    const base = (_isAnnual && annualAttr) ? parseFloat(annualAttr) : monthly;
    const adjusted = Math.round(base * mult);
    const origText = el.getAttribute('data-original-text') || el.textContent;
    if (!el.getAttribute('data-original-text')) el.setAttribute('data-original-text', origText);
    el.textContent = origText.replace(/[€$£]\d+/, sym + adjusted);
  });

  // Update Gym billing suffix only (has billing-suffix class)
  document.querySelectorAll('.billing-suffix').forEach(el => {
    el.textContent = _isAnnual ? '/mo \u00b7 billed annually' : '/mo';
  });

  // Update Gym example calculation
  const gymEx = document.getElementById('gym-example');
  if (gymEx) {
    const base = Math.round((_isAnnual ? 254 : 299) * mult);
    const per = Math.round((_isAnnual ? 127 : 149) * mult);
    const total = base + (3 * per);
    gymEx.innerHTML = 'a 4-location chain pays ' + sym + base + ' + (3 \u00d7 ' + sym + per + ') = <span class="text-white">' + sym + total + '/mo</span>';
  }

}

/* ── Geo-pricing (Gym section only) ──────────────────────────── */
const GEO_PRICING = {
  // Price-sensitive markets: ~40-50% of EU price
  PL: { multiplier: 0.40, symbol: '\u20ac', label: 'Poland' },
  RO: { multiplier: 0.45, symbol: '\u20ac', label: 'Romania' },
  CZ: { multiplier: 0.45, symbol: '\u20ac', label: 'Czech Republic' },
  HU: { multiplier: 0.40, symbol: '\u20ac', label: 'Hungary' },
  IN: { multiplier: 0.35, symbol: '$', label: 'India' },
  ID: { multiplier: 0.35, symbol: '$', label: 'Indonesia' },
  PH: { multiplier: 0.35, symbol: '$', label: 'Philippines' },
  BR: { multiplier: 0.45, symbol: '$', label: 'Brazil' },
  MX: { multiplier: 0.45, symbol: '$', label: 'Mexico' },
  TR: { multiplier: 0.40, symbol: '$', label: 'Turkey' },
  // Mid-range markets
  ES: { multiplier: 0.75, symbol: '\u20ac', label: 'Spain' },
  PT: { multiplier: 0.70, symbol: '\u20ac', label: 'Portugal' },
  IT: { multiplier: 0.80, symbol: '\u20ac', label: 'Italy' },
  GR: { multiplier: 0.65, symbol: '\u20ac', label: 'Greece' },
};

function initGeoPricing() {
  fetch('https://ipapi.co/json/', { mode: 'cors' })
    .then(r => r.json())
    .then(data => {
      const country = data.country_code;
      if (country && GEO_PRICING[country]) {
        const geo = GEO_PRICING[country];
        _geoMultiplier = geo.multiplier;
        _currencySymbol = geo.symbol;
        updateAllPrices();
        showGeoBanner(geo.label);
      }
    })
    .catch(() => { /* silently fail — show default EUR prices */ });
}

function showGeoBanner(countryName) {
  const banner = document.createElement('div');
  banner.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl bg-[#12121A] border border-white/10 text-sm text-white/80 flex items-center gap-3 shadow-lg';
  banner.innerHTML = '<span>\ud83c\udf0d</span><span>Gym prices adjusted for <strong class="text-white">' + countryName + '</strong>. <a href="contact.html" class="text-brand hover:underline">Contact us</a> for exact local pricing.</span><button onclick="this.parentElement.remove()" class="ml-2 text-white/40 hover:text-white">\u2715</button>';
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentElement) banner.remove(); }, 8000);
}
