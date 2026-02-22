/**
 * Event Handlers and State Update Functions
 * Handles user interactions and state modifications
 */

// Note: These functions depend on state, CONSTANTS, and other functions
// They will be available globally for inline event handlers

// --- EVENTS & ACTIONS ---
function updatePostStyle(key, value) {
    if (!window.state) return;
    window.state.post.style[key] = value;
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

function updateT2State(key, value) {
    if (!window.state) return;
    window.state.post.t2[key] = value;
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

function updateT3State(key, value) {
    if (!window.state) return;
    window.state.post.t3[key] = value;
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

function updateT4State(key, value) {
    if (!window.state) return;
    window.state.post.t4[key] = value;
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

function updateT5State(key, value) {
    if (!window.state) return;
    window.state.post.t5[key] = value;
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

function updateT6State(key, value) {
    if (!window.state) return;
    window.state.post.t6[key] = value;
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

// Helper function to update style and display value in real-time
function updatePostStyleWithDisplay(key, value, displayId, format = 'number') {
    if (!window.state) return;
    window.state.post.style[key] = value;
    const displayEl = document.getElementById(displayId);
    if (displayEl) {
        if (format === 'percent') {
            displayEl.textContent = Math.round(value * 100) + '%';
        } else if (format === 'percent-value') {
            // For values that are already percentages (like zoom 100-250)
            displayEl.textContent = Math.round(value) + '%';
        } else if (format === 'px') {
            displayEl.textContent = Math.round(value) + 'px';
        } else if (format === 'number') {
            displayEl.textContent = value;
        } else {
            displayEl.textContent = value;
        }
    }
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

// Helper function to update highlight state and display value in real-time
function updateHighlightStateWithDisplay(key, value, displayId, format = 'number') {
    if (!window.state) return;
    window.state.highlight[key] = value;
    const displayEl = document.getElementById(displayId);
    if (displayEl) {
        if (format === 'percent') {
            displayEl.textContent = Math.round(value * 100) + '%';
        } else if (format === 'px') {
            displayEl.textContent = Math.round(value) + 'px';
        } else if (format === 'number') {
            displayEl.textContent = value;
        } else {
            displayEl.textContent = value;
        }
    }
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
    // Initialize icons in canvas after rendering
    setTimeout(() => {
        const canvasRoot = document.getElementById('canvas-root');
        if (canvasRoot && typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons(canvasRoot);
        }
    }, 50);
}

function setWatermarkPosition(x, y) {
    if (!window.state) return;
    window.state.post.style.watermarkPosX = x;
    window.state.post.style.watermarkPosY = y;
    if (window.renderSidebarContent) {
        window.renderSidebarContent(); // Re-render to update button states
    }
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
}

function updatePostBgUrl(val) {
    if (!window.state || !window.getHostname) return;
    if (val && val.trim()) { 
        window.state.post.bgImage = val.trim(); 
        window.state.post.sources.bg = window.getHostname(val); 
        if (window.debouncedRenderCanvas) {
            window.debouncedRenderCanvas();
        }
    }
}

// Extract most prominent bright color from an image
function extractProminentBrightColor(imageUrl, callback) {
    if (!window.state) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = Math.min(img.width, 200); // Sample at smaller size for performance
            canvas.height = Math.min(img.height, 200);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const colorCounts = {};
            
            // Sample pixels (every 4th pixel for performance)
            for (let i = 0; i < data.length; i += 16) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const brightness = (r + g + b) / 3;
                
                // Only consider bright colors (brightness > 100)
                if (brightness > 100) {
                    // Quantize colors to reduce noise
                    const qr = Math.floor(r / 16) * 16;
                    const qg = Math.floor(g / 16) * 16;
                    const qb = Math.floor(b / 16) * 16;
                    const colorKey = `${qr},${qg},${qb}`;
                    
                    if (!colorCounts[colorKey]) {
                        colorCounts[colorKey] = { count: 0, r, g, b, brightness };
                    }
                    colorCounts[colorKey].count += brightness; // Weight by brightness
                }
            }
            
            // Find the most prominent bright color
            let maxCount = 0;
            let prominentColor = null;
            for (const key in colorCounts) {
                if (colorCounts[key].count > maxCount) {
                    maxCount = colorCounts[key].count;
                    prominentColor = colorCounts[key];
                }
            }
            
            if (prominentColor) {
                const hex = '#' + [prominentColor.r, prominentColor.g, prominentColor.b]
                    .map(x => {
                        const hex = x.toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                    }).join('');
                callback(hex);
            } else {
                // Fallback to border color if no bright color found
                callback(window.state.post.style.overlayBorderColor || '#FF5500');
            }
        } catch (e) {
            console.error('Error extracting color:', e);
            callback(window.state.post.style.overlayBorderColor || '#FF5500');
        }
    };
    img.onerror = function() {
        callback(window.state.post.style.overlayBorderColor || '#FF5500');
    };
    img.src = imageUrl;
}

function toggleOverlayGlow(enabled) {
    updatePostStyle('showOverlayGlow', enabled);
    if (enabled && window.state && window.state.post.style.overlayImgUrl) {
        extractProminentBrightColor(window.state.post.style.overlayImgUrl, (color) => {
            window.state.post.style.overlayGlowColor = color;
            if (window.renderSidebarContent) {
                window.renderSidebarContent();
            }
            if (window.debouncedRenderCanvas) {
                window.debouncedRenderCanvas();
            }
        });
    } else {
        if (window.debouncedRenderCanvas) {
            window.debouncedRenderCanvas();
        }
    }
}

function updatePostOverlayUrl(val) {
    if (!window.state || !window.getHostname) return;
    if (val && val.trim()) { 
        window.state.post.style.overlayImgUrl = val.trim(); 
        window.state.post.sources.overlay = window.getHostname(val); 
        
        // Auto-detect prominent color for glow if glow is enabled
        if (window.state.post.style.showOverlayGlow) {
            extractProminentBrightColor(val.trim(), (color) => {
                window.state.post.style.overlayGlowColor = color;
                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            });
        }
        
        if (window.renderSidebarContent) {
            window.renderSidebarContent();
        }
        if (window.debouncedRenderCanvas) {
            window.debouncedRenderCanvas();
        }
    }
}

function updateHighlightBgUrl(val) {
    if (!window.state) return;
    if (val && val.trim()) { 
        window.state.highlight.bgImage = val.trim(); 
        if (window.debouncedRenderCanvas) {
            window.debouncedRenderCanvas();
        }
    }
}

function updateHighlightState(key, value) {
    if (!window.state) return;
    window.state.highlight[key] = value;
    if (window.renderSidebarContent) {
        window.renderSidebarContent();
    }
    if (window.debouncedRenderCanvas) {
        window.debouncedRenderCanvas();
    }
    // Ensure icons are initialized after state update
    setTimeout(() => {
        const container = document.getElementById('sidebar-content');
        if (container && window.initializeIcons) {
            window.initializeIcons(container);
        }
        // Also initialize globally to catch any missed icons
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }, 50);
}

function handleFileUpload(event, type) {
    if (!window.state || !window.showNotification) return;
    const file = event.target.files[0];
    if (!file) return;
    
    // Reset input
    event.target.value = '';
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        const res = ev.target.result;
        try {
            if (type === 'postBg') {
                window.state.post.bgImage = res;
                window.state.post.sources.bg = 'FILE';
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 'postOverlay') {
                window.state.post.style.overlayImgUrl = res;
                window.state.post.sources.overlay = 'FILE';
                
                // Auto-detect prominent color for glow if glow is enabled
                if (window.state.post.style.showOverlayGlow) {
                    extractProminentBrightColor(res, (color) => {
                        window.state.post.style.overlayGlowColor = color;
                        if (window.renderSidebarContent) {
                            window.renderSidebarContent();
                        }
                        if (window.debouncedRenderCanvas) {
                            window.debouncedRenderCanvas();
                        }
                    });
                }
                
                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 'postLogo') {
                window.state.post.style.logoUrl = res;
                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 'postWatermark') {
                window.state.post.style.watermarkUrl = res;
                window.state.post.style.showWatermark = true;
                window.state.post.sources.watermark = 'FILE';
                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't2Bg') {
                window.state.post.t2.bgImage = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't3Bg') {
                window.state.post.t3.bgImage = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't4Bg') {
                window.state.post.t4.bgImage = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't5Left') {
                window.state.post.t5.imageLeft = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't5Right') {
                window.state.post.t5.imageRight = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't6Bg') {
                window.state.post.t6.bgImage = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 't6Circle') {
                window.state.post.t6.circleImage = res;
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 'highlightIcon') {
                window.state.highlight.customIconUrl = res;
                window.state.highlight.iconType = 'custom';
                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 'highlightBg') {
                window.state.highlight.bgImage = res;
                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }
                if (window.debouncedRenderCanvas) {
                    window.debouncedRenderCanvas();
                }
            } else if (type === 'import') {
                let data;
                try {
                    if (typeof res !== 'string') {
                        throw new Error('File content is not a valid string');
                    }
                    data = JSON.parse(res);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    window.showNotification('Invalid JSON file — could not parse.', 'error');
                    return;
                }
                
                let presetsToImport = [];
                
                // Handle both old format (plain array) and new format (object with metadata)
                if (Array.isArray(data)) {
                    presetsToImport = data;
                } else if (data && typeof data === 'object' && Array.isArray(data.presets)) {
                    presetsToImport = data.presets;
                } else {
                    window.showNotification('Invalid preset file — expected an array or { presets: [...] }.', 'error');
                    return;
                }
                
                if (presetsToImport.length === 0) {
                    window.showNotification('No presets found in file.', 'error');
                    return;
                }
                
                // Validate presets — accept both old format (top-level style) and
                // new full-state format (post.style), as long as id and name are present.
                const validPresets = presetsToImport.filter(p => {
                    if (!p || typeof p !== 'object') return false;
                    if (typeof p.id === 'undefined' || p.id === null) return false;
                    if (typeof p.name !== 'string' || !p.name.trim()) return false;
                    const hasTopStyle  = p.style && typeof p.style === 'object';
                    const hasPostStyle = p.post  && p.post.style && typeof p.post.style === 'object';
                    return hasTopStyle || hasPostStyle;
                });
                
                if (validPresets.length === 0) {
                    window.showNotification('No valid presets found — each preset needs id, name, and style data.', 'error');
                    return;
                }
                
                // Ensure presets array exists
                if (!Array.isArray(window.state.presets)) {
                    window.state.presets = [];
                }
                
                // Merge — skip exact ID duplicates, update by name if IDs differ
                const existingIds   = new Set(window.state.presets.map(p => p && p.id).filter(id => id != null));
                const existingNames = new Map(window.state.presets.map(p => [p && p.name && p.name.toLowerCase(), p && p.id]));
                let skippedDupes = 0;
                let updatedByName = 0;
                const toAdd = [];

                for (const p of validPresets) {
                    if (existingIds.has(p.id)) {
                        // Exact ID match — skip (already have this exact preset version)
                        skippedDupes++;
                    } else if (existingNames.has(p.name.toLowerCase())) {
                        // Same name, different ID (e.g. saved on another device) — replace
                        const oldId = existingNames.get(p.name.toLowerCase());
                        window.state.presets = window.state.presets.filter(x => x.id !== oldId);
                        toAdd.push(p);
                        updatedByName++;
                    } else {
                        toAdd.push(p);
                    }
                }

                window.state.presets = [...window.state.presets, ...toAdd];

                // Persist — strip base64 to prevent localStorage overflow
                let storageOk = true;
                if (window.PRESETS_KEY) {
                    try {
                        localStorage.setItem(window.PRESETS_KEY, JSON.stringify(_presetsForStorage(window.state.presets)));
                    } catch (storageError) {
                        console.error('LocalStorage error during import:', storageError);
                        storageOk = false;
                    }
                }

                if (window.renderSidebarContent) {
                    window.renderSidebarContent();
                }

                const added = toAdd.length;
                let message = `Imported ${added} preset${added !== 1 ? 's' : ''}!`;
                if (skippedDupes > 0)  message += ` (${skippedDupes} duplicate${skippedDupes > 1 ? 's' : ''} skipped)`;
                if (updatedByName > 0) message += ` (${updatedByName} updated by name)`;
                if (!storageOk)        message += ' — storage full, export JSON to keep them!';
                window.showNotification(message, storageOk ? 'success' : 'error');
            }
        } catch (e) {
            console.error('File upload error:', e);
            window.showNotification('Failed to process file', 'error');
        }
    };
    
    reader.onerror = () => {
        window.showNotification('Failed to read file', 'error');
    };
    
    if (type === 'import') {
        reader.readAsText(file);
    } else {
        reader.readAsDataURL(file);
    }
}

/**
 * Returns a version of the presets array safe for localStorage.
 * Base64 data-URLs (data:...) are stripped to prevent exceeding the ~5 MB
 * storage limit. Full image data is kept in window.state.presets (in-memory)
 * and is always included when the user exports to a JSON file.
 */
function _presetsForStorage(presets) {
    function walk(v) {
        if (v === null || v === undefined) return v;
        if (typeof v === 'string') return v.startsWith('data:') ? '' : v;
        if (Array.isArray(v))      return v.map(walk);
        if (typeof v === 'object') {
            var out = {};
            for (var k in v) {
                if (Object.prototype.hasOwnProperty.call(v, k)) out[k] = walk(v[k]);
            }
            return out;
        }
        return v;
    }
    return walk(presets); // presets is an array → returns a stripped array
}

async function savePreset() {
    if (!window.state || !window.showNotification || !window.PRESETS_KEY) return;
    const input = document.getElementById('preset-name-input');
    if (!input) return;
    
    const name = input.value.trim();
    if (!name) {
        window.showNotification('Please enter a template name', 'error');
        input.focus();
        return;
    }
    
    // Check for duplicate names
    const duplicate = window.state.presets.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
        const confirmed = await window.showConfirmPopup(
            'Overwrite Template',
            `A preset named "${name}" already exists. Do you want to overwrite it?`,
            'Overwrite',
            'Cancel'
        );
        if (!confirmed) return;
        // Remove duplicate
        window.state.presets = window.state.presets.filter(p => p.id !== duplicate.id);
    }
    
    // Deep-clone the full state for a complete snapshot
    const postSnap = window.state.post;
    const hlSnap  = window.state.highlight;

    const preset = {
        id: Date.now(),
        name,
        createdAt: new Date().toISOString(),
        appVersion: '1.1',
        mode: window.state.mode,

        // Full post snapshot (new format)
        post: {
            template: postSnap.template,
            headline: postSnap.headline,
            caption:  postSnap.caption,
            bgImage:  postSnap.bgImage,
            sources:  JSON.parse(JSON.stringify(postSnap.sources  || {})),
            style:    JSON.parse(JSON.stringify(postSnap.style)),
            t2:       JSON.parse(JSON.stringify(postSnap.t2)),
            t3:       JSON.parse(JSON.stringify(postSnap.t3)),
            t4:       JSON.parse(JSON.stringify(postSnap.t4)),
            t5:       JSON.parse(JSON.stringify(postSnap.t5)),
            t6:       JSON.parse(JSON.stringify(postSnap.t6)),
        },

        // Full highlight snapshot
        highlight: JSON.parse(JSON.stringify(hlSnap)),

        // Keep top-level style for backward compat (init.js loadPresets validation)
        style: JSON.parse(JSON.stringify(postSnap.style)),
    };
    
    window.state.presets.push(preset);

    // Strip base64 data-URLs before writing to localStorage to avoid the ~5 MB limit.
    // Full image data remains in window.state.presets (in-memory) and in JSON exports.
    let storageOk = true;
    try {
        localStorage.setItem(window.PRESETS_KEY, JSON.stringify(_presetsForStorage(window.state.presets)));
    } catch (storageError) {
        console.error('LocalStorage error (possibly full):', storageError);
        storageOk = false;
    }

    input.value = '';
    if (window.renderSidebarContent) {
        window.renderSidebarContent();
    }

    if (storageOk) {
        window.showNotification(`"${name}" saved!`, 'success');
    } else {
        window.showNotification(`"${name}" saved this session — storage full, export JSON to keep it!`, 'error');
    }
}

async function loadPreset(id) {
    if (!window.state || !window.showNotification) return;
    const p = window.state.presets.find(x => x.id === id);
    if (!p) {
        window.showNotification('Preset not found', 'error');
        return;
    }

    // Accept new format (p.post.style) or legacy format (p.style only)
    const hasNewFormat = p.post && p.post.style && typeof p.post.style === 'object';
    const hasOldFormat = p.style && typeof p.style === 'object';
    if (!hasNewFormat && !hasOldFormat) {
        window.showNotification('Invalid preset — missing style data', 'error');
        return;
    }

    try {
        if (hasNewFormat) {
            // ── Full-state format (current) ───────────────────────────
            const sp = p.post;

            // template is always a non-empty string ('template1'/'template2'/'template3')
            if (sp.template) {
                window.state.post.template = sp.template;
            }
            // headline / caption can legitimately be '' — use undefined check only
            if (sp.headline !== undefined && sp.headline !== null) {
                window.state.post.headline = sp.headline;
            }
            if (sp.caption !== undefined && sp.caption !== null) {
                window.state.post.caption = sp.caption;
            }
            // bgImage can be '' (user cleared it) — MUST use undefined check, not truthy
            if (sp.bgImage !== undefined) {
                window.state.post.bgImage = sp.bgImage;
            }
            if (sp.sources && typeof sp.sources === 'object') {
                // Full replace of sources (merge would silently keep stale source labels)
                window.state.post.sources = { ...window.state.post.sources, ...sp.sources };
            }
            // style / t2 / t3: overlay preset values on top of current defaults so that
            // fields added AFTER the preset was saved still get sensible default values.
            if (sp.style && typeof sp.style === 'object') {
                window.state.post.style = { ...window.state.post.style, ...sp.style };
            }
            if (sp.t2 && typeof sp.t2 === 'object') {
                window.state.post.t2 = { ...window.state.post.t2, ...sp.t2 };
            }
            if (sp.t3 && typeof sp.t3 === 'object') {
                window.state.post.t3 = { ...window.state.post.t3, ...sp.t3 };
            }
            if (sp.t4 && typeof sp.t4 === 'object') {
                window.state.post.t4 = { ...window.state.post.t4, ...sp.t4 };
            }
            if (sp.t5 && typeof sp.t5 === 'object') {
                window.state.post.t5 = { ...window.state.post.t5, ...sp.t5 };
            }
            if (sp.t6 && typeof sp.t6 === 'object') {
                window.state.post.t6 = { ...window.state.post.t6, ...sp.t6 };
            }
        } else {
            // ── Legacy format: top-level style only ───────────────────
            window.state.post.style = { ...window.state.post.style, ...p.style };
        }

        // Restore highlight state
        if (p.highlight && typeof p.highlight === 'object') {
            window.state.highlight = { ...window.state.highlight, ...p.highlight };
        }

        // Silently switch mode if the preset was saved in a different one.
        // No confirmation popup — the user clicked "Load", they want the preset applied.
        if (p.mode && p.mode !== window.state.mode && window.setMode) {
            window.setMode(p.mode);
        }

        if (window.renderCanvas)        window.renderCanvas();
        if (window.renderSidebarContent) window.renderSidebarContent();
        if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();

        window.showNotification(`"${p.name}" loaded!`, 'success');
    } catch (e) {
        console.error('Load preset error:', e);
        window.showNotification('Failed to load preset: ' + e.message, 'error');
    }
}

async function deletePreset(id) {
    if (!window.state || !window.PRESETS_KEY) return;
    const confirmed = await window.showConfirmPopup(
        'Delete Template',
        'Are you sure you want to delete this template? This action cannot be undone.',
        'Delete',
        'Cancel'
    );
    if (!confirmed) return;
    
    window.state.presets = window.state.presets.filter(x => x.id !== id);
    try {
        localStorage.setItem(window.PRESETS_KEY, JSON.stringify(_presetsForStorage(window.state.presets)));
    } catch (e) { /* deleted in memory regardless */ }
    if (window.renderSidebarContent) {
        window.renderSidebarContent();
    }
    if (window.showNotification) {
        window.showNotification('Template deleted', 'success');
    }
}

function focusSaveSection() {
    if (!window.state) return;
    // Ensure sidebar is open
    const sidebar = document.querySelector("#sidebar");
    const container = document.querySelector(".my-container");
    if (sidebar && container) {
        sidebar.classList.add("active-nav");
        container.classList.add("active-cont");
    }
    
    // Switch to templates tab if not already there
    if (window.state.activeTab !== 'templates') {
        window.state.activeTab = 'templates';
        if (window.renderSidebarContent) {
            window.renderSidebarContent();
        }
    }
    
    // Wait for render, then highlight the preset name input
    setTimeout(() => {
        const presetInput = document.getElementById('preset-name-input');
        if (presetInput && window.focusSidebarControl) {
            window.focusSidebarControl('preset-name-input');
        }
    }, 100);
}

// Mobile Toggle Sidebar Function
function toggleMobileSidebar() {
    var sidebar = document.querySelector("#sidebar");
    var container = document.querySelector(".my-container");
    
    if (sidebar && container) {
        sidebar.classList.toggle("active-nav");
        container.classList.toggle("active-cont");
        
        // Prevent body scroll when sidebar is open
        if (sidebar.classList.contains("active-nav")) {
            document.body.classList.add("sidebar-open");
            // Update toggle label to show the active tab name
            setTimeout(function() {
                if (window.updateMobileToggleLabel) window.updateMobileToggleLabel();
            }, 60);
        } else {
            document.body.classList.remove("sidebar-open");
        }
        
        // Recalculate canvas scale after panel animation finishes
        setTimeout(function() {
            if (window.handleResize) window.handleResize();
        }, 460);
    }
}

function checkWelcomePopup() {
    if (!localStorage.getItem('hasSeenWelcome')) {
        var popup = document.getElementById('welcome-popup-overlay');
        if (popup) {
            popup.classList.add('show');
        }
    }
}

function closeWelcomePopup() {
    var popup = document.getElementById('welcome-popup-overlay');
    if (popup) {
        popup.classList.remove('show');
        setTimeout(function() {
            popup.remove();
        }, 500);
    }
    localStorage.setItem('hasSeenWelcome', 'true');
}

// Make globally available
if (typeof window !== 'undefined') {
    window._presetsForStorage = _presetsForStorage;
    window.updatePostStyle = updatePostStyle;
    window.updateT2State = updateT2State;
    window.updateT3State = updateT3State;
    window.updateT4State = updateT4State;
    window.updateT5State = updateT5State;
    window.updateT6State = updateT6State;
    window.updatePostStyleWithDisplay = updatePostStyleWithDisplay;
    window.updateHighlightStateWithDisplay = updateHighlightStateWithDisplay;
    window.setWatermarkPosition = setWatermarkPosition;
    window.updatePostBgUrl = updatePostBgUrl;
    window.extractProminentBrightColor = extractProminentBrightColor;
    window.toggleOverlayGlow = toggleOverlayGlow;
    window.updatePostOverlayUrl = updatePostOverlayUrl;
    window.updateHighlightState = updateHighlightState;
    window.updateHighlightBgUrl = updateHighlightBgUrl;
    window.handleFileUpload = handleFileUpload;
    window.savePreset = savePreset;
    window.loadPreset = loadPreset;
    window.deletePreset = deletePreset;
    window.focusSaveSection = focusSaveSection;
    window.toggleMobileSidebar = toggleMobileSidebar;
    window.checkWelcomePopup = checkWelcomePopup;
    window.closeWelcomePopup = closeWelcomePopup;
}
