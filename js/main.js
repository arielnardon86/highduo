/* ============================================================
   HIGH DUO — main.js
============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ── Sticky header shadow ──────────────────────────────────
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // ── Mobile hamburger menu ─────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navMenu   = document.getElementById('navMenu');

  hamburger.addEventListener('click', () => {
    const open = hamburger.classList.toggle('open');
    navMenu.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
  });

  // Close menu when a link is clicked
  navMenu.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navMenu.classList.remove('open');
    });
  });

  // ── Active nav link on scroll ─────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('.nav__link');

  const observerNav = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach(section => observerNav.observe(section));

  // ── Scroll reveal animations ──────────────────────────────
  const revealEls = document.querySelectorAll(
    '.benefit-card, .testimonial-card, .contact-option, .value-item, .about__mission-card'
  );

  // Add reveal class to elements
  revealEls.forEach((el, i) => {
    el.classList.add('reveal');
    const delay = (i % 5) + 1;
    el.classList.add(`reveal-delay-${delay}`);
  });

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  // ── Product image gallery ─────────────────────────────────
  const thumbs   = document.querySelectorAll('.gallery__thumb');
  const mainImgs = document.querySelectorAll('.gallery__main-img');

  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      const idx = thumb.dataset.index;
      thumbs.forEach(t   => t.classList.remove('active'));
      mainImgs.forEach(img => img.classList.remove('active'));
      thumb.classList.add('active');
      document.querySelector(`.gallery__main-img[data-index="${idx}"]`).classList.add('active');
    });
  });

  // ── Buy button click tracking ─────────────────────────────
  const buyBtn = document.getElementById('buyBtn');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      // Optional: add analytics event here
      // Example: gtag('event', 'click', { event_category: 'CTA', event_label: 'Mercado Libre - Main Product' });
      console.log('[High Duo] → Redirect to Mercado Libre');
    });
  }

  // ── Smooth scroll for anchor links ───────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = 88; // header height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

});
