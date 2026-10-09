(() => {
  'use strict';

  const STORAGE_KEY = 'ryokan_privacy_consent';
  const CONSENT_VERSION = '2026-10-09';
  const CONSENT_MODE = 'basic';
  const scriptElement = document.currentScript;
  const siteRoot = new URL('.', scriptElement?.src || window.location.href);
  const gtmId = scriptElement?.dataset.gtmId || '';
  const policyUrl = new URL('privacidade/', siteRoot).href;
  const cookiesUrl = new URL('politica-de-cookies/', siteRoot).href;

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    wait_for_update: 500
  });

  const blankState = () => ({
    version: CONSENT_VERSION,
    mode: CONSENT_MODE,
    analytics: false,
    marketing: false,
    updatedAt: null
  });

  const readState = () => {
    try {
      const state = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (
        state?.version === CONSENT_VERSION &&
        state?.mode === CONSENT_MODE &&
        typeof state.analytics === 'boolean' &&
        typeof state.marketing === 'boolean' &&
        typeof state.updatedAt === 'string'
      ) return state;
    } catch (_) {
      // Prefer the privacy-safe defaults when storage is unavailable or invalid.
    }
    return blankState();
  };

  let consentState = readState();
  let gtmLoaded = false;
  let preferencesDialog;
  let banner;

  const allows = (category) => category === 'necessary' || consentState[category] === true;

  const updateConsentMode = () => {
    window.gtag('consent', 'update', {
      analytics_storage: allows('analytics') ? 'granted' : 'denied',
      ad_storage: allows('marketing') ? 'granted' : 'denied',
      ad_user_data: allows('marketing') ? 'granted' : 'denied',
      ad_personalization: allows('marketing') ? 'granted' : 'denied'
    });
  };

  const loadGtm = () => {
    if (gtmLoaded || !gtmId || (!allows('analytics') && !allows('marketing'))) return;
    gtmLoaded = true;
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const firstScript = document.getElementsByTagName('script')[0];
    const gtmScript = document.createElement('script');
    gtmScript.async = true;
    gtmScript.dataset.consentManagedGtm = '';
    gtmScript.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
    firstScript.parentNode.insertBefore(gtmScript, firstScript);
  };

  const deleteCookie = (name, domain = '') => {
    const domainPart = domain ? `;domain=${domain}` : '';
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/${domainPart};SameSite=Lax`;
  };

  const clearOptionalCookies = () => {
    const names = document.cookie.split(';').map((entry) => entry.split('=')[0].trim()).filter((name) => (
      /^_ga(?:_|$)/.test(name) || ['_gid', '_gat', '_gcl_au', '_fbp', '_fbc', '_clck', '_clsk'].includes(name)
    ));
    const host = window.location.hostname;
    const parts = host.split('.');
    const baseDomain = parts.length > 1 ? `.${parts.slice(-2).join('.')}` : '';
    names.forEach((name) => {
      deleteCookie(name);
      deleteCookie(name, host);
      if (baseDomain) deleteCookie(name, baseDomain);
    });
  };

  const setBannerOffset = () => {
    const height = banner && !banner.hidden ? banner.getBoundingClientRect().height : 0;
    document.documentElement.style.setProperty('--privacy-banner-offset', `${Math.ceil(height)}px`);
  };

  const hideBanner = () => {
    if (!banner) return;
    banner.hidden = true;
    setBannerOffset();
  };

  const syncPreferenceInputs = () => {
    if (!preferencesDialog) return;
    preferencesDialog.querySelector('[name="privacy-analytics"]').checked = allows('analytics');
    preferencesDialog.querySelector('[name="privacy-marketing"]').checked = allows('marketing');
  };

  const persist = (analytics, marketing) => {
    const previouslyAllowed = allows('analytics') || allows('marketing');
    consentState = {
      version: CONSENT_VERSION,
      mode: CONSENT_MODE,
      analytics: Boolean(analytics),
      marketing: Boolean(marketing),
      updatedAt: new Date().toISOString()
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(consentState)); } catch (_) {}
    updateConsentMode();
    if (allows('analytics') || allows('marketing')) loadGtm();
    else clearOptionalCookies();
    window.dispatchEvent(new CustomEvent('ryokan:consentchange', { detail: { ...consentState } }));
    hideBanner();
    preferencesDialog?.close();

    // Basic Consent Mode cannot unload an already executed container safely.
    if (previouslyAllowed && !allows('analytics') && !allows('marketing') && gtmLoaded) window.location.reload();
  };

  const openPreferences = () => {
    syncPreferenceInputs();
    if (!preferencesDialog.open) preferencesDialog.showModal();
  };

  window.ryokanConsent = {
    allows,
    getState: () => ({ ...consentState }),
    openPreferences
  };

  const renderInterface = () => {
    banner = document.createElement('section');
    banner.className = 'privacy-banner';
    banner.setAttribute('aria-label', 'Preferências de privacidade');
    banner.innerHTML = `
      <div class="privacy-banner__inner">
        <div class="privacy-banner__copy">
          <h2>Privacidade sob seu controle</h2>
          <p>Usamos armazenamento necessário para lembrar sua escolha. Analytics e Marketing permanecem desativados até sua autorização. Consulte o <a href="${policyUrl}">Aviso de Privacidade</a> e a <a href="${cookiesUrl}">Política de Cookies</a>.</p>
        </div>
        <div class="privacy-banner__actions">
          <button class="privacy-action privacy-action--primary" type="button" data-consent-reject>Rejeitar opcionais</button>
          <button class="privacy-action privacy-action--primary" type="button" data-consent-accept>Aceitar todos</button>
          <button class="privacy-action privacy-action--secondary" type="button" data-consent-customize>Personalizar</button>
        </div>
      </div>`;

    preferencesDialog = document.createElement('dialog');
    preferencesDialog.className = 'privacy-dialog';
    preferencesDialog.setAttribute('aria-labelledby', 'privacy-dialog-title');
    preferencesDialog.innerHTML = `
      <form method="dialog" class="privacy-dialog__panel">
        <p class="privacy-dialog__eyebrow">Centro de privacidade</p>
        <h2 id="privacy-dialog-title">Escolha como seus dados podem ser usados</h2>
        <p>Você pode alterar esta decisão a qualquer momento. As categorias opcionais começam desativadas.</p>
        <div class="privacy-category">
          <div><h3>Necessários</h3><p>Guardam sua preferência de privacidade e viabilizam funções solicitadas, como o envio do formulário.</p></div>
          <span class="privacy-category__required">Sempre ativos</span>
        </div>
        <label class="privacy-category">
          <span><strong>Analytics</strong><small>Ajudam a entender o uso da página e seu desempenho.</small></span>
          <input type="checkbox" name="privacy-analytics">
        </label>
        <label class="privacy-category">
          <span><strong>Marketing</strong><small>Permitem mensuração de campanhas e publicidade, quando configuradas no GTM.</small></span>
          <input type="checkbox" name="privacy-marketing">
        </label>
        <p class="privacy-dialog__links"><a href="${policyUrl}">Aviso de Privacidade</a> · <a href="${cookiesUrl}">Política de Cookies</a></p>
        <div class="privacy-dialog__actions">
          <button class="privacy-action privacy-action--primary" type="button" data-consent-dialog-reject>Rejeitar opcionais</button>
          <button class="privacy-action privacy-action--primary" type="button" data-consent-dialog-accept>Aceitar todos</button>
          <button class="privacy-action privacy-action--save" type="submit">Salvar preferências</button>
        </div>
      </form>`;

    document.body.append(banner, preferencesDialog);
    banner.hidden = Boolean(consentState.updatedAt);
    syncPreferenceInputs();
    setBannerOffset();
    if ('ResizeObserver' in window) new ResizeObserver(setBannerOffset).observe(banner);
    window.addEventListener('resize', setBannerOffset, { passive: true });

    banner.querySelector('[data-consent-reject]').addEventListener('click', () => persist(false, false));
    banner.querySelector('[data-consent-accept]').addEventListener('click', () => persist(true, true));
    banner.querySelector('[data-consent-customize]').addEventListener('click', openPreferences);
    preferencesDialog.querySelector('[data-consent-dialog-reject]').addEventListener('click', () => persist(false, false));
    preferencesDialog.querySelector('[data-consent-dialog-accept]').addEventListener('click', () => persist(true, true));
    preferencesDialog.addEventListener('close', () => {
      if (!consentState.updatedAt) banner.hidden = false;
      setBannerOffset();
    });
    preferencesDialog.querySelector('form').addEventListener('submit', (event) => {
      event.preventDefault();
      persist(
        preferencesDialog.querySelector('[name="privacy-analytics"]').checked,
        preferencesDialog.querySelector('[name="privacy-marketing"]').checked
      );
    });
    document.querySelectorAll('[data-privacy-settings]').forEach((button) => button.addEventListener('click', openPreferences));
  };

  if (consentState.updatedAt) {
    updateConsentMode();
    loadGtm();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderInterface, { once: true });
  else renderInterface();
})();
