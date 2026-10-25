/**
 * TABD - The Avenue Builders & Developers
 * Redesign Controller inspired by Avenue25 (avenue25.com.my)
 * 
 * Features:
 * 1. Minimal Header Sticky elevation on scroll
 * 2. Avenue25 Slide-in Navigation Drawer (#headerMenuSlide, #overlaySlide)
 * 3. Avenue25 Developer Dossier Popup (#aboutAvalandPopup)
 * 4. Hero Swiper Carousel initialization
 * 5. Scroll FadeUp IntersectionObserver animations
 * 6. Contact Form Validation
 * 7. Projects Page Filter Tabs
 */

document.addEventListener('DOMContentLoaded', () => {
  initStickyHeader();
  initSlideMenu();
  initDeveloperPopup();
  initHeroSwiper();
  initHeroVideo();
  initCloudIntro();
  initScrollAnimations();
  initWelcomeParallax();
  initProjectFiltering();
  initContactForm();
});

/* 1. Header scroll state */
function initStickyHeader() {
  const header = document.getElementById('header') || document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* 2. Avenue25 Slide-in Navigation Drawer */
function initSlideMenu() {
  const triggers = document.querySelectorAll('.menu-cta-menu-hamburger, .menu-trigger');
  const slideMenu = document.getElementById('headerMenuSlide');
  const overlay = document.getElementById('overlaySlide');
  const closeBtns = document.querySelectorAll('.menu-close-trigger, #menuCloseBtn');

  if (!slideMenu) return;

  const openMenu = (e) => {
    if (e) e.preventDefault();
    slideMenu.classList.add('open');
    if (overlay) overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closeMenu = (e) => {
    if (e) e.preventDefault();
    slideMenu.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  triggers.forEach(btn => btn.addEventListener('click', openMenu));
  closeBtns.forEach(btn => btn.addEventListener('click', closeMenu));
  if (overlay) overlay.addEventListener('click', closeMenu);

  slideMenu.querySelectorAll('.menu-list a, .action-pill, .menu-mobile-enquire a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && slideMenu.classList.contains('open')) {
      closeMenu();
    }
  });
}

/* 3. Avenue25 Developer Dossier Popup (#aboutAvalandPopup) */
function initDeveloperPopup() {
  const openTriggers = document.querySelectorAll('.about-avaland-pop, [data-open-developer]');
  const popup = document.getElementById('aboutAvalandPopup') || document.querySelector('.developer-popup');
  const closeBtn = document.querySelector('.cta-close-avaland-popup') || document.querySelector('.cta-close-popup');

  if (!popup) return;

  const openPopup = (e) => {
    if (e) e.preventDefault();
    popup.classList.add('open');
    document.body.style.overflow = 'hidden';
  };

  const closePopup = (e) => {
    if (e) e.preventDefault();
    popup.classList.remove('open');
    document.body.style.overflow = '';
  };

  openTriggers.forEach(btn => btn.addEventListener('click', openPopup));
  if (closeBtn) closeBtn.addEventListener('click', closePopup);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && popup.classList.contains('open')) {
      closePopup();
    }
  });
}

/* 4. Swiper Hero Carousel (Fallback to pure smooth transition if CDN fails) */
function initHeroSwiper() {
  const swiperElem = document.querySelector('.component-swiper');
  if (!swiperElem) return;

  if (typeof Swiper !== 'undefined') {
    new Swiper('.component-swiper', {
      loop: true,
      effect: 'fade',
      fadeEffect: { crossFade: true },
      speed: 1200,
      autoplay: {
        delay: 5500,
        disableOnInteraction: false,
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  } else {
    // Graceful vanilla slide rotator if Swiper bundle isn't loaded
    const slides = swiperElem.querySelectorAll('.swiper-slide');
    if (slides.length <= 1) return;

    let current = 0;
    slides.forEach((s, idx) => {
      s.style.display = idx === 0 ? 'flex' : 'none';
      s.style.opacity = idx === 0 ? '1' : '0';
      s.style.transition = 'opacity 1s ease';
    });

    setInterval(() => {
      slides[current].style.opacity = '0';
      setTimeout(() => {
        slides[current].style.display = 'none';
        current = (current + 1) % slides.length;
        slides[current].style.display = 'flex';
        setTimeout(() => {
          slides[current].style.opacity = '1';
        }, 50);
      }, 600);
    }, 6000);
  }
}

/* 4b. Hero Background Video Autoplay Assurance */
function initHeroVideo() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;
  video.muted = true;
  try {
    video.currentTime = 0;
  } catch (e) {}
  const playPromise = video.play();
  if (playPromise !== undefined) {
    playPromise.catch(() => {
      // Browser autoplay policy handled safely
    });
  }
}

/* 4c. Cinematic Cloud Opening Intro */
function initCloudIntro() {
  const intro = document.getElementById('cloudIntro');
  if (!intro) return;

  // 0 to 2.5s: Cloud image remains visible
  // 2.5s to 4.5s: Clouds gradually fade away, revealing the video underneath
  const timer = setTimeout(() => {
    intro.classList.add('fade-out');
  }, 2500);

  // Tap or click anywhere to immediately skip intro
  intro.addEventListener('click', () => {
    clearTimeout(timer);
    intro.classList.add('fade-out');
  });

  // After 4.5s (at 4600ms): The cloud overlay is completely removed from view
  setTimeout(() => {
    intro.style.display = 'none';
  }, 4600);
}

/* 5. Avenue25 Scroll FadeUp Animation */
function initScrollAnimations() {
  const animElements = document.querySelectorAll('.fadeUpAnimation, .project-card, .service-card, .project-editorial-feature, .delivered-card, .home-trio-card, .about-pillar-row, .director-editorial-item, .service-detail-row');
  if (!animElements.length) return;

  if (!('IntersectionObserver' in window)) {
    animElements.forEach(el => el.classList.add('active'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  animElements.forEach(el => observer.observe(el));
}

/* 5b. Smooth Parallax Scroll for Welcome Section */
function initWelcomeParallax() {
  const welcomeSection = document.getElementById('welcome') || document.querySelector('.home-welcome-section');
  if (!welcomeSection) return;

  const welcomeContent = welcomeSection.querySelector('.welcome-container');
  if (!welcomeContent) return;

  // Respect prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let ticking = false;

  const updateParallax = () => {
    const rect = welcomeSection.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Check if section is within active viewport range (with 120px buffer)
    if (rect.bottom > -120 && rect.top < windowHeight + 120) {
      const viewportCenter = windowHeight / 2;
      const sectionCenter = rect.top + rect.height / 2;
      const distanceFromCenter = sectionCenter - viewportCenter;

      // Responsive subtle parallax shift
      // Desktop: max ~38px, Mobile: max ~18px
      const isMobile = window.innerWidth <= 768;
      const maxShift = isMobile ? 18 : 38;
      const parallaxFactor = isMobile ? 0.06 : 0.10;
      const rawShift = distanceFromCenter * parallaxFactor;
      const shift = Math.max(-maxShift, Math.min(maxShift, rawShift));

      // Layered fade curve near edges of the viewport
      let opacity = 1;
      const fadeDistance = 140;
      if (rect.top > windowHeight - fadeDistance) {
        // Entering from bottom
        const enterProgress = (windowHeight - rect.top) / fadeDistance;
        opacity = Math.max(0.65, Math.min(1, 0.65 + enterProgress * 0.35));
      } else if (rect.bottom < fadeDistance) {
        // Exiting at top
        const exitProgress = rect.bottom / fadeDistance;
        opacity = Math.max(0.65, Math.min(1, 0.65 + exitProgress * 0.35));
      }

      welcomeContent.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
      welcomeContent.style.opacity = opacity.toFixed(3);
    }
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // Initial trigger after layout
  requestAnimationFrame(updateParallax);
}

/* 6. Projects Page Filter Tabs */
function initProjectFiltering() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-editorial-feature[data-category], .delivered-card[data-category], .project-card[data-category]');

  if (!filterBtns.length || !projectCards.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || (category && category.includes(filterValue))) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });

      // Update visibility of editorial groups based on matching items
      document.querySelectorAll('.projects-editorial-group').forEach(group => {
        const visibleItems = group.querySelectorAll('.project-editorial-feature[data-category]:not([style*="display: none"]), .delivered-card[data-category]:not([style*="display: none"])');
        if (visibleItems.length === 0 && filterValue !== 'all') {
          group.style.display = 'none';
        } else {
          group.style.display = '';
        }
      });
    });
  });
}

/* 7. Contact Form Validation and Simulation */
function initContactForm() {
  const form = document.getElementById('tabdContactForm');
  if (!form) return;

  const feedback = document.getElementById('formFeedback');

  // Clear error notice on typing
  form.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => {
      if (feedback && feedback.classList.contains('error')) {
        feedback.style.display = 'none';
      }
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('contactName')?.value.trim();
    const phone = document.getElementById('contactPhone')?.value.trim();
    const email = document.getElementById('contactEmail')?.value.trim();

    if (!name || !phone || !email) {
      if (feedback) {
        feedback.className = 'form-feedback error';
        feedback.textContent = 'Please fill out all required fields before submitting.';
        feedback.style.display = 'block';
      }
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>SUBMITTING...</span>';

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalContent;

      if (feedback) {
        feedback.className = 'form-feedback success';
        feedback.innerHTML = `<strong>Thank you, ${name}!</strong> Your enquiry has been received. Our relationship managers will respond promptly.`;
        feedback.style.display = 'block';
      }
      form.reset();
    }, 700);
  });
}
