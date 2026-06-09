/* ══════════════════════════════════════════════
   PRIME COMPUTERS — script.js
   All interactivity & animations
══════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Loader ──────────────────────────────── */
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    setTimeout(() => {
      loader.classList.add('hide');
      document.body.style.overflow = '';
    }, 2000);
  });
  document.body.style.overflow = 'hidden';

  /* ── Navbar scroll & active ──────────────── */
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    // Active link
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
    });
    // Back to top
    backToTop.classList.toggle('show', window.scrollY > 400);
  });

  /* ── Hamburger menu ──────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navLinksEl = document.getElementById('navLinks');
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinksEl.classList.toggle('open');
  });
  navLinksEl.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinksEl.classList.remove('open');
    });
  });

  /* ── Hero Particles ──────────────────────── */
  const particleContainer = document.getElementById('particles');
  function spawnParticle() {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = Math.random() * 3 + 1;
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${size}px;
      height: ${size}px;
      animation-duration: ${Math.random() * 8 + 6}s;
      animation-delay: ${Math.random() * 4}s;
      opacity: 0;
    `;
    particleContainer.appendChild(p);
    setTimeout(() => p.remove(), 14000);
  }
  for (let i = 0; i < 30; i++) spawnParticle();
  setInterval(spawnParticle, 600);

  /* ── Counter animation ───────────────────── */
  const counters = document.querySelectorAll('.stat-num');
  let counted = false;
  function runCounters() {
    if (counted) return;
    const heroBottom = document.getElementById('home').getBoundingClientRect().bottom;
    if (heroBottom < window.innerHeight * 1.2) {
      counted = true;
      counters.forEach(el => {
        const target = +el.dataset.target;
        const step = Math.ceil(target / 60);
        let curr = 0;
        const timer = setInterval(() => {
          curr = Math.min(curr + step, target);
          el.textContent = curr.toLocaleString();
          if (curr >= target) clearInterval(timer);
        }, 24);
      });
    }
  }
  window.addEventListener('scroll', runCounters);
  runCounters();

  /* ── Scroll Reveal ───────────────────────── */
  const revealEls = document.querySelectorAll(
    '.service-card, .price-card, .gallery-item, .testimonial-card, .faq-item, .pillar, .af-item, .ci-item, .about-content, .about-visual, .contact-form-wrap, .contact-info, .section-header'
  );
  revealEls.forEach(el => el.classList.add('reveal'));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  /* ── Service Search ──────────────────────── */
  const searchInput = document.getElementById('serviceSearch');
  const clearBtn = document.getElementById('clearSearch');
  const servicesGrid = document.getElementById('servicesGrid');
  const noServices = document.getElementById('noServices');
  const serviceCards = document.querySelectorAll('.service-card');

  function filterServices(query) {
    const q = query.toLowerCase().trim();
    let visible = 0;
    serviceCards.forEach(card => {
      const match = card.dataset.service.includes(q) || card.querySelector('h3').textContent.toLowerCase().includes(q) || card.querySelector('p').textContent.toLowerCase().includes(q);
      card.style.display = (!q || match) ? '' : 'none';
      if (!q || match) visible++;
    });
    noServices.classList.toggle('hidden', visible > 0);
    servicesGrid.classList.toggle('hidden', visible === 0);
  }
  searchInput.addEventListener('input', e => {
    filterServices(e.target.value);
    clearBtn.style.opacity = e.target.value ? '1' : '0';
  });
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    filterServices('');
    clearBtn.style.opacity = '0';
    searchInput.focus();
  });
  clearBtn.style.opacity = '0';

  /* ── FAQ Accordion ───────────────────────── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-answer').classList.remove('open');
      });

      if (!isOpen) {
        item.classList.add('open');
        answer.classList.add('open');
      }
    });
  });

  /* ── Testimonials Slider ─────────────────── */
  const track = document.getElementById('testimonialTrack');
  const dotsContainer = document.getElementById('sliderDots');
  const cards = track.querySelectorAll('.testimonial-card');
  let currentSlide = 0;
  let slideTimer;

  function getSlidesVisible() {
    return window.innerWidth >= 1024 ? 3 : window.innerWidth >= 640 ? 2 : 1;
  }

  function getMaxSlide() {
    return Math.max(0, cards.length - getSlidesVisible());
  }

  function buildDots() {
    dotsContainer.innerHTML = '';
    const max = getMaxSlide();
    for (let i = 0; i <= max; i++) {
      const dot = document.createElement('button');
      dot.classList.add('slider-dot');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      if (i === currentSlide) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }
  }

  function goToSlide(n) {
    currentSlide = Math.max(0, Math.min(n, getMaxSlide()));
    const cardW = cards[0].offsetWidth + 24; // 24 = gap
    track.style.transform = `translateX(-${currentSlide * cardW}px)`;
    document.querySelectorAll('.slider-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
    resetTimer();
  }

  function nextSlide() {
    goToSlide(currentSlide >= getMaxSlide() ? 0 : currentSlide + 1);
  }

  function resetTimer() {
    clearInterval(slideTimer);
    slideTimer = setInterval(nextSlide, 4500);
  }

  buildDots();
  resetTimer();
  window.addEventListener('resize', () => { buildDots(); goToSlide(0); });

  /* ── Contact Form ────────────────────────── */
  const form = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    setTimeout(() => {
      formSuccess.classList.remove('hidden');
      form.reset();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
      setTimeout(() => formSuccess.classList.add('hidden'), 5000);
    }, 1400);
  });

  /* ── Back to Top ─────────────────────────── */
  const backToTop = document.getElementById('backToTop');
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Smooth scrolling for anchor links ───── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = 72; // navbar height
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── Gallery lightbox effect ─────────────── */
  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      const label = item.dataset.label;
      const icon = item.querySelector('i').cloneNode(true);
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:9000;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        cursor:pointer;backdrop-filter:blur(8px);
        animation:fadeInOverlay 0.3s ease forwards;
      `;
      icon.style.cssText = 'font-size:6rem;color:#00d4ff;margin-bottom:20px;';
      const title = document.createElement('p');
      title.style.cssText = `
        font-family:'Orbitron',monospace;color:#00d4ff;
        font-size:1.2rem;letter-spacing:3px;margin-bottom:12px;
      `;
      title.textContent = label;
      const hint = document.createElement('p');
      hint.style.cssText = 'color:rgba(240,248,255,0.4);font-size:0.82rem;font-family:Inter,sans-serif;';
      hint.textContent = 'Click anywhere to close';

      // Add style
      const style = document.createElement('style');
      style.textContent = '@keyframes fadeInOverlay{from{opacity:0}to{opacity:1}}';
      document.head.appendChild(style);

      overlay.appendChild(icon);
      overlay.appendChild(title);
      overlay.appendChild(hint);
      document.body.appendChild(overlay);

      overlay.addEventListener('click', () => {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s';
        setTimeout(() => { overlay.remove(); style.remove(); }, 300);
      });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { overlay.click(); document.removeEventListener('keydown', esc); }
      });
    });
  });

})();
