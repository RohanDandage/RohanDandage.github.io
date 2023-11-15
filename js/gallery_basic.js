  document.addEventListener('DOMContentLoaded', function () {
    filterGallery('gallery1', 'all');
    filterGallery('gallery2', 'all');
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
  }

  function toggleActive(button,category) {
    // Remove 'active' class from all buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));

    if (category === 'all'){
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
    });
  }

  enableHorizontalScroll('gallery1');
  enableHorizontalScroll('gallery2');
  enableHorizontalScroll('gallery3');    
  