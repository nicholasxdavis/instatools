// --- CORE RENDER LOOP ---
function renderApp() {
            window.renderTabs();
            window.renderSidebarContent();
            window.renderCanvas();
            window.handleResize();
            // Initialize icons after DOM is updated - target sidebar specifically
    const sidebarContent = document.getElementById('sidebar-content');
            setTimeout(() => {
                window.initializeIcons(sidebarContent);
                // Re-initialize icons again to ensure all are loaded
                setTimeout(() => {
                    window.initializeIcons(sidebarContent);
                }, 50);
                // One more retry after a longer delay
                setTimeout(() => {
                    window.initializeIcons(sidebarContent);
                }, 150);
            }, 10);
            // Hide blank/empty icons after creation - wait longer to ensure icons are initialized
            setTimeout(() => {
                // Re-initialize icons one more time before checking
                window.initializeIcons(sidebarContent);
                
                // Now check for empty icons
                document.querySelectorAll('.icon-gallery-btn').forEach(btn => {
            const iconEl = btn.querySelector('[data-lucide]');
                    if (iconEl) {
                const svg = iconEl.querySelector('svg');
                        // Only hide if truly empty after waiting
                        if (!svg) {
                            // Wait a bit more before hiding
                            setTimeout(() => {
                        const retrySvg = iconEl.querySelector('svg');
                                if (!retrySvg) {
                                    btn.style.display = 'none';
                                }
                            }, 100);
                        } else if (svg.children.length === 0) {
                            // Check if SVG has any paths or meaningful content
                    const hasContent = svg.querySelector('path, circle, rect, line, polyline, polygon') !== null;
                            if (!hasContent) {
                                btn.style.display = 'none';
                            }
                        }
                    }
                });
            }, 500);
        }

function setMode(mode) {
            if (window.state.mode === mode) return;
            window.state.mode = mode;
            window.state.activeTab = 'editor';
            
            // Reset zoom to auto-fit when mode changes
            if (window.state.manualZoom !== null) {
                window.state.manualZoom = null;
            }
            
            // Update buttons
    const postBtn = document.getElementById('mode-post-btn');
    const highlightBtn = document.getElementById('mode-highlight-btn');
            
            if (postBtn && highlightBtn) {
                postBtn.className = mode === 'post' 
                    ? 'px-6 py-1.5 text-xs font-bold uppercase rounded-md transition-all-200 bg-white text-black shadow-sm hover:shadow-md' 
                    : 'px-6 py-1.5 text-xs font-bold uppercase rounded-md transition-all-200 text-gray-400 hover:text-gray-300';
                highlightBtn.className = mode === 'highlight' 
                    ? 'px-6 py-1.5 text-xs font-bold uppercase rounded-md transition-all-200 bg-white text-black shadow-sm hover:shadow-md' 
                    : 'px-6 py-1.5 text-xs font-bold uppercase rounded-md transition-all-200 text-gray-400 hover:text-gray-300';
            }
            
            window.renderApp();
            
            // Update zoom buttons after mode change
            if (window.updateZoomButtons) {
                setTimeout(() => {
                    window.updateZoomButtons();
                }, 100);
            }
        }

function setActiveTab(tab) {
            if (window.state.activeTab === tab) return;
            window.state.activeTab = tab;
            window.renderApp();
        }

        // --- SIDEBAR RENDERING ---
function renderTabs() {
    const container = document.getElementById('tabs-container');
            if (!container) return;

    // Determine which tabs are available for the current mode/template
    let tabs;
    if (window.state.mode === 'post') {
        const tmpl = window.state.post ? window.state.post.template : null;
        const isT2orT3 = tmpl === 'template2' || tmpl === 'template3' || tmpl === 'template4' || tmpl === 'template5' || tmpl === 'template6' || tmpl === 'template7' || tmpl === 'template8' || tmpl === 'template9' || tmpl === 'template10';
        // T2/T3/T4/T5/T6/T7/T8/T9/T10 have no separate Design tab — everything is in the Editor tab
        tabs = isT2orT3 ? ['editor', 'templates'] : ['editor', 'design', 'templates'];
    } else {
        // Highlight mode: only Editor tab — no Templates tab needed
        tabs = ['editor'];
    }
            
            container.innerHTML = tabs.map(tab => `
                <button
                    onclick="window.setActiveTab('${tab}')"
                    aria-label="${tab} tab"
                    aria-selected="${window.state.activeTab === tab}"
                >
                    ${tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            `).join('');
        }

function renderSidebarContent() {
    const container = document.getElementById('sidebar-content');
            if (!container) return;
            
            if (window.state.mode === 'post') {
                const tmpl = window.state.post.template;
                const isT2orT3 = tmpl === 'template2' || tmpl === 'template3';
                const isNoDesignTab = isT2orT3 || tmpl === 'template4' || tmpl === 'template5' || tmpl === 'template6' || tmpl === 'template7' || tmpl === 'template8' || tmpl === 'template9' || tmpl === 'template10';

                // Guard: T2/T3/T4/T5 have no Design tab — silently fall back to Editor
                if (isNoDesignTab && window.state.activeTab === 'design') {
                    window.state.activeTab = 'editor';
                }

                if (window.state.activeTab === 'editor') {
                    if (tmpl === 'template2') window.renderTemplate2Editor(container);
                    else if (tmpl === 'template3') window.renderTemplate3Editor(container);
                    else if (tmpl === 'template4') window.renderTemplate4Editor(container);
                    else if (tmpl === 'template5') window.renderTemplate5Editor(container);
                    else if (tmpl === 'template6') window.renderTemplate6Editor(container);
                    else if (tmpl === 'template7') window.renderTemplate7Editor(container);
                    else if (tmpl === 'template8') window.renderTemplate8Editor(container);
                    else if (tmpl === 'template9') window.renderTemplate9Editor(container);
                    else if (tmpl === 'template10') window.renderTemplate10Editor(container);
                    else window.renderPostEditor(container);
                }
                else if (window.state.activeTab === 'templates') window.renderPostTemplates(container);
                else if (window.state.activeTab === 'design') {
                    // Only reachable for template1
                    window.renderPostDesign(container);
                }
            } else {
                // Highlight mode: only Editor tab exists — always show editor
                window.state.activeTab = 'editor';
                window.renderHighlightEditor(container);
            }

            // Video audio controls (preview only): show only when a video source exists for the active template
            if (window.state.mode === 'post' && window.state.activeTab === 'editor') {
                try {
                    const post = window.state.post;
                    const style = (post && post.style) ? post.style : {};
                    const isVideo = (v) => (typeof window.isVideoSource === 'function') ? window.isVideoSource(v) : false;

                    const tmpl = post && post.template;
                    const hasVideo =
                        isVideo(post && post.bgImage) ||
                        isVideo(style.overlayImgUrl) ||
                        isVideo(style.logoUrl) ||
                        isVideo(style.watermarkUrl) ||
                        (tmpl === 'template2' && isVideo(post.t2 && post.t2.bgImage)) ||
                        (tmpl === 'template3' && isVideo(post.t3 && post.t3.bgImage)) ||
                        (tmpl === 'template4' && isVideo(post.t4 && post.t4.bgImage)) ||
                        (tmpl === 'template5' && (isVideo(post.t5 && post.t5.imageLeft) || isVideo(post.t5 && post.t5.imageRight))) ||
                        ((tmpl === 'template6' || tmpl === 'template8') && (isVideo(post.t6 && post.t6.bgImage) || isVideo(post.t6 && post.t6.circleImage) || isVideo(post.t8 && post.t8.bgImage) || isVideo(post.t8 && post.t8.circleImage))) ||
                        (tmpl === 'template7' && isVideo(post.t7 && post.t7.profileImageUrl)) ||
                        (tmpl === 'template9' && (isVideo(post.t9 && post.t9.bgImage) || isVideo(post.t9 && post.t9.logoUrl))) ||
                        (tmpl === 'template10' && (isVideo(post.t10 && post.t10.bgImage) || isVideo(post.t10 && post.t10.watermarkUrl)));

                    if (hasVideo) {
                        const existing = container.querySelector('#video-audio-controls');
                        if (existing) existing.remove();
                        const checked = style.showVideoAudio === true;
                        const vol = Math.max(0, Math.min(1, Number(style.videoVolume ?? 0.85)));
                        const volPct = Math.round(vol * 100) + '%';

                        container.insertAdjacentHTML('beforeend', `
                            <div id="video-audio-controls" class="space-y-3 pt-6 border-t border-gray-100 animate-fade-in">
                                <div class="flex justify-between items-center">
                                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                        <i data-lucide="volume-2" class="w-3 h-3"></i> Video Audio
                                    </label>
                                    <input type="checkbox"
                                        id="video-audio-enable"
                                        ${checked ? 'checked' : ''}
                                        onchange="window.updatePostStyle('showVideoAudio', this.checked); window.renderSidebarContent();"
                                        class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                        aria-label="Enable video audio">
                                </div>

                                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                                    <div>
                                        <div class="flex justify-between items-center gap-3 mb-2">
                                            <label class="text-[9px] uppercase font-bold text-gray-400 block">Volume</label>
                                            <div id="video-volume-display" class="text-[10px] text-gray-500 font-mono">${volPct}</div>
                                        </div>
                                        <input type="range"
                                            min="0"
                                            max="1"
                                            step="0.01"
                                            value="${vol}"
                                            ${checked ? '' : 'disabled'}
                                            oninput="window.updatePostStyleWithDisplay('videoVolume', parseFloat(this.value), 'video-volume-display', 'percent')"
                                            class="w-full"
                                            aria-label="Video volume">
                                    </div>
                                </div>
                            </div>
                        `);
                    }
                } catch (e) {
                    console.warn('Video audio controls render failed:', e);
                }
            }
            
            // Initialize Lucide icons after rendering content - target the container specifically
            setTimeout(() => {
                window.initializeIcons(container);
                // Also initialize icons in canvas if needed
        const canvasRoot = document.getElementById('canvas-root');
                if (canvasRoot && typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons(canvasRoot);
                }
                // Global initialization to catch all icons
                if (typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons();
                }
            }, 10);
            
            // Retry after a longer delay to catch any late-rendering icons
            setTimeout(() => {
                window.initializeIcons(container);
        const canvasRoot = document.getElementById('canvas-root');
                if (canvasRoot && typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons(canvasRoot);
                }
                // Global initialization again
                if (typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons();
                }
            }, 100);
            
            // One more retry for stubborn icons
            setTimeout(() => {
                if (typeof lucide !== 'undefined' && lucide.createIcons) {
                    lucide.createIcons(container);
                    lucide.createIcons();
                }
            }, 300);
        }

        // --- POST GENERATOR UI ---
function renderCanvas() {
    // Helper function to get transform string with scale and translateY for positioning
    // When scaled, object-position alone doesn't work well, so we combine it with translateY
    function getImageTransform(scale, posY) {
        const scaleFactor = scale / 100;
        const scaleValue = scaleFactor;
        
        if (scaleFactor === 1) {
            // At 100% scale, no transform needed (use object-position only)
            return 'none';
        }
        
        // Calculate translateY based on position offset from center
        // When image is scaled larger, we need to translate to compensate for the scale
        // Formula: translate by the offset amount, scaled by (scaleFactor - 1)
        // This ensures that changing posY moves the image correctly when zoomed
        const offsetFromCenter = (posY - 50) / 100; // -0.5 to 0.5 (negative = up, positive = down)
        // Translate by the offset, multiplied by how much we've scaled beyond 100%
        // At 200% scale (2x), we need to translate more to achieve the same visual position
        const translateY = offsetFromCenter * 100 * (scaleFactor - 1);
        
        return `scale(${scaleValue}) translateY(${translateY}%)`;
    }
    
    // Get object-position Y - use center when scaled (translate handles positioning)
    function getObjectPositionY(pos, scale) {
        const scaleFactor = scale / 100;
        if (scaleFactor === 1) return pos;
        return 50; // Center when scaled, translate handles the offset
    }
    
    const root = document.getElementById('canvas-root');
            if (!root) return;
    function setCanvasHtml(html) {
        root.innerHTML = html;
        if (window.hydrateCanvasMedia) {
            window.hydrateCanvasMedia(root);
        }
    }

            if (window.state.mode === 'post') {
        const s = window.state.post.style;
                // Parse headline logic
        const parts = window.state.post.headline.split(/(\[.*?\]|\{.*?\})/);
        const headlineHTML = parts.map(part => {
                    if (part.startsWith('[') && part.endsWith(']')) {
                const text = window.escapeHtml(part.slice(1, -1));
                        if (s.useBracketColor) {
                            return `<span style="color: ${s.highlightColor}">${text}</span>`;
                        }
                        return `<span style="color: ${s.primaryColor}">${text}</span>`;
                    }
                    if (part.startsWith('{') && part.endsWith('}')) {
                const text = window.escapeHtml(part.slice(1, -1));
                        if (s.useBraceColor) {
                            return `<span style="color: ${s.secondaryColor}">${text}</span>`;
                        }
                        return `<span style="color: ${s.primaryColor}">${text}</span>`;
                    }
                    return `<span style="color: ${s.primaryColor}">${window.escapeHtml(part)}</span>`;
                }).join('');

                root.style.width = `${window.CONSTANTS.POST_WIDTH}px`;
                // Template 7 should be a perfect square (like a real tweet screenshot),
                // so we force height = width for that template only.
                const isTemplate7 = window.state.post && window.state.post.template === 'template7';
                root.style.height = `${isTemplate7 ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.POST_HEIGHT}px`;

                // â”€â”€ TEMPLATE 2 CANVAS (Clean: white top bar + full image + watermark BL) â”€â”€
                if (window.state.post.template === 'template2') {
            const t2 = window.state.post.t2;
            const safeT2Img = window.escapeHtml(window.getCorsProxyUrl(t2.bgImage));
            const safeT2Headline = window.escapeHtml(t2.headline);
            const safeT2Watermark = t2.watermarkUrl ? window.escapeHtml(window.getCorsProxyUrl(t2.watermarkUrl)) : '';

                    // Build watermark transform and positioning (use right/top/bottom for edge positions to avoid shrinking)
                    // Clamp Y position to 0-100, but allow X to go beyond 100 for right-side positioning
            const t2ClampedPosY = Math.max(0, Math.min(100, t2.watermarkPosY));
            const t2PosX = Math.max(0, t2.watermarkPosX); // Allow values > 100 for right-side extension
                    
            let t2WmTX = '-50%', t2WmTY = '-50%';
            let t2WmLeft = null, t2WmRight = null, t2WmTop = null, t2WmBottom = null;
                    
                    if (t2ClampedPosY <= 15) {
                        t2WmTY = '0%';
                        t2WmTop = `${t2ClampedPosY}%`;
                    } else if (t2ClampedPosY >= 85) {
                        t2WmTY = '0%'; // bottom: X% already anchors the bottom edge
                        t2WmBottom = `${100 - t2ClampedPosY}%`;
                    } else {
                        t2WmTop = `${t2ClampedPosY}%`;
                    }
                    
                    if (t2PosX <= 15) {
                        t2WmTX = '0%';
                        t2WmLeft = `${Math.min(100, t2PosX)}%`;
                    } else if (t2PosX >= 85) {
                        t2WmTX = '0%'; // right: X% already anchors the right edge
                        // Calculate distance from right edge: 100 - posX
                        // For posX > 100, this becomes negative, pushing it right
                const t2RightValue = 100 - t2PosX;
                        t2WmRight = `${t2RightValue}%`;
                    } else {
                        t2WmLeft = `${t2PosX}%`;
                    }

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;display:flex;flex-direction:column;background:#fff;">
                            <!-- White top bar with headline -->
                            <div
                                data-ctx="headline"
                                title="Click to edit headline"
                                ondblclick="window.focusSidebarControl('t2-headline')"
                                style="background:#fff;padding:40px 44px 36px 44px;flex-shrink:0;cursor:pointer;"
                            >
                                <p style="margin:0;font-family:${t2.customFontFamily || t2.fontFamily},sans-serif;font-size:${t2.fontSize}px;font-weight:${t2.fontWeight};color:#000;line-height:1.22;letter-spacing:-0.01em;">${safeT2Headline}</p>
                            </div>
                            <!-- Full image fills remaining space -->
                            <div
                                data-ctx="background"
                                title="Click to edit image"
                                ondblclick="window.focusSidebarControl('t2-bg-url')"
                                style="position:relative;flex:1;overflow:hidden;cursor:pointer;"
                            >
                                <img
                                    src="${safeT2Img}"
                                    style="width:100%;height:100%;object-fit:cover;object-position:${t2.imagePosX}% ${getObjectPositionY(t2.imagePosY, t2.imageScale)}%;transform:${getImageTransform(t2.imageScale, t2.imagePosY)};"
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                                ${safeT2Watermark && t2.showWatermark ? `
                                    <div
                                        data-ctx="watermark"
                                        title="Click to edit watermark"
                                        ondblclick="window.focusSidebarControl('t2-watermark-url')"
                                        style="position:absolute;${t2WmLeft !== null ? `left:${t2WmLeft};` : ''}${t2WmRight !== null ? `right:${t2WmRight};` : ''}${t2WmTop !== null ? `top:${t2WmTop};` : ''}${t2WmBottom !== null ? `bottom:${t2WmBottom};` : ''} transform:translate(${t2WmTX},${t2WmTY});cursor:pointer;opacity:${t2.watermarkOpacity};"
                                    >
                                        <img
                                            src="${safeT2Watermark}"
                                            style="width:${t2.watermarkSize}px;height:auto;object-fit:contain;pointer-events:none;display:block;"
                                            onerror="this.style.display='none'"
                                            alt="Watermark"
                                        >
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `);
                    return; // Done â€” skip template1 rendering below
                }

                // ── TEMPLATE 5 CANVAS (Dual Image: two side-by-side photos + colored headline + arrow + dots) ──
                // ── TEMPLATE 6/8 CANVAS (Sports / Hurdels: full-bleed bg + cinematic gradient + circle inset + brand text + headline + >>> SWIPE >>> + dots) ──
                if (window.state.post.template === 'template6' || window.state.post.template === 'template8') {
            const isT8 = window.state.post.template === 'template8';
            const t6 = isT8 ? window.state.post.t8 : window.state.post.t6;
            const safeBg = window.escapeHtml(window.getCorsProxyUrl(t6.bgImage));
            const safeCircle = t6.circleImage ? window.escapeHtml(window.getCorsProxyUrl(t6.circleImage)) : '';

            // ── Cinematic multi-stop gradient ──
            // Darkening starts at gradientStart%, smoothly reaches gradientStrength opacity by 100%
            const gs  = t6.gradientStart;      // e.g. 22
            const str = t6.gradientStrength;   // e.g. 0.96
            const p2  = (gs + (100 - gs) * 0.20).toFixed(1);
            const p3  = (gs + (100 - gs) * 0.46).toFixed(1);
            const p4  = (gs + (100 - gs) * 0.70).toFixed(1);
            const gradientCSS = [
                `transparent 0%`,
                `transparent ${gs}%`,
                `rgba(0,0,0,${(str * 0.08).toFixed(2)}) ${p2}%`,
                `rgba(0,0,0,${(str * 0.42).toFixed(2)}) ${p3}%`,
                `rgba(0,0,0,${(str * 0.80).toFixed(2)}) ${p4}%`,
                `rgba(0,0,0,${str}) 100%`,
            ].join(', ');

            // ── Headline HTML (plain = headlineColor, [word] = highlightColor) ──
            const t6Parts = t6.headline.split(/(\[.*?\])/);
            const t6HeadlineHTML = t6Parts.map(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    return `<span style="color:${t6.highlightColor}">${window.escapeHtml(part.slice(1, -1))}</span>`;
                }
                return `<span style="color:${t6.headlineColor}">${window.escapeHtml(part)}</span>`;
            }).join('');

            // ── Dots HTML ──
            const t6Count  = Math.max(1, Math.min(10, t6.dotCount  || 4));
            const t6Active = Math.max(0, Math.min(t6Count - 1, t6.activeDot || 0));
            let t6DotsInner = '';
            for (let i = 0; i < t6Count; i++) {
                const isAct = i === t6Active;
                t6DotsInner += `<div style="width:${isAct ? 20 : 7}px;height:7px;border-radius:9999px;background:${t6.dotColor};opacity:${isAct ? 1 : 0.45};"></div>`;
            }
            const t6DotsHtml = t6.showDots
                ? `<div style="display:flex;align-items:center;justify-content:center;gap:5px;">${t6DotsInner}</div>`
                : '';

            // ── SWIPE CTA ──
            // Template 6 keeps decorative chevrons; template 8 is text-only.
            const decoSize   = Math.round(t6.swipeFontSize * 0.52);
            let swipeBlock = "";
            if (t6.showSwipe) {
                if (isT8) {
                    swipeBlock = `
                <div
                    data-ctx="swipe"
                    title="Click to edit swipe text"
                    ondblclick="window.focusSidebarControl('t8-swipe-text')"
                    style="display:flex;align-items:center;justify-content:center;cursor:pointer;pointer-events:auto;"
                >
                    <span style="font-family:'${t6.swipeFontFamily}',sans-serif;color:${t6.swipeColor};font-size:${t6.swipeFontSize}px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;line-height:1;">${window.escapeHtml(t6.swipeText)}</span>
                </div>`;
                } else {
                    swipeBlock = `
                <div
                    data-ctx="swipe"
                    title="Click to edit swipe text"
                    ondblclick="window.focusSidebarControl('t6-swipe-text')"
                    style="display:flex;align-items:center;gap:13px;cursor:pointer;pointer-events:auto;"
                >
                    <span style="color:${t6.swipeColor};opacity:0.45;font-size:${decoSize}px;letter-spacing:5px;font-family:sans-serif;line-height:1;">›&nbsp;›&nbsp;›</span>
                    <span style="font-family:'${t6.swipeFontFamily}',sans-serif;color:${t6.swipeColor};font-size:${t6.swipeFontSize}px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;line-height:1;">${window.escapeHtml(t6.swipeText)}</span>
                    <span style="color:${t6.swipeColor};opacity:0.45;font-size:${decoSize}px;letter-spacing:5px;font-family:sans-serif;line-height:1;">›&nbsp;›&nbsp;›</span>
                </div>`;
                }
            }

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;overflow:hidden;background:#000;">

                            <!-- ① Background image -->
                            <div
                                data-ctx="background"
                                title="Click to edit background"
                                style="position:absolute;inset:0;cursor:pointer;"
                            >
                                <img
                                    src="${safeBg}"
                                    style="width:100%;height:100%;object-fit:cover;object-position:${t6.imagePosX}% ${getObjectPositionY(t6.imagePosY, t6.imageScale)}%;transform:${getImageTransform(t6.imageScale, t6.imagePosY)};transform-origin:center center;opacity:${t6.bgOpacity};"
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                            </div>

                            <!-- ② Flat dim overlay (subtle, optional) -->
                            <div style="position:absolute;inset:0;pointer-events:none;background:${t6.overlayColor};opacity:${t6.overlayOpacity};"></div>

                            <!-- ③ Cinematic multi-stop gradient (bottom-heavy) -->
                            <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom,${gradientCSS});"></div>

                            <!-- ④ Circle inset image (top-right area) -->
                            ${t6.showCircle ? `
                            <div
                                data-ctx="circle-inset"
                                title="Click to replace circle image"
                                style="position:absolute;left:${t6.circlePosX}%;top:${t6.circlePosY}%;transform:translate(-50%,-50%);width:${t6.circleSize}px;height:${t6.circleSize}px;border-radius:50%;overflow:hidden;border:${t6.circleBorderWidth}px solid ${t6.circleBorderColor};cursor:pointer;z-index:20;box-shadow:0 8px 32px rgba(0,0,0,0.6);background:#1a1a1a;flex-shrink:0;"
                            >
                                ${safeCircle
                                    ? `<img src="${safeCircle}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" alt="Circle inset">`
                                    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:13px;font-family:sans-serif;text-align:center;padding:20px;line-height:1.4;">Tap to<br>add photo</div>`
                                }
                            </div>
                            ` : ''}

                            <!-- ⑤ Brand text (top-left) -->
                            ${t6.showBrand ? `
                            <div
                                data-ctx="brand"
                                title="Click to edit brand text"
                                ondblclick="window.focusSidebarControl('${isT8 ? 't8' : 't6'}-brand-text')"
                                style="position:absolute;top:40px;left:44px;z-index:30;cursor:pointer;"
                            >
                                <span style="font-family:'${t6.brandFontFamily}',sans-serif;font-size:${t6.brandFontSize}px;font-weight:900;font-style:${t6.brandItalic ? 'italic' : 'normal'};color:${t6.brandColor};letter-spacing:0.03em;text-transform:uppercase;text-shadow:0 2px 8px rgba(0,0,0,0.6);">${window.escapeHtml(t6.brandText)}</span>
                            </div>
                            ` : ''}

                            <!-- ⑥ Headline (fills bottom area, left-aligned) -->
                            <div style="position:absolute;inset:0;z-index:20;display:flex;flex-direction:column;justify-content:flex-end;pointer-events:none;padding:0 ${t6.paddingH}px ${t6.paddingBottom}px ${t6.paddingH}px;">
                                <h1
                                    data-ctx="headline"
                                    title="Click to edit headline"
                                    ondblclick="window.focusSidebarControl('${isT8 ? 't8' : 't6'}-headline')"
                                    style="margin:0;padding:0;align-self:center;font-family:'${t6.customFontFamily || t6.fontFamily}',sans-serif;font-size:${t6.fontSize}px;font-weight:${t6.fontWeight};line-height:${t6.lineHeight};letter-spacing:${t6.letterSpacing}em;text-transform:uppercase;text-align:${t6.textAlign || 'center'};white-space:pre-wrap;text-shadow:0px 4px 15px rgba(0,0,0,0.8);word-break:break-word;cursor:pointer;pointer-events:auto;"
                                >${t6HeadlineHTML}</h1>
                            </div>

                            <!-- ⑦ Bottom navigation: >>> SWIPE >>> + dots -->
                            <div style="position:absolute;bottom:0;left:0;right:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:26px;gap:10px;pointer-events:none;">
                                ${swipeBlock}
                                ${t6DotsHtml}
                            </div>

                        </div>
                    `);
                    return; // Done — skip template1 rendering below
                }

                // ── TEMPLATE 7 CANVAS (Twitter/X Post: profile pic, username, handle, tweet text, timestamp, engagement metrics) ──
                if (window.state.post.template === 'template7') {
                    const t7 = window.state.post.t7;
                    const safeProfileImg = t7.profileImageUrl ? window.escapeHtml(window.getCorsProxyUrl(t7.profileImageUrl)) : '';
                    const safeUsername = window.escapeHtml(t7.username);
                    const safeHandle = window.escapeHtml(t7.handle);
                    const safeTweetText = window.escapeHtml(t7.tweetText);
                    const safeTimestamp = window.escapeHtml(t7.timestamp);
                    const safeSource = window.escapeHtml(t7.source);
                    
                    // ── Icons from src/ui SVG files (stroke color injected) ──────────────
                    const t7BorderColor = t7.borderColor || 'rgba(255,255,255,0.12)';
                    const iconW = Math.round(t7.metricsFontSize * 1.25);
                    const ic = t7.iconColor || '#8B98A5';
                    const retweetIcon = `<svg width="${iconW}" height="${iconW}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${ic}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M52.94,42.93V18.3a5.54,5.54,0,0,0-5.54-5.54H11.83"/><path d="M11.83,20.14V44.77a5.54,5.54,0,0,0,5.54,5.54H52.94"/><polyline points="4.15 26.39 12.09 20.14 19.51 26.88"/><polyline points="60.36 36.12 52.91 42.94 45 36.76"/></svg>`;
                    const likeIcon    = `<svg width="${iconW}" height="${iconW}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${ic}" stroke-width="3"><path d="M9.06,25C7.68,17.3,12.78,10.63,20.73,10c7-.55,10.47,7.93,11.17,9.55a.13.13,0,0,0,.25,0c3.25-8.91,9.17-9.29,11.25-9.5C49,9.45,56.51,13.78,55,23.87c-2.16,14-23.12,29.81-23.12,29.81S11.79,40.05,9.06,25Z"/></svg>`;
                    const shareIcon   = `<svg width="${iconW}" height="${iconW}" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${ic}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M53.5,34.06V53.33a2.11,2.11,0,0,1-2.12,2.09H12.62a2.11,2.11,0,0,1-2.12-2.09V34.06"/><polyline points="42.61 18.11 32 7.5 21.39 18.11"/><line x1="32" y1="7.5" x2="32" y2="46.39"/></svg>`;

                    // Verified badge: x-badge.png image
                    const badgeSz = Math.max(1, Math.round(t7.usernameFontSize * 1.1) - 1); // 1px smaller
                    const verifiedBadgeHtml = t7.showVerifiedBadge
                        ? `<img src="src/ui/x-badge.png" style="width:${badgeSz}px;height:${badgeSz}px;vertical-align:middle;display:inline-block;margin-left:4px;" alt="verified">`
                        : '';

                    // sp = spacing between elements  
                    const sp = t7.spacingBetweenElements || 20;
                    const smallTopGap = 5;
                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;background:${t7.bgColor};display:flex;flex-direction:column;padding:${t7.paddingV}px ${t7.paddingH}px;font-family:'${t7.customFontFamily || t7.fontFamily}',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;overflow:hidden;">
                            
                            <!-- Header: Profile Picture + Username/Handle (stacked) + Three Dots -->
                            <div style="display:flex;align-items:center;flex-shrink:0;margin-top:${smallTopGap}px;margin-bottom:${sp}px;">
                                <!-- Profile Picture -->
                                <div
                                    data-ctx="profile-image"
                                    title="Click to edit profile picture"
                                    ondblclick="window.focusSidebarControl('t7-profile-image-url')"
                                    style="width:${t7.profileImageSize}px;height:${t7.profileImageSize}px;border-radius:50%;overflow:hidden;flex-shrink:0;margin-right:16px;cursor:pointer;background:#2D3741;"
                                >
                                    ${safeProfileImg 
                                        ? `<img src="${safeProfileImg}" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'" alt="Profile">`
                                        : `<svg width="${t7.profileImageSize}" height="${t7.profileImageSize}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="38" r="22" fill="rgba(255,255,255,0.25)"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="rgba(255,255,255,0.25)"/></svg>`
                                    }
                                </div>
                                <!-- Username + Handle stacked -->
                                <div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:5px;">
                                    <div style="display:flex;align-items:center;line-height:1.2;">
                                        <span data-ctx="username" title="Click to edit username" ondblclick="window.focusSidebarControl('t7-username')"
                                            style="font-size:${t7.usernameFontSize}px;font-weight:${t7.usernameFontWeight};color:${t7.usernameColor};cursor:pointer;"
                                        >${safeUsername}</span>${verifiedBadgeHtml}
                                    </div>
                                    <span data-ctx="handle" title="Click to edit handle" ondblclick="window.focusSidebarControl('t7-handle')"
                                        style="font-size:${t7.handleFontSize}px;color:${t7.handleColor};cursor:pointer;line-height:1.2;"
                                    >${safeHandle}</span>
                                </div>
                                <!-- Three dots -->
                                <div style="color:${ic};font-size:${Math.round(t7.usernameFontSize*0.9)}px;letter-spacing:3px;padding-left:12px;line-height:1;user-select:none;font-weight:700;">•••</div>
                            </div>
                            
                            <!-- Tweet Text -->
                            <div data-ctx="tweet-text" title="Click to edit tweet text" ondblclick="window.focusSidebarControl('t7-tweet-text')"
                                style="font-size:${t7.tweetFontSize}px;font-weight:${t7.tweetFontWeight};color:${t7.textColor};line-height:${t7.lineHeight};white-space:pre-wrap;word-wrap:break-word;cursor:pointer;margin-bottom:${sp}px;"
                            >${safeTweetText}</div>
                            
                            <!-- Timestamp + Source -->
                            <div style="display:flex;align-items:center;gap:6px;color:${t7.timestampColor};font-size:${t7.timestampFontSize}px;flex-shrink:0;margin-top:5px;margin-bottom:${sp}px;">
                                <span data-ctx="timestamp" title="Click to edit timestamp" ondblclick="window.focusSidebarControl('t7-timestamp')" style="cursor:pointer;">${safeTimestamp}</span>
                                <span>·</span>
                                <span data-ctx="source" title="Click to edit source" ondblclick="window.focusSidebarControl('t7-source')" style="color:${t7.sourceColor};text-decoration:underline;cursor:pointer;">${safeSource}</span>
                            </div>
                            
                            <!-- Engagement Metrics: bold numbers + gray labels -->
                            <div style="display:flex;align-items:center;gap:24px;padding-top:${Math.round(sp*0.7)+5}px;padding-bottom:${Math.round(sp*0.7)}px;border-top:1px solid ${t7BorderColor};flex-shrink:0;">
                                <span style="font-size:${t7.metricsFontSize}px;">
                                    <strong style="color:${t7.textColor};font-weight:700;">${window.escapeHtml(t7.retweets)}</strong><span style="color:${t7.metricsColor};"> Retweets</span>
                                </span>
                                <span style="font-size:${t7.metricsFontSize}px;">
                                    <strong style="color:${t7.textColor};font-weight:700;">${window.escapeHtml(t7.quoteTweets)}</strong><span style="color:${t7.metricsColor};"> Quote Tweets</span>
                                </span>
                                <span style="font-size:${t7.metricsFontSize}px;">
                                    <strong style="color:${t7.textColor};font-weight:700;">${window.escapeHtml(t7.likes)}</strong><span style="color:${t7.metricsColor};"> Likes</span>
                                </span>
                            </div>
                            
                            <!-- Action Icons row -->
                            ${t7.showEngagementIcons ? `
                            <div style="display:flex;align-items:center;justify-content:space-around;padding-top:${Math.round(sp*0.7)}px;border-top:1px solid ${t7BorderColor};flex-shrink:0;">
                                <img src="src/ui/comment.png" alt="Reply" style="width:${iconW}px;height:${iconW}px;filter:brightness(0) saturate(100%) invert(73%) sepia(6%) saturate(356%) hue-rotate(172deg) brightness(91%) contrast(88%);">
                                ${retweetIcon}
                                ${likeIcon}
                                ${shareIcon}
                            </div>` : ''}
                            
                        </div>
                    `);
                    return; // Done — skip template1 rendering below
                }

                // ── TEMPLATE 5 CANVAS (Dual Image: two side-by-side photos + colored headline + arrow + dots) ──
                if (window.state.post.template === 'template5') {
            const t5 = window.state.post.t5;
            const safeLeft  = window.escapeHtml(window.getCorsProxyUrl(t5.imageLeft));
            const safeRight = window.escapeHtml(window.getCorsProxyUrl(t5.imageRight));
            const safeT5Watermark = t5.watermarkUrl ? window.escapeHtml(window.getCorsProxyUrl(t5.watermarkUrl)) : '';
            const imgHeightPx = Math.round((t5.imageSplit / 100) * window.CONSTANTS.POST_HEIGHT);

            // Watermark Positioning Logic (Mirrors Template 2)
            const t5ClampedPosY = Math.max(0, Math.min(100, t5.watermarkPosY));
            const t5PosX = Math.max(0, t5.watermarkPosX);
            
            let t5WmTX = '-50%', t5WmTY = '-50%';
            let t5WmLeft = null, t5WmRight = null, t5WmTop = null, t5WmBottom = null;
            
            if (t5ClampedPosY <= 15) { t5WmTY = '0%'; t5WmTop = `${t5ClampedPosY}%`; }
            else if (t5ClampedPosY >= 85) { t5WmTY = '0%'; t5WmBottom = `${100 - t5ClampedPosY}%`; }
            else { t5WmTop = `${t5ClampedPosY}%`; }
            
            if (t5PosX <= 15) { t5WmTX = '0%'; t5WmLeft = `${Math.min(100, t5PosX)}%`; }
            else if (t5PosX >= 85) { t5WmTX = '0%'; const t5RightValue = 100 - t5PosX; t5WmRight = `${t5RightValue}%`; }
            else { t5WmLeft = `${t5PosX}%`; }

            // Parse headline: [word] = highlightColor, plain = headlineColor
            const t5Parts = t5.headline.split(/(\[.*?\])/);
            const t5HeadlineHTML = t5Parts.map(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    // To get the "popping" look on the colored text, we can optionally add a white shadow or stroke. Let's stick to text-shadow.
                    return `<span style="color:${t5.highlightColor};text-shadow:0px 4px 25px rgba(0,0,0,1);">${window.escapeHtml(part.slice(1, -1))}</span>`;
                }
                return `<span style="color:${t5.headlineColor};text-shadow:0px 4px 25px rgba(0,0,0,1);">${window.escapeHtml(part)}</span>`;
            }).join('');

            // Dots HTML
            const t5DotsHtml = t5.showDots ? (() => {
                const count = Math.max(1, Math.min(10, t5.dotCount || 4));
                const active = Math.max(0, Math.min(count - 1, t5.activeDot || 0));
                let dots = '';
                for (let i = 0; i < count; i++) {
                    const isActive = i === active;
                    dots += `<div style="width:${isActive ? 18 : 7}px;height:7px;border-radius:9999px;background:${t5.dotColor};opacity:${isActive ? 1 : 0.4};"></div>`;
                }
                return `<div style="display:flex;align-items:center;justify-content:center;gap:5px;">${dots}</div>`;
            })() : '';

            // Arrow HTML (left-pointing arrow with thick stroke to match reference)
            const arrowSvg = t5.showArrow ? `<svg width="50" height="20" viewBox="0 0 50 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;transform:scaleX(-1);"><line x1="48" y1="10" x2="2" y2="10" stroke="${t5.arrowColor}" stroke-width="3"/><polyline points="12,2 2,10 12,18" fill="none" stroke="${t5.arrowColor}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></svg>` : '';

            // Separator between images
            const sepStyle = t5.imageSeparator ? `border-left:${t5.separatorWidth}px solid ${t5.separatorColor};` : '';

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;display:flex;flex-direction:column;overflow:hidden;">

                            <!-- TOP: two images side by side -->
                            <div style="height:${imgHeightPx}px;display:flex;flex-direction:row;flex-shrink:0;overflow:hidden;">

                                <!-- LEFT IMAGE -->
                                <div
                                    data-ctx="background-left"
                                    title="Click to edit left image"
                                    ondblclick="window.focusSidebarControl('t5-left-url')"
                                    style="flex:1;overflow:hidden;cursor:pointer;position:relative;"
                                >
                                    <img
                                        src="${safeLeft}"
                                        style="width:100%;height:100%;object-fit:cover;object-position:${t5.leftPosX}% ${getObjectPositionY(t5.leftPosY, t5.leftScale)}%;transform:${getImageTransform(t5.leftScale, t5.leftPosY)};transform-origin:center center;"
                                        onerror="this.style.display='none'"
                                        alt="Left image"
                                    >
                                </div>

                                <!-- RIGHT IMAGE -->
                        <div
                            data-ctx="background-right"
                            title="Click to edit right image"
                            ondblclick="window.focusSidebarControl('t5-right-url')"
                            style="flex:1;overflow:hidden;cursor:pointer;position:relative;${sepStyle}"
                        >
                            <img
                                src="${safeRight}"
                                style="width:100%;height:100%;object-fit:cover;object-position:${t5.rightPosX}% ${getObjectPositionY(t5.rightPosY, t5.rightScale)}%;transform:${getImageTransform(t5.rightScale, t5.rightPosY)};transform-origin:center center;"
                                onerror="this.style.display='none'"
                                alt="Right image"
                            >
                        </div>

                        <!-- WATERMARK OVERLAY -->
                        ${safeT5Watermark && (t5.showWatermark !== false) ? `
                            <div
                                data-ctx="watermark"
                                title="Click to edit watermark"
                                ondblclick="window.focusSidebarControl('t5-watermark-url')"
                                style="position:absolute;z-index:30;${t5WmLeft !== null ? `left:${t5WmLeft};` : ''}${t5WmRight !== null ? `right:${t5WmRight};` : ''}${t5WmTop !== null ? `top:${t5WmTop};` : ''}${t5WmBottom !== null ? `bottom:${t5WmBottom};` : ''} transform:translate(${t5WmTX},${t5WmTY});cursor:pointer;opacity:${t5.watermarkOpacity};"
                            >
                                <img
                                    src="${safeT5Watermark}"
                                    style="width:${t5.watermarkSize}px;height:auto;object-fit:contain;pointer-events:none;display:block;"
                                    onerror="this.style.display='none'"
                                    alt="Watermark"
                                >
                            </div>
                        ` : ''}

                    </div>

                            <!-- BOTTOM: text block -->
                            <div style="flex:1;background:${t5.bgColor};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${t5.paddingV}px ${t5.paddingH}px ${Math.round(t5.paddingV * 0.7)}px;position:relative;overflow:hidden;">

                                <!-- HEADLINE -->
                                <h1
                                    data-ctx="headline"
                                    title="Click to edit headline"
                                    ondblclick="window.focusSidebarControl('t5-headline')"
                                    style="margin:0;font-family:'${t5.customFontFamily || t5.fontFamily}',sans-serif;font-size:${t5.fontSize}px;font-weight:${t5.fontWeight};text-transform:uppercase;text-align:${t5.textAlign || 'center'};white-space:pre-wrap;line-height:${t5.lineHeight};letter-spacing:${t5.letterSpacing}em;word-break:break-word;width:100%;cursor:pointer;"
                                >${t5HeadlineHTML}</h1>

                                <!-- BOTTOM ARROW + DOTS -->
                                <div style="position:absolute;bottom:20px;display:flex;flex-direction:column;align-items:center;gap:6px;">
                                    ${arrowSvg}
                                    ${t5DotsHtml}
                                </div>

                            </div>

                        </div>

                    `);
                    return; // Done — skip template1 rendering below
                }

                // ── TEMPLATE 4 CANVAS (Magazine Cover: XXL-style, full bleed + brand badge + swipe + dots) ──
                if (window.state.post.template === 'template4') {
            const t4 = window.state.post.t4;
            const safeT4Img = window.escapeHtml(window.getCorsProxyUrl(t4.bgImage));
            const safeT4Headline = window.escapeHtml(t4.headline);
            const safeT4Badge = window.escapeHtml(t4.badgeText);
            const safeT4Brand = window.escapeHtml(t4.brandText);
            const safeT4Swipe = window.escapeHtml(t4.swipeText);

            // Build pagination dots HTML
            const dotsHtml = t4.showDots ? (() => {
                const count = Math.max(1, Math.min(10, t4.dotCount || 3));
                const active = Math.max(0, Math.min(count - 1, t4.activeDot || 0));
                let dots = '';
                for (let i = 0; i < count; i++) {
                    const isActive = i === active;
                    dots += `<div style="width:${isActive ? 20 : 8}px;height:8px;border-radius:9999px;background:${t4.dotColor};opacity:${isActive ? 1 : 0.45};transition:all 0.2s;"></div>`;
                }
                return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;margin-top:20px;">${dots}</div>`;
            })() : '';

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;background:#000;overflow:hidden;">

                            <!-- BACKGROUND IMAGE -->
                            <div
                                data-ctx="background"
                                title="Click to edit image"
                                ondblclick="window.focusSidebarControl('t4-bg-url')"
                                style="position:absolute;inset:0;overflow:hidden;cursor:pointer;"
                            >
                                <img
                                    src="${safeT4Img}"
                                    style="width:100%;height:100%;object-fit:cover;object-position:${t4.imagePosX}% ${getObjectPositionY(t4.imagePosY, t4.imageScale)}%;transform:${getImageTransform(t4.imageScale, t4.imagePosY)};transform-origin:center center;"
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                            </div>

                            <!-- DARK GRADIENT OVERLAY (bottom-heavy) -->
                            <div style="position:absolute;inset:0;pointer-events:none;background:linear-gradient(to bottom, transparent 0%, transparent ${100 - t4.gradientStrength}%, rgba(0,0,0,0.92) 100%);"></div>
                            <!-- Flat colour overlay for overall dimming -->
                            <div style="position:absolute;inset:0;pointer-events:none;background-color:${t4.overlayColor};opacity:${t4.overlayOpacity};"></div>

                            <!-- TOP-LEFT: BRAND BADGE (e.g. XXL red box) -->
                            ${t4.showBrand ? `
                            <div
                                data-ctx="brand"
                                title="Click to edit brand"
                                ondblclick="window.focusSidebarControl('t4-brand-text')"
                                style="position:absolute;top:40px;left:40px;z-index:30;cursor:pointer;"
                            >
                                <div style="background:${t4.brandBgColor};padding:8px 14px;display:inline-block;">
                                    <span style="font-family:'Archivo Black',sans-serif;font-size:${t4.brandFontSize}px;font-weight:900;color:${t4.brandTextColor};letter-spacing:-0.01em;line-height:1;display:block;">${safeT4Brand}</span>
                                </div>
                            </div>
                            ` : ''}

                            <!-- BOTTOM CONTENT: Badge + Headline + Divider + Swipe + Dots -->
                            <div style="position:absolute;left:0;right:0;bottom:0;z-index:20;padding:0 60px 52px 60px;display:flex;flex-direction:column;align-items:flex-start;">

                                <!-- NEWS BADGE -->
                                ${t4.showBadge ? `
                                <div
                                    data-ctx="badge"
                                    title="Click to edit badge"
                                    ondblclick="window.focusSidebarControl('t4-badge-text')"
                                    style="background:#fff;padding:5px 16px;margin-bottom:22px;cursor:pointer;"
                                >
                                    <span style="font-family:'Archivo Black',sans-serif;font-size:22px;font-weight:900;color:#000;letter-spacing:0.08em;text-transform:uppercase;line-height:1.2;display:block;">${safeT4Badge}</span>
                                </div>
                                ` : ''}

                                <!-- HEADLINE -->
                                <h1
                                    data-ctx="headline"
                                    title="Click to edit headline"
                                    ondblclick="window.focusSidebarControl('t4-headline')"
                                    style="margin:0 0 36px 0;font-family:'${t4.customFontFamily || t4.fontFamily}',sans-serif;font-size:${t4.fontSize}px;font-weight:${t4.fontWeight};color:${t4.headlineColor};text-transform:uppercase;line-height:${t4.lineHeight};letter-spacing:${t4.letterSpacing}em;word-break:break-word;cursor:pointer;width:100%;"
                                >${safeT4Headline}</h1>

                                <!-- DIVIDER + SWIPE + DOTS (full-width, centered) -->
                                <div style="width:100%;display:flex;flex-direction:column;align-items:center;">
                                    ${t4.showDivider ? `<div style="width:100%;height:1.5px;background:${t4.dividerColor};opacity:0.6;margin-bottom:22px;"></div>` : ''}
                                    ${t4.showSwipe ? `
                                    <div
                                        data-ctx="swipe"
                                        title="Click to edit swipe text"
                                        ondblclick="window.focusSidebarControl('t4-swipe-text')"
                                        style="font-family:'Archivo Black',sans-serif;font-size:${t4.swipeFontSize}px;font-weight:700;color:${t4.swipeColor};letter-spacing:0.18em;text-transform:uppercase;opacity:0.75;cursor:pointer;"
                                    >${safeT4Swipe}</div>
                                    ` : ''}
                                    ${dotsHtml}
                                </div>

                            </div>

                        </div>
                    `);
                    return; // Done — skip template1 rendering below
                }

                // ── TEMPLATE 3 CANVAS (Wealth Split: image top, brand divider, bold colored text bottom) ──
                if (window.state.post.template === 'template3') {
            const t3 = window.state.post.t3;
            const safeT3Img = window.escapeHtml(window.getCorsProxyUrl(t3.bgImage));
            const safeT3Headline = window.escapeHtml(t3.headline);
            const imgHeightPx = Math.round((t3.imageSplit / 100) * window.CONSTANTS.POST_HEIGHT);
            const brandSizePx = t3.brandSize;
            const circleSizePx = Math.round(brandSizePx * 1.4);
            const showBg = t3.showBgColor !== false;
                    // Fading divider line: gradient from transparent â†’ color â†’ transparent
            const dividerLine = `background:linear-gradient(to right, transparent 0%, ${t3.brandColor} 20%, ${t3.brandColor} 80%, transparent 100%);height:1.5px;flex:1;`;

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;background:${showBg ? t3.bgColor : '#000'};overflow:hidden;">

                            <!-- LAYER 1: Image â€” full canvas when bg disabled, cropped when enabled -->
                            <div
                                data-ctx="background"
                                title="Click to edit image"
                                ondblclick="window.focusSidebarControl('t3-bg-url')"
                                style="position:absolute;top:0;left:0;right:0;${showBg ? `height:${imgHeightPx}px` : 'bottom:0'};overflow:hidden;cursor:pointer;"
                            >
                                <img
                                    src="${safeT3Img}"
                                    style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${t3.imagePosX}% ${getObjectPositionY(t3.imagePosY, t3.imageScale)}%;transform:${getImageTransform(t3.imageScale, t3.imagePosY)};transform-origin:center center;"
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                                <!-- Bottom fade: bleeds image into the text area below -->
                                ${t3.showBottomFade ? `
                                <div style="position:absolute;bottom:calc(${showBg ? '-2px' : '0px'} + ${-(t3.bottomFadePosY || 0)}px);left:0;right:0;height:${t3.bottomFadeHeight}%;background:linear-gradient(to bottom, transparent 0%, ${t3.bottomFadeColor} 100%);opacity:${t3.bottomFadeOpacity};pointer-events:none;"></div>
                                ` : ''}
                            </div>

                            <!-- LAYER 2: Content column (spacer â†’ brand divider â†’ headline) -->
                            <div style="position:absolute;inset:0;display:flex;flex-direction:column;pointer-events:none;">

                                <!-- Spacer matching image height â€” fades bgColor in at the bottom -->
                                <div style="height:${imgHeightPx}px;flex-shrink:0;background:${showBg ? `linear-gradient(to bottom, transparent 70%, ${t3.bgColor} 100%)` : 'transparent'};pointer-events:none;"></div>

                                <!-- BRAND DIVIDER -->
                                ${t3.showBrand ? `
                                <div
                                    data-ctx="brand"
                                    title="Click to edit brand"
                                    ondblclick="window.focusSidebarControl('t3-bg-url')"
                                    style="display:flex;align-items:center;gap:0;padding:18px 52px;background:${showBg ? t3.bgColor : 'transparent'};flex-shrink:0;cursor:pointer;pointer-events:auto;"
                                >
                                    <div style="${dividerLine}"></div>
                                    <div style="display:flex;align-items:center;gap:6px;padding:0 18px;white-space:nowrap;">
                                        ${t3.showBrandLetter !== false ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:${circleSizePx}px;height:${circleSizePx}px;border:1.5px solid ${t3.brandColor};border-radius:50%;font-size:${brandSizePx * 0.7}px;font-family:Georgia,serif;font-style:italic;color:${t3.brandColor};line-height:1;">${window.escapeHtml((t3.brandLetter || 'w').charAt(0))}</span>` : ''}
                                        <span style="font-family:Georgia,serif;font-style:italic;font-size:${brandSizePx}px;color:${t3.brandColor};letter-spacing:0.04em;line-height:1;">${window.escapeHtml(t3.brandName)}</span>
                                    </div>
                                    <div style="${dividerLine}"></div>
                                </div>
                                ` : `<div style="height:24px;flex-shrink:0;background:${showBg ? t3.bgColor : 'transparent'};"></div>`}

                                <!-- HEADLINE -->
                                <div
                                    data-ctx="headline"
                                    title="Click to edit headline"
                                    ondblclick="window.focusSidebarControl('t3-headline')"
                                    style="flex:1;display:flex;align-items:center;justify-content:center;padding:10px 52px 40px 52px;background:${showBg ? t3.bgColor : 'transparent'};cursor:pointer;pointer-events:auto;"
                                >
                                    <h1 style="position:relative;z-index:2;margin:0;font-family:'${t3.customFontFamily || t3.fontFamily}',sans-serif;font-size:${t3.fontSize}px;font-weight:${t3.fontWeight};font-style:${t3.fontStyle};color:${t3.headlineColor};text-align:center;text-transform:uppercase;line-height:${t3.lineHeight};letter-spacing:${t3.letterSpacing}em;word-break:break-word;">${safeT3Headline}</h1>
                                </div>

                            </div>


                        </div>
                    `);
                    return; // Done â€” skip template1 rendering below
                }

                // ── TEMPLATE 9 CANVAS (Toad Creek: bottom fade, logo top left, gold/white text) ──
                if (window.state.post.template === 'template9') {
                    const t9 = window.state.post.t9;
                    const safeT9Img = window.escapeHtml(window.getCorsProxyUrl(t9.bgImage));
                    const safeT9Logo = t9.logoUrl ? window.escapeHtml(window.getCorsProxyUrl(t9.logoUrl)) : '';
                    
                    // Parse headline: [word] = gold, plain = white
                    const t9Parts = t9.headline.split(/(\[.*?\])/);
                    const t9HeadlineHTML = t9Parts.map(part => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                            return `<span style="color:${t9.highlightColor}">${window.escapeHtml(part.slice(1, -1))}</span>`;
                        }
                        return `<span style="color:${t9.headlineColor}">${window.escapeHtml(part)}</span>`;
                    }).join('');

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;background:#000;overflow:hidden;">
                            
                            <!-- Background Image -->
                            <div 
                                data-ctx="background" 
                                title="Click to edit background" 
                                ondblclick="window.focusSidebarControl('t9-bg-url')"
                                style="position:absolute;inset:0;cursor:pointer;"
                            >
                                <img 
                                    src="${safeT9Img}" 
                                    style="width:100%;height:100%;object-fit:cover;object-position:50% ${getObjectPositionY(t9.imagePosY, t9.imageScale)}%;transform:${getImageTransform(t9.imageScale, t9.imagePosY)};transform-origin:center center;" 
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                            </div>

                            <!-- Bottom Fade -->
                            <div style="position:absolute;bottom:0;left:0;right:0;height:${t9.bottomFadeHeight}%;background:linear-gradient(to bottom, transparent 0%, ${t9.bottomFadeColor} 100%);opacity:${t9.bottomFadeOpacity};pointer-events:none;"></div>

                            <!-- Logo (Top Left) -->
                            ${t9.showLogo && safeT9Logo ? `
                            <div 
                                data-ctx="logo" 
                                title="Click to edit logo" 
                                ondblclick="window.focusSidebarControl('t9-logo-url')"
                                style="position:absolute;top:${t9.logoPosY}%;left:${t9.logoPosX}%;width:${t9.logoSize}px;cursor:pointer;z-index:20;"
                            >
                                <img src="${safeT9Logo}" style="width:100%;height:auto;display:block;" alt="Logo">
                            </div>
                            ` : ''}

                            <!-- Headline (Bottom Center) -->
                            <div style="position:absolute;bottom:0;left:0;right:0;padding:0 ${t9.paddingH}px ${t9.paddingBottom}px ${t9.paddingH}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;z-index:30;pointer-events:none;">
                                <h1 
                                    data-ctx="headline" 
                                    title="Click to edit headline" 
                                    ondblclick="window.focusSidebarControl('t9-headline')"
                                    style="margin:0;font-family:'${t9.customFontFamily || t9.fontFamily}',sans-serif;font-size:${t9.fontSize}px;font-weight:${t9.fontWeight};line-height:${t9.lineHeight};text-align:center;text-transform:uppercase;pointer-events:auto;cursor:pointer;text-shadow:0 2px 10px rgba(0,0,0,0.5);"
                                >${t9HeadlineHTML}</h1>
                            </div>

                        </div>
                    `);
                    return; // Done
                }

                // ── TEMPLATE 10 CANVAS (Grunge Print: top-right watermark, bottom white glow, grunge text) ──
                if (window.state.post.template === 'template10') {
                    const t10 = window.state.post.t10;
                    const safeT10Img = window.escapeHtml(window.getCorsProxyUrl(t10.bgImage));
                    const safeT10Watermark = t10.watermarkUrl ? window.escapeHtml(window.getCorsProxyUrl(t10.watermarkUrl)) : '';

                    // Parse headline: [word] = highlightColor, plain = headlineColor
                    const t10Parts = t10.headline.split(/(\[.*?\])/);
                    const t10HeadlineHTML = t10Parts.map(part => {
                        if (part.startsWith('[') && part.endsWith(']')) {
                            return `<span style="color:${t10.highlightColor}">${window.escapeHtml(part.slice(1, -1))}</span>`;
                        }
                        return `<span style="color:${t10.headlineColor}">${window.escapeHtml(part)}</span>`;
                    }).join('');

                    const safeT10Swipe = window.escapeHtml(t10.swipeText || 'SWIPE');

                    // Watermark Positioning Logic (top-right biased, but fully adjustable)
                    const t10ClampedPosY = Math.max(0, Math.min(100, t10.watermarkPosY));
                    const t10PosX = Math.max(0, t10.watermarkPosX);

                    let t10WmTX = '-50%';
                    let t10WmTY = '-50%';
                    let t10WmLeft = null;
                    let t10WmRight = null;
                    let t10WmTop = null;
                    let t10WmBottom = null;

                    if (t10ClampedPosY <= 15) {
                        t10WmTY = '0%';
                        t10WmTop = `${t10ClampedPosY}%`;
                    } else if (t10ClampedPosY >= 85) {
                        t10WmTY = '0%';
                        t10WmBottom = `${100 - t10ClampedPosY}%`;
                    } else {
                        t10WmTop = `${t10ClampedPosY}%`;
                    }

                    if (t10PosX <= 15) {
                        t10WmTX = '0%';
                        t10WmLeft = `${Math.min(100, t10PosX)}%`;
                    } else if (t10PosX >= 85) {
                        t10WmTX = '0%';
                        const t10RightValue = 100 - t10PosX;
                        t10WmRight = `${t10RightValue}%`;
                    } else {
                        t10WmLeft = `${t10PosX}%`;
                    }

                    const glowHeightPct = Math.max(0, Math.min(100, t10.glowHeight || 40));
                    const glowOpacity = Math.max(0, Math.min(1, t10.glowOpacity != null ? t10.glowOpacity : 0.8));

                    setCanvasHtml(`
                        <div style="position:absolute;inset:0;background:#f4f4f4;overflow:hidden;">

                            <!-- Background Image -->
                            <div 
                                data-ctx="background" 
                                title="Click to edit background" 
                                ondblclick="window.focusSidebarControl('t10-bg-url')"
                                style="position:absolute;inset:0;cursor:pointer;"
                            >
                                <img 
                                    src="${safeT10Img}" 
                                    style="width:100%;height:100%;object-fit:cover;object-position:50% ${getObjectPositionY(t10.imagePosY || 50, t10.imageScale || 100)}%;transform:${getImageTransform(t10.imageScale || 100, t10.imagePosY || 50)};" 
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                            </div>

                            <!-- Bottom Dark Fade on Background -->
                            <div style="position:absolute;left:0;right:0;bottom:0;height:${t10.fadeHeight}%;pointer-events:none;background:linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,${t10.fadeStrength}) 100%);"></div>

                            <!-- Global Black Overlay -->
                            <div style="position:absolute;inset:0;background:${t10.overlayColor};opacity:${t10.overlayOpacity};pointer-events:none;"></div>

                            <!-- Film Grain / Noise Overlay — canvas-generated via filter.js -->
                            ${t10.noiseAmount > 0 ? `
                            <div style="
                                position:absolute;
                                inset:0;
                                pointer-events:none;
                                mix-blend-mode:multiply;
                                background-image:url('${typeof window.getGrainDataUrl === 'function' ? window.getGrainDataUrl(180) : ''}');
                                background-size:180px 180px;
                                background-repeat:repeat;
                                opacity:${Math.min(1, t10.noiseAmount * 1.6)};
                                filter:contrast(1.6) brightness(1.05);
                            "></div>
                            ` : ''}

                            <!-- Bottom Dark Glow (subtle black vignette instead of white) -->
                            <div style="position:absolute;left:0;right:0;bottom:0;height:${glowHeightPct}%;pointer-events:none;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;">
                                <div style="
                                    width:140%;
                                    height:260px;
                                    background:radial-gradient(
                                        circle at 50% 0%,
                                        rgba(0,0,0,${glowOpacity}) 0%,
                                        rgba(0,0,0,${glowOpacity * 0.7}) 32%,
                                        transparent 78%
                                    );
                                    filter:blur(46px);
                                    transform:translateY(34px);
                                "></div>
                            </div>

                            <!-- Headline (Bottom Center, Grunge) -->
                            <div style="position:absolute;bottom:0;left:0;right:0;padding:0 ${t10.paddingH}px ${t10.paddingBottom}px ${t10.paddingH}px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;z-index:30;pointer-events:none;">
                                <h1 
                                    data-ctx="headline" 
                                    title="Click to edit headline" 
                                    ondblclick="window.focusSidebarControl('t10-headline')"
                                    class="effect-grunge"
                                    style="
                                        margin:0;
                                        font-family:'${t10.customFontFamily || t10.fontFamily}', system-ui;
                                        font-size:${t10.fontSize}px;
                                        font-weight:${t10.fontWeight};
                                        line-height:${t10.lineHeight};
                                        text-align:${t10.textAlign || 'center'};
                                        color:${t10.headlineColor};
                                        opacity:0.85;
                                        pointer-events:auto;
                                        cursor:pointer;
                                        text-transform:uppercase;
                                    "
                                >${t10HeadlineHTML}</h1>
                            </div>

                            <!-- Swipe CTA (Bottom Center) — 3 styles -->
                            ${t10.showSwipe ? (() => {
                                const swFF  = window.escapeHtml(t10.swipeCustomFontFamily || t10.swipeFontFamily || t10.fontFamily || 'Rubik Dirt');
                                const swSz  = t10.swipeFontSize || 26;
                                const swCol = t10.swipeColor || '#ffffff';
                                const decoSz = Math.round(swSz * 0.52);
                                const baseStyle = `font-family:'${swFF}',system-ui;color:${swCol};font-size:${swSz}px;font-weight:700;letter-spacing:0.24em;text-transform:uppercase;line-height:1;`;
                                const decoStyle = `color:${swCol};opacity:0.45;font-size:${decoSz}px;letter-spacing:5px;font-family:sans-serif;line-height:1;`;

                                let inner = '';
                                if (t10.swipeStyle === 'chevron') {
                                    inner = `
                                        <span style="${decoStyle}">›&nbsp;›&nbsp;›</span>
                                        <span style="${baseStyle}margin:0 10px;">${safeT10Swipe}</span>
                                        <span style="${decoStyle}">›&nbsp;›&nbsp;›</span>`;
                                } else if (t10.swipeStyle === 'badge') {
                                    inner = `<span style="${baseStyle}border:1.5px solid ${swCol};border-radius:3px;padding:4px 14px;letter-spacing:0.3em;">${safeT10Swipe}</span>`;
                                } else {
                                    // 'text' — plain
                                    inner = `<span style="${baseStyle}">${safeT10Swipe}</span>`;
                                }
                                return `
                            <div style="position:absolute;left:0;right:0;bottom:30px;display:flex;justify-content:center;z-index:36;pointer-events:none;">
                                <div
                                    data-ctx="swipe"
                                    title="Click to edit swipe"
                                    ondblclick="window.focusSidebarControl('t10-swipe-text')"
                                    style="display:flex;align-items:center;pointer-events:auto;cursor:pointer;"
                                >${inner}</div>
                            </div>`;
                            })() : ''}

                            <!-- Watermark (Top-Right by default) -->
                            ${safeT10Watermark && t10.showWatermark ? `
                            <div
                                data-ctx="watermark"
                                title="Click to edit watermark"
                                ondblclick="window.focusSidebarControl('t10-watermark-url')"
                                style="
                                    position:absolute;
                                    ${t10WmLeft !== null ? `left:${t10WmLeft};` : ''}
                                    ${t10WmRight !== null ? `right:${t10WmRight};` : ''}
                                    ${t10WmTop !== null ? `top:${t10WmTop};` : ''}
                                    ${t10WmBottom !== null ? `bottom:${t10WmBottom};` : ''}
                                    transform:translate(${t10WmTX},${t10WmTY});
                                    cursor:pointer;
                                    opacity:${t10.watermarkOpacity};
                                    z-index:40;
                                "
                            >
                                <img
                                    src="${safeT10Watermark}"
                                    style="width:${t10.watermarkSize}px;height:auto;object-fit:contain;pointer-events:none;display:block;"
                                    onerror="this.style.display='none'"
                                    alt="Watermark"
                                >
                            </div>
                            ` : ''}

                        </div>
                    `);
                    return; // Done
                }

                // â”€â”€ TEMPLATE 1 setup â”€â”€
        const safeBgImage = window.escapeHtml(window.getCorsProxyUrl(window.state.post.bgImage));
        const safeOverlayUrl = s.overlayImgUrl ? window.escapeHtml(window.getCorsProxyUrl(s.overlayImgUrl)) : '';
        const safeLogoUrl = s.logoUrl ? window.escapeHtml(window.getCorsProxyUrl(s.logoUrl)) : '';
        const safeWatermarkUrl = s.watermarkUrl ? window.escapeHtml(window.getCorsProxyUrl(s.watermarkUrl)) : '';
        const safeBadgeText = window.escapeHtml(s.badgeText);
        const safeSourceText = window.escapeHtml(s.sourceText);
        const safeSwipeText = window.escapeHtml(s.swipeText || 'Swipe Left');
        const safeCaption = window.escapeHtml(window.state.post.caption);
                
                // Calculate watermark transform and positioning based on position
                // Clamp Y position to 0-100, but allow X to go beyond 100 for right-side positioning
        const clampedPosY = Math.max(0, Math.min(100, s.watermarkPosY));
        const posX = Math.max(0, s.watermarkPosX); // Allow values > 100 for right-side extension
                
        let watermarkTransformX = '-50%';
        let watermarkTransformY = '-50%';
        let watermarkLeft = null;
        let watermarkRight = null;
        let watermarkTop = null;
        let watermarkBottom = null;
                
                if (s.watermarkUrl) {
                    // Top row - anchor to top
                    if (clampedPosY <= 15) {
                        watermarkTransformY = '0%';
                        watermarkTop = `${clampedPosY}%`;
                    }
                    // Bottom row - anchor to bottom
                    // Use translate(0%) — bottom: X% already anchors the bottom edge, no extra shift needed
                    else if (clampedPosY >= 85) {
                        watermarkTransformY = '0%';
                        watermarkBottom = `${100 - clampedPosY}%`;
                    }
                    // Middle row - center vertically
                    else {
                        watermarkTop = `${clampedPosY}%`;
                    }
                    
                    // Left column - anchor to left (clamp to max 100% for left side)
                    if (posX <= 15) {
                        watermarkTransformX = '0%';
                        watermarkLeft = `${Math.min(100, posX)}%`;
                    }
                    // Right column - anchor to right
                    // Use translate(0%) — right: X% already anchors the right edge, no extra shift needed
                    else if (posX >= 85) {
                        watermarkTransformX = '0%';
                const rightValue = 100 - posX;
                        watermarkRight = `${rightValue}%`;
                    }
                    // Middle column - center horizontally
                    else {
                        watermarkLeft = `${posX}%`;
                    }
                }

                // Classic template layout (single, flexible template)
                setCanvasHtml(`
                    <div class="absolute inset-0 z-0 bg-black overflow-hidden" data-ctx="background" title="Click to edit background" ondblclick="window.focusSidebarControl('input-bg-image')" style="cursor:pointer;">
                        <img 
                            src="${safeBgImage}" 
                            style="width: 100%; height: 100%; object-fit: cover; object-position: ${s.imagePosX}% ${getObjectPositionY(s.imagePosY, s.imageScale)}%; transform: ${getImageTransform(s.imageScale, s.imagePosY)}; opacity: ${s.bgOpacity};" 
                            onerror="this.style.display='none'"
                            alt="Background"
                        >
                        <div class="absolute inset-0 pointer-events-none mix-blend-overlay" style="background-image: url('${window.NOISE_SVG}'); background-size: 200px 200px; background-repeat: repeat; opacity: ${s.bgNoise}"></div>
                    </div>
                    <div class="absolute inset-0 z-10" style="background: linear-gradient(to bottom, transparent 0%, transparent 40%, ${s.overlayColor} 85%, ${s.overlayColor} 100%)"></div>
                    <div class="absolute inset-0 z-10 pointer-events-none" style="background-color: ${s.overlayColor}; opacity: ${s.overlayOpacity}"></div>

                    ${safeOverlayUrl ? (() => {
                const glowSize = s.overlayGlowSize !== undefined ? s.overlayGlowSize : 1.0;
                const glowIntensity = s.overlayGlowIntensity !== undefined ? s.overlayGlowIntensity : 0.5;
                const baseSize = s.overlayImgSize;
                const hexColor = s.overlayGlowColor || s.overlayBorderColor || '#FF5500';
                        // Convert hex to rgb
                const r = parseInt(hexColor.slice(1, 3), 16);
                const g = parseInt(hexColor.slice(3, 5), 16);
                const b = parseInt(hexColor.slice(5, 7), 16);
                const glowShadow = s.showOverlayGlow ? (() => {
                    const size1 = baseSize * 0.4 * glowSize;
                    const spread1 = baseSize * 0.2 * glowSize;
                    const size2 = baseSize * 0.6 * glowSize;
                    const spread2 = baseSize * 0.3 * glowSize;
                    const size3 = baseSize * 0.8 * glowSize;
                    const spread3 = baseSize * 0.4 * glowSize;
                    const opacity1 = glowIntensity * 0.5;
                    const opacity2 = glowIntensity * 0.375;
                    const opacity3 = glowIntensity * 0.25;
                            return `0 0 ${size1}px ${spread1}px rgba(${r}, ${g}, ${b}, ${opacity1}), 0 0 ${size2}px ${spread2}px rgba(${r}, ${g}, ${b}, ${opacity2}), 0 0 ${size3}px ${spread3}px rgba(${r}, ${g}, ${b}, ${opacity3})`;
                        })() : '0 10px 25px rgba(0,0,0,0.3)';
                        return `
                        <div class="absolute z-[15] rounded-full overflow-hidden ${s.showOverlay !== false ? '' : 'ctx-ghost'}" data-ctx="circle-overlay" title="Click to edit circle" ondblclick="window.focusSidebarControl('input-overlay-url')" style="width: ${s.overlayImgSize}px; height: ${s.overlayImgSize}px; left: ${s.overlayImgPosX}%; top: ${s.overlayImgPosY}%; transform: translate(-50%, -50%); border: ${s.showOverlayBorder !== false && s.overlayBorderWidth > 0 ? `${s.overlayBorderWidth}px solid ${s.overlayBorderColor}` : 'none'}; box-shadow: ${glowShadow}; cursor:pointer;">
                            <img 
                                src="${safeOverlayUrl}" 
                                style="width: 100%; height: 100%; object-fit: cover;" 
                                onerror="this.style.display='none'"
                                alt="Overlay"
                            >
                            <div class="absolute inset-0 pointer-events-none mix-blend-overlay" style="background-image: url('${window.NOISE_SVG}'); background-size: 200px 200px; background-repeat: repeat; opacity: ${s.overlayNoise}"></div>
                        </div>
                        `;
                    })() : ''}

                    ${safeLogoUrl ? `
                        <div class="absolute top-10 left-10 z-30 ${s.showLogo !== false ? '' : 'ctx-ghost'}" data-ctx="logo" title="Click to edit logo" ondblclick="window.focusSidebarControl('input-logoUrl')" style="opacity: ${s.logoOpacity}; width: ${s.logoSize}px; cursor:pointer;">
                            <img 
                                src="${safeLogoUrl}" 
                                style="width: 100%; height: auto; filter: drop-shadow(0 10px 8px rgb(0 0 0 / 0.04)) drop-shadow(0 4px 3px rgb(0 0 0 / 0.1));" 
                                onerror="this.style.display='none'"
                                alt="Logo"
                            >
                        </div>
                    ` : ''}
                    
                    <div class="absolute top-12 right-10 z-30 flex flex-col items-end gap-2">
                        <div class="font-bold uppercase drop-shadow-md flex items-center gap-2 ${s.showSwipeBadge ? '' : 'ctx-ghost'}" data-ctx="swipe-left" title="Click to edit" ondblclick="window.focusSidebarControl('input-showSwipeBadge')" style="font-family: ${s.customSwipeFontFamily || s.swipeFontFamily || 'Inter'}, sans-serif; font-size: ${s.swipeFontSize || 20}px; color: ${s.swipeTextColor || s.swipeColor || '#FFFFFF'}; opacity: ${s.swipeOpacity !== undefined ? s.swipeOpacity : 0.9}; letter-spacing: ${s.swipeLetterSpacing !== undefined ? s.swipeLetterSpacing : 0.1}em; cursor:pointer;">
                            ${safeSwipeText} ${(s.swipeShowIcon !== false) ? `<i data-lucide="chevron-right" style="width: ${s.swipeIconSize || 24}px; height: ${s.swipeIconSize || 24}px; stroke-width: 3px; color: ${s.swipeColor || '#FFFFFF'};"></i>` : ''}
                        </div>
                    </div>

                    <div class="absolute inset-0 z-20 flex flex-col justify-end p-16" style="pointer-events:none;">
                        <div class="flex flex-col items-start gap-6 mb-8">
                            <div class="bg-white text-black px-4 py-1 text-xl font-bold uppercase tracking-wider mb-2 shadow-lg ${s.showNewsBadge ? '' : 'ctx-ghost'}" data-ctx="badge" title="Click to edit badge" ondblclick="window.focusSidebarControl('input-badgeText')" style="font-family: 'Archivo Black', sans-serif; cursor:pointer; pointer-events:auto;">
                                ${safeBadgeText}
                            </div>
                            <h1 class="uppercase break-words w-full" data-ctx="headline" title="Click to edit text" ondblclick="window.focusSidebarControl('input-headline')" style="font-family: ${s.customFontFamily || s.fontFamily}; font-size: ${s.fontSize}px; line-height: ${s.lineHeight}; letter-spacing: ${s.letterSpacing}em; text-shadow: 0 4px 20px rgba(0,0,0,0.6); cursor:pointer; pointer-events:auto;">
                                ${headlineHTML}
                            </h1>
                            ${safeCaption ? `
                                <p class="text-neutral-200 text-2xl font-medium leading-relaxed opacity-90 max-w-[95%] drop-shadow-md" data-ctx="caption" title="Click to edit caption" ondblclick="window.focusSidebarControl('input-caption')" style="cursor:pointer; pointer-events:auto;">
                                    ${safeCaption}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="absolute bottom-8 right-12 z-30 text-right ${s.showSource ? '' : 'ctx-ghost'}" data-ctx="source" title="Click to edit source" ondblclick="window.focusSidebarControl('input-source')" style="cursor:pointer;">
                        <p class="text-lg text-neutral-400 uppercase tracking-widest font-bold opacity-60 drop-shadow-md font-sans">
                            ${safeSourceText}
                        </p>
                    </div>
                    ${s.watermarkUrl ? `
                        <div class="absolute z-40 ${s.showWatermark ? '' : 'ctx-ghost'}" data-ctx="watermark" title="Click to edit watermark" ondblclick="window.focusSidebarControl('input-watermarkUrl')" style="${watermarkLeft !== null ? `left: ${watermarkLeft};` : ''}${watermarkRight !== null ? `right: ${watermarkRight};` : ''}${watermarkTop !== null ? `top: ${watermarkTop};` : ''}${watermarkBottom !== null ? `bottom: ${watermarkBottom};` : ''} transform: translate(${watermarkTransformX}, ${watermarkTransformY}); opacity: ${s.watermarkOpacity}; cursor:pointer;">
                            <img 
                                src="${safeWatermarkUrl}" 
                                style="width: ${s.watermarkSize}px; height: auto; object-fit: contain; pointer-events:none; display: block;" 
                                onerror="this.style.display='none'"
                                alt="Watermark"
                            >
                        </div>
                    ` : ''}
                `);
            } else {
                // Highlight
        const h = window.state.highlight;
                root.style.width = `${window.CONSTANTS.HIGHLIGHT_SIZE}px`;
                root.style.height = `${window.CONSTANTS.HIGHLIGHT_SIZE}px`;
                root.style.backgroundColor = h.bgColor;
                
                let iconHTML = '';
                if (h.iconType === 'custom' && h.customIconUrl) {
                    iconHTML = `<img src="${window.escapeHtml(window.getCorsProxyUrl(h.customIconUrl))}" style="width: ${h.iconSize}px; height: ${h.iconSize}px; object-fit: contain;" onerror="this.style.display='none'" alt="Custom icon">`;
                } else if (h.iconType === 'fa' && h.faClass) {
                    iconHTML = `<i class="${window.escapeHtml(h.faClass)}" style="font-size: ${h.iconSize}px; color: ${h.iconColor}"></i>`;
                } else {
                    // Lucide icon - use iconMap to get correct Lucide name
                    const iconDisplayName = h.iconName || 'Mic';
                    const lucideIconName = window.HIGHLIGHT_ICON_MAP[iconDisplayName] || 'mic';
                    iconHTML = `<i data-lucide="${lucideIconName}" style="width: ${h.iconSize}px; height: ${h.iconSize}px; color: ${h.iconColor}"></i>`;
                }

                const safeBgImage = (h.showBgImage && h.bgImage) ? window.escapeHtml(window.getCorsProxyUrl(h.bgImage)) : '';

                setCanvasHtml(`
                    <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
                        ${safeBgImage ? `
                            <div class="absolute inset-0 z-0">
                                <img 
                                    src="${safeBgImage}" 
                                    style="width: 100%; height: 100%; object-fit: cover; object-position: ${h.imagePosX}% ${getObjectPositionY(h.imagePosY, h.imageScale)}%; transform: ${getImageTransform(h.imageScale, h.imagePosY)}; opacity: ${h.bgOpacity};" 
                                    onerror="this.style.display='none'"
                                    alt="Background"
                                >
                            </div>
                        ` : ''}
                        <div class="absolute rounded-full border-solid box-border" data-ctx="highlight-ring" title="Click to edit ring" style="width: 90%; height: 90%; border-color: ${h.ringColor}; border-width: ${h.ringWidth}px; cursor:pointer; z-index: 5;"></div>
                        <div class="flex items-center justify-center z-10" data-ctx="highlight-icon" title="Click to edit icon" style="cursor:pointer;">${iconHTML}</div>
                    </div>
                `);
            }
        }

// Make globally available
if (typeof window !== 'undefined') {
    window.renderApp = renderApp;
    window.setMode = setMode;
    window.setActiveTab = setActiveTab;
    window.renderTabs = renderTabs;
    window.renderSidebarContent = renderSidebarContent;
    window.renderCanvas = renderCanvas;
}

