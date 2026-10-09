(() => {
  // Contrato de mensuração: o container do GTM deve consumir estes eventos
  // do dataLayer. Nenhum evento inclui nome, e-mail, telefone ou outro PII.
  window.dataLayer = window.dataLayer || [];
  const trackEvent = (event, parameters = {}) => {
    if (!window.ryokanConsent?.allows('analytics')) return;
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
    if (willOpen) header.classList.remove('is-hidden');
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
  let previousScrollPosition = Math.max(window.scrollY, 0);
  let headerScrollFrame = null;
  const updateHeaderOnScroll = () => {
    const currentScrollPosition = Math.max(window.scrollY, 0);
    const scrollDifference = currentScrollPosition - previousScrollPosition;
    const isMenuOpen = menuToggle.getAttribute('aria-expanded') === 'true';

    header.classList.toggle('is-scrolled', currentScrollPosition > 20);
    if (currentScrollPosition <= 20 || isMenuOpen || scrollDifference < -3) {
      header.classList.remove('is-hidden');
    } else if (scrollDifference > 3) {
      header.classList.add('is-hidden');
    }

    previousScrollPosition = currentScrollPosition;
    headerScrollFrame = null;
  };

  window.addEventListener('scroll', () => {
    if (headerScrollFrame !== null) return;
    headerScrollFrame = window.requestAnimationFrame(updateHeaderOnScroll);
  }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));

  const poolCarousel = document.querySelector('[data-pool-carousel]');
  const poolViewport = poolCarousel.querySelector('.pool-carousel__viewport');
  const poolTrack = poolCarousel.querySelector('[data-pool-track]');
  const poolSlides = [...poolCarousel.querySelectorAll('[data-pool-slide]')];
  const poolStatus = poolCarousel.querySelector('[data-pool-status]');
  let currentPoolSlide = 0;

  const positionPoolTrack = (dragOffset = 0) => {
    poolTrack.style.transform = `translate3d(calc(${-currentPoolSlide * 100}% + ${dragOffset}px), 0, 0)`;
  };

  const showPoolSlide = (index, interactionType) => {
    currentPoolSlide = (index + poolSlides.length) % poolSlides.length;
    const slide = poolSlides[currentPoolSlide];
    positionPoolTrack();
    poolStatus.textContent = `Imagem ${currentPoolSlide + 1} de ${poolSlides.length}`;
    trackEvent('carousel_navigation', {
      carousel_name: 'pool',
      interaction_type: interactionType,
      slide_index: currentPoolSlide + 1,
      slide_name: slide.alt
    });
  };

  poolCarousel.querySelector('[data-pool-previous]').addEventListener('click', () => showPoolSlide(currentPoolSlide - 1, 'previous'));
  poolCarousel.querySelector('[data-pool-next]').addEventListener('click', () => showPoolSlide(currentPoolSlide + 1, 'next'));

  const leisureCarousel = document.querySelector('[data-leisure-carousel]');
  const leisureViewport = leisureCarousel.querySelector('.leisure-carousel__viewport');
  const leisureTrack = leisureCarousel.querySelector('[data-leisure-track]');
  const leisureSlides = [...leisureCarousel.querySelectorAll('.leisure-carousel__slide')];
  const leisureStatus = leisureCarousel.querySelector('[data-leisure-status]');
  const visibleLeisureSlides = 3;
  const lastLeisureStart = Math.max(0, leisureSlides.length - visibleLeisureSlides);
  let currentLeisureStart = 0;

  const positionLeisureTrack = (dragOffset = 0) => {
    const firstSlide = leisureSlides[0];
    const activeSlide = leisureSlides[currentLeisureStart];
    const offset = activeSlide.offsetLeft - firstSlide.offsetLeft;
    leisureTrack.style.transform = `translate3d(${(-offset) + dragOffset}px, 0, 0)`;
  };

  const showLeisureSlides = (index, interactionType) => {
    currentLeisureStart = index < 0 ? lastLeisureStart : index > lastLeisureStart ? 0 : index;
    positionLeisureTrack();
    leisureStatus.textContent = `Imagens ${currentLeisureStart + 1} a ${currentLeisureStart + visibleLeisureSlides} de ${leisureSlides.length}`;
    trackEvent('carousel_navigation', {
      carousel_name: 'leisure_areas',
      interaction_type: interactionType,
      slide_index: currentLeisureStart + 1,
      visible_from: currentLeisureStart + 1,
      visible_to: currentLeisureStart + visibleLeisureSlides
    });
  };

  leisureCarousel.querySelector('[data-leisure-previous]').addEventListener('click', () => showLeisureSlides(currentLeisureStart - 1, 'previous'));
  leisureCarousel.querySelector('[data-leisure-next]').addEventListener('click', () => showLeisureSlides(currentLeisureStart + 1, 'next'));

  const enableCarouselDrag = ({ viewport, track, renderOffset, navigate }) => {
    let pointerId = null;
    let startX = 0;
    let startY = 0;
    let dragOffset = 0;
    let isDragging = false;
    let suppressClick = false;

    const finishDrag = (event, cancelled = false) => {
      if (pointerId === null || event.pointerId !== pointerId) return;
      const pointerType = event.pointerType;
      const shouldNavigate = !cancelled && isDragging && Math.abs(dragOffset) >= Math.min(45, viewport.clientWidth * .12);
      pointerId = null;
      viewport.classList.remove('is-dragging');
      track.classList.remove('is-dragging');
      if (shouldNavigate) {
        suppressClick = true;
        navigate(dragOffset < 0 ? 1 : -1, pointerType === 'mouse' ? 'drag' : 'swipe');
      } else {
        renderOffset(0);
      }
      dragOffset = 0;
      isDragging = false;
    };

    viewport.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      dragOffset = 0;
      isDragging = false;
      viewport.setPointerCapture?.(pointerId);
    });

    viewport.addEventListener('pointermove', (event) => {
      if (event.pointerId !== pointerId) return;
      const distanceX = event.clientX - startX;
      const distanceY = event.clientY - startY;
      if (!isDragging && Math.abs(distanceX) <= Math.max(8, Math.abs(distanceY))) return;
      isDragging = true;
      dragOffset = distanceX * .88;
      viewport.classList.add('is-dragging');
      track.classList.add('is-dragging');
      renderOffset(dragOffset);
      event.preventDefault();
    });

    viewport.addEventListener('pointerup', (event) => finishDrag(event));
    viewport.addEventListener('pointercancel', (event) => finishDrag(event, true));
    viewport.addEventListener('lostpointercapture', (event) => finishDrag(event, true));
    viewport.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
  };

  enableCarouselDrag({
    viewport: poolViewport,
    track: poolTrack,
    renderOffset: positionPoolTrack,
    navigate: (direction, interactionType) => showPoolSlide(currentPoolSlide + direction, interactionType)
  });
  enableCarouselDrag({
    viewport: leisureViewport,
    track: leisureTrack,
    renderOffset: positionLeisureTrack,
    navigate: (direction, interactionType) => showLeisureSlides(currentLeisureStart + direction, interactionType)
  });

  if ('ResizeObserver' in window) new ResizeObserver(() => positionLeisureTrack()).observe(leisureCarousel);
  else window.addEventListener('resize', positionLeisureTrack, { passive: true });

  const lightbox = document.querySelector('#image-lightbox');
  const lightboxImage = lightbox.querySelector('[data-lightbox-image]');
  const lightboxCaption = lightbox.querySelector('[data-lightbox-caption]');
  const lightboxTriggers = [...document.querySelectorAll('[data-lightbox-src]')];
  let activeLightboxSlide = 0;
  let activeLightboxContext = 'leisure_areas';
  let pendingLightboxCloseMethod = '';

  const openLightbox = (trigger, index) => {
    activeLightboxSlide = index + 1;
    activeLightboxContext = trigger.dataset.lightboxContext || 'leisure_areas';
    lightboxImage.src = trigger.dataset.lightboxSrc;
    lightboxImage.alt = trigger.dataset.lightboxAlt;
    lightboxCaption.textContent = trigger.dataset.lightboxAlt;
    lightbox.classList.toggle('image-lightbox--map', activeLightboxContext === 'location_map');
    lightbox.showModal();
    document.body.classList.add('modal-open');
    trackEvent('gallery_lightbox_open', {
      carousel_name: activeLightboxContext,
      slide_index: activeLightboxSlide,
      slide_name: trigger.dataset.lightboxAlt
    });
  };

  const closeLightbox = (method) => {
    pendingLightboxCloseMethod = method;
    lightbox.close();
  };

  lightboxTriggers.forEach((trigger) => {
    const contextSlides = lightboxTriggers.filter((item) => (item.dataset.lightboxContext || 'leisure_areas') === (trigger.dataset.lightboxContext || 'leisure_areas'));
    trigger.addEventListener('click', () => openLightbox(trigger, contextSlides.indexOf(trigger)));
  });
  lightbox.querySelector('[data-close-lightbox]').addEventListener('click', () => closeLightbox('close_button'));
  lightbox.addEventListener('click', (event) => { if (event.target === lightbox) closeLightbox('backdrop'); });
  lightbox.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeLightbox('escape_key');
  });
  lightbox.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    trackEvent('gallery_lightbox_close', {
      carousel_name: activeLightboxContext,
      slide_index: activeLightboxSlide,
      close_method: pendingLightboxCloseMethod || 'native_close'
    });
    lightbox.classList.remove('image-lightbox--map');
    pendingLightboxCloseMethod = '';
  });

  const phoneMask = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const syncRdPhone = (input) => {
    const digits = input.value.replace(/\D/g, '');
    const rdPhone = input.form?.querySelector('[data-rd-phone]');
    if (rdPhone) rdPhone.value = digits.length >= 10 ? `+55${digits}` : '';
  };

  document.querySelectorAll('input[type="tel"]').forEach((input) => {
    input.addEventListener('input', () => {
      input.value = phoneMask(input.value);
      syncRdPhone(input);
    });
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

  const RD_STATION_LOADER_URL = 'https://d335luupugsy2.cloudfront.net/js/loader-scripts/982dc448-4c45-41c9-b491-edf1361459bd-loader.js';
  let rdStationLoaderPromise;
  const loadRdStationCapture = () => {
    if (rdStationLoaderPromise) return rdStationLoaderPromise;

    rdStationLoaderPromise = new Promise((resolve, reject) => {
      const existingLoader = document.querySelector('script[data-rd-station-loader]');
      if (existingLoader?.dataset.loaded === 'true') {
        resolve();
        return;
      }

      const loader = existingLoader || document.createElement('script');
      const handleLoad = () => {
        loader.dataset.loaded = 'true';
        resolve();
      };
      const handleError = () => {
        rdStationLoaderPromise = undefined;
        reject(new Error('Falha ao carregar a integração de cadastro.'));
      };

      loader.addEventListener('load', handleLoad, { once: true });
      loader.addEventListener('error', handleError, { once: true });
      if (!existingLoader) {
        loader.src = RD_STATION_LOADER_URL;
        loader.async = true;
        loader.dataset.rdStationLoader = '';
        document.body.append(loader);
      }
    });

    return rdStationLoaderPromise;
  };

  document.querySelectorAll('[data-lead-form]').forEach((form) => {
    const formLocation = form.id === 'hero-form' ? 'hero' : 'closing';
    let formStarted = false;
    form.addEventListener('focusin', () => {
      if (formStarted) return;
      formStarted = true;
      trackEvent('lead_form_start', { form_location: formLocation });
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (form.dataset.rdCaptureDispatch === 'true') return;
      const phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput) syncRdPhone(phoneInput);
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

      const submitButton = form.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
      }
      status.textContent = 'Cadastro validado. Redirecionando...';
      trackEvent('lead_form_capture_attempt', { form_location: formLocation });
      try {
        await loadRdStationCapture();
        form.dataset.rdCaptureDispatch = 'true';
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        delete form.dataset.rdCaptureDispatch;
        window.setTimeout(() => {
          window.location.assign('/obrigado/');
        }, 1200);
      } catch {
        delete form.dataset.rdCaptureDispatch;
        status.textContent = 'Não foi possível enviar agora. Tente novamente em instantes.';
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.removeAttribute('aria-disabled');
        }
      }
    });
  });

  document.querySelectorAll('[data-lead-form] input').forEach((field) => {
    field.addEventListener('blur', () => { if (field.required) validateField(field); });
  });

  const modal = document.querySelector('#unit-modal');
  const modalTitle = document.querySelector('#unit-modal-title');
  const modalKicker = document.querySelector('#unit-modal-kicker');
  const modalDescription = document.querySelector('#unit-modal-description');
  const modalFeatures = document.querySelector('#unit-modal-features');
  const modalPlanTrack = document.querySelector('[data-unit-modal-track]');
  const modalPlanPrevious = document.querySelector('[data-unit-plan-previous]');
  const modalPlanNext = document.querySelector('[data-unit-plan-next]');
  const modalPlanCounter = document.querySelector('[data-unit-plan-counter]');
  const unitPlan = (final, image, imageWidth, imageHeight, imageAlt) => ({ final, image, imageWidth, imageHeight, imageAlt });
  const unitData = {
    26: {
      type: 'Studio',
      final: 'Final 09',
      description: 'Studio de 26 m², final 09.',
      plans: [unitPlan('Final 09', 'assets/IMAGENS/Plantas/26m-studio-final-09.webp?v=3', 1800, 834, 'Planta do studio de 26 metros quadrados, final 09')],
      features: ['Bancada da cozinha em granito polido', 'Bancada do banho em mármore polido', 'Banheiro 100% revestido', 'Fechadura digital com sistema inteligente na porta de acesso', 'Infraestrutura para instalação de ar-condicionado tipo split/multisplit no quarto', 'Veneziana integrada']
    },
    29: {
      type: 'Studio',
      final: 'Finais 02 a 07 e 10 a 14',
      description: 'Studio de 29 m² disponível nos finais 02, 03, 04, 05, 06, 07, 10, 11, 12, 13 e 14.',
      plans: [2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14].map((final) => unitPlan(`Final ${String(final).padStart(2, '0')}`, `assets/IMAGENS/Plantas/29m-studio-final-${String(final).padStart(2, '0')}.webp?v=3`, 1800, 1772, `Planta do studio de 29 metros quadrados, final ${String(final).padStart(2, '0')}`)),
      features: ['Bancada da cozinha em granito polido', 'Bancada do banho em mármore polido', 'Banheiro 100% revestido', 'Fechadura digital inteligente na porta de acesso', 'Infraestrutura para instalação de ar-condicionado tipo split/multisplit no quarto', 'Veneziana integrada']
    },
    34: {
      type: '1 suíte',
      final: 'Final 15',
      description: 'Unidade de 34 m² com uma suíte, final 15.',
      plans: [unitPlan('Final 15', 'assets/IMAGENS/Plantas/34m-1-suite-final-15.webp?v=3', 1800, 1376, 'Planta da unidade de 34 metros quadrados com uma suíte, final 15')],
      features: ['Bancada da cozinha em granito polido', 'Bancada do banho em mármore polido', 'Banheiro 100% revestido', 'Fechadura digital inteligente na porta de acesso', 'Infraestrutura para instalação de ar-condicionado tipo split/multisplit no quarto', 'Veneziana integrada no quarto']
    },
    45: {
      type: '2 quartos',
      final: 'Final 08',
      description: 'Unidade de 45 m² com dois quartos, final 08.',
      plans: [unitPlan('Final 08', 'assets/IMAGENS/Plantas/45m-2-quartos-final-08.webp?v=3', 1773, 1800, 'Planta da unidade de 45 metros quadrados com dois quartos, final 08')],
      features: ['Bancada da cozinha em granito polido', 'Bancada do banho em mármore polido', 'Banheiro 100% revestido', 'Fechadura digital inteligente na porta de acesso', 'Infraestrutura para instalação de ar-condicionado tipo split/multisplit nos quartos e sala', 'Veneziana integrada nos quartos']
    },
    48: {
      type: '2 quartos',
      final: 'Final 01',
      description: 'Unidade de 48 m² com dois quartos, final 01.',
      plans: [unitPlan('Final 01', 'assets/IMAGENS/Plantas/48m-2-quartos-final-01.webp?v=3', 1786, 1800, 'Planta da unidade de 48 metros quadrados com dois quartos, final 01')],
      features: ['Bancada da cozinha em granito polido', 'Bancada do banho em mármore polido', 'Banheiro 100% revestido', 'Fechadura digital inteligente na porta de acesso', 'Infraestrutura para instalação de ar-condicionado tipo split/multisplit nos quartos e sala', 'Veneziana integrada nos quartos']
    }
  };
  let activeUnitSize = '';
  let activeUnit = null;
  let activeUnitPlanIndex = 0;
  let pendingCloseMethod = '';

  const showUnitPlan = (index, interactionType = 'initial', shouldTrack = true) => {
    if (!activeUnit?.plans.length) return;
    activeUnitPlanIndex = (index + activeUnit.plans.length) % activeUnit.plans.length;
    modalPlanTrack.style.transform = `translate3d(${-activeUnitPlanIndex * 100}%, 0, 0)`;
    [...modalPlanTrack.children].forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', String(slideIndex !== activeUnitPlanIndex)));
    const selectedPlan = activeUnit.plans[activeUnitPlanIndex];
    modalPlanCounter.textContent = activeUnit.plans.length > 1
      ? `${selectedPlan.final} · ${activeUnitPlanIndex + 1} de ${activeUnit.plans.length}`
      : selectedPlan.final;
    if (shouldTrack && activeUnit.plans.length > 1) {
      trackEvent('unit_plan_carousel_navigation', {
        unit_size: activeUnitSize,
        unit_type: activeUnit.type,
        unit_final: selectedPlan.final,
        interaction_type: interactionType,
        slide_index: activeUnitPlanIndex + 1
      });
    }
  };

  const renderUnitPlans = (selectedUnit) => {
    const slides = selectedUnit.plans.map((plan, index) => {
      const slide = document.createElement('div');
      slide.className = 'unit-modal__slide';
      slide.setAttribute('aria-hidden', String(index !== 0));
      const image = document.createElement('img');
      image.src = plan.image;
      image.width = plan.imageWidth;
      image.height = plan.imageHeight;
      image.alt = plan.imageAlt;
      image.decoding = 'async';
      if (index > 0) image.loading = 'lazy';
      slide.append(image);
      return slide;
    });
    modalPlanTrack.replaceChildren(...slides);
    const hasMultiplePlans = selectedUnit.plans.length > 1;
    modalPlanPrevious.hidden = !hasMultiplePlans;
    modalPlanNext.hidden = !hasMultiplePlans;
    showUnitPlan(0, 'initial', false);
  };

  const openModal = (size) => {
    const selectedUnit = unitData[size];
    if (!selectedUnit) return;
    activeUnitSize = size;
    activeUnit = selectedUnit;
    modalKicker.textContent = `${selectedUnit.type} · ${selectedUnit.final}`;
    modalTitle.textContent = `${size} m²`;
    modalDescription.textContent = selectedUnit.description;
    modalFeatures.replaceChildren(...selectedUnit.features.map((feature) => {
      const item = document.createElement('li');
      item.textContent = feature;
      return item;
    }));
    renderUnitPlans(selectedUnit);
    modal.showModal();
    modal.scrollTop = 0;
    document.body.classList.add('modal-open');
    trackEvent('unit_modal_open', { unit_size: size, unit_type: selectedUnit.type, unit_final: selectedUnit.final });
  };
  modalPlanPrevious.addEventListener('click', () => showUnitPlan(activeUnitPlanIndex - 1, 'previous'));
  modalPlanNext.addEventListener('click', () => showUnitPlan(activeUnitPlanIndex + 1, 'next'));

  let unitPlanTouchStartX = null;
  modalPlanTrack.addEventListener('touchstart', (event) => { unitPlanTouchStartX = event.touches[0].clientX; }, { passive: true });
  modalPlanTrack.addEventListener('touchend', (event) => {
    if (unitPlanTouchStartX === null || !activeUnit || activeUnit.plans.length < 2) return;
    const distance = event.changedTouches[0].clientX - unitPlanTouchStartX;
    unitPlanTouchStartX = null;
    if (Math.abs(distance) < 45) return;
    showUnitPlan(activeUnitPlanIndex + (distance < 0 ? 1 : -1), 'swipe');
  }, { passive: true });

  modal.addEventListener('keydown', (event) => {
    if (!activeUnit || activeUnit.plans.length < 2) return;
    if (event.key === 'ArrowLeft') showUnitPlan(activeUnitPlanIndex - 1, 'keyboard_previous');
    if (event.key === 'ArrowRight') showUnitPlan(activeUnitPlanIndex + 1, 'keyboard_next');
  });

  const closeModal = (method = 'close_button') => {
    pendingCloseMethod = method;
    modal.close();
    document.body.classList.remove('modal-open');
  };
  document.querySelectorAll('[data-open-unit]').forEach((button) => button.addEventListener('click', () => {
    const selectedUnit = unitData[button.dataset.openUnit];
    trackEvent('unit_option_click', {
      unit_size: button.dataset.openUnit,
      unit_type: selectedUnit?.type,
      unit_final: selectedUnit?.final,
      trigger_location: button.classList.contains('unit-card') ? 'unit_card' : 'unit_preview'
    });
    openModal(button.dataset.openUnit);
  }));
  modal.querySelector('.unit-modal__close').addEventListener('click', () => closeModal('close_button'));
  modal.querySelector('a[data-close-unit]').addEventListener('click', () => {
    trackEvent('unit_modal_cta_click', { unit_size: activeUnitSize, unit_type: activeUnit?.type, unit_final: activeUnit?.final, cta_target: 'contact' });
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
      unit_type: activeUnit?.type,
      unit_final: activeUnit?.final,
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
