// Get the menu toggle button and nav elements
const menuToggle = document.getElementById('mobile-menu-toggle');
const navList = document.getElementById('nav-list');

// Add click event listener to toggle menu visibility
menuToggle.addEventListener('click', () => {
  navList.classList.toggle('active');
});