/**
 * Initialization Code
 * Sets up the application on page load
 */

function loadPresets() {
    if (!window.PRESETS_KEY || !window.state) return;
    const saved = localStorage.getItem(window.PRESETS_KEY);
    if (saved) {
        try { 
            const parsed = JSON.parse(saved);
            // Ensure it's an array
            if (!Array.isArray(parsed)) {
                console.warn('Presets data is not an array, resetting...');
                window.state.presets = [];
                localStorage.setItem(window.PRESETS_KEY, JSON.stringify([]));
                return;
            }
            
            // Filter out invalid presets.
            // Accept both old format (top-level style) and new full-state format (post.style).
            const validPresets = parsed.filter(p => {
                if (!p || typeof p !== 'object') return false;
                if (typeof p.id === 'undefined' || p.id === null) return false;
                if (typeof p.name !== 'string' || !p.name.trim()) return false;
                const hasTopStyle  = p.style && typeof p.style === 'object';
                const hasPostStyle = p.post  && p.post.style && typeof p.post.style === 'object';
                return hasTopStyle || hasPostStyle;
            });
            
            // If we filtered out invalid presets, save the cleaned version
            if (validPresets.length !== parsed.length) {
                console.warn(`Filtered out ${parsed.length - validPresets.length} invalid preset(s) from storage`);
                window.state.presets = validPresets;
                localStorage.setItem(window.PRESETS_KEY, JSON.stringify(validPresets));
            } else {
                window.state.presets = validPresets;
            }
        } catch (e) { 
            console.error('Failed to load presets:', e);
            window.state.presets = [];
            // Clear corrupted data
            try {
                localStorage.removeItem(window.PRESETS_KEY);
            } catch (clearError) {
                console.error('Failed to clear corrupted presets:', clearError);
            }
        }
    } else {
        // Ensure presets is always an array
        window.state.presets = [];
    }
}

// --- ICON INITIALIZATION HELPER ---
function initializeIcons(container = null) {
    if (typeof lucide === 'undefined' || !lucide.createIcons) {
        console.warn('Lucide library not available');
        return;
    }
    
    try {
        // Initialize icons in the container if provided
        if (container) {
            lucide.createIcons(container);
        }
        // Also do global initialization
        lucide.createIcons();
    } catch (e) {
        console.warn('Error initializing icons:', e);
    }
}

function handleResize() {
    if (!window.state || !window.CONSTANTS) return;
    const container = document.getElementById('preview-container');
    const wrapper = document.getElementById('scale-wrapper');
    if (container && wrapper) {
        const isMobile = window.innerWidth <= 768;
        const targetW = window.state.mode === 'post' ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.HIGHLIGHT_SIZE;
        const targetH = window.state.mode === 'post' ? window.CONSTANTS.POST_HEIGHT : window.CONSTANTS.HIGHLIGHT_SIZE;
        
        // Mobile: use tighter padding to give more room for the canvas
        const pad = isMobile ? 28 : 40;
        let scale = Math.min((container.offsetWidth - pad) / targetW, (container.offsetHeight - pad) / targetH);
        
        // On mobile, reduce Highlight Creator scale slightly (it's square, post is portrait)
        if (isMobile && window.state.mode === 'highlight') {
            scale *= 0.82;
        }
        
        // Clamp scale to reasonable bounds
        scale = Math.max(0.05, Math.min(scale, 4));

        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.width = `${targetW}px`;
        wrapper.style.height = `${targetH}px`;
    }
}

// ── Mobile: Update toggle button label to show current tab ─────────────────
function updateMobileToggleLabel() {
    if (window.innerWidth > 768) return;
    const tabEl = document.querySelector('#tabs-container button[aria-selected="true"]');
    const textEl = document.getElementById('mobile-toggle-text');
    if (textEl && tabEl) {
        // Get text content, strip icon characters
        const text = tabEl.textContent.trim().replace(/[\u{1F300}-\u{1FFFF}]/gu, '').trim();
        textEl.textContent = text || 'Edit';
    }
}
window.updateMobileToggleLabel = updateMobileToggleLabel;

// Initial Loader Logic
window.addEventListener('load', function() {
    // Initial Loader Logic
    setTimeout(function() {
        var loader = document.getElementById('initial-loader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.visibility = 'hidden';
            setTimeout(function() {
                loader.remove();
                
                // Check for welcome popup after loader is gone
                if (window.checkWelcomePopup) {
                    window.checkWelcomePopup();
                }
            }, 500); // Wait for transition to finish
        } else {
            if (window.checkWelcomePopup) {
                window.checkWelcomePopup();
            }
        }
    }, 3000); // Show for 3 seconds
});

// ── Mobile: Swipe-down gesture on the panel to dismiss it ──────────────────
function initMobileSwipeGesture() {
    if (window.innerWidth > 768) return;

    const sidebar = document.querySelector('#sidebar');
    if (!sidebar) return;

    let touchStartY = 0;
    let touchStartTime = 0;
    let isDragging = false;

    sidebar.addEventListener('touchstart', e => {
        // Only initiate drag if touching near the top of the panel (drag handle area)
        const touch = e.touches[0];
        const panelTop = sidebar.getBoundingClientRect().top;
        const touchY = touch.clientY;

        if (touchY - panelTop < 60) { // within 60px of panel top
            touchStartY = touchY;
            touchStartTime = Date.now();
            isDragging = true;
        }
    }, { passive: true });

    sidebar.addEventListener('touchmove', e => {
        if (!isDragging) return;
        const deltaY = e.touches[0].clientY - touchStartY;
        // Visual drag feedback (light displacement)
        if (deltaY > 0 && deltaY < 120) {
            sidebar.style.transform = `translateY(${deltaY * 0.4}px)`;
        }
    }, { passive: true });

    sidebar.addEventListener('touchend', e => {
        if (!isDragging) return;
        isDragging = false;

        const deltaY = e.changedTouches[0].clientY - touchStartY;
        const elapsed = Date.now() - touchStartTime;
        const velocity = deltaY / elapsed; // px/ms

        sidebar.style.transform = '';
        sidebar.style.transition = '';

        // Dismiss on fast swipe down or large drag
        if (velocity > 0.5 || deltaY > 80) {
            window.toggleMobileSidebar();
        }
    }, { passive: true });
}

// --- INIT ---
window.addEventListener('DOMContentLoaded', () => {
    loadPresets();
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    if (window.renderApp) {
        window.renderApp();
    }
    if (window.debounceResize) {
        window.addEventListener('resize', window.debounceResize(handleResize));
    }
    
    // Collapsible Sidebar Functionality
    var menu_btn = document.querySelector("#menu-btn");
    var sidebar = document.querySelector("#sidebar");
    var container = document.querySelector(".my-container");
    
    if (sidebar && container) {
        // On mobile, start with sidebar hidden
        if (window.innerWidth <= 768) {
            sidebar.classList.remove("active-nav");
            container.classList.remove("active-cont");
        }
        
        // Desktop menu button handler
        if (menu_btn) {
            menu_btn.addEventListener("click", () => {
                sidebar.classList.toggle("active-nav");
                container.classList.toggle("active-cont");
                
                // On mobile, prevent body scroll when sidebar is open
                if (window.innerWidth <= 768) {
                    if (sidebar.classList.contains("active-nav")) {
                        document.body.classList.add("sidebar-open");
                    } else {
                        document.body.classList.remove("sidebar-open");
                    }
                }
            });
        }
        
        // Handle window resize
        window.addEventListener("resize", () => {
            if (window.innerWidth <= 768) {
                // On mobile, ensure sidebar can be toggled
                if (!sidebar.classList.contains("active-nav")) {
                    container.classList.remove("active-cont");
                }
            } else {
                // On desktop, restore normal behavior
                document.body.classList.remove("sidebar-open");
            }
        });
    }
    
    // Mobile swipe-down to dismiss panel
    initMobileSwipeGesture();
    
    // Check welcome popup
    if (window.checkWelcomePopup) {
        window.checkWelcomePopup();
    }
    
    // Initial resize to set canvas scale correctly
    setTimeout(handleResize, 100);
});

// Make globally available
if (typeof window !== 'undefined') {
    window.loadPresets = loadPresets;
    window.initializeIcons = initializeIcons;
    window.handleResize = handleResize;
    window.updateMobileToggleLabel = updateMobileToggleLabel;
}
