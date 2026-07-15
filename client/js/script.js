/* ============================================================================
   EverPure — script.js
   Pure vanilla JavaScript (ES6). No jQuery, no frameworks, no libraries.

   This single file is loaded on every page (via <script src="js/script.js">),
   so every feature below checks that its required element(s) exist before
   doing anything. That way nothing breaks on pages that don't have, say,
   a FAQ accordion or an order form.

   Jump to the bottom of the file for the master init that wires everything
   up once the page has loaded.
   ============================================================================ */


/* ============================================================================
   1. MOBILE NAVIGATION
   Required HTML:
     - <button id="navToggle" class="nav-toggle" aria-expanded="false">
     - <nav id="mainNav" class="main-nav"> containing <ul class="nav-links">
   Behavior:
     - Clicking the hamburger toggles the "nav-open" class on both the
       button and the nav (your CSS already styles .nav-open on both).
     - Clicking any link inside the mobile menu closes it again.
     - Listeners are attached exactly once (inside init), so there is no
       risk of the same click firing the toggle twice.
   ============================================================================ */

function initMobileNav() {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');

  // If this page doesn't have a header/nav (it always should), bail out safely.
  if (!navToggle || !mainNav) return;

  const closeMenu = () => {
    mainNav.classList.remove('nav-open');
    navToggle.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    const isOpen = mainNav.classList.toggle('nav-open');
    navToggle.classList.toggle('nav-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  };

  navToggle.addEventListener('click', toggleMenu);

  // Close the mobile menu automatically after a nav link is clicked.
  const navLinks = mainNav.querySelectorAll('.nav-links a');
  navLinks.forEach((link) => {
    link.addEventListener('click', closeMenu);
  });
}


/* ============================================================================
   2. STICKY NAVBAR (scroll effect)
   Required HTML:
     - <header class="site-header"> (already on every page)
   Behavior:
     - Adds a "scrolled" class to the header once the user scrolls past
       40px, removes it near the top again.
     - Your header is already CSS `position: sticky`, so it stays fixed
       either way — this class is just there in case you want to add
       extra shadow/background styling in style.css for the scrolled state,
       e.g.:
         .site-header.scrolled { box-shadow: 0 4px 20px rgba(0,0,0,0.35); }
       That CSS is OPTIONAL — the site works fine without it.
   ============================================================================ */

function initStickyNavbar() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const SCROLL_THRESHOLD = 40;
  let ticking = false; // prevents piling up scroll work on every single pixel

  const updateHeaderState = () => {
    if (window.scrollY > SCROLL_THRESHOLD) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderState);
      ticking = true;
    }
  });
}


/* ============================================================================
   3. SMOOTH SCROLLING FOR IN-PAGE LINKS
   Required HTML:
     - Any <a href="#some-id"> where an element with id="some-id" exists
       on the same page (e.g. products.html "Learn More" links).
   Behavior:
     - Your CSS already has `scroll-behavior: smooth` globally, so this
       would work with zero JS. This function exists to add ONE extra
       thing CSS can't do: it offsets the scroll position by the sticky
       header's height, so the target section isn't hidden underneath it.
   ============================================================================ */

function initSmoothScroll() {
  const header = document.querySelector('.site-header');
  const headerOffset = header ? header.offsetHeight : 0;

  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href').slice(1);
      if (!targetId) return; // ignore bare "#" links

      const targetEl = document.getElementById(targetId);
      if (!targetEl) return; // target isn't on this page, let the browser handle it

      event.preventDefault();

      const targetPosition =
        targetEl.getBoundingClientRect().top + window.scrollY - headerOffset - 16;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    });
  });
}


/* ============================================================================
   4. FAQ ACCORDION (only one open at a time)
   Required HTML:
     - <details class="faq-item"> ... <summary class="faq-question">
       (already on faq.html)
   Behavior:
     - Native <details>/<summary> already opens/closes on click with zero JS.
     - This adds the "only one open at a time" behavior: whenever one FAQ
       item opens, every other .faq-item on the page closes automatically.
   ============================================================================ */

function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (faqItems.length === 0) return;

  faqItems.forEach((item) => {
    item.addEventListener('toggle', () => {
      // "toggle" fires whenever this <details> opens OR closes.
      // We only need to act when THIS one just opened.
      if (item.open) {
        faqItems.forEach((otherItem) => {
          if (otherItem !== item) {
            otherItem.open = false;
          }
        });
      }
    });
  });
}


/* ============================================================================
   5. SCROLL REVEAL ANIMATION (Intersection Observer)
   Required HTML:
     - None extra — this targets every direct <section> inside <main>,
       which already exists on every page.
   Behavior:
     - Adds a "visible" class to each section as it scrolls into view.
     - Uses IntersectionObserver (NOT a scroll event), so it's efficient.
   IMPORTANT — this needs a small CSS addition to actually be visible:
     Right now this only toggles a class; nothing in style.css reacts to
     it yet, so you won't see any animation until you add something like:

       main > section {
         opacity: 0;
         transform: translateY(24px);
         transition: opacity 0.6s ease, transform 0.6s ease;
       }
       main > section.visible {
         opacity: 1;
         transform: translateY(0);
       }

     That's entirely OPTIONAL and up to you — the JS works either way,
     it just won't do anything visible until that CSS exists.
   ============================================================================ */

function initScrollReveal() {
  const sections = document.querySelectorAll('main > section');
  if (sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Stop watching once revealed — it doesn't need to hide again.
          observerInstance.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  sections.forEach((section) => observer.observe(section));
}


/* ============================================================================
   6. BACK TO TOP BUTTON
   Required HTML:
     - None — the button is created here in JavaScript and appended to
       the page automatically, so every page gets one for free.
   Behavior:
     - Hidden until the user scrolls down 300px, then fades/pops in.
     - Clicking it smooth-scrolls back to the top.
   IMPORTANT — basic inline styles are applied directly here so the
   button is usable immediately with zero CSS changes. If you'd rather
   style it yourself in style.css, delete the `btn.style.cssText` line
   below and style `.back-to-top-btn` there instead.
   ============================================================================ */

function initBackToTop() {
  const btn = document.createElement('button');
  btn.id = 'backToTop';
  btn.className = 'back-to-top-btn';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '&uarr;';

  // Basic inline styles so it works before any CSS is added.
  btn.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: linear-gradient(135deg, #2f9be0, #22d3c5);
    color: #04141c;
    font-size: 1.3rem;
    font-weight: 700;
    border: none;
    cursor: pointer;
    z-index: 999;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  `;

  document.body.appendChild(btn);

  const SHOW_AFTER = 300;

  window.addEventListener('scroll', () => {
    if (window.scrollY > SHOW_AFTER) {
      btn.style.opacity = '1';
      btn.style.pointerEvents = 'auto';
      btn.style.transform = 'translateY(0)';
    } else {
      btn.style.opacity = '0';
      btn.style.pointerEvents = 'none';
      btn.style.transform = 'translateY(10px)';
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ============================================================================
   SHARED HELPERS — used by both form validation sections below
   ============================================================================ */

// Shows a small error message right under a field, and highlights the field.
function showFieldError(inputEl, message) {
  clearFieldError(inputEl); // avoid stacking duplicate messages

  inputEl.style.borderColor = '#ff6b6b';

  const errorEl = document.createElement('small');
  errorEl.className = 'js-error-message';
  errorEl.textContent = message;
  errorEl.style.cssText = 'display:block; color:#ff6b6b; font-size:0.8rem; margin-top:0.35rem; font-weight:500;';

  inputEl.insertAdjacentElement('afterend', errorEl);
}

// Removes the error message + highlight from a field, if present.
function clearFieldError(inputEl) {
  inputEl.style.borderColor = '';
  const next = inputEl.nextElementSibling;
  if (next && next.classList.contains('js-error-message')) {
    next.remove();
  }
}

// Basic reusable validators.
function isValidName(value) {
  return value.trim().length >= 2;
}

function isValidPhone(value) {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length >= 10 && digitsOnly.length <= 12;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

// Shows a custom success banner instead of alert(), placed right after a
// given reference element (usually the form itself, or the submit button).
function showSuccessMessage(referenceEl, message) {
  // Remove any previous success message so they don't pile up on resubmit.
  const existing = referenceEl.parentElement.querySelector('.js-success-message');
  if (existing) existing.remove();

  const successBox = document.createElement('div');
  successBox.className = 'js-success-message';
  successBox.textContent = message;
  successBox.style.cssText = `
    margin-top: 1.25rem;
    padding: 1rem 1.25rem;
    border-radius: 8px;
    background: rgba(34, 211, 197, 0.12);
    border: 1px solid #22d3c5;
    color: #22d3c5;
    font-weight: 600;
    font-size: 0.9rem;
  `;

  referenceEl.insertAdjacentElement('afterend', successBox);

  // Auto-dismiss after a few seconds so it doesn't linger forever.
  setTimeout(() => successBox.remove(), 6000);
}


/* ============================================================================
   7. CONTACT FORM VALIDATION
   Required HTML (already on contact.html):
     - <form class="contact-form"> containing:
       #cf-name, #cf-phone, #cf-email (optional), #cf-message
   Behavior:
     - Validates Name, Phone, Message as required; Email only if filled in.
     - Prevents submission (preventDefault) if anything is invalid.
     - On success: shows a custom message and resets the form.
   ============================================================================ */

function initContactFormValidation() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  const nameInput = form.querySelector('#cf-name');
  const phoneInput = form.querySelector('#cf-phone');
  const emailInput = form.querySelector('#cf-email');
  const messageInput = form.querySelector('#cf-message');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let isFormValid = true;

    if (!isValidName(nameInput.value)) {
      showFieldError(nameInput, 'Please enter your full name.');
      isFormValid = false;
    } else {
      clearFieldError(nameInput);
    }

    if (!isValidPhone(phoneInput.value)) {
      showFieldError(phoneInput, 'Please enter a valid phone number.');
      isFormValid = false;
    } else {
      clearFieldError(phoneInput);
    }

    // Email is optional — only validate format if the person typed something.
    if (emailInput.value.trim() !== '' && !isValidEmail(emailInput.value)) {
      showFieldError(emailInput, 'Please enter a valid email address.');
      isFormValid = false;
    } else {
      clearFieldError(emailInput);
    }

    if (messageInput.value.trim().length < 10) {
      showFieldError(messageInput, 'Please write a bit more detail (at least 10 characters).');
      isFormValid = false;
    } else {
      clearFieldError(messageInput);
    }

    if (!isFormValid) return;

    // No backend exists yet — this is where a real fetch()/POST would go.
    showSuccessMessage(form, "Thank you! Your message has been received. We'll get back to you soon.");
    form.reset();
  });

  // Clear a field's error the moment the user starts fixing it.
  [nameInput, phoneInput, emailInput, messageInput].forEach((field) => {
    field.addEventListener('input', () => clearFieldError(field));
  });
}


/* ============================================================================
   8. ORDER FORM VALIDATION
   Required HTML (already on order.html):
     - <form id="orderForm"> containing:
       #of-name, #of-phone, #of-email (optional), #of-address,
       input[name="bottle"] (radio group), #qtyInput, #of-area,
       #of-date, input[name="timeslot"] (radio group), #of-notes (optional)
     - Submit button uses form="orderForm" (already set), so listening for
       the form's "submit" event catches it regardless of where the button
       physically sits in the page.
   ============================================================================ */

function initOrderFormValidation() {
  const form = document.getElementById('orderForm');
  if (!form) return;

  const nameInput = form.querySelector('#of-name');
  const phoneInput = form.querySelector('#of-phone');
  const emailInput = form.querySelector('#of-email');
  const addressInput = form.querySelector('#of-address');
  const areaSelect = form.querySelector('#of-area');
  const dateInput = form.querySelector('#of-date');
  const qtyInput = form.querySelector('#qtyInput');

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    let isFormValid = true;

    if (!isValidName(nameInput.value)) {
      showFieldError(nameInput, 'Please enter your full name.');
      isFormValid = false;
    } else {
      clearFieldError(nameInput);
    }

    if (!isValidPhone(phoneInput.value)) {
      showFieldError(phoneInput, 'Please enter a valid phone number.');
      isFormValid = false;
    } else {
      clearFieldError(phoneInput);
    }

    if (emailInput.value.trim() !== '' && !isValidEmail(emailInput.value)) {
      showFieldError(emailInput, 'Please enter a valid email address.');
      isFormValid = false;
    } else {
      clearFieldError(emailInput);
    }

    if (addressInput.value.trim().length < 5) {
      showFieldError(addressInput, 'Please enter your full delivery address.');
      isFormValid = false;
    } else {
      clearFieldError(addressInput);
    }

    // Bottle choice (radio group) — should always have a default checked,
    // but we confirm just in case.
    const bottleChecked = form.querySelector('input[name="bottle"]:checked');
    if (!bottleChecked) {
      isFormValid = false;
    }

    const quantityValue = parseInt(qtyInput.value, 10);
    if (isNaN(quantityValue) || quantityValue < 1) {
      showFieldError(qtyInput, 'Quantity must be at least 1.');
      isFormValid = false;
    } else {
      clearFieldError(qtyInput);
    }

    if (areaSelect.value === '') {
      showFieldError(areaSelect, 'Please select a delivery area.');
      isFormValid = false;
    } else {
      clearFieldError(areaSelect);
    }

    if (dateInput.value === '') {
      showFieldError(dateInput, 'Please choose a preferred delivery date.');
      isFormValid = false;
    } else {
      // Also make sure the date isn't in the past.
      const chosenDate = new Date(dateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (chosenDate < today) {
        showFieldError(dateInput, 'Delivery date cannot be in the past.');
        isFormValid = false;
      } else {
        clearFieldError(dateInput);
      }
    }

    // Time slot (radio group) — same as bottle, should always have a default.
    const timeslotChecked = form.querySelector('input[name="timeslot"]:checked');
    if (!timeslotChecked) {
      isFormValid = false;
    }

    // Notes are optional — nothing to validate.

    if (!isFormValid) return;

    // No backend exists yet — this is where a real fetch()/POST would go.
    const submitButton = document.querySelector('.order-submit');
    showSuccessMessage(
      submitButton,
      'Thank you! Your order has been received. Our team will confirm delivery shortly.'
    );

    form.reset();
    updateOrderSummary(); // reset the summary box back to defaults too
  });

  // Clear errors as the person fixes each field.
  [nameInput, phoneInput, emailInput, addressInput, areaSelect, dateInput, qtyInput].forEach(
    (field) => {
      field.addEventListener('input', () => clearFieldError(field));
      field.addEventListener('change', () => clearFieldError(field));
    }
  );
}


/* ============================================================================
   9. ORDER SUMMARY (live update) + QUANTITY STEPPER
   Required HTML (already on order.html):
     - input[name="bottle"] (radio group)
     - #qtyMinus, #qtyInput, #qtyPlus
     - #of-area (select)
     - #summaryProduct, #summaryQty, #summaryArea (the display spans)
   Behavior:
     - The [-] and [+] buttons actually change the quantity now.
     - Any change to bottle size, quantity, or area instantly updates
       the Order Summary card.
   ============================================================================ */

// Declared outside the function so initOrderFormValidation() can call it
// after form.reset() without needing to re-select every element again.
function updateOrderSummary() {
  const summaryProduct = document.getElementById('summaryProduct');
  const summaryQty = document.getElementById('summaryQty');
  const summaryArea = document.getElementById('summaryArea');
  if (!summaryProduct || !summaryQty || !summaryArea) return;

  const checkedBottle = document.querySelector('input[name="bottle"]:checked');
  const qtyInput = document.getElementById('qtyInput');
  const areaSelect = document.getElementById('of-area');

  summaryProduct.textContent = checkedBottle ? `${checkedBottle.value} Bottle` : '—';
  summaryQty.textContent = qtyInput ? qtyInput.value : '—';
  summaryArea.textContent = areaSelect && areaSelect.value !== '' ? areaSelect.value : '—';
}

function initOrderSummary() {
  const qtyInput = document.getElementById('qtyInput');
  const qtyMinus = document.getElementById('qtyMinus');
  const qtyPlus = document.getElementById('qtyPlus');
  const areaSelect = document.getElementById('of-area');
  const bottleRadios = document.querySelectorAll('input[name="bottle"]');

  // If the order form isn't on this page, there's nothing to wire up.
  if (!qtyInput || !qtyMinus || !qtyPlus) return;

  const MIN_QTY = parseInt(qtyInput.min, 10) || 1;
  const MAX_QTY = parseInt(qtyInput.max, 10) || 50;

  qtyMinus.addEventListener('click', () => {
    const currentValue = parseInt(qtyInput.value, 10) || MIN_QTY;
    if (currentValue > MIN_QTY) {
      qtyInput.value = currentValue - 1;
      updateOrderSummary();
    }
  });

  qtyPlus.addEventListener('click', () => {
    const currentValue = parseInt(qtyInput.value, 10) || MIN_QTY;
    if (currentValue < MAX_QTY) {
      qtyInput.value = currentValue + 1;
      updateOrderSummary();
    }
  });

  bottleRadios.forEach((radio) => {
    radio.addEventListener('change', updateOrderSummary);
  });

  if (areaSelect) {
    areaSelect.addEventListener('change', updateOrderSummary);
  }

  // Run once on page load so the summary matches whatever is pre-selected.
  updateOrderSummary();
}


/* ============================================================================
   10. BUTTON HOVER ENHANCEMENTS
   Your CSS (.btn:hover, .btn-primary:hover, .btn-outline:hover) already
   fully handles hover styling with transitions — there's nothing a hover
   effect needs from JavaScript here, and adding one would risk fighting
   with or duplicating what CSS already does well.
   Intentionally left as a no-op so this section exists for completeness,
   per your project's coding rules.
   ============================================================================ */

function initButtonEnhancements() {
  // No JavaScript needed — see comment above.
}


/* ============================================================================
   MASTER INIT
   Runs once the HTML is fully parsed. Every function above safely does
   nothing on pages that don't have its required elements, so it's safe
   to call all of them on every page.
   ============================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNav();
  initStickyNavbar();
  initSmoothScroll();
  initFaqAccordion();
  initScrollReveal();
  initBackToTop();
  initContactFormValidation();
  initOrderFormValidation();
  initOrderSummary();
  initButtonEnhancements();
});