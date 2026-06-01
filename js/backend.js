/* --- Intro Animation (formerly intro.js) --- */
(function() {
    $(window).on('load', function() {
      var background, intro, loader, logo, tl;
      intro = $('.intro');
      loader = $('.load');
      background = $('.background');
      logo = $('.logo > img');
      tl = new TimelineMax();
      return tl.fromTo(logo, 0, {
        scale: .95,
        alpha: 0
      }, {
        ease: Expo.easeOut,
        scale: 1,
        alpha: 1,
        delay: 0
      }).to(loader, 0.3, {
        ease: Power4.easeInOut,
        x: "0%",
        onComplete: function() {
          return TweenMax.set(logo, {
            visibility: "hidden",
            delay: 0
          });
        }
      }).to(loader, 0, {
        ease: Power4.easeInOut,
        x: "100%"
      }).to(background, 0, {
        ease: Power4.easeInOut,
        x: "100%",
        onComplete: function() {
          return TweenMax.set(intro, {
            visibility: "hidden"
          });
        }
      });
    });
  
  }).call(this);

/* --- Gallery Functionality (formerly gallery_basic.js) --- */
document.addEventListener('DOMContentLoaded', function () {
  // Initialize galleries
  filterGallery('gallery1', 'all');
  filterGallery('gallery2', 'all');
  filterGallery('gallery3', 'all');

  // Enable interactions
  enableHorizontalScroll('gallery1');
  enableHorizontalScroll('gallery2');
  enableHorizontalScroll('gallery3');

  enableHorizontalScrollwheel('gallery1');
  enableHorizontalScrollwheel('gallery2');
  enableHorizontalScrollwheel('gallery3');

  initializeCarouselControls();
});

function filterGallery(galleryId, category) {
  const items = document.querySelectorAll(`#${galleryId} .gallery-item`);
  items.forEach(item => {
    const categories = item.classList;
    if (category === 'all' || categories.contains(category)) {
      item.classList.remove('hide');
    } else {
      item.classList.add('hide');
    }
  });
  // Update button states after filtering
  const gallery = document.getElementById(galleryId);
  if (gallery) {
    updateButtonStates(gallery);
  }
}

function toggleActive(button, category) {
  // Remove 'active' class from all buttons
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

  if (category === 'all') {
    return;
  }

  // Add 'active' class to the clicked button
  button.classList.add('active');
}

function enableHorizontalScroll(containerId) {
  let isMouseDown = false;
  let startX;
  let scrollLeft;

  const container = document.getElementById(containerId);
  if (!container) return;

  container.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
  });

  container.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  container.addEventListener('mouseleave', () => {
    isMouseDown = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX) * 3; // Adjust the multiplier for faster/slower scrolling
    container.scrollLeft = scrollLeft - walk;
    updateButtonStates(container); // Update buttons while dragging
  });
}

function enableHorizontalScrollwheel(elementId) {
  var container = document.getElementById(elementId);

  if (container) {
    container.addEventListener('wheel', function (event) {
      if (event.deltaY > 0) {
        container.scrollLeft += 70; // Adjust scrolling speed if needed
      } else {
        container.scrollLeft -= 150; // Adjust scrolling speed if needed
      }
      updateButtonStates(container); // Update buttons while wheeling
      event.preventDefault();
    }, { passive: false });
  } else {
    console.error('Element with id ' + elementId + ' not found.');
  }
}

function updateButtonStates(gallery) {
  const galleryId = gallery.id;
  const prevBtn = document.querySelector(`.js-carousel__button--prev[aria-controls="${galleryId}"]`);
  const nextBtn = document.querySelector(`.js-carousel__button--next[aria-controls="${galleryId}"]`);

  if (prevBtn) {
    prevBtn.disabled = gallery.scrollLeft <= 0;
  }
  if (nextBtn) {
    // Check if reached the end
    // Use a small threshold (1px) for floating point precision issues
    nextBtn.disabled = gallery.scrollLeft + gallery.clientWidth >= gallery.scrollWidth - 1;
  }
}

function initializeCarouselControls() {
  const prevButtons = document.querySelectorAll('.js-carousel__button--prev');
  const nextButtons = document.querySelectorAll('.js-carousel__button--next');

  const scrollAmount = 600; // Increased scroll amount

  prevButtons.forEach(button => {
    button.onclick = function() { // Using onclick for maximum reliability
      const galleryId = button.getAttribute('aria-controls');
      const gallery = document.getElementById(galleryId);
      if (gallery) {
        gallery.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    };
  });

  nextButtons.forEach(button => {
    button.onclick = function() { // Using onclick for maximum reliability
      const galleryId = button.getAttribute('aria-controls');
      const gallery = document.getElementById(galleryId);
      if (gallery) {
        gallery.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };
  });

  // Attach scroll event listeners to galleries to update button states
  const galleries = document.querySelectorAll('.gallery-container');
  galleries.forEach(gallery => {
    gallery.addEventListener('scroll', () => updateButtonStates(gallery));
    // Initial state check after a short delay to ensure layout is ready
    setTimeout(() => updateButtonStates(gallery), 100);
  });
}

/* --- Keyboard Navigation (formerly navigation.js) --- */
document.addEventListener('keydown', function(e) {
  if (e.key === 'ArrowDown') {
    const nextButtons = document.querySelectorAll('.next_button');
    for (let btn of nextButtons) {
      const container = btn.closest('#projects');
      if (container) {
        const containerRect = container.getBoundingClientRect();
        // If the section is currently in view (at the top or overlapping the top)
        if (containerRect.top <= 10 && containerRect.bottom > 10) {
          btn.click();
          e.preventDefault();
          break;
        }
      }
    }
  }
});
