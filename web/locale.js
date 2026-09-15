// Locale detection from subdomain + browser language auto-redirect
// es.saimantrajapam.org → 'es'
// hi.saimantrajapam.org → 'hi'
// (any other) → 'en'

// Auto-redirect from root domain based on browser language
(function() {
  const hostname = window.location.hostname;
  const isRootDomain = hostname === 'saimantrajapam.org' || hostname === 'www.saimantrajapam.org';
  
  // Skip if already on a locale subdomain
  const parts = hostname.split('.');
  const hasLocaleSubdomain = parts.length >= 3 && ['es', 'hi', 'en'].includes(parts[0]);
  
  // Skip if user has explicitly set language preference
  const hasExplicitLang = document.cookie.includes('lang=') || new URLSearchParams(window.location.search).has('lang');
  
  // Skip if already redirected once in this session
  const alreadyRedirected = sessionStorage.getItem('localeRedirected') === '1';
  
  if (isRootDomain && !hasLocaleSubdomain && !hasExplicitLang && !alreadyRedirected) {
    const browserLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    const primary = browserLang.split('-')[0];
    
    const localeMap = { en: 'en', es: 'es', hi: 'hi' };
    const sub = localeMap[primary] || 'en';
    
    const target = 'https://' + sub + '.saimantrajapam.org' + window.location.pathname + window.location.search;
    
    if (window.location.href !== target) {
      sessionStorage.setItem('localeRedirected', '1');
      window.location.replace(target);
    }
  }
})();

function detectLocale() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (['es', 'hi', 'en'].includes(subdomain)) {
      return subdomain;
    }
  }
  // Check for query param override
  const params = new URLSearchParams(window.location.search);
  if (params.has('lang')) {
    const lang = params.get('lang');
    if (['es', 'hi', 'en'].includes(lang)) return lang;
  }
  // Default to English
  return 'en';
}

const LOCALE = detectLocale();
document.documentElement.lang = LOCALE;

// Translations
const translations = {
  en: {
    'app.title': 'Sri Sathya Sai Mantra Japam',
    'dashboard.totalCount': 'Total Count',
    'dashboard.dailyBreakdown': 'Daily Breakdown',
    'dashboard.locations': 'Locations',
    'dashboard.registerName': 'Register Name',
    'dashboard.submitJapam': 'Submit your Japam count',
    'register.title': 'Register Your Name',
    'register.label': 'Full Name (required)',
    'register.placeholder': 'Your name',
    'register.hint': 'Register once to appear in the submission dropdown.',
    'register.button': 'Register',
    'register.success': 'Name registered!',
    'register.alreadyExists': 'Name already registered',
    'register.failed': 'Registration failed',
    'submit.title': 'Submit Today',
    'submit.nameLabel': 'Name (select or leave anonymous)',
    'submit.anonymous': '— Anonymous —',
    'submit.hint': 'Your submission will be recorded but your name will not be displayed publicly.',
    'submit.dateLabel': 'Date (required)',
    'submit.countLabel': 'Japam Count (required)',
    'submit.button': 'Submit your Japam count',
    'submit.success': 'Submitted — updating dashboard.',
    'submit.failed': 'Submission failed. See console for details.',
    'submit.required': 'Please provide date and count.',
    'submit.dateFuture': 'Date cannot be in the future.',
    'modal.close': 'Close',
  },
  es: {
    'app.title': 'Japam de Mantra de Sri Sathya Sai',
    'dashboard.totalCount': 'Conteo Total',
    'dashboard.dailyBreakdown': 'Desglose Diario',
    'dashboard.locations': 'Ubicaciones',
    'dashboard.registerName': 'Registrar Nombre',
    'dashboard.submitJapam': 'Enviar tu conteo de Japam',
    'register.title': 'Registrar Tu Nombre',
    'register.label': 'Nombre Completo (requerido)',
    'register.placeholder': 'Tu nombre',
    'register.hint': 'Regístrate una vez para aparecer en el menú de envío.',
    'register.button': 'Registrar',
    'register.success': '¡Nombre registrado!',
    'register.alreadyExists': 'El nombre ya está registrado',
    'register.failed': 'Falló el registro',
    'submit.title': 'Enviar Hoy',
    'submit.nameLabel': 'Nombre (seleccionar o dejar anónimo)',
    'submit.anonymous': '— Anónimo —',
    'submit.hint': 'Tu envío se registrará pero tu nombre no se mostrará públicamente.',
    'submit.dateLabel': 'Fecha (requerida)',
    'submit.countLabel': 'Conteo de Japam (requerido)',
    'submit.button': 'Enviar tu conteo de Japam',
    'submit.success': 'Enviado — actualizando panel.',
    'submit.failed': 'Falló el envío. Consulta la consola para detalles.',
    'submit.required': 'Por favor proporciona fecha y conteo.',
    'submit.dateFuture': 'La fecha no puede ser futura.',
    'modal.close': 'Cerrar',
  },
  hi: {
    'app.title': 'श्री सत्य साई मंत्र जपम्',
    'dashboard.totalCount': 'कुल संख्या',
    'dashboard.dailyBreakdown': 'दैनिक विवरण',
    'dashboard.locations': 'स्थान',
    'dashboard.registerName': 'नाम पंजीकृत करें',
    'dashboard.submitJapam': 'अपना जपम् काउंट जमा करें',
    'register.title': 'अपना नाम पंजीकृत करें',
    'register.label': 'पूरा नाम (आवश्यक)',
    'register.placeholder': 'आपका नाम',
    'register.hint': 'एक बार पंजीकृत होने पर जमा करने के ड्रॉपडाउन में दिखाई देगा।',
    'register.button': 'पंजीकृत करें',
    'register.success': 'नाम पंजीकृत!',
    'register.alreadyExists': 'नाम पहले से पंजीकृत है',
    'register.failed': 'पंजीकरण विफल',
    'submit.title': 'आज जमा करें',
    'submit.nameLabel': 'नाम (चुनें या गुमनाम छोड़ें)',
    'submit.anonymous': '— गुमनाम —',
    'submit.hint': 'आपका जमा रिकॉर्ड किया जाएगा लेकिन आपका नाम सार्वजनिक रूप से प्रदर्शित नहीं किया जाएगा।',
    'submit.dateLabel': 'तारीख (आवश्यक)',
    'submit.countLabel': 'जपम् काउंट (आवश्यक)',
    'submit.button': 'अपना जपम् काउंट जमा करें',
    'submit.success': 'जमा किया गया — डैशबोर्ड अपडेट हो रहा है।',
    'submit.failed': 'जमा करना विफल। विवरण के लिए कंसोल देखें।',
    'submit.required': 'कृपया तारीख और काउंट प्रदान करें।',
    'submit.dateFuture': 'तारीख भविष्य की नहीं हो सकती।',
    'modal.close': 'बंद करें',
  },
};

function t(key) {
  return translations[LOCALE]?.[key] || translations.en[key] || key;
}

// Apply translations on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else if (el.tagName === 'OPTION' && el.value === '') {
      el.textContent = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  
  // Update document title
  document.title = t('app.title');
  
  // Update lang attribute on html
  document.documentElement.lang = LOCALE;
  
  // Language switcher
  console.log('[Locale] DOMContentLoaded, LOCALE:', LOCALE);
  console.log('[Locale] Found lang-btn elements:', document.querySelectorAll('.lang-btn').length);
  document.querySelectorAll('.lang-btn').forEach(btn => {
    if (btn.dataset.lang === LOCALE) btn.classList.add('active');
    btn.addEventListener('click', () => {
      console.log('[Locale] Button clicked:', btn.dataset.lang);
      const lang = btn.dataset.lang;
      // Set cookie for persistence (1 year)
      document.cookie = `lang=${lang}; path=/; max-age=${60*60*24*365}; SameSite=Lax`;
      // Redirect to locale subdomain
      const hostname = window.location.hostname;
      const parts = hostname.split('.');
      let newHostname;
      if (parts.length >= 3 && ['es', 'hi', 'en'].includes(parts[0])) {
        newHostname = [lang, ...parts.slice(1)].join('.');
      } else {
        newHostname = `${lang}.${hostname}`;
      }
      const target = `${window.location.protocol}//${newHostname}${window.location.pathname}${window.location.search}`;
      console.log('[Locale] Redirecting to:', target);
      window.location.href = target;
    });
  });
});

export { LOCALE, t };