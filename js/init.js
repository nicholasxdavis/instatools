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
        const targetW = window.state.mode === 'post' ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.HIGHLIGHT_SIZE;
        const targetH = window.state.mode === 'post' ? window.CONSTANTS.POST_HEIGHT : window.CONSTANTS.HIGHLIGHT_SIZE;
        let scale = Math.min((container.offsetWidth - 40) / targetW, (container.offsetHeight - 40) / targetH);
        
        // On mobile, reduce Highlight Creator scale by 20%
        if (window.innerWidth <= 768 && window.state.mode === 'highlight') {
            scale *= 0.8;
        }

        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.width = `${targetW}px`;
        wrapper.style.height = `${targetH}px`;
    }
}

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
    
    // Check welcome popup
    if (window.checkWelcomePopup) {
        window.checkWelcomePopup();
    }
});

// Make globally available
if (typeof window !== 'undefined') {
    window.loadPresets = loadPresets;
    window.initializeIcons = initializeIcons;
    window.handleResize = handleResize;
}
