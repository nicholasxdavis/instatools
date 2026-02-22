window.focusSidebarControl = function(id) {
            const el = document.getElementById(id);
            if (el) {
                // Ensure sidebar is open (both mobile and desktop)
                const sidebar = document.querySelector("#sidebar");
                const container = document.querySelector(".my-container");
                let wasClosed = false;
                
                if (sidebar && container) {
                    // Check if sidebar is currently closed
                    wasClosed = !sidebar.classList.contains("active-nav");
                    
                    if (wasClosed) {
                        // Open the sidebar
                        sidebar.classList.add("active-nav");
                        container.classList.add("active-cont");
                        
                        // On mobile, also prevent body scroll
                        if (window.innerWidth <= 768) {
                            document.body.classList.add("sidebar-open");
                        }
                    }
                }
                
                // Wait a bit for sidebar animation if it was just opened, then scroll to element
                setTimeout(() => {
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Add highlight pulse
                        el.classList.add('highlight-pulse');
                        
                        // Special handling for checkboxes/small inputs to highlight container
                        if (el.type === 'checkbox') {
                            const parent = el.closest('div');
                            if (parent) parent.classList.add('highlight-pulse');
                            setTimeout(() => {
                                if (parent) parent.classList.remove('highlight-pulse');
                            }, 2000);
                        }

                        setTimeout(() => {
                            el.classList.remove('highlight-pulse');
                        }, 2000);
                    }
                }, wasClosed ? 350 : 0);
            }
        };




// â”€â”€ HIGHLIGHT MODE MOBILE CLICK HANDLER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// On mobile, single-click on highlight elements should focus the corresponding sidebar control
(function initHighlightMobileClick() {
    // Mapping from data-ctx to sidebar control IDs
    const highlightControlMap = {
'highlight-ring': 'highlight-ring-thickness-slider', // Focus ring thickness slider
'highlight-icon': 'highlight-icon-size-slider'     // Focus icon size slider
    };

    document.addEventListener('click', e => {
// Only for highlight mode on mobile
if (window.state.mode !== 'highlight' || window.innerWidth > 768) return;

// Don't trigger if clicking inside sidebar
const sidebar = document.querySelector("#sidebar");
if (sidebar && sidebar.contains(e.target)) return;

// Check if a highlight ctx-enabled element was clicked
const target = e.target.closest('[data-ctx]');
if (target) {
    const ctxType = target.getAttribute('data-ctx');
    const controlId = highlightControlMap[ctxType];
    
    if (controlId) {
// Prevent default behavior and stop propagation
e.preventDefault();
e.stopPropagation();

// Focus the corresponding sidebar control
window.focusSidebarControl(controlId);
    }
}
    }, true); // true = capture phase
})();

// Create debounced render canvas function (if not already created)
if (!window.debouncedRenderCanvas && window.debounceRender) {
    window.debouncedRenderCanvas = window.debounceRender(() => {
        if (window.renderCanvas) {
            window.renderCanvas();
        }
        setTimeout(() => {
            const canvasRoot = document.getElementById('canvas-root');
            if (canvasRoot && typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons(canvasRoot);
            }
        }, 10);
    }, 100);
}
// Initialize contextual toolbar after all functions are exported
// This IIFE will run immediately but setMode override will work correctly
(function initCtxToolbar() {
    const toolbar = document.getElementById('ctx-toolbar');
    let currentCtx = null;
    let currentAnchorEl = null;

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  TOOLBAR BUILDER DISPATCHER
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function buildToolbar(ctxType, anchorEl) {

toolbar.innerHTML = '';
currentCtx = ctxType;
currentAnchorEl = anchorEl;

const builders = {
    'background':        buildBackgroundToolbar,
    'background-left':   buildBackgroundLeftToolbar,
    'background-right':  buildBackgroundRightToolbar,
    'circle-overlay':    buildCircleOverlayToolbar,
    'watermark':         buildWatermarkToolbar,
    'logo':              buildLogoToolbar,
    'headline':          buildHeadlineToolbar,
    'caption':           buildCaptionToolbar,
    'badge':             buildBadgeToolbar,
    'swipe-left':        buildSwipeLeftToolbar,
    'swipe':             buildT4SwipeToolbar,
    'source':            buildSourceToolbar,
    'highlight-ring':    buildHighlightRingToolbar,
    'highlight-icon':    buildHighlightIconToolbar,
    'brand':             buildBrandToolbar,
    'circle-inset':      buildCircleInsetToolbar,
};

if (!builders[ctxType]) return;
builders[ctxType]();

// Hide if empty (e.g. caption only has inline edit)
if (toolbar.children.length === 0) {
    toolbar.classList.remove('visible');
    return;
}

positionToolbar(anchorEl);
toolbar.classList.add('visible');
    }

    // ────────────────────────────────────────────────────────────────────
    //  POSITIONING
    // ────────────────────────────────────────────────────────────────────
    function positionToolbar(anchorEl) {

        // ── Mobile: CSS handles bottom-bar positioning ───────────────────
        // Clear any stale inline styles from a previous desktop session and
        // let the CSS @media rules take over. Visibility is made explicit so
        // the element isn't hidden while the .visible class is being added.
        if (window.innerWidth <= 768) {
            toolbar.style.top        = '';
            toolbar.style.left       = '';
            toolbar.style.right      = '';
            toolbar.style.width      = '';
            toolbar.style.bottom     = '';
            toolbar.style.maxWidth   = '';
            toolbar.style.visibility = 'visible';
            return;
        }

        // ── Desktop: float near the anchor element ───────────────────────
const anchorRect = anchorEl.getBoundingClientRect();
const GAP = 10;
const SCREEN_PAD = 12;

// Toolbar is position:fixed at body level – use raw viewport coords
const anchorCenterX = anchorRect.left + anchorRect.width / 2;

// Temporarily make invisible (not display:none – we need it laid out to measure)
toolbar.style.visibility = 'hidden';
toolbar.classList.add('visible'); // adds display:flex via CSS

requestAnimationFrame(() => {
    const tbRect = toolbar.getBoundingClientRect();

    // ── Horizontal clamping ──────────────────────────────────────────
    const minX = SCREEN_PAD + tbRect.width / 2;
    const maxX = window.innerWidth - SCREEN_PAD - tbRect.width / 2;
    const clampedX = Math.max(minX, Math.min(maxX, anchorCenterX));

    // left = center point minus half-width (translateX(-50%) is still applied in CSS)
    // Actually we set left directly and remove the CSS transform for fixed elements
    const finalLeft = clampedX - tbRect.width / 2;

    // ── Vertical: prefer above, flip below if needed ─────────────────
    let finalTop = anchorRect.top - tbRect.height - GAP;
    if (finalTop < SCREEN_PAD) {
        finalTop = anchorRect.bottom + GAP;
    }
    // Keep bottom edge on screen too
    const maxTop = window.innerHeight - tbRect.height - SCREEN_PAD;
    finalTop = Math.min(finalTop, maxTop);

    toolbar.style.left       = finalLeft + 'px';
    toolbar.style.top        = finalTop  + 'px';
    toolbar.style.visibility = 'visible';
});
    }

    function reanchor() {
if (!currentCtx || !currentAnchorEl) return;
setTimeout(() => {
    const el = document.querySelector(`[data-ctx="${currentCtx}"]`);
    if (el && toolbar.classList.contains('visible')) {
currentAnchorEl = el;
positionToolbar(el);
    }
}, 130);
    }

    function hideToolbar() {
toolbar.classList.remove('visible');
// Clear inline styles set by positionToolbar so CSS display:none takes effect
toolbar.style.display = '';
toolbar.style.visibility = '';
currentCtx = null;
currentAnchorEl = null;
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  INLINE EDITING HELPER
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function activateInlineEdit(el, initialValue, onUpdateState) {
if (el.isContentEditable) return;

// Find the actual text element (could be the element itself or a child)
let textEl = el;
// Check if there's a child element that contains the text (like <p> or <h1>)
const childTextEl = el.querySelector('p, h1, h2, h3, h4, h5, h6, span');
if (childTextEl) {
    textEl = childTextEl;
}

// Get computed styles from the text element to preserve them
const computedStyle = window.getComputedStyle(textEl);
const fontSize = computedStyle.fontSize;
const fontFamily = computedStyle.fontFamily;
const fontWeight = computedStyle.fontWeight;
const color = computedStyle.color;
const lineHeight = computedStyle.lineHeight;
const letterSpacing = computedStyle.letterSpacing;
const textTransform = computedStyle.textTransform;
const textAlign = computedStyle.textAlign;

// Store original style to restore later
const originalStyle = el.getAttribute('style') || '';

// Apply preserved styles as inline styles using setProperty to properly merge
el.style.setProperty('font-size', fontSize, 'important');
el.style.setProperty('font-family', fontFamily, 'important');
el.style.setProperty('font-weight', fontWeight, 'important');
el.style.setProperty('color', color, 'important');
el.style.setProperty('line-height', lineHeight, 'important');
el.style.setProperty('letter-spacing', letterSpacing, 'important');
if (textTransform !== 'none') {
    el.style.setProperty('text-transform', textTransform, 'important');
}
if (textAlign !== 'start' && textAlign !== 'left') {
    el.style.setProperty('text-align', textAlign, 'important');
}

el.contentEditable = true;
el.classList.add('ctx-editing');

// Show raw text for editing (removes HTML formatting like spans)
el.innerText = initialValue;
el.focus();

// Select all text to avoid cursor mismatch with raw vs html
const range = document.createRange();
range.selectNodeContents(el);
const sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);

const onInput = (e) => {
    e.stopPropagation();
    onUpdateState(el.innerText);
};

const onBlur = () => {
    el.contentEditable = false;
    el.classList.remove('ctx-editing');
    // Restore original style
    if (originalStyle) {
el.setAttribute('style', originalStyle);
    } else {
el.removeAttribute('style');
    }
    // Cleanup
    el.removeEventListener('input', onInput);
    el.removeEventListener('blur', onBlur);
    el.removeEventListener('keydown', onKeydown);
    el.removeEventListener('click', onClick);
    // Re-render to restore formatting
    window.renderCanvas(); 
};

const onKeydown = (e) => {
    e.stopPropagation();
    // Optional: Blur on Enter for single-line? 
    // Let's allow multiline for now as users might want it.
};

const onClick = (e) => {
    e.stopPropagation();
};

el.addEventListener('input', onInput);
el.addEventListener('blur', onBlur);
el.addEventListener('keydown', onKeydown); // prevent app hotkeys
el.addEventListener('click', onClick); // prevent re-triggering toolbar build
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  PRIMITIVE HELPERS
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    function addLabel(text) {
if (!text) return;
const el = document.createElement('span');
el.className = 'ctx-label';
el.textContent = text;
toolbar.appendChild(el);
    }
    function addSep() {
const el = document.createElement('div');
el.className = 'ctx-sep';
toolbar.appendChild(el);
    }
    function addBtn(html, onClick, active = false) {
const btn = document.createElement('button');
btn.className = 'ctx-btn' + (active ? ' active' : '');
btn.innerHTML = html;
btn.onclick = e => { e.stopPropagation(); onClick(); };
toolbar.appendChild(btn);
return btn;
    }

    // Single Color Picker Button (Cleaner, less overwhelming)
    function addColorPicker(currentColor, onChange) {
const wrap = document.createElement('div');
wrap.className = 'ctx-color-wrap';

const btn = document.createElement('button');
btn.className = 'ctx-btn';
btn.title = 'Change Color';
// Show a small preview dot and text
btn.innerHTML = `<span style="width:10px;height:10px;border-radius:50%;background:${currentColor};border:1px solid rgba(255,255,255,0.4);display:inline-block;"></span> Color`;

const inp = document.createElement('input');
inp.type = 'color';
inp.value = currentColor;
inp.oninput = e => { 
    e.stopPropagation(); 
    // Live update the little preview dot
    btn.querySelector('span').style.backgroundColor = e.target.value;
    onChange(e.target.value); 
};

wrap.appendChild(btn);
wrap.appendChild(inp);
toolbar.appendChild(wrap);
    }

    // Slider with live value display
    function addSlider(label, min, max, step, value, unit, onChange) {
if (label) addLabel(label);
const slider = document.createElement('input');
slider.type = 'range';
slider.className = 'ctx-slider';
slider.min = min; slider.max = max; slider.step = step;
slider.value = value;
const valEl = document.createElement('span');
valEl.className = 'ctx-val';
valEl.textContent = fmtVal(value, unit);
slider.oninput = e => {
    e.stopPropagation();
    const v = parseFloat(e.target.value);
    valEl.textContent = fmtVal(v, unit);
    onChange(v);
};
toolbar.appendChild(slider);
toolbar.appendChild(valEl);
    }
    function fmtVal(v, unit) {
if (unit === '%01') return Math.round(v * 100) + '%';
if (unit === 'px')  return Math.round(v) + 'px';
if (unit === '%')   return Math.round(v) + '%';
if (unit === 'number') return (Math.round(v * 10) / 10).toFixed(1) + 'x';
return Math.round(v * 10) / 10;
    }



    // Image upload/replace button
    function addImageReplace(onLoad) {
const lbl = document.createElement('label');
lbl.className = 'ctx-img-label';
// Inline SVG to ensure it always renders immediately without waiting for Lucide
lbl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Replace';
const fileInp = document.createElement('input');
fileInp.type = 'file';
fileInp.accept = 'image/*';
fileInp.style.display = 'none';
fileInp.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = re => onLoad(re.result);
    reader.readAsDataURL(file);
};
lbl.appendChild(fileInp);
toolbar.appendChild(lbl);
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  PER-ELEMENT TOOLBARS
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    // Background image â†’ Replace | Opacity | Zoom  (template-aware)
    function buildBackgroundToolbar() {
const tmpl = window.state.post.template;

if (tmpl === 'template2') {
    const t2 = window.state.post.t2;
    addImageReplace(dataUrl => { t2.bgImage = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
    addSep();
    addSlider('Zoom', 100, 250, 5, t2.imageScale, '%', v => window.updateT2State('imageScale', v));
    addSlider('Pos X', 0, 100, 1, t2.imagePosX, '%', v => window.updateT2State('imagePosX', v));
    addSlider('Pos Y', 0, 100, 1, t2.imagePosY, '%', v => window.updateT2State('imagePosY', v));
    return;
}

if (tmpl === 'template3') {
    const t3 = window.state.post.t3;
    addImageReplace(dataUrl => { t3.bgImage = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
    addSep();
    addSlider('Zoom', 100, 250, 5, t3.imageScale, '%', v => window.updateT3State('imageScale', v));
    addSlider('Pos X', 0, 100, 1, t3.imagePosX, '%', v => window.updateT3State('imagePosX', v));
    addSlider('Pos Y', 0, 100, 1, t3.imagePosY, '%', v => window.updateT3State('imagePosY', v));
    return;
}

if (tmpl === 'template4') {
    const t4 = window.state.post.t4;
    addImageReplace(dataUrl => { t4.bgImage = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
    addSep();
    addSlider('Zoom', 100, 250, 5, t4.imageScale, '%', v => window.updateT4State('imageScale', v));
    addSlider('Pos X', 0, 100, 1, t4.imagePosX, '%', v => window.updateT4State('imagePosX', v));
    addSlider('Pos Y', 0, 100, 1, t4.imagePosY, '%', v => window.updateT4State('imagePosY', v));
    return;
}

if (tmpl === 'template6') {
    const t6 = window.state.post.t6;
    addLabel('Background');
    addImageReplace(dataUrl => { t6.bgImage = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
    addSep();
    addSlider('Zoom', 100, 250, 5, t6.imageScale, '%', v => window.updateT6State('imageScale', v));
    addSlider('Pos X', 0, 100, 1, t6.imagePosX, '%', v => window.updateT6State('imagePosX', v));
    addSlider('Pos Y', 0, 100, 1, t6.imagePosY, '%', v => window.updateT6State('imagePosY', v));
    return;
}

// template1 default
const s = window.state.post.style;
addImageReplace(dataUrl => {
    window.state.post.bgImage = dataUrl;
    window.debouncedRenderCanvas();
    reanchor();
});
addSep();
addSlider('Opacity', 0, 1, 0.05, s.bgOpacity, '%01', v => window.updatePostStyle('bgOpacity', v));
addSep();
addSlider('Zoom', 100, 250, 5, s.imageScale, '%', v => window.updatePostStyle('imageScale', v));
    }

    // Left image (Template 5)
    function buildBackgroundLeftToolbar() {
const t5 = window.state.post.t5;
addLabel('Left Img');
addImageReplace(dataUrl => { t5.imageLeft = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
addSep();
addSlider('Zoom', 100, 250, 5, t5.leftScale, '%', v => window.updateT5State('leftScale', v));
addSlider('Pos X', 0, 100, 1, t5.leftPosX, '%', v => window.updateT5State('leftPosX', v));
addSlider('Pos Y', 0, 100, 1, t5.leftPosY, '%', v => window.updateT5State('leftPosY', v));
    }

    // Right image (Template 5)
    function buildBackgroundRightToolbar() {
const t5 = window.state.post.t5;
addLabel('Right Img');
addImageReplace(dataUrl => { t5.imageRight = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
addSep();
addSlider('Zoom', 100, 250, 5, t5.rightScale, '%', v => window.updateT5State('rightScale', v));
addSlider('Pos X', 0, 100, 1, t5.rightPosX, '%', v => window.updateT5State('rightPosX', v));
addSlider('Pos Y', 0, 100, 1, t5.rightPosY, '%', v => window.updateT5State('rightPosY', v));
    }

    // Circle inset (Template 6) — Replace photo | Border color | Size | Border width | Position | Hide
    function buildCircleInsetToolbar() {
const t6 = window.state.post.t6;
addLabel('Circle Photo');
addImageReplace(dataUrl => { t6.circleImage = dataUrl; window.debouncedRenderCanvas(); reanchor(); });
addSep();
addLabel('Border');
addColorPicker(t6.circleBorderColor, c => window.updateT6State('circleBorderColor', c));
addSep();
addSlider('Size',   80, 400, 10, t6.circleSize,         'px', v => { window.updateT6State('circleSize', v);         reanchor(); });
addSlider('Border', 0,  20,   1, t6.circleBorderWidth,  'px', v => { window.updateT6State('circleBorderWidth', v);  reanchor(); });
addSep();
addSlider('Pos X', 30,  90,  1, t6.circlePosX, '%', v => { window.updateT6State('circlePosX', v); reanchor(); });
addSlider('Pos Y',  5,  55,  1, t6.circlePosY, '%', v => { window.updateT6State('circlePosY', v); reanchor(); });
addSep();
addBtn('<i class="bx bx-hide"></i> Hide', () => { window.updateT6State('showCircle', false); reanchor(); });
    }

    // T4 / T6 swipe text toolbar
    function buildT4SwipeToolbar() {
const tmpl = window.state.post.template;
if (tmpl === 'template6') {
    const t6 = window.state.post.t6;
    activateInlineEdit(currentAnchorEl, t6.swipeText, v => { t6.swipeText = v; });
    addSep();
    addLabel('Color');
    addColorPicker(t6.swipeColor, c => window.updateT6State('swipeColor', c));
    addSep();
    addSlider('Size', 12, 60, 1, t6.swipeFontSize, 'px', v => window.updateT6State('swipeFontSize', v));
    return;
}
// T4 default
const t4 = window.state.post.t4;
activateInlineEdit(currentAnchorEl, t4.swipeText, v => { t4.swipeText = v; });
addSep();
addLabel('Color');
addColorPicker(t4.swipeColor, c => window.updateT4State('swipeColor', c));
addSep();
addSlider('Size', 12, 48, 1, t4.swipeFontSize, 'px', v => window.updateT4State('swipeFontSize', v));
    }

    // Circle overlay â†’ Replace | Border color | Border px | Size | Hide
    function buildCircleOverlayToolbar() {
const s = window.state.post.style;
const isHidden = s.showOverlay === false;
const borderVisible = s.showOverlayBorder !== false;
const glowVisible = s.showOverlayGlow === true;

addImageReplace(dataUrl => {
    window.updatePostStyle('overlayImgUrl', dataUrl);
    // Auto-detect color if glow is enabled
    if (s.showOverlayGlow) {
window.extractProminentBrightColor(dataUrl, (color) => {
    window.updatePostStyle('overlayGlowColor', color);
    reanchor();
});
    }
    reanchor();
});
addSep();
addLabel('Border');
addColorPicker(s.overlayBorderColor, c => { window.updatePostStyle('overlayBorderColor', c); reanchor(); });
addSep();
addLabel('Glow');
addColorPicker(s.overlayGlowColor || s.overlayBorderColor, c => { window.updatePostStyle('overlayGlowColor', c); reanchor(); });
if (glowVisible) {
    addSlider('Glow Intensity', 0, 1, 0.01, s.overlayGlowIntensity !== undefined ? s.overlayGlowIntensity : 0.5, '%01', v => { window.updatePostStyle('overlayGlowIntensity', v); reanchor(); });
    addSlider('Glow Size', 0, 2, 0.1, s.overlayGlowSize !== undefined ? s.overlayGlowSize : 1.0, 'number', v => { window.updatePostStyle('overlayGlowSize', v); reanchor(); });
}
addSep();
addSlider('Size', 100, 800, 10, s.overlayImgSize, 'px', v => { window.updatePostStyle('overlayImgSize', v); reanchor(); });
addSlider('W', 0, 60, 1, s.overlayBorderWidth, 'px', v => { window.updatePostStyle('overlayBorderWidth', v); reanchor(); });

addSep();
addBtn(borderVisible ? '<i class="bx bx-hide"></i> Hide Border' : '<i class="bx bx-show"></i> Show Border', () => {
    window.updatePostStyle('showOverlayBorder', !borderVisible);
    reanchor();
});

addSep();
addBtn(glowVisible ? '<i class="bx bx-hide"></i> Hide Glow' : '<i class="bx bx-show"></i> Show Glow', () => {
    const newGlowState = !glowVisible;
    window.updatePostStyle('showOverlayGlow', newGlowState);
    // Auto-detect color when enabling glow
    if (newGlowState && s.overlayImgUrl) {
window.extractProminentBrightColor(s.overlayImgUrl, (color) => {
    window.updatePostStyle('overlayGlowColor', color);
    reanchor();
});
    }
    reanchor();
});

addSep();
addBtn(isHidden ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
    window.updatePostStyle('showOverlay', isHidden);
    reanchor();
});
    }

    // Watermark â†’ Replace | Opacity | Size | Hide  (template-aware)
    function buildWatermarkToolbar() {
const tmpl = window.state.post.template;

if (tmpl === 'template2') {
    const t2 = window.state.post.t2;
    addImageReplace(dataUrl => { window.updateT2State('watermarkUrl', dataUrl); reanchor(); });
    addSep();
    addSlider('Opacity', 0, 1, 0.05, t2.watermarkOpacity, '%01', v => window.updateT2State('watermarkOpacity', v));
    addSlider('Size', 50, 500, 10, t2.watermarkSize, 'px', v => window.updateT2State('watermarkSize', v));
    addSep();
    addBtn(!t2.showWatermark ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
window.updateT2State('showWatermark', !t2.showWatermark);
reanchor();
    });
    return;
}

// template1 default
const s = window.state.post.style;
const isHidden = s.showWatermark === false;

addImageReplace(dataUrl => {
    window.updatePostStyle('watermarkUrl', dataUrl);
    reanchor();
});
addSep();
addSlider('Opacity', 0, 1, 0.05, s.watermarkOpacity, '%01', v => window.updatePostStyle('watermarkOpacity', v));
addSlider('Size', 50, 500, 10, s.watermarkSize, 'px', v => window.updatePostStyle('watermarkSize', v));

addSep();
addBtn(!s.showWatermark ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
    window.updatePostStyle('showWatermark', !s.showWatermark);
    reanchor();
});
    }

    // Logo â†’ Replace | Opacity | Size | Hide
    function buildLogoToolbar() {
const s = window.state.post.style;
const isHidden = s.showLogo === false;

addImageReplace(dataUrl => {
    window.updatePostStyle('logoUrl', dataUrl);
    reanchor();
});
addSep();
addSlider('Opacity', 0, 1, 0.05, s.logoOpacity, '%01', v => window.updatePostStyle('logoOpacity', v));
addSlider('Size', 50, 400, 5, s.logoSize, 'px', v => window.updatePostStyle('logoSize', v));

addSep();
addBtn(isHidden ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
    window.updatePostStyle('showLogo', isHidden);
    reanchor();
});
    }

    // Headline â†’ Edit text | Color | Size  (template-aware)
    function buildHeadlineToolbar() {
const tmpl = window.state.post.template;

if (tmpl === 'template2') {
    const t2 = window.state.post.t2;
    activateInlineEdit(currentAnchorEl, t2.headline, v => { t2.headline = v; });
    addSep();
    addSlider('Size', 30, 160, 2, t2.fontSize, 'px', v => window.updateT2State('fontSize', v));
    return;
}

if (tmpl === 'template3') {
    const t3 = window.state.post.t3;
    activateInlineEdit(currentAnchorEl, t3.headline, v => { t3.headline = v; });
    addSep();
    addLabel('Color');
    addColorPicker(t3.headlineColor, c => window.updateT3State('headlineColor', c));
    addSep();
    addSlider('Size', 30, 160, 2, t3.fontSize, 'px', v => window.updateT3State('fontSize', v));
    return;
}

if (tmpl === 'template4') {
    const t4 = window.state.post.t4;
    activateInlineEdit(currentAnchorEl, t4.headline, v => { t4.headline = v; });
    addSep();
    addLabel('Color');
    addColorPicker(t4.headlineColor, c => window.updateT4State('headlineColor', c));
    addSep();
    addSlider('Size', 30, 160, 2, t4.fontSize, 'px', v => window.updateT4State('fontSize', v));
    return;
}

if (tmpl === 'template5') {
    const t5 = window.state.post.t5;
    activateInlineEdit(currentAnchorEl, t5.headline, v => { t5.headline = v; });
    addSep();
    addLabel('Text');
    addColorPicker(t5.headlineColor, c => window.updateT5State('headlineColor', c));
    addSep();
    addLabel('[ ] Color');
    addColorPicker(t5.highlightColor, c => window.updateT5State('highlightColor', c));
    addSep();
    addSlider('Size', 40, 180, 2, t5.fontSize, 'px', v => window.updateT5State('fontSize', v));
    return;
}

if (tmpl === 'template6') {
    const t6 = window.state.post.t6;
    activateInlineEdit(currentAnchorEl, t6.headline, v => { t6.headline = v; });
    addSep();
    addLabel('Text');
    addColorPicker(t6.headlineColor, c => window.updateT6State('headlineColor', c));
    addSep();
    addLabel('[ ]');
    addColorPicker(t6.highlightColor, c => window.updateT6State('highlightColor', c));
    addSep();
    addSlider('Size', 40, 180, 2, t6.fontSize, 'px', v => window.updateT6State('fontSize', v));
    return;
}

// template1 default
const s = window.state.post.style;
activateInlineEdit(currentAnchorEl, window.state.post.headline, v => {
    window.state.post.headline = v;
});

addSep();
addLabel('Text');
addColorPicker(s.primaryColor, c => window.updatePostStyle('primaryColor', c));

addSep();
addLabel('[ ]');
addColorPicker(s.highlightColor, c => window.updatePostStyle('highlightColor', c));

addSep();
addLabel('{ }');
addColorPicker(s.secondaryColor, c => window.updatePostStyle('secondaryColor', c));

addSep();
addSlider('Size', 40, 160, 2, s.fontSize, 'px', v => window.updatePostStyle('fontSize', v));
    }

    // Caption â†’ Edit text | (nothing else, keep it simple)
    function buildCaptionToolbar() {
activateInlineEdit(currentAnchorEl, window.state.post.caption, v => {
    window.state.post.caption = v;
});
    }

    // News Badge â†’ Edit text | Hide
    function buildBadgeToolbar() {
const s = window.state.post.style;
// Target the inner span to preserve the pill background/styling
const editTarget = currentAnchorEl.querySelector('span') || currentAnchorEl;

activateInlineEdit(editTarget, s.badgeText, v => {
    s.badgeText = v; 
});

addSep();
addBtn(!s.showNewsBadge ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
    window.updatePostStyle('showNewsBadge', !s.showNewsBadge);
    reanchor();
});
    }

    // Swipe Left â†’ Edit text | Text Color | Icon Color | Size | Show/Hide
    function buildSwipeLeftToolbar() {
const s = window.state.post.style;

// Edit text - use custom handler to preserve icon
const el = currentAnchorEl;
if (el && !el.isContentEditable) {
    // Store original HTML to preserve icon
    const originalHTML = el.innerHTML;
    const textOnly = s.swipeText || 'Swipe Left';
    
    // Extract just the text content (without icon)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHTML;
    const iconElement = tempDiv.querySelector('i[data-lucide]');
    const iconHTML = iconElement ? iconElement.outerHTML : '';
    // Get text by removing icon from cloned element
    if (iconElement) iconElement.remove();
    const textContent = tempDiv.textContent.trim() || textOnly;
    
    // Get computed styles
    const computedStyle = window.getComputedStyle(el);
    const fontSize = computedStyle.fontSize;
    const fontFamily = computedStyle.fontFamily;
    const fontWeight = computedStyle.fontWeight;
    const color = computedStyle.color;
    const lineHeight = computedStyle.lineHeight;
    const letterSpacing = computedStyle.letterSpacing;
    const textTransform = computedStyle.textTransform;
    const textAlign = computedStyle.textAlign;
    const originalStyle = el.getAttribute('style') || '';
    
    // Apply styles
    el.style.setProperty('font-size', fontSize, 'important');
    el.style.setProperty('font-family', fontFamily, 'important');
    el.style.setProperty('font-weight', fontWeight, 'important');
    el.style.setProperty('color', color, 'important');
    el.style.setProperty('line-height', lineHeight, 'important');
    el.style.setProperty('letter-spacing', letterSpacing, 'important');
    if (textTransform !== 'none') {
el.style.setProperty('text-transform', textTransform, 'important');
    }
    if (textAlign !== 'start' && textAlign !== 'left') {
el.style.setProperty('text-align', textAlign, 'important');
    }
    
    el.contentEditable = true;
    el.classList.add('ctx-editing');
    
    // Preserve icon while editing - wrap text in span, keep icon
    if (iconHTML && s.swipeShowIcon !== false) {
el.innerHTML = `<span class="swipe-text-edit">${textContent}</span> ${iconHTML}`;
const textSpan = el.querySelector('.swipe-text-edit');
if (textSpan) {
    textSpan.contentEditable = true;
    textSpan.focus();
    const range = document.createRange();
    range.selectNodeContents(textSpan);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}
    } else {
el.innerText = textContent;
el.focus();
const range = document.createRange();
range.selectNodeContents(el);
const sel = window.getSelection();
sel.removeAllRanges();
sel.addRange(range);
    }
    
    const onInput = (e) => {
e.stopPropagation();
const textSpan = el.querySelector('.swipe-text-edit');
const editedText = textSpan ? textSpan.textContent.trim() : el.innerText.trim();
s.swipeText = editedText;
// Don't re-render on every input to avoid flickering
    };
    
    const onBlur = () => {
// Save final text value
const textSpan = el.querySelector('.swipe-text-edit');
const finalText = textSpan ? textSpan.textContent.trim() : el.innerText.trim();
if (finalText !== s.swipeText) {
    s.swipeText = finalText;
}

el.contentEditable = false;
el.classList.remove('ctx-editing');
if (originalStyle) {
    el.setAttribute('style', originalStyle);
} else {
    el.removeAttribute('style');
}
el.removeEventListener('input', onInput);
el.removeEventListener('blur', onBlur);
el.removeEventListener('keydown', onKeydown);
el.removeEventListener('click', onClick);
// Re-render to restore proper formatting with icon
window.renderCanvas();
// Re-initialize icons after render
setTimeout(() => {
    const canvasRoot = document.getElementById('canvas-root');
    if (canvasRoot && typeof lucide !== 'undefined' && lucide.createIcons) {
lucide.createIcons(canvasRoot);
    }
}, 10);
    };
    
    const onKeydown = (e) => {
e.stopPropagation();
    };
    
    const onClick = (e) => {
e.stopPropagation();
    };
    
    el.addEventListener('input', onInput);
    el.addEventListener('blur', onBlur);
    el.addEventListener('keydown', onKeydown);
    el.addEventListener('click', onClick);
}

addSep();
addLabel('Text Color');
addColorPicker(s.swipeTextColor || s.swipeColor || '#FFFFFF', c => window.updatePostStyle('swipeTextColor', c));

addSep();
addLabel('Icon Color');
addColorPicker(s.swipeColor || '#FFFFFF', c => window.updatePostStyle('swipeColor', c));

addSep();
addSlider('Size', 12, 48, 1, s.swipeFontSize || 20, 'px', v => window.updatePostStyle('swipeFontSize', v));

addSep();
addSlider('Icon', 12, 48, 1, s.swipeIconSize || 24, 'px', v => window.updatePostStyle('swipeIconSize', v));

addSep();
addSlider('Opacity', 0, 100, 1, Math.round((s.swipeOpacity || 0.9) * 100), '%', v => window.updatePostStyle('swipeOpacity', v / 100));

addSep();
addBtn((s.swipeShowIcon !== false) ? '<i class="bx bx-hide"></i> Hide Icon' : '<i class="bx bx-show"></i> Show Icon', () => {
    window.updatePostStyle('swipeShowIcon', s.swipeShowIcon === false);
    reanchor();
});

addSep();
addBtn(!s.showSwipeBadge ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
    window.updatePostStyle('showSwipeBadge', !s.showSwipeBadge);
    reanchor();
});
    }

    // Source/credit â†’ Edit text | Hide
    function buildSourceToolbar() {
const s = window.state.post.style;
activateInlineEdit(currentAnchorEl, s.sourceText, v => {
    s.sourceText = v;
});

addSep();
addBtn(!s.showSource ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
    window.updatePostStyle('showSource', !s.showSource);
    reanchor();
});
    }

    // Brand divider (template3) â†’ Color | Size | Show/Hide letter
    function buildBrandToolbar() {
const tmpl = window.state.post.template;

if (tmpl === 'template4') {
    const t4 = window.state.post.t4;
    addLabel('Badge BG');
    addColorPicker(t4.brandBgColor, c => window.updateT4State('brandBgColor', c));
    addSep();
    addLabel('Text');
    addColorPicker(t4.brandTextColor, c => window.updateT4State('brandTextColor', c));
    addSep();
    addSlider('Size', 18, 72, 1, t4.brandFontSize, 'px', v => window.updateT4State('brandFontSize', v));
    addSep();
    addBtn(!t4.showBrand ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
        window.updateT4State('showBrand', !t4.showBrand); reanchor();
    });
    return;
}

if (tmpl === 'template5') {
    const t5 = window.state.post.t5;
    addLabel('Badge BG');
    addColorPicker(t5.brandBgColor, c => window.updateT5State('brandBgColor', c));
    addSep();
    addLabel('Text');
    addColorPicker(t5.brandTextColor, c => window.updateT5State('brandTextColor', c));
    addSep();
    addSlider('Size', 12, 40, 1, t5.brandFontSize, 'px', v => window.updateT5State('brandFontSize', v));
    addSep();
    addBtn(!t5.showBrand ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
        window.updateT5State('showBrand', !t5.showBrand); reanchor();
    });
    return;
}

if (tmpl === 'template6') {
    const t6 = window.state.post.t6;
    activateInlineEdit(currentAnchorEl, t6.brandText, v => { t6.brandText = v; });
    addSep();
    addLabel('Color');
    addColorPicker(t6.brandColor, c => window.updateT6State('brandColor', c));
    addSep();
    addSlider('Size', 14, 60, 1, t6.brandFontSize, 'px', v => window.updateT6State('brandFontSize', v));
    addSep();
    addBtn(t6.brandItalic ? '<i class="bx bx-italic"></i> Normal' : '<i class="bx bx-italic"></i> Italic', () => {
        window.updateT6State('brandItalic', !t6.brandItalic); reanchor();
    });
    addSep();
    addBtn(!t6.showBrand ? '<i class="bx bx-show"></i> Show' : '<i class="bx bx-hide"></i> Hide', () => {
        window.updateT6State('showBrand', !t6.showBrand); reanchor();
    });
    return;
}

// Template 3 default: brand divider
const t3 = window.state.post.t3;
addLabel('Brand');
addColorPicker(t3.brandColor, c => window.updateT3State('brandColor', c));
addSep();
addSlider('Size', 16, 80, 1, t3.brandSize, 'px', v => window.updateT3State('brandSize', v));
addSep();
addBtn(t3.showBrandLetter !== false ? '<i class="bx bx-hide"></i> Hide Letter' : '<i class="bx bx-show"></i> Show Letter', () => {
    window.updateT3State('showBrandLetter', t3.showBrandLetter === false);
    reanchor();
});
    }

    // Highlight ring â†’ Color | Thickness
    function buildHighlightRingToolbar() {
const h = window.state.highlight;
addLabel('Ring');
addColorPicker(h.ringColor, c => window.updateHighlightState('ringColor', c));
addSep();
addSlider('Thick', 0, 100, 2, h.ringWidth, 'px', v => window.updateHighlightState('ringWidth', v));
    }

    // Highlight icon â†’ Color | Size
    function buildHighlightIconToolbar() {
const h = window.state.highlight;
addLabel('Icon');
addColorPicker(h.iconColor, c => window.updateHighlightState('iconColor', c));
addSep();
addSlider('Size', 100, 800, 20, h.iconSize, 'px', v => window.updateHighlightState('iconSize', v));
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //  CLICK DELEGATION
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Single capture-phase listener handles everything.
    // Capture phase fires before any inline onclick/stopPropagation on children.
    document.addEventListener('click', e => {
// Post Generator only
if (window.state.mode !== 'post') {         hideToolbar(); return; }

// Clicks inside the toolbar itself â†’ do nothing
if (toolbar.contains(e.target)) return;

// Check if a ctx-enabled element was clicked
const target = e.target.closest('[data-ctx]');
if (target) {
    buildToolbar(target.getAttribute('data-ctx'), target);
    return;
}

// Everything else â†’ hide
        hideToolbar();
    }, true); // true = capture phase

    // Also hide toolbar when switching away from Post mode
    // Store original setMode before overriding
    if (!window._origSetMode && window.setMode) window._origSetMode = window.setMode;
    window.setMode = function(mode) {
        hideToolbar();
        if (window._origSetMode) window._origSetMode(mode);
    };

})();

// Make globally available
if (typeof window !== 'undefined') {
    window.focusSidebarControl = focusSidebarControl;
    
    // Create debounced render canvas function (if not already created)
    if (!window.debouncedRenderCanvas && window.debounceRender) {
        window.debouncedRenderCanvas = window.debounceRender(() => {
            if (window.renderCanvas) {
                window.renderCanvas();
            }
            setTimeout(() => {
                const canvasRoot = document.getElementById('canvas-root');
                if (canvasRoot && typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons(canvasRoot);
                }
            }, 10);
        }, 100);
    }
}