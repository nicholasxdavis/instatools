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
        const isT2orT3 = tmpl === 'template2' || tmpl === 'template3' || tmpl === 'template4' || tmpl === 'template5' || tmpl === 'template6';
        // T2/T3/T4/T5/T6 have no separate Design tab — everything is in the Editor tab
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
                const isNoDesignTab = isT2orT3 || tmpl === 'template4' || tmpl === 'template5' || tmpl === 'template6';

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
    const root = document.getElementById('canvas-root');
            if (!root) return;

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
                root.style.height = `${window.CONSTANTS.POST_HEIGHT}px`;

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

                    root.innerHTML = `
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
                                    style="width:100%;height:100%;object-fit:cover;object-position:${t2.imagePosX}% ${t2.imagePosY}%;transform:scale(${t2.imageScale/100});"
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
                    `;
                    return; // Done â€” skip template1 rendering below
                }

                // ── TEMPLATE 5 CANVAS (Dual Image: two side-by-side photos + colored headline + arrow + dots) ──
                // ── TEMPLATE 6 CANVAS (Sports / Hurdels: full-bleed bg + cinematic gradient + circle inset + brand text + headline + >>> SWIPE >>> + dots) ──
                if (window.state.post.template === 'template6') {
            const t6 = window.state.post.t6;
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

            // ── >>> SWIPE >>> ──
            // Decorative right-pointing chevrons (›) flank the swipe word
            const decoSize   = Math.round(t6.swipeFontSize * 0.52);
            const swipeBlock = t6.showSwipe ? `
                <div
                    data-ctx="swipe"
                    title="Click to edit swipe text"
                    ondblclick="window.focusSidebarControl('t6-swipe-text')"
                    style="display:flex;align-items:center;gap:13px;cursor:pointer;pointer-events:auto;"
                >
                    <span style="color:${t6.swipeColor};opacity:0.45;font-size:${decoSize}px;letter-spacing:5px;font-family:sans-serif;line-height:1;">›&nbsp;›&nbsp;›</span>
                    <span style="font-family:'${t6.swipeFontFamily}',sans-serif;color:${t6.swipeColor};font-size:${t6.swipeFontSize}px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;line-height:1;">${window.escapeHtml(t6.swipeText)}</span>
                    <span style="color:${t6.swipeColor};opacity:0.45;font-size:${decoSize}px;letter-spacing:5px;font-family:sans-serif;line-height:1;">›&nbsp;›&nbsp;›</span>
                </div>` : '';

                    root.innerHTML = `
                        <div style="position:absolute;inset:0;overflow:hidden;background:#000;">

                            <!-- ① Background image -->
                            <div
                                data-ctx="background"
                                title="Click to edit background"
                                style="position:absolute;inset:0;cursor:pointer;"
                            >
                                <img
                                    src="${safeBg}"
                                    style="width:100%;height:100%;object-fit:cover;object-position:${t6.imagePosX}% ${t6.imagePosY}%;transform:scale(${t6.imageScale / 100});transform-origin:center center;opacity:${t6.bgOpacity};"
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
                                style="position:absolute;left:${t6.circlePosX}%;top:${t6.circlePosY}%;transform:translate(-50%,-50%);width:${t6.circleSize}px;height:${t6.circleSize}px;border-radius:50%;overflow:hidden;border:${t6.circleBorderWidth}px solid ${t6.circleBorderColor};cursor:pointer;z-index:20;box-shadow:0 6px 28px rgba(0,0,0,0.5);background:#1a1a1a;flex-shrink:0;"
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
                                ondblclick="window.focusSidebarControl('t6-brand-text')"
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
                                    ondblclick="window.focusSidebarControl('t6-headline')"
                                    style="margin:0;padding:0;font-family:'${t6.customFontFamily || t6.fontFamily}',sans-serif;font-size:${t6.fontSize}px;font-weight:${t6.fontWeight};line-height:${t6.lineHeight};letter-spacing:${t6.letterSpacing}em;text-transform:uppercase;text-align:left;word-break:break-word;cursor:pointer;pointer-events:auto;"
                                >${t6HeadlineHTML}</h1>
                            </div>

                            <!-- ⑦ Bottom navigation: >>> SWIPE >>> + dots -->
                            <div style="position:absolute;bottom:0;left:0;right:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:26px;gap:10px;pointer-events:none;">
                                ${swipeBlock}
                                ${t6DotsHtml}
                            </div>

                        </div>
                    `;
                    return; // Done — skip template1 rendering below
                }

                // ── TEMPLATE 5 CANVAS (Dual Image: two side-by-side photos + colored headline + arrow + dots) ──
                if (window.state.post.template === 'template5') {
            const t5 = window.state.post.t5;
            const safeLeft  = window.escapeHtml(window.getCorsProxyUrl(t5.imageLeft));
            const safeRight = window.escapeHtml(window.getCorsProxyUrl(t5.imageRight));
            const imgHeightPx = Math.round((t5.imageSplit / 100) * window.CONSTANTS.POST_HEIGHT);

            // Parse headline: [word] = highlightColor, plain = headlineColor
            const t5Parts = t5.headline.split(/(\[.*?\])/);
            const t5HeadlineHTML = t5Parts.map(part => {
                if (part.startsWith('[') && part.endsWith(']')) {
                    return `<span style="color:${t5.highlightColor}">${window.escapeHtml(part.slice(1, -1))}</span>`;
                }
                return `<span style="color:${t5.headlineColor}">${window.escapeHtml(part)}</span>`;
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

            // Arrow HTML (left-pointing arrow, thin with arrowhead)
            const arrowSvg = t5.showArrow ? `<svg width="70" height="20" viewBox="0 0 70 20" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;"><line x1="68" y1="10" x2="2" y2="10" stroke="${t5.arrowColor}" stroke-width="2"/><polyline points="14,2 2,10 14,18" fill="none" stroke="${t5.arrowColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>` : '';

            // Separator between images
            const sepStyle = t5.imageSeparator ? `border-left:${t5.separatorWidth}px solid ${t5.separatorColor};` : '';

                    root.innerHTML = `
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
                                        style="width:100%;height:100%;object-fit:cover;object-position:${t5.leftPosX}% ${t5.leftPosY}%;transform:scale(${t5.leftScale/100});transform-origin:center center;"
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
                                        style="width:100%;height:100%;object-fit:cover;object-position:${t5.rightPosX}% ${t5.rightPosY}%;transform:scale(${t5.rightScale/100});transform-origin:center center;"
                                        onerror="this.style.display='none'"
                                        alt="Right image"
                                    >
                                </div>

                            </div>

                            <!-- BOTTOM: text block -->
                            <div style="flex:1;background:${t5.bgColor};display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:${t5.paddingV}px ${t5.paddingH}px ${Math.round(t5.paddingV * 0.7)}px;position:relative;overflow:hidden;">

                                <!-- HEADLINE -->
                                <h1
                                    data-ctx="headline"
                                    title="Click to edit headline"
                                    ondblclick="window.focusSidebarControl('t5-headline')"
                                    style="margin:0;font-family:'${t5.customFontFamily || t5.fontFamily}',sans-serif;font-size:${t5.fontSize}px;font-weight:${t5.fontWeight};text-transform:uppercase;text-align:${t5.textAlign};line-height:${t5.lineHeight};letter-spacing:${t5.letterSpacing}em;word-break:break-word;width:100%;cursor:pointer;"
                                >${t5HeadlineHTML}</h1>

                                <!-- ARROW + DOTS -->
                                <div style="display:flex;flex-direction:column;align-items:center;gap:10px;">
                                    ${arrowSvg}
                                    ${t5DotsHtml}
                                </div>

                            </div>

                        </div>

                        <!-- BRAND BADGE: absolutely positioned top-left corner -->
                        ${t5.showBrand ? `
                        <div
                            data-ctx="brand"
                            title="Click to edit brand"
                            ondblclick="window.focusSidebarControl('t5-brand-text')"
                            style="position:absolute;top:28px;left:28px;z-index:30;cursor:pointer;display:flex;align-items:center;gap:0;"
                        >
                            <div style="width:${t5.brandFontSize * 2.2}px;height:${t5.brandFontSize * 2.2}px;border-radius:50%;background:${t5.brandBgColor};border:2px solid ${t5.brandBorderColor};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <span style="font-family:'Archivo Black',sans-serif;font-size:${t5.brandFontSize}px;font-weight:900;color:${t5.brandTextColor};letter-spacing:-0.02em;line-height:1;">${window.escapeHtml(t5.brandText)}</span>
                            </div>
                        </div>
                        ` : ''}
                    `;
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

                    root.innerHTML = `
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
                                    style="width:100%;height:100%;object-fit:cover;object-position:${t4.imagePosX}% ${t4.imagePosY}%;transform:scale(${t4.imageScale/100});transform-origin:center center;"
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
                    `;
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

                    root.innerHTML = `
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
                                    style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:${t3.imagePosX}% ${t3.imagePosY}%;transform:scale(${t3.imageScale/100});transform-origin:center center;"
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
                    `;
                    return; // Done â€” skip template1 rendering below
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
                root.innerHTML = `
                    <div class="absolute inset-0 z-0 bg-black overflow-hidden" data-ctx="background" title="Click to edit background" ondblclick="window.focusSidebarControl('input-bg-image')" style="cursor:pointer;">
                        <img 
                            src="${safeBgImage}" 
                            style="width: 100%; height: 100%; object-fit: cover; object-position: ${s.imagePosX}% ${s.imagePosY}%; transform: scale(${s.imageScale/100}); opacity: ${s.bgOpacity};" 
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
                `;
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

                root.innerHTML = `
                    <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
                        <div class="absolute rounded-full border-solid box-border" data-ctx="highlight-ring" title="Click to edit ring" style="width: 90%; height: 90%; border-color: ${h.ringColor}; border-width: ${h.ringWidth}px; cursor:pointer;"></div>
                        <div class="flex items-center justify-center z-10" data-ctx="highlight-icon" title="Click to edit icon" style="cursor:pointer;">${iconHTML}</div>
                    </div>
                `;
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

