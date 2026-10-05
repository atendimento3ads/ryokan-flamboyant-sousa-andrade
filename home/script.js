(() => {
  // Endpoint esperado no mesmo domínio para a integração futura com o RD Station.
  // O backend deve armazenar as credenciais e encaminhar o payload para a API de Conversões.
  const RD_STATION_PROXY_ENDPOINT = '/api/leads/rd-station';

  // Contrato de mensuração: o container do GTM deve consumir estes eventos
  // do dataLayer. Nenhum evento inclui nome, e-mail, telefone ou outro PII.
  window.dataLayer = window.dataLayer || [];
  const trackEvent = (event, parameters = {}) => {
    window.dataLayer.push({
      event,
      page_name: 'ryokan_flamboyant',
      ...parameters
    });
  };

  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.primary-navigation');

  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    navigation.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  menuToggle.addEventListener('click', () => {
    const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    menuToggle.setAttribute('aria-label', willOpen ? 'Fechar menu' : 'Abrir menu');
    navigation.classList.toggle('is-open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
    trackEvent('mobile_menu_toggle', { menu_state: willOpen ? 'open' : 'closed' });
  });

  navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    trackEvent('navigation_click', {
      link_text: link.textContent.trim().toLowerCase(),
      target_section: link.getAttribute('href').replace('#', '')
    });
    closeMenu();
  }));
  window.addEventListener('scroll', () => header.classList.toggle('is-scrolled', window.scrollY > 20), { passive: true });

  const carousel = document.querySelector('[data-carousel]');
  const mainImage = carousel.querySelector('[data-carousel-main]');
  const thumbs = [...carousel.querySelectorAll('.gallery__thumb')];
  let currentSlide = 0;

  const showSlide = (index, interactionType = 'arrow') => {
    currentSlide = (index + thumbs.length) % thumbs.length;
    const thumb = thumbs[currentSlide];
    mainImage.style.opacity = '0';
    window.setTimeout(() => {
      mainImage.src = thumb.dataset.src;
      mainImage.alt = thumb.dataset.alt;
      mainImage.style.opacity = '1';
    }, 180);
    thumbs.forEach((item, itemIndex) => item.classList.toggle('is-active', itemIndex === currentSlide));
    trackEvent('carousel_navigation', {
      carousel_name: 'amenities',
      interaction_type: interactionType,
      slide_index: currentSlide + 1,
      slide_name: thumb.dataset.alt
    });
  };

  thumbs.forEach((thumb, index) => thumb.addEventListener('click', () => showSlide(index, 'thumbnail')));
  carousel.querySelector('[data-carousel-previous]').addEventListener('click', () => showSlide(currentSlide - 1, 'previous'));
  carousel.querySelector('[data-carousel-next]').addEventListener('click', () => showSlide(currentSlide + 1, 'next'));

  const phoneMask = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('input', () => { input.value = phoneMask(input.value); });
  });

  const validateField = (field) => {
    let message = '';
    if (field.type === 'checkbox' && !field.checked) message = 'Confirme a autorização para continuar.';
    if (field.name === 'name' && field.value.trim().length < 2) message = 'Informe seu nome completo.';
    if (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim())) message = 'Informe um e-mail válido.';
    if (field.name === 'personal_phone' && field.value.replace(/\D/g, '').length < 10) message = 'Informe um telefone válido.';
    field.classList.toggle('is-invalid', Boolean(message));
    const error = field.id ? document.querySelector(`[data-error-for="${field.id}"]`) : null;
    if (error) error.textContent = message;
    return !message;
  };

  document.querySelectorAll('[data-lead-form]').forEach((form) => {
    const formLocation = form.id === 'hero-form' ? 'hero' : 'closing';
    let formStarted = false;
    form.addEventListener('focusin', () => {
      if (formStarted) return;
      formStarted = true;
      trackEvent('lead_form_start', { form_location: formLocation });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const fields = [...form.querySelectorAll('[required]')];
      const isValid = fields.map(validateField).every(Boolean);
      const status = form.querySelector('.form-status');
      if (!isValid) {
        status.textContent = 'Revise os campos destacados.';
        trackEvent('lead_form_validation_error', {
          form_location: formLocation,
          invalid_fields: fields.filter((field) => field.classList.contains('is-invalid') || (field.type === 'checkbox' && !field.checked)).map((field) => field.name).join(',')
        });
        form.querySelector('.is-invalid')?.focus();
        return;
      }

      /*
       * Integração RD Station (pendente de credenciais/endpoint do cliente):
       * enviar via POST para RD_STATION_PROXY_ENDPOINT os campos
       * name, email, personal_phone,
       * communications_consent e conversion_identifier para o endpoint
       * confirmado da API de Conversões do RD Station Marketing.
       * Nunca inclua token privado no frontend; use um endpoint server-side/proxy.
       */
      status.textContent = `Cadastro validado. Integração de envio aguardando configuração em ${RD_STATION_PROXY_ENDPOINT}.`;
      trackEvent('lead_form_demo_validated', { form_location: formLocation });
    });
  });

  document.querySelectorAll('[data-lead-form] input').forEach((field) => {
    field.addEventListener('blur', () => { if (field.required) validateField(field); });
  });

  const modal = document.querySelector('#unit-modal');
  const modalTitle = document.querySelector('#unit-modal-title');
  let activeUnitSize = '';
  let pendingCloseMethod = '';
  const openModal = (size) => {
    activeUnitSize = size;
    modalTitle.textContent = `${size} m² de inteligência e conforto`;
    modal.showModal();
    modal.scrollTop = 0;
    document.body.classList.add('modal-open');
    trackEvent('unit_modal_open', { unit_size: size });
  };
  const closeModal = (method = 'close_button') => {
    pendingCloseMethod = method;
    modal.close();
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('[data-open-unit]').forEach((button) => button.addEventListener('click', () => {
    trackEvent('unit_option_click', {
      unit_size: button.dataset.openUnit,
      trigger_location: button.classList.contains('unit-card') ? 'unit_card' : 'unit_preview'
    });
    openModal(button.dataset.openUnit);
  }));
  modal.querySelector('.unit-modal__close').addEventListener('click', () => closeModal('close_button'));
  modal.querySelector('a[data-close-unit]').addEventListener('click', () => {
    trackEvent('unit_modal_cta_click', { unit_size: activeUnitSize, cta_target: 'contact' });
    closeModal('cta');
  });
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal('backdrop'); });
  modal.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeModal('escape_key');
  });
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    trackEvent('unit_modal_close', {
      unit_size: activeUnitSize,
      close_method: pendingCloseMethod || 'native_close'
    });
    pendingCloseMethod = '';
  });

  document.querySelector('[data-developer-credit]')?.addEventListener('click', () => {
    trackEvent('external_link_click', {
      link_name: '3ads',
      link_url: 'https://3ads.com.br/',
      link_location: 'footer'
    });
  });

  const revealElements = [...document.querySelectorAll('.reveal')];
  const canAnimateReveal = 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canAnimateReveal) {
    document.documentElement.classList.add('reveal-enabled');
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px', threshold: 0.12 });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }
})();
