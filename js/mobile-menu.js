// Mobile Menu Utility
export function initializeMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const bottomNav = document.querySelector('.bottom-nav');
    
    // Only initialize if elements exist
    if (!mobileMenuToggle || !sidebar) return;
    
    // Create overlay for mobile menu
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    // Toggle mobile menu
    function toggleMobileMenu() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('show');
        document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
    }
    
    // Close mobile menu
    function closeMobileMenu() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    // Event listeners
    mobileMenuToggle.addEventListener('click', toggleMobileMenu);
    overlay.addEventListener('click', closeMobileMenu);
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            closeMobileMenu();
        }
    });
    
    // Show/hide mobile menu toggle and bottom nav based on screen size
    function checkScreenSize() {
        if (window.innerWidth <= 768) {
            // Mobile: Show bottom nav, hide sidebar toggle
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'block';
            closeMobileMenu();
        } else if (window.innerWidth <= 1024) {
            // Tablet: Show sidebar toggle, hide bottom nav
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'block';
            if (bottomNav) bottomNav.style.display = 'none';
        } else {
            // Desktop: Hide both, show sidebar
            if (mobileMenuToggle) mobileMenuToggle.style.display = 'none';
            if (bottomNav) bottomNav.style.display = 'none';
            closeMobileMenu();
        }
    }
    
    // Initial check
    checkScreenSize();
    
    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);
    
    // Close menu when clicking on sidebar links
    const sidebarLinks = sidebar.querySelectorAll('.sidebar-menu a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                closeMobileMenu();
            }
        });
    });
    
    // Initialize bottom navigation
    initializeBottomNav();
}

// Bottom Navigation Utility
export function initializeBottomNav() {
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    // Add click animations
    bottomNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Add ripple effect
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple 0.6s linear;
                pointer-events: none;
            `;
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
    
    // Add ripple animation CSS
    if (!document.getElementById('ripple-styles')) {
        const style = document.createElement('style');
        style.id = 'ripple-styles';
        style.textContent = `
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Toast notification utility
export function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <i class="fas fa-${getToastIcon(type)}" style="color: var(--${type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'}-color);"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Loading state utility
export function showLoading(element) {
    if (element) {
        element.classList.add('loading');
        element.disabled = true;
    }
}

export function hideLoading(element) {
    if (element) {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

// Form validation utility
export function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.style.borderColor = 'var(--error-color)';
            isValid = false;
        } else {
            input.style.borderColor = 'var(--gray-200)';
        }
    });
    
    return isValid;
}

// Debounce utility for search inputs
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
