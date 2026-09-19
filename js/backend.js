/**
 * JavaScript DOM Contract Safeguards:
 * 
 * Critical DOM Selectors required by this script:
 * - Intro animation: .intro, .load, .background, .logo > img
 * - Galleries: [id^="gallery"] (#gallery1, #gallery2, #gallery3), .gallery-container
 * - Filtering: #${galleryId} .gallery-item, .gallery-item.hide, .filter-btn, .filter-btn.active
 * - Carousel controls (optional): .js-carousel__button--prev, .js-carousel__button--next
 * - Navigation: .next_button, #projects
 * 
 * DO NOT remove or rename these classes/IDs from index.html or tailwind.css.
 */

/* ==========================================================================
   Modernized Zero-Dependency Intro Splash
   ========================================================================== */
(function() {
  'use strict';

  function initIntro() {
    const intro = document.querySelector('.intro');
    if (!intro) return;

    // Honor user accessibility preference for reduced motion
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      intro.remove();
      return;
    }

    const bg = intro.querySelector('.background');
    const logo = intro.querySelector('.logo');
    const logoImg = intro.querySelector('.logo img');

    let isDismissed = false;
    function dismissIntro() {
      if (isDismissed) return;
      isDismissed = true;
      clearTimeout(safetyTimer);
      intro.classList.add('intro--dismissed');
      setTimeout(() => {
        if (intro.parentNode) {
          intro.remove();
        }
      }, 350);
    }

    // Safety timeout: guarantee intro never blocks the page
    const safetyTimer = setTimeout(dismissIntro, 1200);

    // Immediate tap or click dismissal for instant access
    intro.addEventListener('click', dismissIntro, { once: true });

    // Native Web Animations API sequence
    if (logoImg && logoImg.animate) {
      const fadeIn = logoImg.animate([
        { opacity: 0, transform: 'scale(0.96)' },
        { opacity: 1, transform: 'scale(1)' }
      ], {
        duration: 320,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      });

      fadeIn.onfinish = () => {
        setTimeout(() => {
          if (isDismissed) return;
          if (bg && bg.animate) {
            const slide = bg.animate([
              { transform: 'translateX(0%)' },
              { transform: 'translateX(100%)' }
            ], {
              duration: 400,
              easing: 'cubic-bezier(0.77, 0, 0.175, 1)',
              fill: 'forwards'
            });

            if (logo && logo.animate) {
              logo.animate([
                { opacity: 1, transform: 'scale(1)' },
                { opacity: 0, transform: 'scale(0.97)' }
              ], {
                duration: 250,
                easing: 'ease-out',
                fill: 'forwards'
              });
            }

            slide.onfinish = dismissIntro;
          } else {
            dismissIntro();
          }
        }, 200);
      };
    } else {
      setTimeout(dismissIntro, 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIntro);
  } else {
    initIntro();
  }
})();

/* ==========================================================================
   Modular Gallery Component (Zero Globals) - Phase 2 State Isolation & Auto-Reset
   ========================================================================== */
(function() {
  'use strict';

  class PortfolioGallery {
    /**
     * @param {HTMLElement} rootElement - The .gallery parent container
     */
    constructor(rootElement) {
      this.root = rootElement;
      this.container = this.root.querySelector('.gallery-container');
      if (!this.container) return;

      this.id = this.container.id;
      this.items = Array.from(this.container.querySelectorAll('.gallery-item'));
      this.chips = Array.from(this.root.querySelectorAll('[data-filter], .filter-btn'));
      this.prevBtn = this.root.querySelector(`.js-carousel__button--prev[aria-controls="${this.id}"]`) ||
                     this.root.querySelector('.js-carousel__button--prev');
      this.nextBtn = this.root.querySelector(`.js-carousel__button--next[aria-controls="${this.id}"]`) ||
                     this.root.querySelector('.js-carousel__button--next');

      this.activeCategory = 'all';
      this.isUpdateScheduled = false;

      // Accessibility live region for filter announcements
      this.liveStatus = this.root.querySelector('.gallery-a11y-status');
      if (!this.liveStatus) {
        this.liveStatus = document.createElement('div');
        this.liveStatus.className = 'gallery-a11y-status sr-only';
        this.liveStatus.setAttribute('aria-live', 'polite');
        this.liveStatus.setAttribute('aria-atomic', 'true');
        const controls = this.root.querySelector('.gallery-controls') || this.root;
        controls.appendChild(this.liveStatus);
      }

      this.bindEvents();
      this.filter('all');
      this.updateControls();

      // Responsive observer for container dimension reflows
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.scheduleControlUpdate();
        });
        this.resizeObserver.observe(this.container);
      }
    }

    /**
     * Filters gallery items by category, isolates active state to this gallery,
     * and automatically resets scroll view.
     * @param {string} requestedCategory 
     */
    filter(requestedCategory) {
      // Toggle logic: clicking active non-all chip deselects back to 'all'
      const category = (this.activeCategory === requestedCategory && requestedCategory !== 'all') 
        ? 'all' 
        : (requestedCategory || 'all');

      this.activeCategory = category;

      // 1. Scoped DOM filtering strictly inside this gallery container
      let visibleCount = 0;
      this.items.forEach(item => {
        const match = (this.activeCategory === 'all' || item.classList.contains(this.activeCategory));
        item.classList.toggle('hide', !match);
        if (match) visibleCount++;
      });

      // 2. Auto-Reset: Reset scroll position to 0 so cards start cleanly at the beginning
      this.container.scrollLeft = 0;

      // 3. Isolated Chip State: Strictly update only this gallery's chips
      let activeLabel = 'All';
      this.chips.forEach((chip, index) => {
        const filterVal = chip.getAttribute('data-filter');
        const isActive = (filterVal === this.activeCategory);
        chip.classList.toggle('active', isActive);
        chip.setAttribute('aria-selected', isActive ? 'true' : 'false');
        // Ensure keyboard users can tab into chips (active chip, or first chip if viewing all)
        const isTabbable = isActive || (this.activeCategory === 'all' && index === 0);
        chip.setAttribute('tabindex', isTabbable ? '0' : '-1');
        if (isActive) {
          activeLabel = chip.textContent.trim() || 'All';
        }
      });

      // 4. Update screen-reader live status
      if (this.liveStatus) {
        this.liveStatus.textContent = `Showing ${visibleCount} item${visibleCount === 1 ? '' : 's'} in ${activeLabel}`;
      }

      // 5. Immediate & next-frame control re-evaluation
      this.updateControls();
      requestAnimationFrame(() => this.updateControls());
    }

    /**
     * Computes optimal scroll stride based on visible card dimensions or fluid percentage.
     * @returns {number}
     */
    getDynamicScrollAmount() {
      const visibleCard = this.container.querySelector('.gallery-item:not(.hide)');
      if (visibleCard && visibleCard.offsetWidth > 0) {
        const cardWidth = visibleCard.offsetWidth;
        const style = window.getComputedStyle(this.container);
        const gap = parseFloat(style.columnGap || style.gap || '0') || 0;
        const stride = cardWidth + gap;
        if (this.container.clientWidth < 640) {
          return stride > 0 ? stride : Math.floor(this.container.clientWidth * 0.85);
        }
        return Math.max(stride, Math.floor(this.container.clientWidth * 0.8));
      }
      return Math.max(200, Math.floor(this.container.clientWidth * 0.85));
    }

    /**
     * Scrolls the container left (-1) or right (+1).
     * @param {number} direction 
     */
    scrollBy(direction) {
      const amount = this.getDynamicScrollAmount();
      this.container.scrollBy({ left: direction * amount, behavior: 'smooth' });
    }

    /**
     * Schedules a throttled control update via requestAnimationFrame.
     */
    scheduleControlUpdate() {
      if (this.isUpdateScheduled) return;
      this.isUpdateScheduled = true;
      requestAnimationFrame(() => {
        this.isUpdateScheduled = false;
        this.updateControls();
      });
    }

    /**
     * Updates disabled state of carousel buttons based on scroll boundary conditions.
     */
    updateControls() {
      const scrollLeft = this.container.scrollLeft;
      const scrollWidth = this.container.scrollWidth;
      const clientWidth = this.container.clientWidth;
      const maxScrollLeft = scrollWidth - clientWidth;

      // If content fits completely without scrolling, disable both buttons
      if (maxScrollLeft <= 2) {
        if (this.prevBtn) this.prevBtn.disabled = true;
        if (this.nextBtn) this.nextBtn.disabled = true;
        return;
      }

      if (this.prevBtn) {
        this.prevBtn.disabled = scrollLeft <= 1;
      }
      if (this.nextBtn) {
        // Threshold check to guard against subpixel rounding
        this.nextBtn.disabled = scrollLeft >= maxScrollLeft - 2;
      }
    }

    /**
     * Binds scoped event listeners for filters, carousels, and gestures.
     */
    bindEvents() {
      // 1. Delegated click handling on gallery root
      this.root.addEventListener('click', (e) => {
        // Filter chip clicked
        const chip = e.target.closest('[data-filter], .filter-btn');
        if (chip && this.root.contains(chip)) {
          e.preventDefault();
          const category = chip.getAttribute('data-filter') || 'all';
          this.filter(category);
          return;
        }

        // Carousel buttons clicked
        const prev = e.target.closest('.js-carousel__button--prev');
        if (prev && this.root.contains(prev)) {
          e.preventDefault();
          this.scrollBy(-1);
          return;
        }

        const next = e.target.closest('.js-carousel__button--next');
        if (next && this.root.contains(next)) {
          e.preventDefault();
          this.scrollBy(1);
          return;
        }
      });

      // 2. Passive scroll listener with requestAnimationFrame throttling
      this.container.addEventListener('scroll', () => this.scheduleControlUpdate(), { passive: true });

      // 3. Pointer-based mouse drag-to-scroll with threshold check
      let isPointerDown = false;
      let startX = 0;
      let startScrollLeft = 0;
      let hasDraggedPastThreshold = false;
      let dragDistance = 0;
      const DRAG_THRESHOLD = 6; // px movement required before engaging drag

      this.container.addEventListener('pointerdown', (e) => {
        // Allow mobile touch screens to use native momentum scrolling
        if (e.pointerType === 'touch') return;
        if (e.button !== 0) return; // Only primary mouse button

        isPointerDown = true;
        hasDraggedPastThreshold = false;
        dragDistance = 0;
        startX = e.clientX;
        startScrollLeft = this.container.scrollLeft;

        if (this.container.setPointerCapture) {
          try {
            this.container.setPointerCapture(e.pointerId);
          } catch (_) {}
        }
      });

      this.container.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;

        const deltaX = e.clientX - startX;
        dragDistance = Math.abs(deltaX);

        if (!hasDraggedPastThreshold && dragDistance > DRAG_THRESHOLD) {
          hasDraggedPastThreshold = true;
          this.container.classList.add('is-dragging');
        }

        if (hasDraggedPastThreshold) {
          e.preventDefault();
          this.container.scrollLeft = startScrollLeft - deltaX;
          this.scheduleControlUpdate();
        }
      });

      const endPointerDrag = (e) => {
        if (!isPointerDown) return;
        isPointerDown = false;

        if (this.container.releasePointerCapture && e && e.pointerId) {
          try {
            this.container.releasePointerCapture(e.pointerId);
          } catch (_) {}
        }

        if (hasDraggedPastThreshold) {
          this.container.classList.remove('is-dragging');
          // Maintain drag state briefly so capture-phase click handler suppresses accidental navigation
          setTimeout(() => {
            hasDraggedPastThreshold = false;
            dragDistance = 0;
            this.updateControls();
          }, 60);
        } else {
          dragDistance = 0;
        }
      };

      this.container.addEventListener('pointerup', endPointerDrag);
      this.container.addEventListener('pointercancel', endPointerDrag);

      // 4. Suppress accidental link clicks when dragging cards
      this.container.addEventListener('click', (e) => {
        if (hasDraggedPastThreshold || dragDistance > DRAG_THRESHOLD) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);

      // 5. Prevent native browser ghost dragging of card images
      this.container.addEventListener('dragstart', (e) => {
        e.preventDefault();
      });

      // 6. Keyboard navigation for focused carousel
      this.container.setAttribute('tabindex', '0');
      this.container.setAttribute('role', 'region');
      this.container.setAttribute('aria-label', `${this.id} projects carousel`);

      this.container.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.scrollBy(-1);
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.scrollBy(1);
        }
      });
    }
  }

  // Registry for initialized gallery instances
  const galleryInstances = new Map();

  function initGalleries() {
    document.querySelectorAll('.gallery').forEach((el) => {
      const container = el.querySelector('.gallery-container');
      const id = container ? container.id : null;
      if (id && !galleryInstances.has(id)) {
        galleryInstances.set(id, new PortfolioGallery(el));
      }
    });
  }

  // Safe backward compatibility bridge for any external invocation
  window.filterGallery = function(galleryId, category) {
    const instance = galleryInstances.get(galleryId);
    if (instance) {
      instance.filter(category);
    }
  };
  window.toggleActive = function() {
    // No-op: handled automatically inside PortfolioGallery.filter()
  };

  // Lifecycle bindings
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGalleries);
  } else {
    initGalleries();
  }

  window.addEventListener('resize', () => {
    galleryInstances.forEach(instance => instance.updateControls());
  });
  window.addEventListener('load', () => {
    galleryInstances.forEach(instance => instance.updateControls());
  });

  // --- Modernized Section Navigation ---
  const sectionIds = ['lead', 'research', 'coding', 'blogs', 'contact'];

  function getSections() {
    return sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean);
  }

  function getCurrentSectionIndex() {
    const sections = getSections();
    const scrollPos = window.scrollY + 120;
    for (let i = sections.length - 1; i >= 0; i--) {
      if (scrollPos >= sections[i].offsetTop) {
        return i;
      }
    }
    return 0;
  }

  function scrollToSection(index) {
    const sections = getSections();
    if (index >= 0 && index < sections.length) {
      sections[index].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Smooth click interception for all .next_button links
  document.addEventListener('click', function(e) {
    const nextBtn = e.target.closest('.next_button');
    if (!nextBtn) return;

    const href = nextBtn.getAttribute('href');
    if (!href || href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (href.startsWith('#')) {
      const target = document.getElementById(href.slice(1));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // Bidirectional Keyboard Navigation: ArrowDown/PageDown and ArrowUp/PageUp
  document.addEventListener('keydown', function(e) {
    const active = document.activeElement;
    if (active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' ||
      active.isContentEditable ||
      active.classList.contains('gallery-container')
    )) {
      return;
    }

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      const currentIdx = getCurrentSectionIndex();
      const nextIdx = currentIdx + 1;
      const sections = getSections();
      if (nextIdx < sections.length) {
        e.preventDefault();
        scrollToSection(nextIdx);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      const currentIdx = getCurrentSectionIndex();
      const prevIdx = currentIdx - 1;
      if (prevIdx >= 0) {
        e.preventDefault();
        scrollToSection(prevIdx);
      }
    }
  });

})();
