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
        
        // If manual zoom is set, use it instead of auto-fit
        if (window.state.manualZoom !== null) {
            scale = window.state.manualZoom;
        }
        
        // Clamp scale to reasonable bounds
        scale = Math.max(0.1, Math.min(scale, 3));

        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.width = `${targetW}px`;
        wrapper.style.height = `${targetH}px`;
    }
}

// ── Zoom Functions ─────────────────────────────────────────────────────────────
function zoomIn() {
    if (!window.state || !window.CONSTANTS) return;
    const container = document.getElementById('preview-container');
    const wrapper = document.getElementById('scale-wrapper');
    if (!container || !wrapper) return;
    
    const targetW = window.state.mode === 'post' ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.HIGHLIGHT_SIZE;
    const targetH = window.state.mode === 'post' ? window.CONSTANTS.POST_HEIGHT : window.CONSTANTS.HIGHLIGHT_SIZE;
    const isMobile = window.innerWidth <= 768;
    const pad = isMobile ? 28 : 40;
    
    // Get current scale
    let currentScale = window.state.manualZoom;
    if (currentScale === null) {
        // Calculate auto-fit scale
        currentScale = Math.min((container.offsetWidth - pad) / targetW, (container.offsetHeight - pad) / targetH);
        if (isMobile && window.state.mode === 'highlight') {
            currentScale *= 0.82;
        }
    }
    
    // Increase by 0.15 (smooth increments)
    const newScale = Math.min(currentScale + 0.15, 3.0);
    window.state.manualZoom = newScale;
    
    // Apply with smooth transition
    wrapper.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    wrapper.style.transform = `scale(${newScale})`;
    
    // Update button states
    updateZoomButtons();
}

function zoomOut() {
    if (!window.state || !window.CONSTANTS) return;
    const container = document.getElementById('preview-container');
    const wrapper = document.getElementById('scale-wrapper');
    if (!container || !wrapper) return;
    
    const targetW = window.state.mode === 'post' ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.HIGHLIGHT_SIZE;
    const targetH = window.state.mode === 'post' ? window.CONSTANTS.POST_HEIGHT : window.CONSTANTS.HIGHLIGHT_SIZE;
    const isMobile = window.innerWidth <= 768;
    const pad = isMobile ? 28 : 40;
    
    // Get current scale
    let currentScale = window.state.manualZoom;
    if (currentScale === null) {
        // Calculate auto-fit scale
        currentScale = Math.min((container.offsetWidth - pad) / targetW, (container.offsetHeight - pad) / targetH);
        if (isMobile && window.state.mode === 'highlight') {
            currentScale *= 0.82;
        }
    }
    
    // Decrease by 0.15 (smooth increments)
    const newScale = Math.max(currentScale - 0.15, 0.1);
    window.state.manualZoom = newScale;
    
    // Apply with smooth transition
    wrapper.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
    wrapper.style.transform = `scale(${newScale})`;
    
    // Update button states
    updateZoomButtons();
}

function resetZoom() {
    if (!window.state) return;
    const wrapper = document.getElementById('scale-wrapper');
    if (!wrapper) return;
    
    // Reset to auto-fit
    window.state.manualZoom = null;
    
    // Apply with smooth transition
    wrapper.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    // Trigger resize to recalculate auto-fit
    handleResize();
    
    // Update button states
    updateZoomButtons();
}

function updateZoomButtons() {
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    
    if (!zoomInBtn || !zoomOutBtn || !zoomResetBtn) return;
    
    const hasManualZoom = window.state.manualZoom !== null;
    const currentScale = window.state.manualZoom !== null ? window.state.manualZoom : 
        (() => {
            const container = document.getElementById('preview-container');
            if (!container || !window.CONSTANTS) return 1;
            const isMobile = window.innerWidth <= 768;
            const targetW = window.state.mode === 'post' ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.HIGHLIGHT_SIZE;
            const targetH = window.state.mode === 'post' ? window.CONSTANTS.POST_HEIGHT : window.CONSTANTS.HIGHLIGHT_SIZE;
            const pad = isMobile ? 28 : 40;
            let scale = Math.min((container.offsetWidth - pad) / targetW, (container.offsetHeight - pad) / targetH);
            if (isMobile && window.state.mode === 'highlight') scale *= 0.82;
            return scale;
        })();
    
    // Enable/disable buttons based on zoom limits
    zoomInBtn.disabled = currentScale >= 3.0;
    zoomOutBtn.disabled = currentScale <= 0.1;
    
    // Highlight reset button if manual zoom is active (no pink, just opacity change)
    if (hasManualZoom) {
        zoomResetBtn.classList.add('active');
    } else {
        zoomResetBtn.classList.remove('active');
    }
    
    // Ensure icon colors are maintained
    const zoomButtons = document.querySelectorAll('.zoom-btn [data-lucide] svg');
    zoomButtons.forEach(svg => {
        svg.style.stroke = '#ec7258';
        svg.style.color = '#ec7258';
    });
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
        window.addEventListener('resize', window.debounceResize(() => {
            handleResize();
            // Only update zoom buttons if not in manual zoom mode
            if (window.state.manualZoom === null) {
                updateZoomButtons();
            }
        }));
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
    
    // Initialize zoom controls
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomResetBtn = document.getElementById('zoom-reset-btn');
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', zoomIn);
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', zoomOut);
    }
    if (zoomResetBtn) {
        zoomResetBtn.addEventListener('click', resetZoom);
    }
    
    // Initialize zoom button icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        setTimeout(() => {
            lucide.createIcons();
            // Set icon colors to #ec7258
            const zoomButtons = document.querySelectorAll('.zoom-btn [data-lucide] svg');
            zoomButtons.forEach(svg => {
                svg.style.stroke = '#ec7258';
                svg.style.color = '#ec7258';
            });
            updateZoomButtons();
        }, 100);
    }
    
    // Check welcome popup
    if (window.checkWelcomePopup) {
        window.checkWelcomePopup();
    }
    
    // Initial resize to set canvas scale correctly
    setTimeout(() => {
        handleResize();
        updateZoomButtons();
    }, 100);
});

// Make globally available
if (typeof window !== 'undefined') {
    window.loadPresets = loadPresets;
    window.initializeIcons = initializeIcons;
    window.handleResize = handleResize;
    window.updateMobileToggleLabel = updateMobileToggleLabel;
    window.zoomIn = zoomIn;
    window.zoomOut = zoomOut;
    window.resetZoom = resetZoom;
    window.updateZoomButtons = updateZoomButtons;
}
