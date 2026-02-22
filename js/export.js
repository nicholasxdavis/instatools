/**
 * Export Engine — Canvas 2D API (pixel-perfect)
 *
 * Replaces html2canvas entirely. Draws every layer from state using the
 * Canvas 2D API so the result is guaranteed 1-to-1 with the preview:
 *   • Circle overlay uses arc() + clip() — never bleeds outside the ring
 *   • object-fit:cover simulated precisely for every image
 *   • Full letter-spacing, text-shadow, opacity, glow support
 *   • All three post templates + highlight creator
 */

// ─── CORS proxy helpers ────────────────────────────────────────────────────────
// Never draw a non-CORS image into canvas — that taints it and blocks toBlob().
// We try the original URL first (works when the host sends CORS headers), then
// fall through to public CORS proxies, then give up gracefully (null = skip).
const _CORS_PROXIES = [
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function loadImg(src) {
    if (!src) return null;

    // Build candidate list: original URL first, then proxied copies
    const candidates = [src, ..._CORS_PROXIES.map(fn => fn(src))];

    for (const url of candidates) {
        const img = await new Promise(resolve => {
            const el        = new Image();
            el.crossOrigin  = 'anonymous'; // ALWAYS — never taint the canvas
            el.onload       = () => resolve(el);
            el.onerror      = () => resolve(null);
            el.src          = url;
            setTimeout(() => resolve(null), 8000);
        });
        if (img) return img; // got it — stop trying
    }

    // All attempts failed — caller will skip drawing this image
    console.warn('[export] Could not load image (CORS blocked by all proxies):', src);
    return null;
}

// ─── Object-fit: cover + object-position + CSS-scale ──────────────────────────
// Mirrors:  width:100%; height:100%; object-fit:cover;
//           object-position: posX% posY%; transform:scale(scale)
function drawCover(ctx, img, dx, dy, dw, dh, posX, posY, scale) {
    if (!img) return;
    const iW = img.naturalWidth  || img.width;
    const iH = img.naturalHeight || img.height;
    if (!iW || !iH) return;

    posX  = posX  ?? 50;
    posY  = posY  ?? 50;
    scale = scale ?? 1;

    // cover: fill the dest box, then multiply by zoom scale
    const iA = iW / iH, dA = dw / dh;
    let fitW, fitH;
    if (iA > dA) { fitH = dh; fitW = fitH * iA; }
    else          { fitW = dw; fitH = fitW / iA; }
    fitW *= scale;
    fitH *= scale;

    const ox = dx + (dw - fitW) * (posX / 100);
    const oy = dy + (dh - fitH) * (posY / 100);

    ctx.save();
    ctx.beginPath();
    ctx.rect(dx, dy, dw, dh);
    ctx.clip();
    ctx.drawImage(img, ox, oy, fitW, fitH);
    ctx.restore();
}

// ─── Font pre-load ─────────────────────────────────────────────────────────────
async function loadFont(spec) {
    try { await document.fonts.load(spec); } catch (_) { /* ignore */ }
}

// ─── Letter-spacing helper (CSS string, modern browsers) ──────────────────────
function setLS(ctx, px) {
    try { ctx.letterSpacing = px + 'px'; } catch (_) { /* fallback: no spacing */ }
}

// ─── Measure text width respecting current ctx font ───────────────────────────
function mW(ctx, t) { return ctx.measureText(t).width; }

// ─── Simple word-wrap → string[] ──────────────────────────────────────────────
function wrapSimple(ctx, text, maxW) {
    const words = (text || '').split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
        if (!w) continue;
        const test = cur ? cur + ' ' + w : w;
        if (cur && mW(ctx, test) > maxW) { lines.push(cur); cur = w; }
        else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
}

// ─── Parse headline into [{word, color}] ──────────────────────────────────────
function parseHL(hl, s) {
    const parts = (hl || '').split(/(\[.*?\]|\{.*?\})/);
    const out = [];
    for (const p of parts) {
        let color, raw;
        if (p.startsWith('[') && p.endsWith(']')) {
            raw = p.slice(1, -1);
            color = s.useBracketColor ? s.highlightColor : s.primaryColor;
        } else if (p.startsWith('{') && p.endsWith('}')) {
            raw = p.slice(1, -1);
            color = s.useBraceColor ? s.secondaryColor : s.primaryColor;
        } else {
            raw = p; color = s.primaryColor;
        }
        raw.toUpperCase().split(/\s+/).forEach(w => { if (w) out.push({ word: w, color }); });
    }
    return out;
}

// ─── Wrap colored words → Array<Array<{word,color}>> ──────────────────────────
function wrapColored(ctx, words, maxW) {
    const lines = [];
    let line = [], lineW = 0;
    const sp = mW(ctx, ' ');
    for (const item of words) {
        const wW = mW(ctx, item.word);
        const add = line.length ? sp + wW : wW;
        if (line.length && lineW + add > maxW) {
            lines.push(line); line = [item]; lineW = wW;
        } else {
            line.push(item); lineW += add;
        }
    }
    if (line.length) lines.push(line);
    return lines;
}

// ─── Draw colored lines, return Y after last line ─────────────────────────────
function drawColoredLines(ctx, lines, x, y, lineH) {
    const sp = mW(ctx, ' ');
    for (const line of lines) {
        let cx = x;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, cx, y);
            cx += mW(ctx, line[i].word);
            if (i < line.length - 1) cx += sp;
        }
        y += lineH;
    }
    return y;
}

// ─── Hex → {r,g,b} ────────────────────────────────────────────────────────────
function h2rgb(hex) {
    if (!hex || hex.length < 7) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16),
    };
}

// ─── Watermark position (mirrors the CSS left/right/top/bottom logic) ──────────
// containerX/Y: top-left origin of the positioning container in canvas coords
function calcWmXY(posX, posY, contW, contH, wmW, wmH, contX, contY) {
    contX = contX || 0; contY = contY || 0;
    const cy = Math.max(0, Math.min(100, posY || 0));
    const cx = Math.max(0, posX || 0);
    let x, y;

    if (cx <= 15)      x = contX + (Math.min(100, cx) / 100) * contW;
    else if (cx >= 85) x = contX + contW - ((100 - cx) / 100) * contW - wmW;
    else               x = contX + (cx / 100) * contW - wmW / 2;

    if (cy <= 15)      y = contY + (cy / 100) * contH;
    else if (cy >= 85) y = contY + contH - ((100 - cy) / 100) * contH - wmH;
    else               y = contY + (cy / 100) * contH - wmH / 2;

    return { x, y };
}

// ─── TEMPLATE 1 (Classic News) ────────────────────────────────────────────────
async function exportT1(ctx, state, W, H) {
    const s    = state.post.style;
    const post = state.post;
    const PAD  = 64; // p-16 in Tailwind = 64px

    // Load all images in parallel
    const [bgImg, ovlImg, logoImg, wmImg] = await Promise.all([
        loadImg(post.bgImage),
        (s.overlayImgUrl && s.showOverlay !== false) ? loadImg(s.overlayImgUrl) : null,
        s.logoUrl    ? loadImg(s.logoUrl)    : null,
        s.watermarkUrl ? loadImg(s.watermarkUrl) : null,
    ]);

    // Ensure fonts are loaded before drawing text
    const ff   = s.customFontFamily || s.fontFamily || 'Archivo Black';
    const fs   = s.fontSize || 85;
    const swFF = s.customSwipeFontFamily || s.swipeFontFamily || 'Inter';
    const swFS = s.swipeFontSize || 20;
    await Promise.all([
        loadFont(`900 ${fs}px "${ff}"`),
        loadFont(`bold 21px "Archivo Black"`),
        loadFont(`500 24px "Inter"`),
        loadFont(`bold ${swFS}px "${swFF}"`),
    ]);

    // ── Layer 1: Black base ───────────────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Layer 2: Background image ─────────────────────────────────────────────
    if (bgImg) {
        ctx.save();
        ctx.globalAlpha = s.bgOpacity ?? 1;
        drawCover(ctx, bgImg, 0, 0, W, H,
            s.imagePosX ?? 50, s.imagePosY ?? 50, (s.imageScale ?? 100) / 100);
        ctx.restore();
    }

    // ── Layer 3: Gradient overlay (transparent → dark) ────────────────────────
    {
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0,    'rgba(0,0,0,0)');
        g.addColorStop(0.4,  'rgba(0,0,0,0)');
        g.addColorStop(0.85, s.overlayColor || '#000');
        g.addColorStop(1,    s.overlayColor || '#000');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    // ── Layer 4: Flat colour overlay ──────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = s.overlayOpacity ?? 0.5;
    ctx.fillStyle   = s.overlayColor || '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Layer 5: Circle overlay (pixel-perfect arc clip) ─────────────────────
    if (ovlImg && s.showOverlay !== false) {
        const sz  = s.overlayImgSize || 450;
        const cx  = (s.overlayImgPosX / 100) * W;
        const cy  = (s.overlayImgPosY / 100) * H;
        const r   = sz / 2;
        const bW  = (s.showOverlayBorder !== false && (s.overlayBorderWidth || 0) > 0)
                    ? s.overlayBorderWidth : 0;
        const ir  = Math.max(1, r - bW); // inner radius for image clip

        // Glow (3 layered shadows, matching the CSS box-shadow)
        if (s.showOverlayGlow) {
            const gc    = s.overlayGlowColor || s.overlayBorderColor || '#FF5500';
            const gSz   = s.overlayGlowSize     ?? 1.0;
            const gInt  = s.overlayGlowIntensity ?? 0.5;
            const { r: gr, g: gg, b: gb } = h2rgb(gc);
            for (const [blur, alpha] of [
                [sz * 0.4 * gSz, gInt * 0.50],
                [sz * 0.6 * gSz, gInt * 0.375],
                [sz * 0.8 * gSz, gInt * 0.25],
            ]) {
                ctx.save();
                ctx.shadowColor  = `rgba(${gr},${gg},${gb},${alpha})`;
                ctx.shadowBlur   = blur;
                // Draw near-invisible filled circle to trigger the shadow
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${gr},${gg},${gb},0.001)`;
                ctx.fill();
                ctx.restore();
            }
        }

        // Image clipped to inner circle (PERFECT — no bleed)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ir, 0, Math.PI * 2);
        ctx.clip();
        drawCover(ctx, ovlImg, cx - ir, cy - ir, ir * 2, ir * 2, 50, 50, 1);
        ctx.restore();

        // Border ring
        if (bW > 0 && s.showOverlayBorder !== false) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cx, cy, r - bW / 2, 0, Math.PI * 2);
            ctx.strokeStyle = s.overlayBorderColor || '#FF5500';
            ctx.lineWidth   = bW;
            ctx.stroke();
            ctx.restore();
        }
    }

    // ── Layer 6: Logo ─────────────────────────────────────────────────────────
    if (logoImg && s.showLogo !== false && s.logoUrl) {
        ctx.save();
        ctx.globalAlpha   = s.logoOpacity ?? 1;
        ctx.shadowColor   = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur    = 14;
        ctx.shadowOffsetY = 4;
        const lW = s.logoSize || 150;
        const lH = (logoImg.naturalHeight / logoImg.naturalWidth) * lW;
        ctx.drawImage(logoImg, 40, 40, lW, lH);
        ctx.restore();
    }

    // ── Layer 7: Swipe Left badge ─────────────────────────────────────────────
    if (s.showSwipeBadge !== false) {
        const swClr = s.swipeTextColor || s.swipeColor || '#FFF';
        const swOp  = s.swipeOpacity ?? 0.9;
        const swLS  = (s.swipeLetterSpacing ?? 0.1) * swFS;
        const arrow = s.swipeShowIcon !== false ? '  ›' : '';
        const swTxt = (s.swipeText || 'Swipe Left').toUpperCase() + arrow;

        ctx.save();
        ctx.globalAlpha  = swOp;
        ctx.fillStyle    = swClr;
        ctx.font         = `bold ${swFS}px "${swFF}", sans-serif`;
        setLS(ctx, swLS);
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText(swTxt, W - 40, 48);
        ctx.restore();
    }

    // ── Bottom content block: flex-col justify-end p-16 gap-6 mb-8 ───────────
    // Padding = 64px, mb-8 = 32px
    const lh   = s.lineHeight    ?? 0.9;
    const lsEm = s.letterSpacing ?? -0.02;
    const lsPx = lsEm * fs;

    // Set font & measure headline
    ctx.font = `900 ${fs}px "${ff}", sans-serif`;
    setLS(ctx, lsPx);

    const hlWords = parseHL(post.headline, s);
    const hlLines = wrapColored(ctx, hlWords, W - PAD * 2);
    const lineH   = Math.round(fs * lh);
    const hlH     = hlLines.length * lineH;

    // Caption
    let capLines = [];
    const capText = (post.caption || '').trim();
    if (capText) {
        ctx.save();
        ctx.font = '500 24px "Inter", sans-serif';
        setLS(ctx, 0);
        capLines = wrapSimple(ctx, capText, W - PAD * 2);
        ctx.restore();
    }
    const CAP_LH = 38; // 24px font × ~1.6 line-height
    const capH   = capLines.length > 0 ? capLines.length * CAP_LH : 0;

    const badgeOn = s.showNewsBadge !== false;
    const BADGE_H = 40;
    const badgeH  = badgeOn ? BADGE_H + 24 : 0; // height + gap-6

    const totalH  = badgeH + hlH + (capH ? 24 + capH : 0);
    // Bottom anchor: H - bottom_pad - mb-8
    let y = H - PAD - 32 - totalH;

    // ── News badge ────────────────────────────────────────────────────────────
    if (badgeOn) {
        const bt = (s.badgeText || 'NEWS').toUpperCase();
        ctx.save();
        ctx.font         = 'bold 21px "Archivo Black", sans-serif';
        setLS(ctx, 0.08 * 21);
        ctx.textBaseline = 'middle';
        const bMetrics   = ctx.measureText(bt);
        const bPH        = 16; // px-4
        const bW2        = bMetrics.width + bPH * 2;
        ctx.fillStyle    = '#FFF';
        ctx.fillRect(PAD, y, bW2, BADGE_H);
        ctx.fillStyle    = '#000';
        ctx.fillText(bt, PAD + bPH, y + BADGE_H / 2 + 1);
        ctx.restore();
        y += BADGE_H + 24;
    }

    // ── Headline (multi-color, text-shadow) ───────────────────────────────────
    ctx.save();
    ctx.font          = `900 ${fs}px "${ff}", sans-serif`;
    setLS(ctx, lsPx);
    ctx.textBaseline  = 'top';
    ctx.shadowColor   = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur    = 20;
    ctx.shadowOffsetY = 4;
    y = drawColoredLines(ctx, hlLines, PAD, y, lineH);
    ctx.restore();

    // ── Caption ───────────────────────────────────────────────────────────────
    if (capLines.length > 0) {
        y += 24; // gap-6
        ctx.save();
        ctx.globalAlpha  = 0.9;
        ctx.fillStyle    = '#e5e5e5';
        ctx.font         = '500 24px "Inter", sans-serif';
        setLS(ctx, 0);
        ctx.textBaseline = 'top';
        for (const ln of capLines) { ctx.fillText(ln, PAD, y); y += CAP_LH; }
        ctx.restore();
    }

    // ── Source ────────────────────────────────────────────────────────────────
    if (s.showSource !== false) {
        ctx.save();
        ctx.globalAlpha  = 0.6;
        ctx.fillStyle    = '#a3a3a3';
        ctx.font         = 'bold 18px sans-serif';
        setLS(ctx, 0.1 * 18);
        ctx.textAlign    = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText((s.sourceText || '').toUpperCase(), W - 48, H - 32);
        ctx.restore();
    }

    // ── Watermark ─────────────────────────────────────────────────────────────
    if (wmImg && s.showWatermark !== false && s.watermarkUrl) {
        ctx.save();
        ctx.globalAlpha = s.watermarkOpacity ?? 0.8;
        const wmW = s.watermarkSize || 323;
        const wmH = (wmImg.naturalHeight / wmImg.naturalWidth) * wmW;
        const { x: wx, y: wy } = calcWmXY(
            s.watermarkPosX ?? 0, s.watermarkPosY ?? 0, W, H, wmW, wmH);
        ctx.drawImage(wmImg, wx, wy, wmW, wmH);
        ctx.restore();
    }
}

// ─── TEMPLATE 2 (Clean / No Jumper) ──────────────────────────────────────────
async function exportT2(ctx, state, W, H) {
    const t2 = state.post.t2;

    const [bgImg, wmImg] = await Promise.all([
        loadImg(t2.bgImage),
        t2.watermarkUrl ? loadImg(t2.watermarkUrl) : null,
    ]);

    const ff = t2.customFontFamily || t2.fontFamily || 'DM Sans';
    const fs = t2.fontSize  || 67;
    const fw = t2.fontWeight || 400;
    await loadFont(`${fw} ${fs}px "${ff}"`);

    // ── White background ──────────────────────────────────────────────────────
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, W, H);

    // ── Measure the white top bar height from headline ────────────────────────
    // CSS: padding 40px 44px 36px 44px, font line-height 1.22
    const PAD_H = 44, PAD_T = 40, PAD_B = 36;
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, -0.01 * fs);
    ctx.textBaseline = 'top';
    const hlLines  = wrapSimple(ctx, t2.headline || '', W - PAD_H * 2);
    const hlLineH  = Math.round(fs * 1.22);
    const hlH      = hlLines.length * hlLineH;
    const topBarH  = PAD_T + hlH + PAD_B;

    // ── White top bar ─────────────────────────────────────────────────────────
    ctx.fillStyle = '#FFF';
    ctx.fillRect(0, 0, W, topBarH);

    // ── Headline text ─────────────────────────────────────────────────────────
    ctx.save();
    ctx.font         = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, -0.01 * fs);
    ctx.fillStyle    = '#000';
    ctx.textBaseline = 'top';
    let ty = PAD_T;
    for (const ln of hlLines) { ctx.fillText(ln, PAD_H, ty); ty += hlLineH; }
    ctx.restore();

    // ── Background image (fills remaining height) ─────────────────────────────
    const imgH = H - topBarH;
    if (bgImg) {
        drawCover(ctx, bgImg, 0, topBarH, W, imgH,
            t2.imagePosX ?? 50, t2.imagePosY ?? 50, (t2.imageScale ?? 100) / 100);
    }

    // ── Watermark (positioned within the image container) ────────────────────
    if (wmImg && t2.showWatermark !== false && t2.watermarkUrl) {
        ctx.save();
        ctx.globalAlpha = t2.watermarkOpacity ?? 0.61;
        const wmW = t2.watermarkSize || 201;
        const wmH = (wmImg.naturalHeight / wmImg.naturalWidth) * wmW;
        const { x: wx, y: wy } = calcWmXY(
            t2.watermarkPosX ?? 3, t2.watermarkPosY ?? 99,
            W, imgH, wmW, wmH, 0, topBarH);
        ctx.drawImage(wmImg, wx, wy, wmW, wmH);
        ctx.restore();
    }
}

// ─── TEMPLATE 3 (Wealth / Split) ─────────────────────────────────────────────
async function exportT3(ctx, state, W, H) {
    const t3 = state.post.t3;

    const [bgImg] = await Promise.all([loadImg(t3.bgImage)]);

    const ff = t3.customFontFamily || t3.fontFamily || 'Oswald';
    const fs = t3.fontSize  || 86;
    const fw = t3.fontWeight || 700;
    await loadFont(`${fw} ${fs}px "${ff}"`);

    const showBg    = t3.showBgColor !== false;
    const bgColor   = t3.bgColor || '#0a0a0a';
    const imgSplit  = t3.imageSplit ?? 57;
    const imgAreaH  = Math.round((imgSplit / 100) * H);

    // ── Background fill ───────────────────────────────────────────────────────
    ctx.fillStyle = showBg ? bgColor : '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Background image (top portion only when bg is enabled) ───────────────
    if (bgImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, W, showBg ? imgAreaH : H);
        ctx.clip();
        drawCover(ctx, bgImg, 0, 0, W, showBg ? imgAreaH : H,
            t3.imagePosX ?? 89, t3.imagePosY ?? 0, (t3.imageScale ?? 100) / 100);
        ctx.restore();
    }

    // ── Bottom fade (image bleeds into text area) ─────────────────────────────
    if (t3.showBottomFade !== false && showBg) {
        const fadePct = (t3.bottomFadeHeight ?? 79) / 100;
        const fadeH   = fadePct * imgAreaH;
        const offsetY = -(t3.bottomFadePosY || 0);
        const fadeY   = imgAreaH - fadeH + offsetY;
        const fg      = ctx.createLinearGradient(0, fadeY, 0, fadeY + fadeH);
        fg.addColorStop(0, 'rgba(0,0,0,0)');
        fg.addColorStop(1, t3.bottomFadeColor || bgColor);
        ctx.save();
        ctx.globalAlpha = t3.bottomFadeOpacity ?? 1;
        ctx.fillStyle   = fg;
        ctx.fillRect(0, fadeY, W, fadeH + 4);
        ctx.restore();
    }

    // ── Brand divider ─────────────────────────────────────────────────────────
    const bSz    = t3.brandSize || 37;
    const bColor = t3.brandColor || '#FFF';
    const circD  = Math.round(bSz * 1.4);
    const BDIV_PAD_H = 52, BDIV_PAD_V = 18;

    // Estimate brand divider total height
    const brandDivH = showBg && t3.showBrand !== false
        ? BDIV_PAD_V * 2 + circD
        : (showBg ? 24 : 0);

    const dividerY = imgAreaH;

    if (showBg && t3.showBrand !== false) {
        const centerX  = W / 2;
        const letterX0 = BDIV_PAD_H;
        const midY     = dividerY + BDIV_PAD_V + circD / 2;

        // Estimate inner content width
        ctx.font = `italic ${bSz}px Georgia, serif`;
        setLS(ctx, 0.04 * bSz);
        const nameW = mW(ctx, t3.brandName || 'ealth');
        const showL = t3.showBrandLetter !== false;
        const innerW = (showL ? circD + 6 : 0) + nameW;
        const innerPad = 18;
        const innerL = centerX - innerW / 2 - innerPad;
        const innerR = centerX + innerW / 2 + innerPad;

        // Left fading divider line
        {
            const g = ctx.createLinearGradient(BDIV_PAD_H, 0, innerL, 0);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.3, bColor);
            g.addColorStop(1,   bColor);
            ctx.fillStyle = g;
            ctx.fillRect(BDIV_PAD_H, midY - 0.75, innerL - BDIV_PAD_H, 1.5);
        }
        // Right fading divider line
        {
            const g = ctx.createLinearGradient(innerR, 0, W - BDIV_PAD_H, 0);
            g.addColorStop(0,   bColor);
            g.addColorStop(0.7, bColor);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(innerR, midY - 0.75, W - BDIV_PAD_H - innerR, 1.5);
        }

        let bx = centerX - innerW / 2;

        // Circle letter
        if (showL) {
            ctx.save();
            ctx.strokeStyle  = bColor;
            ctx.lineWidth    = 1.5;
            ctx.beginPath();
            ctx.arc(bx + circD / 2, midY, circD / 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.font         = `italic ${Math.round(bSz * 0.7)}px Georgia, serif`;
            setLS(ctx, 0);
            ctx.fillStyle    = bColor;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((t3.brandLetter || 'w').charAt(0), bx + circD / 2, midY);
            ctx.restore();
            bx += circD + 6;
        }

        // Brand name
        ctx.save();
        ctx.font         = `italic ${bSz}px Georgia, serif`;
        setLS(ctx, 0.04 * bSz);
        ctx.fillStyle    = bColor;
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(t3.brandName || 'ealth', bx, midY);
        ctx.restore();
    }

    // ── Headline ──────────────────────────────────────────────────────────────
    const textAreaY = dividerY + brandDivH;
    const textAreaH = H - textAreaY;
    const ls3Em     = t3.letterSpacing ?? 0;

    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, ls3Em * fs);
    ctx.textBaseline = 'top';

    const hlLines3 = wrapSimple(ctx, (t3.headline || '').toUpperCase(), W - BDIV_PAD_H * 2);
    const lh3      = t3.lineHeight ?? 1.15;
    const lineH3   = Math.round(fs * lh3);
    const hlH3     = hlLines3.length * lineH3;

    // Vertically center within text area (with bottom padding 40px)
    const hl3Y = textAreaY + Math.max(10, (textAreaH - hlH3 - 40) / 2);

    ctx.save();
    ctx.font         = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, ls3Em * fs);
    ctx.fillStyle    = t3.headlineColor || '#FFD800';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    let hy = hl3Y;
    for (const ln of hlLines3) { ctx.fillText(ln, W / 2, hy); hy += lineH3; }
    ctx.restore();
}

// ─── HIGHLIGHT CREATOR ────────────────────────────────────────────────────────
async function exportHighlight(ctx, state, SZ) {
    const h  = state.highlight;
    const cx = SZ / 2, cy = SZ / 2;

    // Background
    ctx.fillStyle = h.bgColor || '#000';
    ctx.fillRect(0, 0, SZ, SZ);

    // Ring
    if ((h.ringWidth || 0) > 0) {
        const ringR = SZ * 0.45 - h.ringWidth / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = h.ringColor || '#FF5500';
        ctx.lineWidth   = h.ringWidth;
        ctx.stroke();
        ctx.restore();
    }

    // Icon
    const iSz = h.iconSize || 400;
    if (h.iconType === 'custom' && h.customIconUrl) {
        const iconImg = await loadImg(h.customIconUrl);
        if (iconImg) ctx.drawImage(iconImg, cx - iSz / 2, cy - iSz / 2, iSz, iSz);
    } else {
        // Grab the live Lucide SVG from DOM, recolour it, render to canvas
        const domSvg = document.querySelector(
            '[data-ctx="highlight-icon"] svg, .highlight-icon-el svg');
        if (domSvg) {
            const clone = domSvg.cloneNode(true);
            clone.setAttribute('width',  iSz);
            clone.setAttribute('height', iSz);
            clone.style.color = h.iconColor || '#FFF';
            clone.querySelectorAll('[stroke="currentColor"]')
                 .forEach(el => el.setAttribute('stroke', h.iconColor || '#FFF'));
            clone.querySelectorAll('[fill="currentColor"]')
                 .forEach(el => el.setAttribute('fill', h.iconColor || '#FFF'));

            const svgStr  = new XMLSerializer().serializeToString(clone);
            const blob    = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
            const url     = URL.createObjectURL(blob);
            await new Promise(resolve => {
                const img   = new Image();
                img.onload  = () => {
                    ctx.drawImage(img, cx - iSz / 2, cy - iSz / 2, iSz, iSz);
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
                img.src = url;
            });
        }
    }
}

// ─── Shared: draw pill-shaped pagination dots ─────────────────────────────────
function drawDots(ctx, cx, y, count, active, dotH, activeW, inactiveW, gap, color, activeAlpha, inactiveAlpha) {
    const widths = Array.from({ length: count }, (_, i) => i === active ? activeW : inactiveW);
    const totalW = widths.reduce((a, b) => a + b, 0) + gap * (count - 1);
    let dx = cx - totalW / 2;
    const r = dotH / 2;
    for (let i = 0; i < count; i++) {
        const dW = widths[i];
        ctx.save();
        ctx.globalAlpha = i === active ? activeAlpha : inactiveAlpha;
        ctx.fillStyle   = color;
        ctx.beginPath();
        ctx.moveTo(dx + r, y);
        ctx.lineTo(dx + dW - r, y);
        ctx.arc(dx + dW - r, y + r, r, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(dx + r, y + dotH);
        ctx.arc(dx + r, y + r, r, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        dx += dW + gap;
    }
}

// ─── TEMPLATE 4 (Magazine / XXL) ─────────────────────────────────────────────
async function exportT4(ctx, state, W, H) {
    const t4   = state.post.t4;
    const PAD  = 60;   // left/right padding of bottom block
    const PAD_B = 52;  // bottom padding of block

    const ff = t4.customFontFamily || t4.fontFamily || 'Archivo Black';
    const fs = t4.fontSize  || 95;
    const fw = t4.fontWeight || 900;

    const [bgImg] = await Promise.all([loadImg(t4.bgImage)]);
    await Promise.all([
        loadFont(`${fw} ${fs}px "${ff}"`),
        loadFont(`900 38px "Archivo Black"`),
        loadFont(`900 22px "Archivo Black"`),
    ]);

    // ── Black base ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Background image ──────────────────────────────────────────────────────
    if (bgImg) {
        drawCover(ctx, bgImg, 0, 0, W, H,
            t4.imagePosX ?? 50, t4.imagePosY ?? 25, (t4.imageScale ?? 100) / 100);
    }

    // ── Gradient (bottom-heavy, transparent → dark) ───────────────────────────
    {
        const gs = Math.max(0, Math.min(99, 100 - (t4.gradientStrength ?? 65))) / 100;
        const g  = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0,  'rgba(0,0,0,0)');
        g.addColorStop(gs, 'rgba(0,0,0,0)');
        g.addColorStop(1,  'rgba(0,0,0,0.92)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }

    // ── Flat dim overlay ──────────────────────────────────────────────────────
    ctx.save();
    ctx.globalAlpha = t4.overlayOpacity ?? 0.35;
    ctx.fillStyle   = t4.overlayColor   || '#000';
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // ── Brand badge (top-left rectangle) ─────────────────────────────────────
    if (t4.showBrand !== false) {
        const bFS    = t4.brandFontSize || 38;
        const BPAD_H = 14, BPAD_V = 8;
        ctx.save();
        ctx.font         = `900 ${bFS}px "Archivo Black", sans-serif`;
        setLS(ctx, -0.01 * bFS);
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'left';
        const bt  = t4.brandText || 'XXL';
        const bTW = mW(ctx, bt);
        const bBW = bTW + BPAD_H * 2;
        const bBH = bFS + BPAD_V * 2;
        ctx.fillStyle = t4.brandBgColor  || '#CC0000';
        ctx.fillRect(40, 40, bBW, bBH);
        ctx.fillStyle = t4.brandTextColor || '#FFF';
        ctx.fillText(bt, 40 + BPAD_H, 40 + BPAD_V);
        ctx.restore();
    }

    // ── Measure bottom content block (badge → headline → divider → swipe → dots) ──
    const BADGE_FS   = 22;
    const BADGE_PH   = 16, BADGE_PV = 5;
    const BADGE_H    = BADGE_FS + BADGE_PV * 2; // ~32px
    const BADGE_MB   = 22;

    const LS_PX = (t4.letterSpacing ?? -0.02) * fs;
    const LH    = Math.round(fs * (t4.lineHeight ?? 1.0));
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, LS_PX);
    const hlLines = wrapSimple(ctx, (t4.headline || '').toUpperCase(), W - PAD * 2);
    const HL_H    = hlLines.length * LH;
    const HL_MB   = 36;

    const DIV_H  = t4.showDivider ? 1.5 : 0;
    const DIV_MB = t4.showDivider ? 22  : 0;

    const SW_FS = t4.swipeFontSize || 22;
    const SW_H  = t4.showSwipe ? Math.round(SW_FS * 1.2) : 0;

    const DOT_H  = 8, DOT_MT = 20;
    const DOT_TH = t4.showDots ? DOT_H + DOT_MT : 0;

    const badgeBlock = t4.showBadge ? BADGE_H + BADGE_MB : 0;
    const totalBlock = badgeBlock + HL_H + HL_MB + DIV_H + DIV_MB + SW_H + DOT_TH;

    let y = H - PAD_B - totalBlock;

    // ── NEWS badge ────────────────────────────────────────────────────────────
    if (t4.showBadge !== false) {
        const bt  = (t4.badgeText || 'NEWS').toUpperCase();
        ctx.save();
        ctx.font         = `900 ${BADGE_FS}px "Archivo Black", sans-serif`;
        setLS(ctx, 0.08 * BADGE_FS);
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'left';
        const btW = mW(ctx, bt) + BADGE_PH * 2;
        ctx.fillStyle    = '#FFF';
        ctx.fillRect(PAD, y, btW, BADGE_H);
        ctx.fillStyle    = '#000';
        ctx.fillText(bt, PAD + BADGE_PH, y + BADGE_H / 2);
        ctx.restore();
        y += BADGE_H + BADGE_MB;
    }

    // ── Headline ──────────────────────────────────────────────────────────────
    ctx.save();
    ctx.font          = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, LS_PX);
    ctx.fillStyle     = t4.headlineColor  || '#FFF';
    ctx.textBaseline  = 'top';
    ctx.textAlign     = 'left';
    ctx.shadowColor   = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur    = 16;
    ctx.shadowOffsetY = 3;
    for (const ln of hlLines) { ctx.fillText(ln, PAD, y); y += LH; }
    ctx.restore();
    y += HL_MB;

    // ── Divider line ──────────────────────────────────────────────────────────
    if (t4.showDivider !== false) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle   = t4.dividerColor || '#FFF';
        ctx.fillRect(PAD, y, W - PAD * 2, 1.5);
        ctx.restore();
        y += DIV_H + DIV_MB;
    }

    // ── Swipe text ────────────────────────────────────────────────────────────
    if (t4.showSwipe !== false) {
        ctx.save();
        ctx.globalAlpha  = 0.75;
        ctx.font         = `700 ${SW_FS}px "Archivo Black", sans-serif`;
        setLS(ctx, 0.18 * SW_FS);
        ctx.fillStyle    = t4.swipeColor  || '#FFF';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText((t4.swipeText || 'SWIPE LEFT').toUpperCase(), W / 2, y);
        ctx.restore();
        y += SW_H;
    }

    // ── Pagination dots ───────────────────────────────────────────────────────
    if (t4.showDots) {
        y += DOT_MT;
        const cnt = Math.max(1, Math.min(10, t4.dotCount  || 3));
        const act = Math.max(0, Math.min(cnt - 1, t4.activeDot || 0));
        drawDots(ctx, W / 2, y, cnt, act, DOT_H, 20, 8, 6, t4.dotColor || '#FFF', 1, 0.45);
    }
}

// ─── TEMPLATE 5 (Dual Image) ──────────────────────────────────────────────────
async function exportT5(ctx, state, W, H) {
    const t5      = state.post.t5;
    const imgH    = Math.round((t5.imageSplit ?? 62) / 100 * H);
    const textH   = H - imgH;
    const PAD_H   = t5.paddingH ?? 52;
    const PAD_V   = t5.paddingV ?? 36;
    const imgHalfW = W / 2;

    const ff = t5.customFontFamily || t5.fontFamily || 'Archivo Black';
    const fs = t5.fontSize  || 74;
    const fw = t5.fontWeight || 900;

    const [leftImg, rightImg] = await Promise.all([
        loadImg(t5.imageLeft),
        loadImg(t5.imageRight),
    ]);
    await loadFont(`${fw} ${fs}px "${ff}"`);

    // ── Black base ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Left image ────────────────────────────────────────────────────────────
    if (leftImg) {
        drawCover(ctx, leftImg, 0, 0, imgHalfW, imgH,
            t5.leftPosX ?? 50, t5.leftPosY ?? 50, (t5.leftScale ?? 100) / 100);
    }

    // ── Right image ───────────────────────────────────────────────────────────
    if (rightImg) {
        drawCover(ctx, rightImg, imgHalfW, 0, imgHalfW, imgH,
            t5.rightPosX ?? 50, t5.rightPosY ?? 50, (t5.rightScale ?? 100) / 100);
    }

    // ── Optional separator line between images ────────────────────────────────
    if (t5.imageSeparator) {
        ctx.save();
        ctx.fillStyle = t5.separatorColor || '#FFF';
        ctx.fillRect(imgHalfW - (t5.separatorWidth || 2) / 2, 0, t5.separatorWidth || 2, imgH);
        ctx.restore();
    }

    // ── Text block background ──────────────────────────────────────────────────
    ctx.fillStyle = t5.bgColor || '#000';
    ctx.fillRect(0, imgH, W, textH);

    // ── Headline (multi-color, centered) ──────────────────────────────────────
    const parts5 = (t5.headline || '').split(/(\[.*?\])/);
    const words5 = [];
    for (const p of parts5) {
        if (p.startsWith('[') && p.endsWith(']')) {
            p.slice(1, -1).toUpperCase().split(/\s+/).forEach(w => { if (w) words5.push({ word: w, color: t5.highlightColor || '#FF0' }); });
        } else {
            p.toUpperCase().split(/\s+/).forEach(w => { if (w) words5.push({ word: w, color: t5.headlineColor || '#FFF' }); });
        }
    }

    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, (t5.letterSpacing ?? 0) * fs);
    const hlLines5 = wrapColored(ctx, words5, W - PAD_H * 2);
    const LH5      = Math.round(fs * (t5.lineHeight ?? 1.1));
    const HL_H5    = hlLines5.length * LH5;

    // Dots + Arrow block height
    const DOT_H5   = 7;
    const DOT_MT5  = 10;
    const ARROW_H5 = t5.showArrow ? 20 : 0;
    const ARROW_MT = t5.showArrow ? 0  : 0;
    const DOTS_TH  = t5.showDots  ? DOT_H5 + DOT_MT5 : 0;
    const navH     = ARROW_H5 + (t5.showArrow && t5.showDots ? 10 : 0) + DOTS_TH;

    // Layout: paddingV top, content, paddingV*0.7 bottom
    const availH = textH - PAD_V - Math.round(PAD_V * 0.7);
    // Headline anchored to top of text area + PAD_V
    const hlY = imgH + PAD_V;

    ctx.save();
    ctx.font         = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, (t5.letterSpacing ?? 0) * fs);
    ctx.textBaseline = 'top';
    ctx.textAlign    = t5.textAlign === 'left' ? 'left' : 'center';
    const hlStartX   = t5.textAlign === 'left' ? PAD_H : W / 2;

    // draw colored lines – for centered, we need to manually center each line
    const sp5 = mW(ctx, ' ');
    let cy5 = hlY;
    for (const line of hlLines5) {
        const lineW = line.reduce((acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp5 : 0), 0);
        let cx5 = t5.textAlign === 'left' ? PAD_H : (W - lineW) / 2;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, cx5, cy5);
            cx5 += mW(ctx, line[i].word);
            if (i < line.length - 1) cx5 += sp5;
        }
        cy5 += LH5;
    }
    ctx.restore();

    // ── Arrow + dots (bottom center of text block) ────────────────────────────
    const bottomY  = H - Math.round(PAD_V * 0.7);
    let navY = bottomY - navH;

    // Arrow (left-pointing: horizontal line + arrowhead on left)
    if (t5.showArrow !== false) {
        const aColor = t5.arrowColor || '#FFF';
        const aW = 70, aH = 20;
        const ax = (W - aW) / 2;
        const ay = navY;
        ctx.save();
        ctx.strokeStyle = aColor;
        ctx.lineWidth   = 2;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(ax + 68, ay + 10);
        ctx.lineTo(ax + 2,  ay + 10);
        ctx.stroke();
        // Arrowhead
        ctx.beginPath();
        ctx.moveTo(ax + 14, ay + 2);
        ctx.lineTo(ax + 2,  ay + 10);
        ctx.lineTo(ax + 14, ay + 18);
        ctx.stroke();
        ctx.restore();
        navY += aH + (t5.showDots ? 10 : 0);
    }

    // Dots
    if (t5.showDots) {
        const cnt5 = Math.max(1, Math.min(10, t5.dotCount  || 4));
        const act5 = Math.max(0, Math.min(cnt5 - 1, t5.activeDot || 0));
        drawDots(ctx, W / 2, navY, cnt5, act5, DOT_H5, 18, 7, 5, t5.dotColor || '#FFF', 1, 0.4);
    }

    // ── Brand badge (top-left circle) ─────────────────────────────────────────
    if (t5.showBrand !== false) {
        const bFS  = t5.brandFontSize || 22;
        const bDia = Math.round(bFS * 2.2);
        const bCX  = 28 + bDia / 2;
        const bCY  = 28 + bDia / 2;
        // Circle fill
        ctx.save();
        ctx.beginPath();
        ctx.arc(bCX, bCY, bDia / 2, 0, Math.PI * 2);
        ctx.fillStyle = t5.brandBgColor || '#000';
        ctx.fill();
        // Border
        ctx.strokeStyle = t5.brandBorderColor || '#FFF';
        ctx.lineWidth   = 2;
        ctx.stroke();
        ctx.restore();
        // Brand text inside circle
        ctx.save();
        ctx.font         = `900 ${bFS}px "Archivo Black", sans-serif`;
        setLS(ctx, -0.02 * bFS);
        ctx.fillStyle    = t5.brandTextColor || '#FFF';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t5.brandText || '', bCX, bCY);
        ctx.restore();
    }
}

// ─── TEMPLATE 6 (Sports / Hurdels) ───────────────────────────────────────────
async function exportT6(ctx, state, W, H) {
    const t6 = state.post.t6;
    const PAD_H    = t6.paddingH    ?? 44;
    const PAD_BOT  = t6.paddingBottom ?? 120;

    const ff = t6.customFontFamily || t6.fontFamily || 'Archivo Black';
    const fs = t6.fontSize  || 86;
    const fw = t6.fontWeight || 900;

    const [bgImg, circleImg] = await Promise.all([
        loadImg(t6.bgImage),
        (t6.showCircle && t6.circleImage) ? loadImg(t6.circleImage) : null,
    ]);
    await Promise.all([
        loadFont(`${fw} ${fs}px "${ff}"`),
        loadFont(`900 ${t6.brandFontSize || 32}px "${t6.brandFontFamily || 'Archivo Black'}"`),
        loadFont(`700 ${t6.swipeFontSize || 22}px "${t6.swipeFontFamily || 'Bebas Neue'}"`),
    ]);

    // ── Black base ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Background image ──────────────────────────────────────────────────────
    if (bgImg) {
        ctx.save();
        ctx.globalAlpha = t6.bgOpacity ?? 1;
        drawCover(ctx, bgImg, 0, 0, W, H,
            t6.imagePosX ?? 50, t6.imagePosY ?? 50, (t6.imageScale ?? 100) / 100);
        ctx.restore();
    }

    // ── Flat dim overlay ──────────────────────────────────────────────────────
    if ((t6.overlayOpacity ?? 0) > 0) {
        ctx.save();
        ctx.globalAlpha = t6.overlayOpacity;
        ctx.fillStyle   = t6.overlayColor || '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    // ── Cinematic multi-stop gradient (mirrors CSS exactly) ───────────────────
    {
        const gs  = t6.gradientStart    ?? 22;
        const str = t6.gradientStrength ?? 0.96;
        const p2  = (gs + (100 - gs) * 0.20) / 100;
        const p3  = (gs + (100 - gs) * 0.46) / 100;
        const p4  = (gs + (100 - gs) * 0.70) / 100;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,          'rgba(0,0,0,0)');
        grad.addColorStop(gs / 100,   'rgba(0,0,0,0)');
        grad.addColorStop(p2, `rgba(0,0,0,${+(str * 0.08).toFixed(3)})`);
        grad.addColorStop(p3, `rgba(0,0,0,${+(str * 0.42).toFixed(3)})`);
        grad.addColorStop(p4, `rgba(0,0,0,${+(str * 0.80).toFixed(3)})`);
        grad.addColorStop(1,  `rgba(0,0,0,${+str.toFixed(3)})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }

    // ── Circle inset photo (top-right area) ───────────────────────────────────
    if (t6.showCircle !== false && circleImg) {
        const cSz  = t6.circleSize        ?? 200;
        const cBW  = t6.circleBorderWidth ?? 5;
        const cCX  = (t6.circlePosX / 100) * W;
        const cCY  = (t6.circlePosY / 100) * H;
        const r    = cSz / 2;
        const ir   = Math.max(1, r - cBW);

        // Shadow
        ctx.save();
        ctx.shadowColor  = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur   = 28;
        ctx.shadowOffsetY = 6;
        ctx.beginPath();
        ctx.arc(cCX, cCY, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.001)';
        ctx.fill();
        ctx.restore();

        // Image clipped to inner circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(cCX, cCY, ir, 0, Math.PI * 2);
        ctx.clip();
        drawCover(ctx, circleImg, cCX - ir, cCY - ir, ir * 2, ir * 2, 50, 50, 1);
        ctx.restore();

        // Border ring
        if (cBW > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(cCX, cCY, r - cBW / 2, 0, Math.PI * 2);
            ctx.strokeStyle = t6.circleBorderColor || '#FFF';
            ctx.lineWidth   = cBW;
            ctx.stroke();
            ctx.restore();
        }
    }

    // ── Brand text (top-left) ─────────────────────────────────────────────────
    if (t6.showBrand !== false) {
        const bFS  = t6.brandFontSize   || 32;
        const bFF  = t6.brandFontFamily || 'Archivo Black';
        const bStyle = t6.brandItalic ? 'italic' : 'normal';
        ctx.save();
        ctx.font         = `${bStyle} 900 ${bFS}px "${bFF}", sans-serif`;
        setLS(ctx, 0.03 * bFS);
        ctx.fillStyle    = t6.brandColor || '#FFF';
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'left';
        ctx.shadowColor  = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur   = 8;
        ctx.shadowOffsetY = 2;
        ctx.fillText((t6.brandText || '').toUpperCase(), 44, 40);
        ctx.restore();
    }

    // ── Headline (left-aligned, bottom-left, [brackets] = highlight color) ────
    const t6Parts = (t6.headline || '').split(/(\[.*?\])/);
    const t6Words = [];
    for (const p of t6Parts) {
        if (p.startsWith('[') && p.endsWith(']')) {
            p.slice(1, -1).toUpperCase().split(/\s+/).forEach(w => {
                if (w) t6Words.push({ word: w, color: t6.highlightColor || '#FF3333' });
            });
        } else {
            p.toUpperCase().split(/\s+/).forEach(w => {
                if (w) t6Words.push({ word: w, color: t6.headlineColor || '#FFF' });
            });
        }
    }

    const LS6    = (t6.letterSpacing ?? 0) * fs;
    const LH6    = Math.round(fs * (t6.lineHeight ?? 1.0));
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, LS6);
    const hlLines6 = wrapColored(ctx, t6Words, W - PAD_H * 2);
    const HL_H6    = hlLines6.length * LH6;

    // Swipe + dots block height
    const SW_FS6 = t6.swipeFontSize || 22;
    const SW_H6  = t6.showSwipe ? Math.round(SW_FS6 * 1.3) : 0;
    const DOT_H6 = 7;
    const DOT_MT6 = 10;
    const DOT_TH6 = t6.showDots ? DOT_H6 + DOT_MT6 : 0;
    const NAV_H6  = SW_H6 + (t6.showSwipe && t6.showDots ? 10 : 0) + DOT_TH6;

    // Headline bottom edge = H - PAD_BOT
    const hlTop = H - PAD_BOT - HL_H6;

    ctx.save();
    ctx.font          = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, LS6);
    ctx.textBaseline  = 'top';
    ctx.shadowColor   = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur    = 22;
    ctx.shadowOffsetY = 4;

    const sp6 = mW(ctx, ' ');
    let hy6 = hlTop;
    for (const line of hlLines6) {
        let cx6 = PAD_H;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, cx6, hy6);
            cx6 += mW(ctx, line[i].word);
            if (i < line.length - 1) cx6 += sp6;
        }
        hy6 += LH6;
    }
    ctx.restore();

    // ── >>> SWIPE >>> + dots (bottom center, pb 26px) ─────────────────────────
    const PB6   = 26;
    let navY6   = H - PB6 - NAV_H6;

    if (t6.showSwipe !== false) {
        const swFF   = t6.swipeFontFamily || 'Bebas Neue';
        const decoSz = Math.round(SW_FS6 * 0.52);
        const decoTxt = '\u203A\u00A0\u203A\u00A0\u203A'; // › › ›

        ctx.save();
        ctx.fillStyle    = t6.swipeColor || '#FFF';
        ctx.textBaseline = 'top';
        ctx.textAlign    = 'center';

        // Left deco (faded)
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.font        = `${decoSz}px sans-serif`;
        setLS(ctx, 5);
        ctx.fillText(decoTxt, W / 2 - 80, navY6 + (SW_FS6 - decoSz) / 2);
        ctx.restore();

        // Center swipe word
        ctx.font = `700 ${SW_FS6}px "${swFF}", sans-serif`;
        setLS(ctx, 0.22 * SW_FS6);
        ctx.fillText((t6.swipeText || 'SWIPE').toUpperCase(), W / 2, navY6);

        // Right deco (faded)
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.font        = `${decoSz}px sans-serif`;
        setLS(ctx, 5);
        ctx.fillText(decoTxt, W / 2 + 80, navY6 + (SW_FS6 - decoSz) / 2);
        ctx.restore();

        ctx.restore();
        navY6 += SW_H6 + (t6.showDots ? 10 : 0);
    }

    if (t6.showDots) {
        const cnt6 = Math.max(1, Math.min(10, t6.dotCount  || 4));
        const act6 = Math.max(0, Math.min(cnt6 - 1, t6.activeDot || 0));
        drawDots(ctx, W / 2, navY6, cnt6, act6, DOT_H6, 20, 7, 5, t6.dotColor || '#FFF', 1, 0.45);
    }
}

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────────────────────
async function exportCanvas() {
    const state = window.state;
    const notify = window.showNotification || ((m, t) => console.log(`[${t}]`, m));

    if (!state)            { notify('State not ready', 'error'); return; }
    if (state.isExporting) { notify('Export already in progress…', 'error'); return; }

    state.isExporting = true;

    // UI: show loading state
    const exportBtn  = document.getElementById('export-btn'); // Panel button (mobile)
    const exportBtnHeader = document.getElementById('export-btn-header'); // Header button (desktop)
    const exportText = document.getElementById('export-text'); // Panel text (mobile)
    const exportTextHeader = document.getElementById('export-text-header'); // Header text (desktop)
    const overlay    = document.getElementById('loading-overlay');
    const wrapper    = document.getElementById('scale-wrapper');

    if (exportBtn)  { exportBtn.disabled = true; exportBtn.classList.add('export-loading'); }
    if (exportBtnHeader)  { exportBtnHeader.disabled = true; exportBtnHeader.classList.add('export-loading'); }
    if (exportText) exportText.textContent = 'Exporting…';
    if (exportTextHeader) exportTextHeader.textContent = 'Exporting…';
    if (overlay)    overlay.classList.remove('hidden');
    if (wrapper)    { wrapper.style.opacity = '0'; wrapper.style.transition = 'opacity 0.2s ease'; }

    const t0          = Date.now();
    const MIN_DISPLAY = 2000; // match the template-switch loader duration

    try {
        const isPost = state.mode === 'post';
        const W = isPost ? window.CONSTANTS.POST_WIDTH  : window.CONSTANTS.HIGHLIGHT_SIZE;
        const H = isPost ? window.CONSTANTS.POST_HEIGHT : window.CONSTANTS.HIGHLIGHT_SIZE;

        // Create offscreen canvas at native 1:1 resolution
        const canvas  = document.createElement('canvas');
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        if (isPost) {
            const tmpl = state.post.template;
            if      (tmpl === 'template2') await exportT2(ctx, state, W, H);
            else if (tmpl === 'template3') await exportT3(ctx, state, W, H);
            else if (tmpl === 'template4') await exportT4(ctx, state, W, H);
            else if (tmpl === 'template5') await exportT5(ctx, state, W, H);
            else if (tmpl === 'template6') await exportT6(ctx, state, W, H);
            else                           await exportT1(ctx, state, W, H);
        } else {
            await exportHighlight(ctx, state, W);
        }

        // Convert to PNG and trigger download
        try {
            canvas.toBlob(blob => {
                if (!blob) { notify('Failed to generate image data', 'error'); return; }
                const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
                link.href     = url;
                link.download = `instatools-${state.mode}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
                URL.revokeObjectURL(url);
                notify('Image exported successfully!', 'success');
            }, 'image/png');
        } catch (secErr) {
            if (secErr.name === 'SecurityError') {
                notify('Export blocked: one or more images could not be loaded due to CORS restrictions. Try uploading images directly instead of pasting external URLs.', 'error');
        } else {
                throw secErr; // re-throw unexpected errors
            }
        }

    } catch (err) {
        console.error('Export error:', err);
        notify('Export failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
        const wait = Math.max(0, MIN_DISPLAY - (Date.now() - t0));
        setTimeout(() => {
            if (overlay)    overlay.classList.add('hidden');
            if (wrapper)    { wrapper.style.transition = 'opacity 0.3s ease'; wrapper.style.opacity = '1'; }
            if (exportBtn)  { exportBtn.disabled = false; exportBtn.classList.remove('export-loading'); }
            if (exportBtnHeader)  { exportBtnHeader.disabled = false; exportBtnHeader.classList.remove('export-loading'); }
            if (exportText) exportText.textContent = 'EXPORT';
            if (exportTextHeader) exportTextHeader.textContent = 'EXPORT';
        state.isExporting = false;
        }, wait);
    }
}

// ─── EXPORT PRESETS AS JSON ───────────────────────────────────────────────────
function exportPresets() {
    const state  = window.state || {};
    const notify = window.showNotification || ((m, t) => console.log(`[${t}]`, m));
    try {
        if (!Array.isArray(state.presets) || state.presets.length === 0) {
            notify('No presets to export. Save a preset first!', 'error');
            return;
        }
        
        const valid = state.presets.filter(p =>
            p && typeof p === 'object' && p.id != null &&
            typeof p.name === 'string' && p.name.trim() &&
            (p.style || (p.post && p.post.style))
        );

        if (valid.length === 0) {
            notify('No valid presets to export.', 'error');
            return;
        }
        
        const data = {
            version:     '1.1',
            exportDate:  new Date().toISOString(),
            presetCount: valid.length,
            presets:     valid,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `instatools-presets-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        notify(`Exported ${valid.length} preset(s)!`, 'success');
    } catch (e) {
        console.error('Export presets error:', e);
        notify('Failed to export presets: ' + (e.message || 'Unknown error'), 'error');
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.exportCanvas  = exportCanvas;
    window.exportPresets = exportPresets;
}
