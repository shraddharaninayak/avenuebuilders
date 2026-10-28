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
  if (!window.location.hash) {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }

  initStickyHeader();
  initSlideMenu();
  initDeveloperPopup();
  initHeroSwiper();
  initLandmarksGallery();
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

/* 4c. Signature Landmarks Architectural Editorial Gallery Controller */
function initLandmarksGallery() {
  const swiperElem = document.querySelector('.landmarks-swiper');
  if (!swiperElem) return;

  const numBtns = document.querySelectorAll('.nav-rail-num');
  const prevRail = document.querySelector('.nav-rail-prev');
  const nextRail = document.querySelector('.nav-rail-next');
  const floatNext = document.querySelector('.landmarks-floating-next-btn');

  let swiperInstance = null;
  let activeIndex = 0;

  function updateActiveIndex(idx) {
    activeIndex = idx;
    const currentDigit = document.querySelector('.current-rail-digit');
    if (currentDigit) {
      currentDigit.textContent = `0${idx + 1}`;
    }

    numBtns.forEach(btn => {
      const bIdx = parseInt(btn.getAttribute('data-index'), 10);
      if (bIdx === idx) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const cards = document.querySelectorAll('.landmark-editorial-card');
    cards.forEach(card => {
      const cIdx = parseInt(card.getAttribute('data-card-index'), 10);
      if (cIdx === idx) {
        card.classList.add('is-active-focus');
      } else {
        card.classList.remove('is-active-focus');
      }
    });
  }

  if (typeof Swiper !== 'undefined') {
    swiperInstance = new Swiper('.landmarks-swiper', {
      slidesPerView: 1.15,
      spaceBetween: 16,
      speed: 650,
      grabCursor: true,
      watchOverflow: true,
      pagination: {
        el: '.landmarks-mobile-dots',
        clickable: true,
      },
      breakpoints: {
        640: {
          slidesPerView: 2,
          spaceBetween: 18,
        },
        1024: {
          slidesPerView: 3,
          spaceBetween: 20,
          allowTouchMove: false,
        },
      },
      on: {
        slideChange: function () {
          updateActiveIndex(this.realIndex);
        },
      },
    });
  }

  // Connect left rail indicator buttons
  numBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      if (swiperInstance && window.innerWidth < 1024) {
        swiperInstance.slideTo(idx);
      } else {
        updateActiveIndex(idx);
      }
    });
  });

  // Connect previous arrow
  if (prevRail) {
    prevRail.addEventListener('click', () => {
      let prevIdx = (activeIndex - 1 + 3) % 3;
      if (swiperInstance && window.innerWidth < 1024) {
        swiperInstance.slideTo(prevIdx);
      } else {
        updateActiveIndex(prevIdx);
      }
    });
  }

  // Connect next arrows (rail next and right floating circular button)
  const handleNext = () => {
    let nextIdx = (activeIndex + 1) % 3;
    if (swiperInstance && window.innerWidth < 1024) {
      swiperInstance.slideTo(nextIdx);
    } else {
      updateActiveIndex(nextIdx);
    }
  };

  if (nextRail) nextRail.addEventListener('click', handleNext);
  if (floatNext) floatNext.addEventListener('click', handleNext);
}

/* 4b. Hero Background Video Controller (Deferred Start After Cloud Intro) */
let heroVideoStarted = false;

function markHeroVideoPlaying() {
  const wrapper = document.querySelector('.hero-video-wrapper');
  if (wrapper) {
    wrapper.classList.add('is-playing', 'video-playing');
  }
}

function startHeroVideo() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;

  // Mobile & desktop video attributes
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  // Add listeners to mark playing as soon as frames render
  if (!video.paused && video.currentTime > 0) {
    markHeroVideoPlaying();
  } else {
    video.addEventListener('playing', markHeroVideoPlaying, { once: true });
    video.addEventListener('timeupdate', function onFirstTime() {
      if (video.currentTime > 0) {
        markHeroVideoPlaying();
        video.removeEventListener('timeupdate', onFirstTime);
      }
    });
  }

  heroVideoStarted = true;

  const attemptPlay = () => {
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        markHeroVideoPlaying();
      }).catch((err) => {
        console.warn('Hero video autoplay restriction encountered:', err);
        // Graceful touch/click fallback if autoplay was restricted by mobile browser
        const triggerPlayOnGesture = () => {
          video.play().then(() => {
            markHeroVideoPlaying();
          }).catch(() => {});
          window.removeEventListener('touchstart', triggerPlayOnGesture);
          window.removeEventListener('click', triggerPlayOnGesture);
        };
        window.addEventListener('touchstart', triggerPlayOnGesture, { passive: true, once: true });
        window.addEventListener('click', triggerPlayOnGesture, { passive: true, once: true });
      });
    }
  };

  if (video.readyState >= 2) {
    attemptPlay();
  } else {
    attemptPlay();
    video.addEventListener('canplay', attemptPlay, { once: true });
    video.addEventListener('loadeddata', attemptPlay, { once: true });
  }
}

function initHeroVideo() {
  const video = document.querySelector('.hero-video-bg');
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  // Handle video load errors safely to retain the static architectural fallback background
  video.addEventListener('error', (e) => {
    console.warn('Hero video load issue, keeping fallback background:', e);
    const wrapper = document.querySelector('.hero-video-wrapper');
    if (wrapper) wrapper.classList.remove('is-playing', 'video-playing');
  });

  // If intro has already been played in this browser session, start the hero video immediately
  if (sessionStorage.getItem('tabd_intro_played')) {
    startHeroVideo();
  } else {
    video.pause();
    try {
      video.currentTime = 0;
    } catch (e) {}
  }
}

/* 4c. Unified Introductory Sequence:
   STAGE 1: Avenue Logo Intro (0.0s to ~3.2s)
   STAGE 2: Cinematic Cloud Intro (Exactly 2.0s visible, 3.2s to 5.2s, then 1.0s smooth fade)
   STAGE 3: Milestone Hero Video (Starts playback ONLY after cloud intro finishes at 6.2s)
   
   Session Behavior:
   - First visit in session: Plays full sequence (Logo -> 2s Cloud -> Hero Video).
   - On refresh: Skips intro, loads Home page directly, starts video immediately.
   - On clicking Home or navigating back: Skips intro, loads Home page directly.
   - Navigating between pages: Never replays intro.
*/
function initCloudIntro() {
  const logoIntro = document.getElementById('avenue-intro');
  const cloudIntro = document.getElementById('cloudIntro');

  // Check if intro has already been played in this browser session
  const hasIntroPlayed = Boolean(sessionStorage.getItem('tabd_intro_played'));

  // If on a page without intro elements (e.g. About, Projects, Services, Contact),
  // record the session flag so navigating to Home later will not replay the intro.
  if (!logoIntro && !cloudIntro) {
    sessionStorage.setItem('tabd_intro_played', 'true');
    return;
  }

  // If intro was already played in this session (e.g. page refresh or clicking Home):
  if (hasIntroPlayed) {
    document.documentElement.classList.add('skip-intro');
    if (logoIntro) {
      logoIntro.style.display = 'none';
      logoIntro.setAttribute('data-intro', 'skip');
    }
    if (cloudIntro) {
      cloudIntro.style.display = 'none';
      cloudIntro.classList.add('fade-out');
    }
    startHeroVideo();
    return;
  }

  // First visit in this session: record the flag so subsequent reloads or navigations skip intro
  sessionStorage.setItem('tabd_intro_played', 'true');

  let cloudFadeTimer = null;
  let cloudCompleteTimer = null;
  let logoRemoveTimer = null;

  function triggerCloudFade() {
    if (!cloudIntro || cloudIntro.classList.contains('fade-out')) return;
    cloudIntro.classList.add('fade-out');
    cloudCompleteTimer = setTimeout(() => {
      cloudIntro.style.display = 'none';
      startHeroVideo();
    }, 1000);
  }

  // Stage 1: Avenue Logo Intro cleanup after its CSS exit animation completes (~3950ms)
  if (logoIntro) {
    logoRemoveTimer = setTimeout(() => {
      logoIntro.style.display = 'none';
    }, 4000);

    // Click/tap to skip logo intro; clouds remain visible for 2.0s from click
    logoIntro.addEventListener('click', () => {
      logoIntro.style.display = 'none';
      if (cloudIntro && !cloudIntro.classList.contains('fade-out')) {
        clearTimeout(cloudFadeTimer);
        cloudFadeTimer = setTimeout(triggerCloudFade, 2000);
      }
    });
  }

  // Stage 2: Cinematic Cloud Intro sequence
  // After logo intro finishes (~3.2s), clouds remain visible for exactly 2 seconds (until 5200ms).
  // Then clouds dissolve naturally over 1.0s (5200ms to 6200ms).
  // The video starts playing only after the clouds completely disappear (6200ms).
  if (cloudIntro) {
    cloudFadeTimer = setTimeout(triggerCloudFade, 5200);

    // Tap or click anywhere on cloud intro to immediately fade away to hero video
    cloudIntro.addEventListener('click', () => {
      clearTimeout(cloudFadeTimer);
      clearTimeout(cloudCompleteTimer);
      triggerCloudFade();
    });

    // Safety fallback: ensure video starts even if timer was paused by background tab
    setTimeout(startHeroVideo, 7000);
  } else {
    // If cloud intro element is absent, start video immediately
    startHeroVideo();
  }
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

  function applyFilter(filterValue) {
    projectCards.forEach(card => {
      const category = card.getAttribute('data-category');
      if (filterValue === 'all' || (category && category.includes(filterValue))) {
        card.style.display = '';
        card.classList.add('active');
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
        group.querySelectorAll('.fadeUpAnimation').forEach(el => el.classList.add('active'));
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });

  // Apply default active filter on page load (OUR LEGACY)
  const defaultActiveBtn = document.querySelector('.filter-btn.active') || filterBtns[0];
  if (defaultActiveBtn) {
    applyFilter(defaultActiveBtn.getAttribute('data-filter'));
  }
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
