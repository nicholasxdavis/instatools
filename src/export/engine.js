import { POST_WIDTH, POST_HEIGHT, HIGHLIGHT_SIZE } from '../config/constants.js'
import { textureUrl } from '../config/media.js'
import { applyGrain, getGrainDataUrl } from './filter.js'
import { tweetIconSvg } from '../themes/template7/icons.js'

if (typeof window !== 'undefined') {
  window.CONSTANTS = { POST_WIDTH, POST_HEIGHT, HIGHLIGHT_SIZE }
  window.applyGrain = applyGrain
  window.getGrainDataUrl = getGrainDataUrl
}

/**
 * Export Engine - Canvas 2D API (pixel-perfect)
 *
 * Replaces html2canvas entirely. Draws every layer from state using the
 * Canvas 2D API so the result is guaranteed 1-to-1 with the preview:
 *   • Circle overlay uses arc() + clip() - never bleeds outside the ring
 *   • object-fit:cover simulated precisely for every image
 *   • Full letter-spacing, text-shadow, opacity, glow support
 *   • All post templates (1 - 16) + highlight creator
 */

// ─── CORS proxy helpers ────────────────────────────────────────────────────────
// The live canvas uses plain <img> tags - no CORS required.  But drawing into
// an offscreen canvas taints it the moment a non-CORS image is used, blocking
// toBlob().  Strategy:
//   1. Normalize known URLs (github.com/blob → raw.githubusercontent.com)
//   2. fetch() → blob URL  (ignores non-CORS cache, follows redirects cleanly)
//   3. Fall through to public CORS proxies if the origin blocks CORS directly
const _CORS_PROXIES = [
    u => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    u => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    u => `https://images.weserv.nl/?url=${encodeURIComponent(u.replace(/^https?:\/\//, ''))}&n=-1`,
    u => `https://wsrv.nl/?url=${encodeURIComponent(u.replace(/^https?:\/\//, ''))}&n=-1`,
];
let _exportSession = null;

function _resolveSrc(src) {
    if (!src || typeof src !== 'string') return src;
    const value = src.trim();
    if (!value) return value;
    if (value.startsWith('src/ui/')) return `/${value.slice(4)}`;
    if (value.startsWith('./src/ui/')) return `/${value.slice(6)}`;
    return value;
}

function _isLocalSrc(src) {
    if (!src) return false;
    if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('/')) return true;
    try {
        return new URL(src, window.location.origin).origin === window.location.origin;
    } catch {
        return false;
    }
}

// ─── Normalise GitHub blob-viewer URLs to raw.githubusercontent.com ────────────
// github.com/blob/… does NOT send CORS headers.
// raw.githubusercontent.com sends  Access-Control-Allow-Origin: * - use that.
function _normalizeImgUrl(src) {
    try {
        const u = new URL(src);
        if (u.hostname === 'github.com') {
            // /user/repo/blob/branch/...path...
            const m = u.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/(.+)/);
            if (m) {
                return `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}`;
            }
        }
    } catch (_) { /* not a valid URL - leave as-is */ }
    return src;
}

function _isVideoSource(src) {
    if (!src || typeof src !== 'string') return false;
    const value = src.trim().toLowerCase();
    if (!value) return false;
    if (value.startsWith('data:video/')) return true;
    if (typeof window !== 'undefined' && window.__instatoolsVideoBlobs && window.__instatoolsVideoBlobs.has(src)) return true;
    return /\.(mp4|webm|mov|m4v|ogv|ogg)(\?|#|$)/i.test(value);
}

function _extFromVideoSource(src) {
    const low = (src || '').toLowerCase();
    if (low.includes('.webm')) return 'webm';
    if (low.includes('.mov')) return 'mov';
    if (low.includes('.m4v')) return 'm4v';
    if (low.includes('.ogv') || low.includes('.ogg')) return 'ogv';
    return 'mp4';
}

function _activeVideoSourceFromPost(post) {
    if (!post) return null;
    const t = post.template;
    const s = post.style || {};
    const checks = [];
    if (t === 'template2') checks.push(post.t2 && post.t2.bgImage);
    else if (t === 'template3') checks.push(post.t3 && post.t3.bgImage);
    else if (t === 'template4') checks.push(post.t4 && post.t4.bgImage);
    else if (t === 'template5') checks.push(post.t5 && post.t5.imageLeft, post.t5 && post.t5.imageRight);
    else if (t === 'template6') checks.push(post.t6 && post.t6.bgImage, post.t6 && post.t6.circleImage);
    else if (t === 'template7') checks.push(post.t7 && post.t7.profileImageUrl);
    else if (t === 'template8') checks.push(post.t8 && post.t8.bgImage, post.t8 && post.t8.circleImage);
    else if (t === 'template9') checks.push(post.t9 && post.t9.bgImage, post.t9 && post.t9.logoUrl);
    else if (t === 'template10') checks.push(post.t10 && post.t10.bgImage, post.t10 && post.t10.watermarkUrl);
    else if (t === 'template11') checks.push(post.t11 && post.t11.bgImage, post.t11 && post.t11.watermarkUrl);
    else if (t === 'template12') checks.push(
        post.t12 && post.t12.imageCenter,
        post.t12 && post.t12.imageLeft,
        post.t12 && post.t12.imageRight,
        post.t12 && post.t12.logoUrl,
    );
    else if (t === 'template13') checks.push(post.t13 && post.t13.bgImage, post.t13 && post.t13.watermarkUrl);
    else if (t === 'template14') checks.push(post.t14 && post.t14.bgImage, post.t14 && post.t14.watermarkUrl);
    else if (t === 'template15') checks.push(
        post.t15 && post.t15.bgImage,
        post.t15 && post.t15.subjectUrl,
        post.t15 && post.t15.markImageUrl,
        post.t15 && post.t15.watermarkUrl,
    );
    else if (t === 'template16') checks.push(post.t16 && post.t16.productUrl, post.t16 && post.t16.logoUrl);
    else checks.push(post.bgImage, s.overlayImgUrl, s.logoUrl, s.watermarkUrl);
    return checks.find(v => _isVideoSource(v)) || null;
}

async function _downloadSourceFile(src, filenameBase) {
    let blob = null;
    if (src.startsWith('data:')) {
        const res = await fetch(src);
        blob = await res.blob();
    } else {
        const objUrl = await _fetchAsBlobUrl(src);
        if (!objUrl) return false;
        try {
            const res = await fetch(objUrl);
            blob = await res.blob();
        } finally {
            URL.revokeObjectURL(objUrl);
        }
    }

    if (!blob) return false;
    const outUrl = URL.createObjectURL(blob);
    const ext = _extFromVideoSource(src);
    const link = document.createElement('a');
    link.href = outUrl;
    link.download = `${filenameBase}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(outUrl);
    return true;
}

function _loadImageElement(src, timeoutMs = 15000) {
    return new Promise(resolve => {
        let settled = false
        const el = new Image()
        const done = (value) => {
            if (settled) return
            settled = true
            el.onload = null
            el.onerror = null
            resolve(value)
        }
        el.onload = () => done(el)
        el.onerror = () => done(null)
        el.src = src
        setTimeout(() => done(null), timeoutMs)
    })
}

async function _loadImageElementRetry(src, attempts = 3) {
    for (let i = 0; i < attempts; i += 1) {
        const img = await _loadImageElement(src, 12000 + i * 2000)
        if (img) return img
    }
    return null
}

function _fetchableCandidates(src) {
    const normalized = _normalizeImgUrl(src);
    const candidates = [normalized];
    if (normalized !== src) candidates.push(src);
    _CORS_PROXIES.forEach(fn => {
        try { candidates.push(fn(normalized)); } catch (_) {}
    });
    return [...new Set(candidates)];
}

function _loadImageCors(src) {
    return new Promise(resolve => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        let settled = false;
        const done = (value) => {
            if (settled) return;
            settled = true;
            el.onload = null;
            el.onerror = null;
            resolve(value);
        };
        el.onload = () => done(el);
        el.onerror = () => done(null);
        el.src = src;
        setTimeout(() => done(null), 10000);
    });
}

async function _fetchAsBlobUrl(src) {
    const candidates = _fetchableCandidates(src);
    for (const url of candidates) {
        try {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 15000);
            const resp = await fetch(url, {
                mode: 'cors',
                credentials: 'omit',
                cache: 'no-cache',
                signal: controller.signal,
            });
            clearTimeout(tid);
            if (!resp.ok) continue;
            const blob = await resp.blob();
            return URL.createObjectURL(blob);
        } catch (_) {
            // Try next candidate.
        }
    }
    return null;
}

async function loadVideoFrame(src) {
    if (!src) return null;
    const direct = src.startsWith('data:') || src.startsWith('blob:');
    let objectUrl = null;
    let videoSrc = src;

    if (!direct) {
        objectUrl = await _fetchAsBlobUrl(src);
        if (!objectUrl) {
            console.warn('[export] Could not load video (all attempts failed):', src);
            return null;
        }
        videoSrc = objectUrl;
    }

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    try {
        await new Promise((resolve) => {
            let done = false;
            const finish = () => {
                if (done) return;
                done = true;
                resolve();
            };
            const fail = () => {
                if (done) return;
                done = true;
                resolve();
            };
            video.onloadeddata = finish;
            video.onerror = fail;
            video.src = videoSrc;
            setTimeout(fail, 9000);
        });

        const vW = video.videoWidth || 0;
        const vH = video.videoHeight || 0;
        if (!vW || !vH) return null;
        const frame = document.createElement('canvas');
        frame.width = vW;
        frame.height = vH;
        const fctx = frame.getContext('2d');
        fctx.drawImage(video, 0, 0, vW, vH);
        return frame;
    } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
}

async function loadVideoElement(src) {
    if (!src) return null;
    const direct = src.startsWith('data:') || src.startsWith('blob:');
    let objectUrl = null;
    let videoSrc = src;

    if (!direct) {
        objectUrl = await _fetchAsBlobUrl(src);
        if (!objectUrl) return null;
        videoSrc = objectUrl;
    }

    const video = document.createElement('video');
    const wantAudio = (_exportSession && _exportSession.showVideoAudio === true);
    const volume = Math.max(0, Math.min(1, Number((_exportSession && _exportSession.videoVolume != null) ? _exportSession.videoVolume : 0.85)));
    video.muted = !wantAudio;
    video.volume = wantAudio ? volume : 0;
    video.controls = false;
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';

    await new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            resolve();
        };
        video.onloadedmetadata = finish;
        video.onerror = finish;
        video.src = videoSrc;
        setTimeout(finish, 9000);
    });

    if (!video.videoWidth || !video.videoHeight) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        return null;
    }

    if (_exportSession && objectUrl) {
        _exportSession.cleanupUrls.push(objectUrl);
    } else if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
    }
    return video;
}

async function loadImg(src) {
    src = _resolveSrc(src);
    if (!src) return null;
    if (_exportSession && _exportSession.cache.has(src)) {
        return _exportSession.cache.get(src);
    }
    if (_isVideoSource(src)) {
        const out = (_exportSession && _exportSession.videoMode)
            ? await loadVideoElement(src)
            : await loadVideoFrame(src);
        if (_exportSession) _exportSession.cache.set(src, out);
        return out;
    }

    if (src.startsWith('data:') || src.startsWith('blob:') || _isLocalSrc(src)) {
        const localSrc = src.startsWith('/') && typeof window !== 'undefined'
            ? new URL(src, window.location.origin).href
            : src
        const out = await _loadImageElementRetry(localSrc)
        if (out && _exportSession) _exportSession.cache.set(src, out)
        return out
    }

    const corsDirect = await _loadImageCors(src);
    if (corsDirect) {
        if (_exportSession) _exportSession.cache.set(src, corsDirect);
        return corsDirect;
    }

    const candidates = _fetchableCandidates(src);

    for (const url of candidates) {
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                const controller = new AbortController();
                const tid = setTimeout(() => controller.abort(), 15000);

                const resp = await fetch(url, {
                    mode:        'cors',
                    credentials: 'omit',
                    cache:       'no-cache',
                    signal:      controller.signal,
                });
                clearTimeout(tid);
                if (!resp.ok) continue;

                const blob    = await resp.blob();
                if (!blob || !blob.size) continue;
                const blobUrl = URL.createObjectURL(blob);

                const img = await _loadImageElement(blobUrl, 12000);
                URL.revokeObjectURL(blobUrl);

                if (img) {
                    if (_exportSession) _exportSession.cache.set(src, img);
                    return img;
                }
            } catch (_) {
                // fetch failed (CORS rejection, network error, or abort timeout)
            }
        }
    }

    console.warn('[export] Could not load image (all attempts failed):', src);
    return null;
}

function _postTemplateSize(state) {
    const tmpl = state.post ? state.post.template : null;
    const W = window.CONSTANTS.POST_WIDTH;
    const H = tmpl === 'template7' ? window.CONSTANTS.POST_WIDTH : window.CONSTANTS.POST_HEIGHT;
    return { W, H, tmpl };
}

async function _renderPostToCtx(ctx, state, W, H) {
    const tmpl = state.post.template;
    if      (tmpl === 'template2')                     await exportT2(ctx, state, W, H);
    else if (tmpl === 'template3')                     await exportT3(ctx, state, W, H);
    else if (tmpl === 'template4')                     await exportT4(ctx, state, W, H);
    else if (tmpl === 'template5')                     await exportT5(ctx, state, W, H);
    else if (tmpl === 'template6' || tmpl === 'template8')
                                                      await exportT6(ctx, state, W, H);
    else if (tmpl === 'template7')                     await exportT7(ctx, state, W, H);
    else if (tmpl === 'template9')                     await exportT9(ctx, state, W, H);
    else if (tmpl === 'template10')                    await exportT10(ctx, state, W, H);
    else if (tmpl === 'template11')                    await exportT11(ctx, state, W, H);
    else if (tmpl === 'template12')                    await exportT12(ctx, state, W, H);
    else if (tmpl === 'template13')                    await exportT13(ctx, state, W, H);
    else if (tmpl === 'template14')                    await exportT14(ctx, state, W, H);
    else if (tmpl === 'template15')                    await exportT15(ctx, state, W, H);
    else if (tmpl === 'template16')                    await exportT16(ctx, state, W, H);
    else                                               await exportT1(ctx, state, W, H);
}

function _collectSessionVideos() {
    if (!_exportSession) return [];
    const out = [];
    for (const value of _exportSession.cache.values()) {
        if (value && value.tagName === 'VIDEO') out.push(value);
    }
    return out;
}

async function _seekVideoTo(video, timeSec) {
    if (!video || !Number.isFinite(timeSec)) return;
    const safeTime = Math.max(0, Math.min(timeSec, Math.max(0, (video.duration || timeSec) - 0.02)));
    await new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            resolve();
        };
        video.onseeked = finish;
        video.onerror = finish;
        try {
            video.currentTime = safeTime;
        } catch (_) {
            finish();
        }
        setTimeout(finish, 1200);
    });
}

// ─── Object-fit: cover + object-position + CSS-scale ──────────────────────────
// Mirrors:  width:100%; height:100%; object-fit:cover;
//           object-position: posX% posY%; transform:scale(scale)
function drawCover(ctx, img, dx, dy, dw, dh, posX, posY, scale) {
    if (!img) return;
    const iW = img.naturalWidth  || img.videoWidth || img.width;
    const iH = img.naturalHeight || img.videoHeight || img.height;
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

function _clampFade(n, fallback = 0) {
    return Math.max(0, Math.min(80, Number(n ?? fallback) || 0)) / 100;
}

function _applyEdgeFade(octx, w, h, startFade, endFade, vertical) {
    if (startFade <= 0 && endFade <= 0) return;
    const g = vertical
        ? octx.createLinearGradient(0, 0, 0, h)
        : octx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, startFade > 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
    if (startFade > 0) g.addColorStop(Math.min(0.999, startFade), 'rgba(0,0,0,1)');
    const solidEnd = Math.min(0.999, Math.max(startFade + 0.001, 1 - endFade));
    if (endFade > 0) g.addColorStop(solidEnd, 'rgba(0,0,0,1)');
    g.addColorStop(1, endFade > 0 ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
    octx.globalCompositeOperation = 'destination-in';
    octx.fillStyle = g;
    octx.fillRect(0, 0, w, h);
}

function drawCutout(ctx, img, cx, cy, size, fades = {}) {
    if (!img || !size) return;
    const iW = img.naturalWidth || img.width;
    const iH = img.naturalHeight || img.height;
    if (!iW || !iH) return;
    const w = size;
    const h = (iH / iW) * w;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const top = _clampFade(fades.top);
    const bottom = _clampFade(fades.bottom);
    const left = _clampFade(fades.left);
    const right = _clampFade(fades.right);

    if (top + bottom + left + right <= 0) {
        ctx.drawImage(img, x, y, w, h);
        return;
    }

    const off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w));
    off.height = Math.max(1, Math.round(h));
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, off.width, off.height);
    _applyEdgeFade(octx, off.width, off.height, top, bottom, true);
    _applyEdgeFade(octx, off.width, off.height, left, right, false);
    ctx.drawImage(off, x, y, w, h);
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

    if ((s.bgNoise || 0) > 0) applyGrain(ctx, W, H, s.bgNoise);

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

        // Image clipped to inner circle (PERFECT - no bleed)
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, ir, 0, Math.PI * 2);
        ctx.clip();
        drawCover(ctx, ovlImg, cx - ir, cy - ir, ir * 2, ir * 2, 50, 50, 1);
        if ((s.overlayNoise || 0) > 0) applyGrain(ctx, W, H, s.overlayNoise);
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

    const barColor = t2.barColor || '#FFF';
    ctx.fillStyle = barColor;
    ctx.fillRect(0, 0, W, H);

    const PAD_H = t2.paddingH ?? 44;
    const PAD_T = t2.paddingTop ?? 40;
    const PAD_B = t2.paddingBottom ?? 36;
    const lh = t2.lineHeight ?? 1.22;
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, (t2.letterSpacing ?? -0.01) * fs);
    ctx.textBaseline = 'top';
    const hlLines  = wrapSimple(ctx, t2.headline || '', W - PAD_H * 2);
    const hlLineH  = Math.round(fs * lh);
    const hlH      = hlLines.length * hlLineH;
    const topBarH  = PAD_T + hlH + PAD_B;

    ctx.fillStyle = barColor;
    ctx.fillRect(0, 0, W, topBarH);

    // ── Headline text ─────────────────────────────────────────────────────────
    ctx.save();
    ctx.font         = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, (t2.letterSpacing ?? -0.01) * fs);
    ctx.fillStyle    = t2.textColor || '#000';
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
    const italic = t3.fontStyle === 'italic' ? 'italic ' : '';
    await loadFont(`${italic}${fw} ${fs}px "${ff}"`);

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
        setLS(ctx, (t3.brandLetterSpacing ?? 0.04) * bSz);
        const nameW = mW(ctx, t3.brandName || 'ealth');
        const showL = t3.showBrandLetter !== false;
        const innerW = (showL ? circD + 6 : 0) + nameW;
        const innerPad = 18;
        const innerL = centerX - innerW / 2 - innerPad;
        const innerR = centerX + innerW / 2 + innerPad;

        const divW = Math.max(0.5, t3.dividerWidth ?? 1.5);
        // Left fading divider line
        {
            const g = ctx.createLinearGradient(BDIV_PAD_H, 0, innerL, 0);
            g.addColorStop(0, 'rgba(255,255,255,0)');
            g.addColorStop(0.3, bColor);
            g.addColorStop(1,   bColor);
            ctx.fillStyle = g;
            ctx.fillRect(BDIV_PAD_H, midY - divW / 2, innerL - BDIV_PAD_H, divW);
        }
        // Right fading divider line
        {
            const g = ctx.createLinearGradient(innerR, 0, W - BDIV_PAD_H, 0);
            g.addColorStop(0,   bColor);
            g.addColorStop(0.7, bColor);
            g.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = g;
            ctx.fillRect(innerR, midY - divW / 2, W - BDIV_PAD_H - innerR, divW);
        }

        let bx = centerX - innerW / 2;

        // Circle letter
        if (showL) {
            ctx.save();
            ctx.strokeStyle  = bColor;
            ctx.lineWidth    = t3.letterBorderWidth ?? 1.5;
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
        setLS(ctx, (t3.brandLetterSpacing ?? 0.04) * bSz);
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

    ctx.font = `${italic}${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, ls3Em * fs);
    ctx.textBaseline = 'top';

    const hlLines3 = wrapSimple(ctx, (t3.headline || '').toUpperCase(), W - BDIV_PAD_H * 2);
    const lh3      = t3.lineHeight ?? 1.15;
    const lineH3   = Math.round(fs * lh3);
    const hlH3     = hlLines3.length * lineH3;

    // Vertically center within text area (with bottom padding 40px)
    const hl3Y = textAreaY + Math.max(10, (textAreaH - hlH3 - 40) / 2);

    ctx.save();
    ctx.font         = `${italic}${fw} ${fs}px "${ff}", sans-serif`;
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
        const fallback = h.customIconUrl ? await loadImg(h.customIconUrl) : null;
        if (fallback) {
            ctx.drawImage(fallback, cx - iSz / 2, cy - iSz / 2, iSz, iSz);
        } else {
            ctx.save();
            ctx.strokeStyle = h.iconColor || '#FFF';
            ctx.lineWidth = Math.max(6, iSz * 0.055);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            const s = iSz / 24;
            ctx.translate(cx, cy);
            ctx.scale(s, s);
            ctx.translate(-12, -12);
            ctx.beginPath();
            ctx.moveTo(12, 2);
            ctx.bezierCurveTo(9.8, 2, 8, 4.2, 8, 6.8);
            ctx.lineTo(8, 13.2);
            ctx.bezierCurveTo(8, 15.8, 9.8, 18, 12, 18);
            ctx.bezierCurveTo(14.2, 18, 16, 15.8, 16, 13.2);
            ctx.lineTo(16, 6.8);
            ctx.bezierCurveTo(16, 4.2, 14.2, 2, 12, 2);
            ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(12, 12, 7, Math.PI * 0.15, Math.PI * 0.85);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(12, 19);
            ctx.lineTo(12, 22);
            ctx.moveTo(9, 22);
            ctx.lineTo(15, 22);
            ctx.stroke();
            ctx.restore();
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
        setLS(ctx, (t4.brandLetterSpacing ?? -0.01) * bFS);
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

    const DIV_H  = t4.showDivider ? (t4.dividerWidth ?? 1.5) : 0;
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
    ctx.textAlign     = 'left'; // Always draw left-aligned internally
    ctx.shadowColor   = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur    = 16;
    ctx.shadowOffsetY = 3;
    
    const align4 = t4.textAlign || 'left';
    for (const ln of hlLines) { 
        const lineW = mW(ctx, ln);
        let cx4 = PAD;
        if (align4 === 'center') {
            cx4 = (W - lineW) / 2;
        } else if (align4 === 'right') {
            cx4 = W - PAD - lineW;
        }
        ctx.fillText(ln, cx4, y); 
        y += LH; 
    }
    ctx.restore();
    y += HL_MB;

    // ── Divider line ──────────────────────────────────────────────────────────
    if (t4.showDivider !== false) {
        ctx.save();
        ctx.globalAlpha = t4.dividerOpacity ?? 0.6;
        ctx.fillStyle   = t4.dividerColor || '#FFF';
        ctx.fillRect(PAD, y, W - PAD * 2, DIV_H);
        ctx.restore();
        y += DIV_H + DIV_MB;
    }

    // ── Swipe text ────────────────────────────────────────────────────────────
    if (t4.showSwipe !== false) {
        ctx.save();
        ctx.globalAlpha  = 0.75;
        ctx.font         = `700 ${SW_FS}px "Archivo Black", sans-serif`;
        setLS(ctx, (t4.swipeLetterSpacing ?? 0.18) * SW_FS);
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
    const leftW = Math.round(W * (Math.min(75, Math.max(25, t5.leftWidth ?? 50)) / 100));
    const rightW = W - leftW;

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
        drawCover(ctx, leftImg, 0, 0, leftW, imgH,
            t5.leftPosX ?? 50, t5.leftPosY ?? 50, (t5.leftScale ?? 100) / 100);
    }

    // ── Right image ───────────────────────────────────────────────────────────
    if (rightImg) {
        drawCover(ctx, rightImg, leftW, 0, rightW, imgH,
            t5.rightPosX ?? 50, t5.rightPosY ?? 50, (t5.rightScale ?? 100) / 100);
    }

    // ── Optional separator line between images ────────────────────────────────
    if (t5.imageSeparator) {
        ctx.save();
        ctx.fillStyle = t5.separatorColor || '#FFF';
        ctx.fillRect(leftW - (t5.separatorWidth || 2) / 2, 0, t5.separatorWidth || 2, imgH);
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
    ctx.textAlign    = 'left'; // Always draw left-aligned internally because we calculate cx5 manually
    ctx.shadowColor   = 'rgba(0,0,0,1)';
    ctx.shadowBlur    = 25;
    ctx.shadowOffsetY = 4;

    const align5 = t5.textAlign || 'center';

    // draw colored lines - for centered, we need to manually center each line
    const sp5 = mW(ctx, ' ');
    let cy5 = hlY;
    for (const line of hlLines5) {
        let lineW = 0;
        if (align5 !== 'left') {
            lineW = line.reduce((acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp5 : 0), 0);
        }

        let cx5 = PAD_H;
        if (align5 === 'center') {
            cx5 = (W - lineW) / 2;
        } else if (align5 === 'right') {
            cx5 = W - PAD_H - lineW;
        }

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
        const aW = 50, aH = 20;
        const ax = (W - aW) / 2;
        const ay = navY;
        ctx.save();
        ctx.strokeStyle = aColor;
        ctx.lineWidth   = 3;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.beginPath();
        ctx.moveTo(ax + 48, ay + 10);
        ctx.lineTo(ax + 2,  ay + 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax + 12, ay + 2);
        ctx.lineTo(ax + 2,  ay + 10);
        ctx.lineTo(ax + 12, ay + 18);
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

    // ── Watermark (overlaid on top image area) ────────────────────────────────
    if (t5.showWatermark !== false && t5.watermarkUrl) {
        const wmImg = await loadImg(t5.watermarkUrl);
        if (wmImg) {
            const wmSize = t5.watermarkSize || 180;
            const wmOp   = t5.watermarkOpacity ?? 1;
            const wmPosX = t5.watermarkPosX ?? 50;
            const wmPosY = t5.watermarkPosY ?? 10;

            const wmAspectRatio = wmImg.width / wmImg.height;
            const wmW = wmSize;
            const wmH = wmSize / wmAspectRatio;

            let wx = (wmPosX / 100) * W;
            let wy = (wmPosY / 100) * imgH;

            // Handle edge clamping like CSS logic
            if (wmPosX <= 15) wx = (wmPosX / 100) * W;
            else if (wmPosX >= 85) wx = W - ( (100-wmPosX)/100 * W ) - wmW;
            else wx -= wmW / 2;

            if (wmPosY <= 15) wy = (wmPosY / 100) * imgH;
            else if (wmPosY >= 85) wy = imgH - ( (100-wmPosY)/100 * imgH ) - wmH;
            else wy -= wmH / 2;

            ctx.save();
            ctx.globalAlpha = wmOp;
            ctx.drawImage(wmImg, wx, wy, wmW, wmH);
            ctx.restore();
        }
    }
}

// ─── TEMPLATE 6 / 8 (Sports / Hurdels variants) ─────────────────────────────
async function exportT6(ctx, state, W, H) {
    const isT8 = state.post.template === 'template8';
    const t6 = isT8 ? state.post.t8 : state.post.t6;
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
        setLS(ctx, (t6.brandLetterSpacing ?? 0.03) * bFS);
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
    ctx.shadowColor   = 'rgba(0,0,0,1)';
    ctx.shadowBlur    = 25;
    ctx.shadowOffsetY = 4;

    const sp6 = mW(ctx, ' ');
    let hy6 = hlTop;
    const align6 = t6.textAlign || 'left';
    
    for (const line of hlLines6) {
        let lineW = 0;
        if (align6 !== 'left') {
            lineW = line.reduce((acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp6 : 0), 0);
        }
        
        let cx6 = PAD_H;
        if (align6 === 'center') {
            cx6 = (W - lineW) / 2;
        } else if (align6 === 'right') {
            cx6 = W - PAD_H - lineW;
        }
        
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

        if (isT8) {
            // Template 8: text-only SWIPE CTA (no chevrons)
            ctx.font = `700 ${SW_FS6}px "${swFF}", sans-serif`;
            setLS(ctx, (t6.swipeLetterSpacing ?? 0.22) * SW_FS6);
            ctx.fillText((t6.swipeText || 'SWIPE').toUpperCase(), W / 2, navY6);
        } else {
            // Template 6: SWIPE with decorative chevrons on both sides
            // Left deco (faded)
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.font        = `${decoSz}px sans-serif`;
            setLS(ctx, 5);
            ctx.fillText(decoTxt, W / 2 - 80, navY6 + (SW_FS6 - decoSz) / 2);
            ctx.restore();

            // Center swipe word
            ctx.font = `700 ${SW_FS6}px "${swFF}", sans-serif`;
            setLS(ctx, (t6.swipeLetterSpacing ?? 0.22) * SW_FS6);
            ctx.fillText((t6.swipeText || 'SWIPE').toUpperCase(), W / 2, navY6);

            // Right deco (faded)
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.font        = `${decoSz}px sans-serif`;
            setLS(ctx, 5);
            ctx.fillText(decoTxt, W / 2 + 80, navY6 + (SW_FS6 - decoSz) / 2);
            ctx.restore();
        }

        ctx.restore();
        navY6 += SW_H6 + (t6.showDots ? 10 : 0);
    }

    if (t6.showDots) {
        const cnt6 = Math.max(1, Math.min(10, t6.dotCount  || 4));
        const act6 = Math.max(0, Math.min(cnt6 - 1, t6.activeDot || 0));
        drawDots(ctx, W / 2, navY6, cnt6, act6, DOT_H6, 20, 7, 5, t6.dotColor || '#FFF', 1, 0.45);
    }
}

// ─── Load an SVG string as a canvas-drawable Image ────────────────────────────
async function loadSvgImg(svgStr) {
    return new Promise(resolve => {
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url  = URL.createObjectURL(blob);
        const img  = new Image();
        img.onload  = () => { URL.revokeObjectURL(url); resolve(img); };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
        img.src = url;
    });
}

// ─── TEMPLATE 7 (Twitter/X Post - 1080×1080 square) ──────────────────────────
async function exportT7(ctx, state, W, H) {
    const t7 = state.post.t7;

    const profileImg = t7.profileImageUrl ? await loadImg(t7.profileImageUrl) : null;

    const ff = t7.customFontFamily || t7.fontFamily || 'system-ui';
    const ffs = `"${ff}",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif`;
    await Promise.all([
        loadFont(`${t7.usernameFontWeight} ${t7.usernameFontSize}px ${ffs}`),
        loadFont(`${t7.tweetFontWeight} ${t7.tweetFontSize}px ${ffs}`),
        loadFont(`${t7.timestampFontSize}px ${ffs}`),
        loadFont(`${t7.metricsFontSize}px ${ffs}`),
    ]);

    const PAD_H       = t7.paddingH         || 60;
    const PAD_V       = t7.paddingV         || 60;
    const PROF        = t7.profileImageSize  || 160;
    const U_FS        = t7.usernameFontSize  || 36;
    const U_FW        = t7.usernameFontWeight|| 700;
    const H_FS        = t7.handleFontSize    || 32;
    const TW_FS       = t7.tweetFontSize     || 62;
    const TW_FW       = t7.tweetFontWeight   || 400;
    const TW_LH       = t7.lineHeight        || 1.47;
    const TS_FS       = t7.timestampFontSize || 30;
    const M_FS        = t7.metricsFontSize   || 30;
    const SP          = t7.spacingBetweenElements || 24;
    const borderColor = t7.borderColor       || 'rgba(255,255,255,0.12)';
    const borderWidth = t7.borderWidth ?? 1;
    const ic          = t7.iconColor         || '#8B98A5';
    const iconDrawH   = Math.round(M_FS * 1.85);
    const BAND_PAD    = Math.max(28, Math.round(SP * 1.2));
    const moreW       = Math.round(U_FS * 0.72);

    const [replyIconImg, retweetIconImg, heartIconImg, shareIconImg, moreIconImg, xBadgeImg] = await Promise.all([
        loadSvgImg(tweetIconSvg('reply', ic)),
        loadSvgImg(tweetIconSvg('retweet', ic)),
        loadSvgImg(tweetIconSvg('like', ic)),
        loadSvgImg(tweetIconSvg('share', ic)),
        loadSvgImg(tweetIconSvg('more', ic)),
        t7.showVerifiedBadge ? loadImg(`${import.meta.env.BASE_URL || '/'}ui/x-badge.png`) : Promise.resolve(null),
    ]);

    // ── Background ────────────────────────────────────────────────────────────
    ctx.fillStyle = t7.bgColor || '#15202B';
    ctx.fillRect(0, 0, W, H);

    ctx.textBaseline = 'top';
    let y = PAD_V;

    // ── 1. Header ─────────────────────────────────────────────────────────────
    const uLineH  = Math.round(U_FS * 1.15);
    const hLineH  = Math.round(H_FS * 1.2);
    const headerH = Math.max(PROF, 4 + uLineH + 2 + hLineH);

    // Profile circle - top-aligned like Twitter
    const profileCX = PAD_H + PROF / 2;
    const profileCY = y + PROF / 2;
    if (profileImg) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(profileCX, profileCY, PROF / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(profileImg, PAD_H, profileCY - PROF / 2, PROF, PROF);
        ctx.restore();
    } else {
        ctx.save();
        ctx.fillStyle = '#2D3741';
        ctx.beginPath();
        ctx.arc(profileCX, profileCY, PROF / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(profileCX, profileCY - PROF * 0.12, PROF * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(profileCX, profileCY + PROF * 0.25, PROF * 0.32, PROF * 0.22, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }

    // Username + handle + verified badge
    const nameX        = PAD_H + PROF + 20;
    const textBlockTop = y + 4;
    ctx.save();
    ctx.textBaseline = 'top';
    ctx.font = `${U_FW} ${U_FS}px ${ffs}`;
    setLS(ctx, (t7.usernameLetterSpacing ?? 0) * U_FS);
    ctx.fillStyle = t7.usernameColor || '#E7E9EA';
    ctx.fillText(t7.username || 'erin', nameX, textBlockTop);
    if (t7.showVerifiedBadge && xBadgeImg) {
        const bSz = Math.max(1, Math.round(U_FS * 1.05));
        const usernameW = ctx.measureText(t7.username || 'erin').width;
        const badgeY = textBlockTop + Math.max(0, (uLineH - bSz) / 2);
        ctx.drawImage(xBadgeImg, nameX + usernameW + 6, badgeY, bSz, bSz);
    }
    setLS(ctx, 0);
    ctx.font = `${H_FS}px ${ffs}`;
    ctx.fillStyle = t7.handleColor || '#8B98A5';
    ctx.fillText(t7.handle || '@ErinSauriol', nameX, textBlockTop + uLineH + 2);
    if (moreIconImg) {
        ctx.drawImage(moreIconImg, W - PAD_H - moreW, textBlockTop + 2, moreW, moreW);
    }
    ctx.restore();

    y += headerH + Math.round(SP * 0.55);

    // ── 2. Tweet Text ──────────────────────────────────────────────────────────
    ctx.save();
    ctx.font = `${TW_FW} ${TW_FS}px ${ffs}`;
    setLS(ctx, (t7.letterSpacing ?? 0) * TW_FS);
    ctx.fillStyle = t7.textColor || '#E7E9EA';
    const tweetLines = wrapSimple(ctx, t7.tweetText || '', W - PAD_H * 2);
    const tweetLineH = Math.round(TW_FS * TW_LH);
    for (const line of tweetLines) { ctx.fillText(line, PAD_H, y); y += tweetLineH; }
    setLS(ctx, 0);
    ctx.restore();
    y += SP;

    // ── 3. Timestamp + Source ──────────────────────────────────────────────────
    ctx.save();
    ctx.font = `${TS_FS}px ${ffs}`;
    const timestamp = t7.timestamp || '5:35 PM · 12/14/21';
    const source    = t7.source    || 'Twitter for iPhone';
    ctx.fillStyle = t7.timestampColor || '#8B98A5';
    ctx.fillText(timestamp, PAD_H, y);
    const tsW  = ctx.measureText(timestamp).width;
    const dot  = ' · ';
    ctx.fillText(dot, PAD_H + tsW, y);
    const dotW = ctx.measureText(dot).width;
    ctx.fillStyle = t7.sourceColor || '#1D9BF0';
    const srcX = PAD_H + tsW + dotW;
    ctx.fillText(source, srcX, y);
    ctx.restore();
    y += Math.round(TS_FS * 1.3) + SP;

    // ── 4. Metrics row (divider + bold num + gray label) ─────────────────────
    ctx.save();
    ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth;
    ctx.beginPath(); ctx.moveTo(PAD_H, y); ctx.lineTo(W - PAD_H, y); ctx.stroke();
    ctx.restore();
    y += borderWidth + BAND_PAD;

    ctx.save();
    ctx.textBaseline = 'top';
    const mData = [
        { v: t7.retweets    || '27K',   l: ' Retweets' },
        { v: t7.quoteTweets || '6,808', l: ' Quote Tweets' },
        { v: t7.likes       || '255K',  l: ' Likes' },
    ];
    let mx = PAD_H;
    for (const m of mData) {
        ctx.font = `700 ${M_FS}px ${ffs}`; ctx.fillStyle = t7.textColor || '#E7E9EA';
        ctx.fillText(m.v, mx, y); const vW = ctx.measureText(m.v).width;
        ctx.font = `${M_FS}px ${ffs}`; ctx.fillStyle = t7.metricsColor || '#8B98A5';
        ctx.fillText(m.l, mx + vW, y); mx += vW + ctx.measureText(m.l).width + 48;
    }
    ctx.restore();
    y += Math.round(M_FS * 1.3) + BAND_PAD;

    // ── 5. Icons row ──────────────────────────────────────────────────────────
    if (t7.showEngagementIcons) {
        ctx.save();
        ctx.strokeStyle = borderColor; ctx.lineWidth = borderWidth;
        ctx.beginPath(); ctx.moveTo(PAD_H, y); ctx.lineTo(W - PAD_H, y); ctx.stroke();
        ctx.restore();
        y += borderWidth + BAND_PAD;

        const iSz  = iconDrawH;
        const colW = (W - PAD_H * 2) / 4;
        const icons = [replyIconImg, retweetIconImg, heartIconImg, shareIconImg];
        icons.forEach((img, i) => {
            if (!img) return;
            const cx = PAD_H + colW * (i + 0.5);
            ctx.drawImage(img, cx - iSz / 2, y, iSz, iSz);
        });
    }
}

// ─── TEMPLATE 9 (Toad Creek: bottom fade, logo TL, gold/white text) ───────────
async function exportT9(ctx, state, W, H) {
    const t9 = state.post.t9;

    const [bgImg, logoImg] = await Promise.all([
        loadImg(t9.bgImage),
        (t9.showLogo && t9.logoUrl) ? loadImg(t9.logoUrl) : null,
    ]);

    const ff = t9.customFontFamily || t9.fontFamily || 'Anton';
    const fs = t9.fontSize || 108;
    const fw = t9.fontWeight || 700;
    await loadFont(`${fw} ${fs}px "${ff}"`);

    // ── Black base ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    // ── Background image ──────────────────────────────────────────────────────
    if (bgImg) {
        ctx.save();
        drawCover(
            ctx,
            bgImg,
            0,
            0,
            W,
            H,
            t9.imagePosX ?? 50,
            t9.imagePosY ?? 50,
            (t9.imageScale ?? 100) / 100
        );
        ctx.restore();
    }

    // ── Bottom colour fade ────────────────────────────────────────────────────
    // Use the fade colour's own RGB at alpha=0 for the transparent stop so the
    // gradient interpolates through the correct hue (not through black).
    const fadePct = Math.max(0, Math.min(100, t9.bottomFadeHeight ?? 50)) / 100;
    if (fadePct > 0 && (t9.bottomFadeOpacity ?? 0) > 0) {
        const fadeH   = fadePct * H;
        const fadeY   = H - fadeH;
        const col     = t9.bottomFadeColor || '#172d42';
        const { r: fr, g: fg, b: fb } = h2rgb(col);
        const g       = ctx.createLinearGradient(0, fadeY, 0, H);
        g.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
        g.addColorStop(1, col);
        ctx.save();
        ctx.globalAlpha = t9.bottomFadeOpacity ?? 1;
        ctx.fillStyle   = g;
        ctx.fillRect(0, fadeY, W, fadeH + 2);
        ctx.restore();
    }

    // ── Logo (top-left) ───────────────────────────────────────────────────────
    if (logoImg && t9.showLogo !== false) {
        const ls = t9.logoSize || 251;
        const lW = ls;
        const aspect = (logoImg.naturalHeight || logoImg.height || 1) /
                       (logoImg.naturalWidth || logoImg.width || 1);
        const lH = lW * aspect;
        const x = (t9.logoPosX ?? 2) / 100 * W;
        const y = (t9.logoPosY ?? 2) / 100 * H;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.55)';
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 4;
        ctx.drawImage(logoImg, x, y, lW, lH);
        ctx.restore();
    }

    // ── Headline (bottom centre, [brackets] = gold) ──────────────────────────
    const PAD_H = t9.paddingH ?? 40;
    const PAD_B = t9.paddingBottom ?? 80;
    const lh = t9.lineHeight ?? 1.1;
    const lsEm = t9.letterSpacing ?? 0;
    const lsPx = lsEm * fs;

    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, lsPx);

    // Split into logical lines (respect explicit newlines)
    const allLines = [];
    const rawLines = (t9.headline || '').split(/\r?\n/);
    for (const rawLine of rawLines) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).toUpperCase().split(/\s+/).forEach(w => {
                    if (w) words.push({ word: w, color: t9.highlightColor || '#d2a02d' });
                });
            } else {
                p.toUpperCase().split(/\s+/).forEach(w => {
                    if (w) words.push({ word: w, color: t9.headlineColor || '#fffdfd' });
                });
            }
        }
        const wrapped = wrapColored(ctx, words, W - PAD_H * 2);
        for (const line of wrapped) allLines.push(line);
    }

    const lineH = Math.round(fs * lh);
    const totalH = allLines.length * lineH;
    let y = H - PAD_B - totalH;

    const sp = mW(ctx, ' ');
    const align = t9.textAlign || 'center';

    ctx.save();
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, lsPx);
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 4;

    for (const line of allLines) {
        let lineW = 0;
        if (align !== 'left') {
            lineW = line.reduce(
                (acc, item, i) =>
                    acc + mW(ctx, item.word) + (i < line.length - 1 ? sp : 0),
                0
            );
        }

        let x = PAD_H;
        if (align === 'center') {
            x = (W - lineW) / 2;
        } else if (align === 'right') {
            x = W - PAD_H - lineW;
        }

        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, x, y);
            x += mW(ctx, line[i].word);
            if (i < line.length - 1) x += sp;
        }
        y += lineH;
    }

    ctx.restore();
}

// ─── TEMPLATE 10 (Grunge Print: top-right watermark, bottom glow) ─────────────
async function exportT10(ctx, state, W, H) {
    const t10 = state.post.t10;

    const [bgImg, wmImg] = await Promise.all([
        loadImg(t10.bgImage),
        (t10.showWatermark && t10.watermarkUrl) ? loadImg(t10.watermarkUrl) : null,
    ]);

    const ff = t10.customFontFamily || t10.fontFamily || 'Rubik Dirt';
    const fs = t10.fontSize || 153;
    const fw = t10.fontWeight || 400;
    await loadFont(`${fw} ${fs}px "${ff}"`);
    if (t10.showSwipe !== false) {
        await loadFont(`700 ${t10.swipeFontSize || 26}px "${ff}"`);
    }

    // ── Base background ────────────────────────────────────────────────────────
    ctx.fillStyle = '#f4f4f4';
    ctx.fillRect(0, 0, W, H);

    // ── Background image ──────────────────────────────────────────────────────
    if (bgImg) {
        const posX = t10.imagePosX != null ? t10.imagePosX : 50;
        const posY = t10.imagePosY != null ? t10.imagePosY : 50;
        const scale = (t10.imageScale != null ? t10.imageScale : 100) / 100;
        drawCover(ctx, bgImg, 0, 0, W, H, posX, posY, scale);
    }

    // ── Bottom dark fade on background ────────────────────────────────────────
    const fadeHpct    = Math.max(0, Math.min(100, t10.fadeHeight   ?? 40)) / 100;
    const fadeStrength = Math.max(0, Math.min(1,  t10.fadeStrength ?? 0.7));
    if (fadeHpct > 0 && fadeStrength > 0) {
        const fadeH = fadeHpct * H;
        const fadeY = H - fadeH;
        const g     = ctx.createLinearGradient(0, fadeY, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${fadeStrength})`);
        ctx.save();
        ctx.fillStyle = g;
        ctx.fillRect(0, fadeY, W, fadeH + 2);
        ctx.restore();
    }

    // ── Global black overlay ───────────────────────────────────────────────────
    if ((t10.overlayOpacity ?? 0) > 0) {
        ctx.save();
        ctx.globalAlpha = t10.overlayOpacity ?? 0.35;
        ctx.fillStyle = t10.overlayColor || '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    // ── Bottom dark glow ─────────────────────────────────────────────────────
    // CSS: a 260px-tall div at the BOTTOM of a container, with a radial gradient
    // whose center is at the top of that div (50% 0%), plus filter:blur(46px).
    // The container has overflow:hidden so the glow is clipped to the bottom region.
    // Canvas equivalent: radial gradient centered BELOW the canvas bottom
    // (simulating the gradient source at the very bottom edge), clipped to the
    // bottom glowHpct region.  No blob in the middle.
    const glowHpct    = Math.max(0, Math.min(100, t10.glowHeight ?? 64)) / 100;
    const glowOpacity = Math.max(0, Math.min(1,   t10.glowOpacity ?? 0.9));
    if (glowHpct > 0 && glowOpacity > 0) {
        const containerH = glowHpct * H;
        const containerY = H - containerH; // top of the glow container

        ctx.save();
        // Clip to the container area - nothing draws above this line
        ctx.beginPath();
        ctx.rect(0, containerY, W, containerH + 2);
        ctx.clip();

        // Gradient center sits just below the canvas bottom (translateY(34px) analog).
        // Radius = 75 % of W so it spreads to ~150 % total, matching the 140 % wide div.
        const gradCX = W / 2;
        const gradCY = H + H * 0.04;   // ~4 % of H below bottom edge
        const gradR  = W * 0.75;

        const grad = ctx.createRadialGradient(gradCX, gradCY, 0, gradCX, gradCY, gradR);
        grad.addColorStop(0,    `rgba(0,0,0,${glowOpacity})`);
        grad.addColorStop(0.32, `rgba(0,0,0,${+(glowOpacity * 0.7).toFixed(3)})`);
        grad.addColorStop(0.78, 'rgba(0,0,0,0)');

        ctx.fillStyle = grad;
        ctx.fillRect(-W * 0.2, containerY, W * 1.4, containerH + gradR);
        ctx.restore();
    }

    if ((t10.noiseAmount || 0) > 0) applyGrain(ctx, W, H, t10.noiseAmount);

    // ── Headline (bottom centre, grunge text) ─────────────────────────────────
    const PAD_H = t10.paddingH ?? 74;
    const PAD_B = t10.paddingBottom ?? 85;
    const lh = t10.lineHeight ?? 0.85;
    const lsEm = t10.letterSpacing ?? 0;
    const lsPx = lsEm * fs;

    ctx.font = `${fw} ${fs}px "${ff}", system-ui`;
    setLS(ctx, lsPx);

    const allLines10 = [];
    const rawLines10 = (t10.headline || '').split(/\r?\n/);
    for (const rawLine of rawLines10) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).toUpperCase().split(/\s+/).forEach(w => {
                    if (w) words.push({ word: w, color: t10.highlightColor || '#ffffff' });
                });
            } else {
                p.toUpperCase().split(/\s+/).forEach(w => {
                    if (w) words.push({ word: w, color: t10.headlineColor || '#EC4899' });
                });
            }
        }
        const wrapped = wrapColored(ctx, words, W - PAD_H * 2);
        for (const line of wrapped) allLines10.push(line);
    }

    const lineH10 = Math.round(fs * lh);
    const totalH10 = allLines10.length * lineH10;
    let y10 = H - PAD_B - totalH10;

    const sp10 = mW(ctx, ' ');
    const align10 = t10.textAlign || 'center';

    ctx.save();
    ctx.font = `${fw} ${fs}px "${ff}", system-ui`;
    setLS(ctx, lsPx);
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.85;

    for (const line of allLines10) {
        let lineW = 0;
        if (align10 !== 'left') {
            lineW = line.reduce(
                (acc, item, i) =>
                    acc + mW(ctx, item.word) + (i < line.length - 1 ? sp10 : 0),
                0
            );
        }

        let x10 = PAD_H;
        if (align10 === 'center') {
            x10 = (W - lineW) / 2;
        } else if (align10 === 'right') {
            x10 = W - PAD_H - lineW;
        }

        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, x10, y10);
            x10 += mW(ctx, line[i].word);
            if (i < line.length - 1) x10 += sp10;
        }
        y10 += lineH10;
    }

    ctx.restore();

    // ── Swipe CTA - 3 styles ───────────────────────────────────────────────────
    if (t10.showSwipe !== false) {
        const swFF  = t10.swipeCustomFontFamily || t10.swipeFontFamily || ff;
        const swFS  = t10.swipeFontSize || 26;
        const swTxt = (t10.swipeText || 'SWIPE').toUpperCase();
        const swCol = t10.swipeColor || '#FFFFFF';
        const ySw   = H - 30;

        await loadFont(`700 ${swFS}px "${swFF}"`);

        ctx.save();
        ctx.fillStyle    = swCol;
        ctx.textBaseline = 'bottom';
        ctx.textAlign    = 'center';

        if (t10.swipeStyle === 'chevron') {
            // Centre word
            ctx.font = `700 ${swFS}px "${swFF}", system-ui`;
            setLS(ctx, (t10.swipeLetterSpacing ?? 0.24) * swFS);
            const txtW   = mW(ctx, swTxt);
            const gap    = swFS * 0.55;
            const decoSz = Math.round(swFS * 0.52);
            const decoTxt = '\u203A\u00A0\u203A\u00A0\u203A';

            ctx.font = `700 ${swFS}px "${swFF}", system-ui`;
            setLS(ctx, (t10.swipeLetterSpacing ?? 0.24) * swFS);
            ctx.fillText(swTxt, W / 2, ySw);

            // Left chevrons
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.font = `${decoSz}px sans-serif`;
            setLS(ctx, 5);
            ctx.textAlign = 'right';
            ctx.fillText(decoTxt, W / 2 - txtW / 2 - gap, ySw);
            ctx.restore();

            // Right chevrons
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.font = `${decoSz}px sans-serif`;
            setLS(ctx, 5);
            ctx.textAlign = 'left';
            ctx.fillText(decoTxt, W / 2 + txtW / 2 + gap, ySw);
            ctx.restore();

        } else if (t10.swipeStyle === 'badge') {
            ctx.font = `700 ${swFS}px "${swFF}", system-ui`;
            setLS(ctx, (t10.swipeLetterSpacing ?? 0.24) * swFS);
            const tw    = mW(ctx, swTxt);
            const padH  = swFS * 0.55;
            const padV  = swFS * 0.22;
            const bW    = tw + padH * 2;
            const bH    = swFS + padV * 2;
            const bX    = W / 2 - bW / 2;
            const bY    = ySw - bH;
            // Border rect
            ctx.save();
            ctx.strokeStyle = swCol;
            ctx.lineWidth   = Math.max(1.5, swFS / 16);
            ctx.strokeRect(bX, bY, bW, bH);
            ctx.restore();
            // Text inside
            ctx.textBaseline = 'middle';
            ctx.fillText(swTxt, W / 2, bY + bH / 2);

        } else {
            // 'text' - plain bold
            ctx.font = `700 ${swFS}px "${swFF}", system-ui`;
            setLS(ctx, (t10.swipeLetterSpacing ?? 0.24) * swFS);
            ctx.fillText(swTxt, W / 2, ySw);
        }

        ctx.restore();
    }

    // ── Watermark (top-right biased, adjustable) ──────────────────────────────
    if (wmImg && t10.showWatermark !== false && t10.watermarkUrl) {
        const wmW = t10.watermarkSize || 364;
        const wmH = (wmImg.naturalHeight / wmImg.naturalWidth) * wmW;
        const posX = t10.watermarkPosX != null ? t10.watermarkPosX : 100;
        const posY = t10.watermarkPosY != null ? t10.watermarkPosY : 0;
        const { x: wx, y: wy } = calcWmXY(posX, posY, W, H, wmW, wmH);

        ctx.save();
        ctx.globalAlpha = t10.watermarkOpacity ?? 0.9;
        ctx.drawImage(wmImg, wx, wy, wmW, wmH);
        ctx.restore();
    }
}

// ─── TEMPLATE 11 (Editorial - 1080×1350 photo + serif headline) ───────────────
async function exportT11(ctx, state, W, H) {
    const t11 = state.post.t11 || {};
    const atTop = t11.headlinePos === 'top';

    const [bgImg, wmImg] = await Promise.all([
        loadImg(t11.bgImage),
        (t11.showWatermark && t11.watermarkUrl) ? loadImg(t11.watermarkUrl) : null,
    ]);

    const ff = t11.customFontFamily || t11.fontFamily || 'Playfair Display';
    const fs = t11.fontSize || 78;
    const fw = t11.fontWeight || 700;
    const italic = t11.fontItalic ? 'italic ' : '';
    await loadFont(`${italic}${fw} ${fs}px "${ff}"`);

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    if (bgImg) {
        drawCover(
            ctx,
            bgImg,
            0, 0, W, H,
            t11.imagePosX ?? 50,
            t11.imagePosY ?? 50,
            (t11.imageScale ?? 100) / 100,
        );
    }

    const fadePct = Math.max(0, Math.min(100, t11.fadeHeight ?? 42)) / 100;
    const fadeStrength = Math.max(0, Math.min(1, t11.fadeStrength ?? 0.42));
    if (fadePct > 0 && fadeStrength > 0) {
        const fadeH = fadePct * H;
        const g = atTop
            ? ctx.createLinearGradient(0, fadeH, 0, 0)
            : ctx.createLinearGradient(0, H - fadeH, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${fadeStrength})`);
        ctx.fillStyle = g;
        if (atTop) ctx.fillRect(0, 0, W, fadeH + 2);
        else ctx.fillRect(0, H - fadeH - 2, W, fadeH + 2);
    }

    if ((t11.overlayOpacity ?? 0) > 0) {
        ctx.save();
        ctx.globalAlpha = t11.overlayOpacity ?? 0.1;
        ctx.fillStyle = t11.overlayColor || '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    const PAD_H = t11.paddingH ?? 88;
    const PAD_V = t11.paddingV ?? 92;
    const lh = t11.lineHeight ?? 1.08;
    const lsPx = (t11.letterSpacing ?? -0.02) * fs;
    const fontSpec = `${italic}${fw} ${fs}px "${ff}", Georgia, serif`;

    ctx.font = fontSpec;
    setLS(ctx, lsPx);

    const allLines = [];
    const rawLines = String(t11.headline || '').split(/\r?\n/);
    for (const rawLine of rawLines) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t11.highlightColor || '#FFFFFF' });
                });
            } else {
                p.split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t11.headlineColor || '#FFFFFF' });
                });
            }
        }
        if (!words.length) {
            allLines.push([]);
            continue;
        }
        const wrapped = wrapColored(ctx, words, W - PAD_H * 2);
        for (const line of wrapped) allLines.push(line);
    }

    const lineH = Math.round(fs * lh);
    const totalH = Math.max(1, allLines.length) * lineH;
    let y = atTop ? PAD_V : H - PAD_V - totalH;
    const align = t11.textAlign || 'center';
    const sp = mW(ctx, ' ');

    ctx.save();
    ctx.font = fontSpec;
    setLS(ctx, lsPx);
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 2;

    for (const line of allLines) {
        if (!line.length) {
            y += lineH;
            continue;
        }
        let lineW = 0;
        if (align !== 'left') {
            lineW = line.reduce(
                (acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp : 0),
                0,
            );
        }
        let x = PAD_H;
        if (align === 'center') x = (W - lineW) / 2;
        else if (align === 'right') x = W - PAD_H - lineW;

        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, x, y);
            x += mW(ctx, line[i].word);
            if (i < line.length - 1) x += sp;
        }
        y += lineH;
    }
    ctx.restore();

    if (wmImg && t11.showWatermark !== false && t11.watermarkUrl) {
        const wmW = t11.watermarkSize || 56;
        const natW = wmImg.naturalWidth || wmImg.width || 1;
        const natH = wmImg.naturalHeight || wmImg.height || 1;
        const wmH = (natH / natW) * wmW;
        const posX = t11.watermarkPosX != null ? t11.watermarkPosX : 96;
        const posY = t11.watermarkPosY != null ? t11.watermarkPosY : 96;
        const { x: wx, y: wy } = calcWmXY(posX, posY, W, H, wmW, wmH);
        ctx.save();
        ctx.globalAlpha = t11.watermarkOpacity ?? 0.92;
        ctx.drawImage(wmImg, wx, wy, wmW, wmH);
        ctx.restore();
    }
}

// ─── TEMPLATE 12 (Cutout Stack - bronze field + transparent PNGs) ─────────────
async function exportT12(ctx, state, W, H) {
    const t12 = state.post.t12 || {};
    const [centerImg, leftImg, rightImg, logoImg] = await Promise.all([
        t12.imageCenter ? loadImg(t12.imageCenter) : null,
        t12.imageLeft ? loadImg(t12.imageLeft) : null,
        t12.imageRight ? loadImg(t12.imageRight) : null,
        (t12.showLogo && t12.logoUrl) ? loadImg(t12.logoUrl) : null,
    ]);

    const ff = t12.customFontFamily || t12.fontFamily || 'Archivo Black';
    const fs = t12.fontSize || 148;
    const fw = t12.fontWeight || 900;
    const eyeFS = t12.eyebrowSize || 34;
    const swFS = t12.swipeFontSize || 22;
    await Promise.all([
        loadFont(`${fw} ${fs}px "${ff}"`),
        loadFont(`800 ${eyeFS}px "${ff}"`),
        loadFont(`800 ${swFS}px "${ff}"`),
    ]);

    const bg = t12.bgColor || '#2a1a12';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const gx = ((t12.glowX ?? 50) / 100) * W;
    const gy = ((t12.glowY ?? 34) / 100) * H;
    const gr = ((t12.glowSize ?? 70) / 100) * W;
    const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    glow.addColorStop(0, t12.glowColor || '#b08958');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    if ((t12.noiseAmount || 0) > 0) applyGrain(ctx, W, H, t12.noiseAmount);

    if (leftImg) {
        drawCutout(ctx, leftImg, (t12.leftPosX ?? 18) / 100 * W, (t12.leftPosY ?? 44) / 100 * H, t12.leftSize || 420, {
            top: t12.leftFadeTop ?? 0,
            bottom: t12.leftFadeBottom ?? 28,
            left: t12.leftFadeLeft ?? 0,
            right: t12.leftFadeRight ?? 0,
        });
    }
    if (rightImg) {
        drawCutout(ctx, rightImg, (t12.rightPosX ?? 82) / 100 * W, (t12.rightPosY ?? 44) / 100 * H, t12.rightSize || 420, {
            top: t12.rightFadeTop ?? 0,
            bottom: t12.rightFadeBottom ?? 28,
            left: t12.rightFadeLeft ?? 0,
            right: t12.rightFadeRight ?? 0,
        });
    }
    if (centerImg) {
        drawCutout(ctx, centerImg, (t12.centerPosX ?? 50) / 100 * W, (t12.centerPosY ?? 46) / 100 * H, t12.centerSize || 780, {
            top: t12.centerFadeTop ?? 0,
            bottom: t12.centerFadeBottom ?? 38,
            left: t12.centerFadeLeft ?? 0,
            right: t12.centerFadeRight ?? 0,
        });
    }

    const washH = Math.max(0, Math.min(100, t12.fadeHeight ?? 42)) / 100 * H;
    const washStrength = Math.max(0, Math.min(1, t12.fadeStrength ?? 0.92));
    if (washH > 0 && washStrength > 0) {
        const { r, g, b } = h2rgb(bg);
        const wash = ctx.createLinearGradient(0, H - washH, 0, H);
        wash.addColorStop(0, `rgba(${r},${g},${b},0)`);
        wash.addColorStop(1, bg);
        ctx.save();
        ctx.globalAlpha = washStrength;
        ctx.fillStyle = wash;
        ctx.fillRect(0, H - washH - 2, W, washH + 2);
        ctx.restore();
    }

    if (logoImg && t12.showLogo) {
        const lw = t12.logoSize || 110;
        const natW = logoImg.naturalWidth || logoImg.width || 1;
        const natH = logoImg.naturalHeight || logoImg.height || 1;
        const lh = (natH / natW) * lw;
        const { x: lx, y: ly } = calcWmXY(t12.logoPosX ?? 4, t12.logoPosY ?? 4, W, H, lw, lh);
        ctx.save();
        ctx.globalAlpha = t12.logoOpacity ?? 1;
        ctx.drawImage(logoImg, lx, ly, lw, lh);
        ctx.restore();
    }

    const PAD_H = t12.paddingH ?? 48;
    const PAD_B = t12.paddingBottom ?? 128;
    const hl = String(t12.headline || '').toUpperCase();
    const lsPx = (t12.letterSpacing ?? -0.04) * fs;
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, lsPx);
    const rawLines = hl.split(/\r?\n/);
    const lines = [];
    for (const raw of rawLines) {
        const wrapped = wrapSimple(ctx, raw, W - PAD_H * 2);
        for (const line of wrapped) lines.push(line);
    }
    const lineH = Math.round(fs * (t12.lineHeight ?? 0.86));
    const titleH = Math.max(1, lines.length) * lineH;
    const eyeGap = 10;
    const eyeH = eyeFS * 1.1;
    let y = H - PAD_B - titleH - eyeH - eyeGap;

    ctx.save();
    ctx.font = `800 ${eyeFS}px "${ff}", sans-serif`;
    setLS(ctx, (t12.eyebrowLetterSpacing ?? 0.02) * eyeFS);
    ctx.fillStyle = t12.eyebrowColor || '#FFFFFF';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText((t12.eyebrowLeft || '').toUpperCase(), PAD_H, y);
    ctx.textAlign = 'right';
    ctx.fillText((t12.eyebrowRight || '').toUpperCase(), W - PAD_H, y);
    ctx.restore();
    y += eyeH + eyeGap;

    ctx.save();
    ctx.font = `${fw} ${fs}px "${ff}", sans-serif`;
    setLS(ctx, lsPx);
    ctx.fillStyle = t12.headlineColor || '#FFFFFF';
    ctx.textBaseline = 'top';
    const align = t12.textAlign || 'center';
    for (const line of lines) {
        const lineW = mW(ctx, line);
        let x = PAD_H;
        if (align === 'center') x = (W - lineW) / 2;
        else if (align === 'right') x = W - PAD_H - lineW;
        ctx.fillText(line, x, y);
        y += lineH;
    }
    ctx.restore();

    if (t12.showSwipe !== false) {
        ctx.save();
        ctx.font = `800 ${swFS}px "${ff}", sans-serif`;
        setLS(ctx, (t12.swipeLetterSpacing ?? 0.06) * swFS);
        ctx.fillStyle = t12.swipeColor || '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText((t12.swipeText || 'SWIPE LEFT TO SEE THE LIST').toUpperCase(), W / 2, H - 28);
        ctx.restore();
    }
}

// ─── TEMPLATE 13 (Pulse - live wire / signal alert) ───────────────────────────
async function exportT13(ctx, state, W, H) {
    const t13 = state.post.t13 || {};
    const [bgImg, wmImg] = await Promise.all([
        loadImg(t13.bgImage),
        (t13.showWatermark && t13.watermarkUrl) ? loadImg(t13.watermarkUrl) : null,
    ]);

    const ff = t13.customFontFamily || t13.fontFamily || 'Bebas Neue';
    const metaFF = t13.customMetaFontFamily || t13.metaFontFamily || 'Inter';
    const fs = t13.fontSize || 168;
    const fw = t13.fontWeight || 400;
    const kickerFS = t13.kickerSize || 22;
    const dekFS = t13.dekSize || 28;
    const metaFS = t13.metaSize || 20;
    await Promise.all([
        loadFont(`${fw} ${fs}px "${ff}"`),
        loadFont(`800 ${kickerFS}px "${metaFF}"`),
        loadFont(`${t13.dekWeight || 500} ${dekFS}px "${metaFF}"`),
        loadFont(`700 ${metaFS}px "${metaFF}"`),
    ]);

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);

    if (bgImg) {
        drawCover(
            ctx,
            bgImg,
            0, 0, W, H,
            t13.imagePosX ?? 50,
            t13.imagePosY ?? 50,
            (t13.imageScale ?? 100) / 100,
        );
    }

    const fadePct = Math.max(0, Math.min(100, t13.fadeHeight ?? 68)) / 100;
    const fadeStrength = Math.max(0, Math.min(1, t13.fadeStrength ?? 0.92));
    if (fadePct > 0 && fadeStrength > 0) {
        const fadeH = fadePct * H;
        const g = ctx.createLinearGradient(0, H - fadeH, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(0.42, `rgba(0,0,0,${fadeStrength * 0.35})`);
        g.addColorStop(1, `rgba(0,0,0,${fadeStrength})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, H - fadeH - 2, W, fadeH + 2);
    }

    if ((t13.overlayOpacity ?? 0) > 0) {
        ctx.save();
        ctx.globalAlpha = t13.overlayOpacity ?? 0.18;
        ctx.fillStyle = t13.overlayColor || '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    if ((t13.vignetteOpacity ?? 0) > 0) {
        const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.72);
        vig.addColorStop(0, 'rgba(0,0,0,0)');
        vig.addColorStop(1, 'rgba(0,0,0,0.72)');
        ctx.save();
        ctx.globalAlpha = t13.vignetteOpacity ?? 0.55;
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    const accent = t13.accentColor || '#C8FF00';
    const railW = t13.railWidth ?? 8;
    const railInset = t13.railInset ?? 28;
    if (t13.showRail !== false) {
        const x = railInset;
        const y = 72;
        const h = H - 144;
        ctx.save();
        ctx.fillStyle = accent;
        ctx.shadowColor = accent;
        ctx.shadowBlur = 24;
        // pill rail
        const r = Math.min(railW / 2, 99);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, railW, h, r);
        else {
            ctx.moveTo(x + r, y);
            ctx.arcTo(x + railW, y, x + railW, y + h, r);
            ctx.arcTo(x + railW, y + h, x, y + h, r);
            ctx.arcTo(x, y + h, x, y, r);
            ctx.arcTo(x, y, x + railW, y, r);
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();
    }

    const PAD_H = t13.paddingH ?? 56;
    const PAD_B = t13.paddingBottom ?? 78;
    const copyLeft = PAD_H + (t13.showRail !== false ? railW + railInset + 18 : 0);
    const copyRight = PAD_H;
    const maxTextW = W - copyLeft - copyRight;
    const align = t13.textAlign || 'left';
    const gap = 22;

    const uppercase = t13.uppercase !== false;
    const hlRaw = String(t13.headline || '');
    const hl = uppercase ? hlRaw.toUpperCase() : hlRaw;
    const lsPx = (t13.letterSpacing ?? 0.01) * fs;
    const fontSpec = `${fw} ${fs}px "${ff}", "Arial Narrow", sans-serif`;
    ctx.font = fontSpec;
    setLS(ctx, lsPx);

    const allLines = [];
    for (const rawLine of hl.split(/\r?\n/)) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t13.highlightColor || accent });
                });
            } else {
                p.split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t13.headlineColor || '#FFFFFF' });
                });
            }
        }
        if (!words.length) {
            allLines.push([]);
            continue;
        }
        for (const line of wrapColored(ctx, words, maxTextW)) allLines.push(line);
    }

    const lineH = Math.round(fs * (t13.lineHeight ?? 0.86));
    const titleH = Math.max(1, allLines.length) * lineH;

    const showKicker = t13.showKicker !== false;
    const kickerPadY = 10;
    const kickerPadX = 18;
    const kickerH = showKicker ? kickerFS + kickerPadY * 2 : 0;

    const showRule = t13.showRule !== false;
    const ruleH = showRule ? (t13.ruleHeight ?? 4) : 0;

    const showDek = t13.showDek !== false && t13.dek;
    let dekLines = [];
    let dekLineH = 0;
    if (showDek) {
        ctx.font = `${t13.dekWeight || 500} ${dekFS}px "${metaFF}", Inter, sans-serif`;
        setLS(ctx, (t13.dekLetterSpacing ?? -0.01) * dekFS);
        dekLines = wrapSimple(ctx, String(t13.dek), maxTextW * 0.92);
        dekLineH = Math.round(dekFS * (t13.dekLineHeight ?? 1.35));
    }
    const dekBlockH = showDek ? dekLines.length * dekLineH : 0;

    const showMeta = t13.showMeta !== false && (t13.metaLeft || t13.metaRight);
    const metaH = showMeta ? metaFS : 0;

    let stackH = titleH;
    if (showKicker) stackH += kickerH + gap;
    if (showRule) stackH += ruleH + gap;
    if (showDek) stackH += dekBlockH + gap;
    if (showMeta) stackH += metaH;

    let y = H - PAD_B - stackH;

    if (showKicker) {
        const label = String(t13.kickerText || 'LIVE · BREAKING').toUpperCase();
        ctx.font = `800 ${kickerFS}px "${metaFF}", Inter, sans-serif`;
        setLS(ctx, (t13.kickerLetterSpacing ?? 0.14) * kickerFS);
        const pulseR = 6;
        const pulseGap = 12;
        const textW = mW(ctx, label);
        const showPulse = t13.showPulse !== false;
        const innerW = (showPulse ? pulseR * 2 + pulseGap : 0) + textW;
        const boxW = innerW + 14 + kickerPadX;
        const boxH = kickerH;
        const boxX = copyLeft;
        const boxY = y;
        ctx.save();
        ctx.fillStyle = t13.kickerBg || 'rgba(8,8,8,0.72)';
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxW, boxH, boxH / 2);
            ctx.fill();
        } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
        }
        let cx = boxX + 14;
        if (showPulse) {
            ctx.fillStyle = t13.pulseColor || accent;
            ctx.beginPath();
            ctx.arc(cx + pulseR, boxY + boxH / 2, pulseR, 0, Math.PI * 2);
            ctx.fill();
            cx += pulseR * 2 + pulseGap;
        }
        ctx.fillStyle = t13.kickerColor || '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(label, cx, boxY + boxH / 2 + 0.5);
        ctx.restore();
        y += kickerH + gap;
    }

    ctx.save();
    ctx.font = fontSpec;
    setLS(ctx, lsPx);
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 6;
    const sp = mW(ctx, ' ');
    for (const line of allLines) {
        if (!line.length) {
            y += lineH;
            continue;
        }
        let lineW = 0;
        if (align !== 'left') {
            lineW = line.reduce(
                (acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp : 0),
                0,
            );
        }
        let x = copyLeft;
        if (align === 'center') x = copyLeft + (maxTextW - lineW) / 2;
        else if (align === 'right') x = copyLeft + maxTextW - lineW;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, x, y);
            x += mW(ctx, line[i].word);
            if (i < line.length - 1) x += sp;
        }
        y += lineH;
    }
    ctx.restore();

    if (showRule) {
        y += gap;
        const rw = ((t13.ruleWidth ?? 18) / 100) * maxTextW;
        let rx = copyLeft;
        if (align === 'center') rx = copyLeft + (maxTextW - rw) / 2;
        else if (align === 'right') rx = copyLeft + maxTextW - rw;
        ctx.save();
        ctx.fillStyle = t13.ruleColor || accent;
        if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(rx, y, rw, ruleH, ruleH / 2);
            ctx.fill();
        } else {
            ctx.fillRect(rx, y, rw, ruleH);
        }
        ctx.restore();
        y += ruleH;
    }

    if (showDek) {
        y += gap;
        ctx.save();
        ctx.font = `${t13.dekWeight || 500} ${dekFS}px "${metaFF}", Inter, sans-serif`;
        setLS(ctx, (t13.dekLetterSpacing ?? -0.01) * dekFS);
        ctx.fillStyle = t13.dekColor || 'rgba(255,255,255,0.78)';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0,0,0,0.45)';
        ctx.shadowBlur = 12;
        for (const line of dekLines) {
            const lineW = mW(ctx, line);
            let x = copyLeft;
            if (align === 'center') x = copyLeft + (maxTextW - lineW) / 2;
            else if (align === 'right') x = copyLeft + maxTextW - lineW;
            ctx.fillText(line, x, y);
            y += dekLineH;
        }
        ctx.restore();
    }

    if (showMeta) {
        y += gap;
        const left = String(t13.metaLeft || '').toUpperCase();
        const right = String(t13.metaRight || '').toUpperCase();
        ctx.save();
        ctx.font = `700 ${metaFS}px "${metaFF}", Inter, sans-serif`;
        setLS(ctx, (t13.metaLetterSpacing ?? 0.16) * metaFS);
        ctx.fillStyle = t13.metaColor || 'rgba(255,255,255,0.7)';
        ctx.textBaseline = 'top';
        const parts = [];
        if (left) parts.push({ type: 'text', text: left });
        if (left && right) parts.push({ type: 'dot' });
        if (right) parts.push({ type: 'text', text: right });
        let totalW = 0;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].type === 'dot') totalW += 6;
            else totalW += mW(ctx, parts[i].text);
            if (i < parts.length - 1) totalW += 12;
        }
        let x = copyLeft;
        if (align === 'center') x = copyLeft + (maxTextW - totalW) / 2;
        else if (align === 'right') x = copyLeft + maxTextW - totalW;
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].type === 'dot') {
                ctx.fillStyle = accent;
                ctx.beginPath();
                ctx.arc(x + 3, y + metaFS * 0.45, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = t13.metaColor || 'rgba(255,255,255,0.7)';
                x += 6;
            } else {
                ctx.fillText(parts[i].text, x, y);
                x += mW(ctx, parts[i].text);
            }
            if (i < parts.length - 1) x += 12;
        }
        ctx.restore();
    }

    if (wmImg && t13.showWatermark !== false && t13.watermarkUrl) {
        const wmW = t13.watermarkSize || 72;
        const natW = wmImg.naturalWidth || wmImg.width || 1;
        const natH = wmImg.naturalHeight || wmImg.height || 1;
        const wmH = (natH / natW) * wmW;
        const posX = t13.watermarkPosX != null ? t13.watermarkPosX : 94;
        const posY = t13.watermarkPosY != null ? t13.watermarkPosY : 5;
        const { x: wx, y: wy } = calcWmXY(posX, posY, W, H, wmW, wmH);
        ctx.save();
        ctx.globalAlpha = t13.watermarkOpacity ?? 0.9;
        ctx.drawImage(wmImg, wx, wy, wmW, wmH);
        ctx.restore();
    }
}

// ─── TEMPLATE 14 (Hazard - sports stripe rails + bottom type) ─────────────────
async function exportT14(ctx, state, W, H) {
    const t14 = state.post.t14 || {};
    const showStripes = t14.showStripes !== false;
    const stripeW = showStripes ? Math.max(0, t14.stripeWidth ?? 28) : 0;
    const innerX = stripeW;
    const innerW = W - stripeW * 2;

    const [bgImg, wmImg] = await Promise.all([
        loadImg(t14.bgImage),
        (t14.showWatermark && t14.watermarkUrl) ? loadImg(t14.watermarkUrl) : null,
    ]);

    const ff = t14.customFontFamily || t14.fontFamily || 'Anton';
    const fs = t14.fontSize || 92;
    const fw = t14.fontWeight || 400;
    await loadFont(`${fw} ${fs}px "${ff}"`);

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, W, H);

    // Photo stage between rails
    if (bgImg && innerW > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(innerX, 0, innerW, H);
        ctx.clip();
        drawCover(
            ctx,
            bgImg,
            innerX, 0, innerW, H,
            t14.imagePosX ?? 50,
            t14.imagePosY ?? 50,
            (t14.imageScale ?? 100) / 100,
        );
        ctx.restore();
    }

    const fadePct = Math.max(0, Math.min(100, t14.fadeHeight ?? 48)) / 100;
    const fadeStrength = Math.max(0, Math.min(1, t14.fadeStrength ?? 0.96));
    const fadeHex = t14.fadeColor || '#1a0508';
    const { r: fr, g: fg, b: fb } = h2rgb(fadeHex);
    if (fadePct > 0 && fadeStrength > 0 && innerW > 0) {
        const fadeH = fadePct * H;
        const g = ctx.createLinearGradient(0, H - fadeH, 0, H);
        g.addColorStop(0, `rgba(${fr},${fg},${fb},0)`);
        g.addColorStop(0.48, `rgba(${fr},${fg},${fb},${fadeStrength * 0.55})`);
        g.addColorStop(1, `rgba(${fr},${fg},${fb},${fadeStrength})`);
        ctx.fillStyle = g;
        ctx.fillRect(innerX, H - fadeH - 2, innerW, fadeH + 2);
    }

    if ((t14.overlayOpacity ?? 0) > 0 && innerW > 0) {
        ctx.save();
        ctx.globalAlpha = t14.overlayOpacity ?? 0.08;
        ctx.fillStyle = t14.overlayColor || '#000';
        ctx.fillRect(innerX, 0, innerW, H);
        ctx.restore();
    }

    // Hazard stripe rails
    if (showStripes && stripeW > 0) {
        const a = t14.stripeColorA || '#C8102E';
        const b = t14.stripeColorB || '#0a0a0a';
        const band = Math.max(4, t14.stripeSize || 12);
        const angle = (t14.stripeAngle ?? -45) * Math.PI / 180;
        const drawRail = (x) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, 0, stripeW, H);
            ctx.clip();
            // Paint diagonal bands across a larger area then clip
            const diag = Math.hypot(stripeW, H) * 2;
            ctx.translate(x + stripeW / 2, H / 2);
            ctx.rotate(angle);
            let i = 0;
            for (let ox = -diag; ox < diag; ox += band) {
                ctx.fillStyle = (i % 2 === 0) ? a : b;
                ctx.fillRect(ox, -diag, band, diag * 2);
                i += 1;
            }
            ctx.restore();
        };
        drawRail(0);
        drawRail(W - stripeW);
    }

    const PAD_H = t14.paddingH ?? 36;
    const PAD_B = t14.paddingBottom ?? 54;
    const maxTextW = Math.max(40, innerW - PAD_H * 2);
    const align = t14.textAlign || 'center';
    const uppercase = t14.uppercase !== false;
    const hlRaw = String(t14.headline || '');
    const hl = uppercase ? hlRaw.toUpperCase() : hlRaw;
    const lsPx = (t14.letterSpacing ?? 0.01) * fs;
    const fontSpec = `${fw} ${fs}px "${ff}", "Arial Narrow", Impact, sans-serif`;

    ctx.font = fontSpec;
    setLS(ctx, lsPx);

    const allLines = [];
    for (const rawLine of hl.split(/\r?\n/)) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t14.highlightColor || '#C8102E' });
                });
            } else {
                p.split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t14.headlineColor || '#FFFFFF' });
                });
            }
        }
        if (!words.length) {
            allLines.push([]);
            continue;
        }
        for (const line of wrapColored(ctx, words, maxTextW)) allLines.push(line);
    }

    const lineH = Math.round(fs * (t14.lineHeight ?? 0.92));
    const titleH = Math.max(1, allLines.length) * lineH;
    let y = H - PAD_B - titleH;
    const copyLeft = innerX + PAD_H;
    const sp = mW(ctx, ' ');

    ctx.save();
    ctx.font = fontSpec;
    setLS(ctx, lsPx);
    ctx.textBaseline = 'top';
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 4;
    for (const line of allLines) {
        if (!line.length) {
            y += lineH;
            continue;
        }
        let lineW = 0;
        if (align !== 'left') {
            lineW = line.reduce(
                (acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp : 0),
                0,
            );
        }
        let x = copyLeft;
        if (align === 'center') x = copyLeft + (maxTextW - lineW) / 2;
        else if (align === 'right') x = copyLeft + maxTextW - lineW;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            ctx.fillText(line[i].word, x, y);
            x += mW(ctx, line[i].word);
            if (i < line.length - 1) x += sp;
        }
        y += lineH;
    }
    ctx.restore();

    if (wmImg && t14.showWatermark !== false && t14.watermarkUrl && innerW > 0) {
        const wmSize = t14.watermarkSize || 120;
        const natW = wmImg.naturalWidth || wmImg.width || 1;
        const natH = wmImg.naturalHeight || wmImg.height || 1;
        const wmH = (natH / natW) * wmSize;
        const posX = t14.watermarkPosX != null ? t14.watermarkPosX : 92;
        const posY = t14.watermarkPosY != null ? t14.watermarkPosY : 5;
        // Position relative to inner stage (matches preview)
        const { x: wx, y: wy } = calcWmXY(posX, posY, innerW, H, wmSize, wmH);
        ctx.save();
        ctx.globalAlpha = t14.watermarkOpacity ?? 0.92;
        ctx.drawImage(wmImg, innerX + wx, wy, wmSize, wmH);
        ctx.restore();
    }
}

function _hexClip(ctx, x, y, size) {
    const pts = [
        [0.5, 0], [0.93, 0.25], [0.93, 0.75], [0.5, 1], [0.07, 0.75], [0.07, 0.25],
    ];
    ctx.beginPath();
    pts.forEach(([px, py], i) => {
        const X = x + px * size;
        const Y = y + py * size;
        if (i === 0) ctx.moveTo(X, Y);
        else ctx.lineTo(X, Y);
    });
    ctx.closePath();
}

function _drawDotMark(ctx, x, y, size, color) {
    const gap = size * 0.14;
    const d = (size - gap) / 2;
    const r = d / 2;
    ctx.fillStyle = color;
    const cells = [
        [x + r, y + r],
        [x + d + gap + r, y + r],
        [x + r, y + d + gap + r],
        [x + d + gap + r, y + d + gap + r],
    ];
    for (const [cx, cy] of cells) {
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
    }
}

function _drawMarkImage(ctx, img, x, y, size) {
    const natW = img.naturalWidth || img.width || 1;
    const natH = img.naturalHeight || img.height || 1;
    const scale = Math.min(size / natW, size / natH);
    const dw = natW * scale;
    const dh = natH * scale;
    ctx.drawImage(img, x + (size - dw) / 2, y + (size - dh) / 2, dw, dh);
}

function _resolveCtaAlign(textAlign, ctaAlign) {
    if (ctaAlign === 'match') return textAlign || 'left';
    return ctaAlign || 'left';
}

function _drawT15Cta(ctx, t15, dekFF, y, W, railW, textPadH, textAlign) {
    const ctaSize = t15.ctaSize || 20;
    const ctaWeight = t15.ctaWeight || 600;
    const ctaStyle = t15.ctaStyle || 'fill';
    const ctaAlign = _resolveCtaAlign(textAlign, t15.ctaAlign);
    const padX = t15.ctaPadH ?? 24;
    const padY = t15.ctaPadV ?? 14;
    const marginTop = t15.ctaMarginTop ?? 12;
    const offsetX = t15.ctaOffsetX ?? 0;
    const offsetY = t15.ctaOffsetY ?? 0;
    const fullWidth = t15.ctaFullWidth;
    const isTextLink = ctaStyle === 'underline' || ctaStyle === 'ghost';

    y += marginTop + offsetY;

    ctx.save();
    ctx.font = `${ctaWeight} ${ctaSize}px "${dekFF}", sans-serif`;
    setLS(ctx, (t15.ctaLetterSpacing ?? -0.01) * ctaSize);
    const label = t15.ctaText || '';
    const textW = mW(ctx, label);
    const copyW = W - railW;
    const btnW = fullWidth ? copyW - textPadH * 2 : textW + (isTextLink ? 0 : padX * 2);
    const btnH = isTextLink ? ctaSize + 4 : ctaSize + padY * 2;
    const bx = _alignX(ctaAlign, textPadH, copyW, btnW) + offsetX;

    if (ctaStyle === 'fill') {
        ctx.fillStyle = t15.ctaBg || '#14B8A6';
        _roundRectPath(ctx, bx, y, btnW, btnH, t15.ctaRadius ?? 12);
        ctx.fill();
        ctx.fillStyle = t15.ctaColor || '#FFFFFF';
    } else if (ctaStyle === 'outline') {
        const border = t15.ctaBorder ?? 2;
        ctx.strokeStyle = t15.ctaBorderColor || t15.ctaBg || '#14B8A6';
        ctx.lineWidth = border;
        _roundRectPath(ctx, bx + border / 2, y + border / 2, btnW - border, btnH - border, t15.ctaRadius ?? 12);
        ctx.stroke();
        ctx.fillStyle = t15.ctaColor || t15.ctaBg || '#14B8A6';
    } else if (ctaStyle === 'underline') {
        ctx.fillStyle = t15.ctaColor || t15.ctaBg || '#14B8A6';
    } else {
        ctx.fillStyle = t15.ctaColor || '#FFFFFF';
    }

    ctx.textBaseline = 'middle';
    const tx = isTextLink
        ? bx
        : fullWidth && !isTextLink
            ? bx + btnW / 2
            : bx + padX;
    if (fullWidth && !isTextLink) {
        ctx.textAlign = 'center';
        ctx.fillText(label, tx, y + btnH / 2);
        ctx.textAlign = 'left';
    } else {
        ctx.fillText(label, tx, y + btnH / 2);
    }

    if (ctaStyle === 'underline') {
        const uy = y + btnH - 2;
        ctx.strokeStyle = t15.ctaBg || t15.ctaBorderColor || '#14B8A6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, uy);
        ctx.lineTo(bx + textW, uy);
        ctx.stroke();
    }

    ctx.restore();
    return y + btnH;
}

// ─── TEMPLATE 15 (Campaign - photo field + optional framed subject) ───────────
async function exportT15(ctx, state, W, H) {
    const t15 = state.post.t15 || {};
    const shape = t15.frameShape || 'circle';
    const framed = shape !== 'none';
    const PAD_H = t15.paddingH ?? 64;
    const PAD_V = t15.paddingV ?? 72;
    const railW = t15.showRail ? Math.max(0, t15.railWidth ?? 12) : 0;
    const pos = t15.headlinePos || 'center';
    const align = t15.textAlign || 'left';
    const showBrandRow = t15.showBrandRow !== false;
    const markMode = showBrandRow ? (t15.markMode || (t15.showMark ? 'dots' : 'none')) : 'none';

    const [bgImg, subImg, markImg, wmImg] = await Promise.all([
        t15.bgImage ? loadImg(t15.bgImage) : null,
        (t15.showSubject && t15.subjectUrl) ? loadImg(t15.subjectUrl) : null,
        (markMode === 'image' && t15.markImageUrl) ? loadImg(t15.markImageUrl) : null,
        (t15.showWatermark && t15.watermarkUrl) ? loadImg(t15.watermarkUrl) : null,
    ]);

    const ff = t15.customFontFamily || t15.fontFamily || 'Plus Jakarta Sans';
    const brandFF = t15.customBrandFontFamily || t15.brandFontFamily || 'Plus Jakarta Sans';
    const fs = t15.fontSize || 68;
    const fw = t15.fontWeight || 700;
    const brandSize = t15.brandSize || 28;
    const brandWeight = t15.brandWeight || 600;
    const kickerSize = t15.kickerSize || 18;
    const footerSize = t15.footerSize || 22;
    await Promise.all([
        loadFont(`${fw} ${fs}px "${ff}"`),
        loadFont(`${brandWeight} ${brandSize}px "${brandFF}"`),
        loadFont(`700 ${kickerSize}px "${brandFF}"`),
        loadFont(`500 ${footerSize}px "${brandFF}"`),
    ]);

    ctx.fillStyle = t15.bgColor || '#111111';
    ctx.fillRect(0, 0, W, H);

    if (bgImg) {
        ctx.save();
        ctx.globalAlpha = t15.bgOpacity ?? 1;
        drawCover(
            ctx,
            bgImg,
            0, 0, W, H,
            t15.imagePosX ?? 50,
            t15.imagePosY ?? 50,
            (t15.imageScale ?? 100) / 100,
        );
        ctx.restore();
    }

    const fadePct = Math.max(0, Math.min(100, t15.fadeHeight ?? 38)) / 100;
    const fadeStrength = Math.max(0, Math.min(1, t15.fadeStrength ?? 0.52));
    if (fadePct > 0 && fadeStrength > 0) {
        const fadeH = fadePct * H;
        const fadeHex = t15.fadeColor || '#000000';
        const { r, g, b } = h2rgb(fadeHex);
        const grad = ctx.createLinearGradient(0, fadeH, 0, 0);
        grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
        grad.addColorStop(1, `rgba(${r},${g},${b},${fadeStrength})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, fadeH + 2);
    }

    if (t15.showBottomFade) {
        const bottomPct = Math.max(0, Math.min(100, t15.bottomFadeHeight ?? 42)) / 100;
        const bottomStrength = Math.max(0, Math.min(1, t15.bottomFadeStrength ?? 0.55));
        if (bottomPct > 0 && bottomStrength > 0) {
            const fadeH = bottomPct * H;
            const fadeHex = t15.fadeColor || '#000000';
            const { r, g, b } = h2rgb(fadeHex);
            const grad = ctx.createLinearGradient(0, H - fadeH, 0, H);
            grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
            grad.addColorStop(1, `rgba(${r},${g},${b},${bottomStrength})`);
            ctx.fillStyle = grad;
            ctx.fillRect(0, H - fadeH - 2, W, fadeH + 2);
        }
    }

    if ((t15.overlayOpacity ?? 0) > 0) {
        ctx.save();
        ctx.globalAlpha = t15.overlayOpacity ?? 0.22;
        ctx.fillStyle = t15.overlayColor || '#000';
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
    }

    if (t15.showPattern) {
        const size = Math.max(8, t15.patternSize || 26);
        const r = 1.15;
        ctx.save();
        ctx.globalAlpha = t15.patternOpacity ?? 0.12;
        ctx.fillStyle = t15.patternColor || '#FFFFFF';
        for (let y = size / 2; y < H; y += size) {
            for (let x = size / 2; x < W; x += size) {
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    if (subImg) {
        const size = t15.subjectSize || 620;
        const cx = (t15.subjectPosX ?? 50) / 100 * W;
        const cy = (t15.subjectPosY ?? 68) / 100 * H;
        ctx.save();
        if (t15.grayscale) ctx.filter = 'grayscale(1)';
        if (t15.showSubjectGlow) {
            const glowSize = t15.subjectGlowSize ?? 1.2;
            const glowBlur = Math.round(24 * glowSize);
            const glowHex = t15.subjectGlowColor || '#FFFFFF';
            const glowOp = t15.subjectGlowOpacity ?? 1;
            const { r, g, b } = h2rgb(glowHex);
            ctx.shadowColor = `rgba(${r},${g},${b},${glowOp})`;
            ctx.shadowBlur = glowBlur;
        }
        if (framed) {
            const x = cx - size / 2;
            const y = cy - size / 2;
            ctx.beginPath();
            if (shape === 'circle') {
                ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
            } else if (shape === 'hex') {
                _hexClip(ctx, x, y, size);
            } else {
                const rad = t15.frameRadius ?? 36;
                if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, size, size, rad);
                else ctx.rect(x, y, size, size);
            }
            ctx.clip();
            drawCover(
                ctx,
                subImg,
                x, y, size, size,
                t15.subjectImagePosX ?? 50,
                t15.subjectImagePosY ?? 50,
                (t15.subjectImageScale ?? 100) / 100,
            );
            ctx.restore();

            const border = t15.frameBorder || 0;
            if (border > 0) {
                ctx.save();
                ctx.strokeStyle = t15.frameBorderColor || '#FFFFFF';
                ctx.lineWidth = border;
                ctx.beginPath();
                if (shape === 'circle') ctx.arc(cx, cy, size / 2 - border / 2, 0, Math.PI * 2);
                else if (shape === 'hex') _hexClip(ctx, x, y, size);
                else if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, size, size, t15.frameRadius ?? 36);
                else ctx.rect(x, y, size, size);
                ctx.stroke();
                ctx.restore();
            }
        } else {
            drawCutout(ctx, subImg, cx, cy, size);
            ctx.restore();
        }
    }

    if (railW > 0) {
        ctx.fillStyle = t15.railColor || t15.accentColor || '#14B8A6';
        ctx.fillRect(W - railW, 0, railW, H);
    }

    if (showBrandRow) {
        const brandY = Math.round(PAD_V * 0.72) + (t15.brandPosY ?? 0);
        const brandX = PAD_H + (t15.brandPosX ?? 0);
        const markSize = t15.markSize || 36;
        const hasMark = markMode === 'dots' || (markMode === 'image' && markImg);
        const hasBrand = t15.showBrand !== false;
        const rowH = Math.max(hasMark ? markSize : 0, hasBrand ? brandSize : 0);
        let brandTextX = brandX;
        if (hasMark) {
            const my = brandY + (rowH - markSize) / 2;
            if (markMode === 'dots') {
                _drawDotMark(ctx, brandX, my, markSize, t15.accentColor || '#FFFFFF');
            } else if (markImg) {
                _drawMarkImage(ctx, markImg, brandX, my, markSize);
            }
            brandTextX = brandX + markSize + 14;
        }
        if (hasBrand) {
            ctx.save();
            ctx.font = `${brandWeight} ${brandSize}px "${brandFF}", sans-serif`;
            setLS(ctx, (t15.brandLetterSpacing ?? -0.02) * brandSize);
            ctx.fillStyle = t15.brandColor || '#FFFFFF';
            ctx.textBaseline = 'middle';
            ctx.fillText(t15.brandText || '', brandTextX, brandY + rowH / 2);
            ctx.restore();
        }
    }

    const copyOffsetX = t15.copyOffsetX ?? 0;
    const copyOffsetY = t15.copyOffsetY ?? 0;
    const textPadH = PAD_H + copyOffsetX;

    const fontSpec = `${fw} ${fs}px "${ff}", sans-serif`;
    ctx.font = fontSpec;
    setLS(ctx, (t15.letterSpacing ?? -0.03) * fs);

    const allLines = [];
    const rawLines = String(t15.headline || '').split(/\r?\n/);
    for (const rawLine of rawLines) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t15.highlightColor || '#FFFFFF' });
                });
            } else {
                p.split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t15.headlineColor || '#FFFFFF' });
                });
            }
        }
        if (!words.length) {
            allLines.push([]);
            continue;
        }
        const wrapped = wrapColored(ctx, words, W - textPadH * 2 - railW);
        for (const line of wrapped) allLines.push(line);
    }

    const lineH = Math.round(fs * (t15.lineHeight ?? 1.12));
    const showKicker = t15.showKicker;
    const kickerH = showKicker ? Math.round(kickerSize * 1.15) : 0;
    const kickerGap = showKicker ? 16 : 0;
    const dekFF = t15.customDekFontFamily || t15.dekFontFamily || ff;
    const dekSize = t15.dekSize || 24;
    const dekWeight = t15.dekWeight || 500;
    const showDek = t15.showDek;
    const dekLH = Math.round(dekSize * (t15.dekLineHeight ?? 1.35));
    let dekLines = [];
    if (showDek) {
        await loadFont(`${dekWeight} ${dekSize}px "${dekFF}"`);
        ctx.save();
        ctx.font = `${dekWeight} ${dekSize}px "${dekFF}", sans-serif`;
        setLS(ctx, (t15.dekLetterSpacing ?? -0.02) * dekSize);
        dekLines = wrapSimple(ctx, String(t15.dek || ''), W - textPadH * 2 - railW);
        ctx.restore();
    }
    const dekH = showDek ? dekLines.length * dekLH + 16 : 0;
    const showCta = t15.showCta;
    const ctaSize = t15.ctaSize || 20;
    const ctaWeight = t15.ctaWeight || 600;
    let ctaBlockH = 0;
    if (showCta) {
        await loadFont(`${ctaWeight} ${ctaSize}px "${dekFF}"`);
        const ctaStyle = t15.ctaStyle || 'fill';
        const marginTop = t15.ctaMarginTop ?? 12;
        const padY = t15.ctaPadV ?? 14;
        const lh = ctaStyle === 'underline' || ctaStyle === 'ghost'
            ? ctaSize + 4
            : ctaSize + padY * 2;
        ctaBlockH = marginTop + lh;
    }
    const totalH = kickerH + kickerGap + Math.max(1, allLines.length) * lineH + dekH + (showCta ? ctaBlockH : 0);
    const footerBottomPad = Math.max(40, PAD_V * 0.55);
    const copyBottomGap = t15.copyBottomGap ?? 36;
    const footerReserve = t15.showFooter
        ? footerSize + footerBottomPad + copyBottomGap
        : footerBottomPad + copyBottomGap;
    const brandClear = showBrandRow && (t15.showBrand !== false || markMode !== 'none') ? 120 : 0;

    let y;
    if (pos === 'top') y = Math.max(PAD_V, brandClear) + copyOffsetY;
    else if (pos === 'bottom') y = H - footerReserve - totalH - copyOffsetY;
    else y = (H - totalH) / 2 + copyOffsetY;

    if (showKicker) {
        ctx.save();
        ctx.font = `700 ${kickerSize}px "${brandFF}", sans-serif`;
        setLS(ctx, (t15.kickerLetterSpacing ?? 0.18) * kickerSize);
        ctx.fillStyle = t15.kickerColor || '#FFFFFF';
        ctx.textBaseline = 'top';
        const kickerText = String(t15.kickerText || '').toUpperCase();
        let kx = textPadH;
        if (align === 'center') kx = (W - railW - mW(ctx, kickerText)) / 2;
        else if (align === 'right') kx = W - railW - textPadH - mW(ctx, kickerText);
        ctx.fillText(kickerText, kx, y);
        ctx.restore();
        y += kickerH + kickerGap;
    }

    ctx.save();
    ctx.font = fontSpec;
    setLS(ctx, (t15.letterSpacing ?? -0.03) * fs);
    ctx.textBaseline = 'top';
    const sp = mW(ctx, ' ');
    const uppercase = t15.uppercase;
    for (const line of allLines) {
        if (!line.length) {
            y += lineH;
            continue;
        }
        let lineW = 0;
        if (align !== 'left') {
            lineW = line.reduce(
                (acc, item, i) => acc + mW(ctx, item.word) + (i < line.length - 1 ? sp : 0),
                0,
            );
        }
        let x = textPadH;
        if (align === 'center') x = (W - railW - lineW) / 2;
        else if (align === 'right') x = W - railW - textPadH - lineW;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            const word = uppercase ? line[i].word.toUpperCase() : line[i].word;
            ctx.fillText(word, x, y);
            x += mW(ctx, word);
            if (i < line.length - 1) x += sp;
        }
        y += lineH;
    }
    ctx.restore();

    if (showDek && dekLines.length) {
        y += 16;
        ctx.save();
        ctx.font = `${dekWeight} ${dekSize}px "${dekFF}", sans-serif`;
        setLS(ctx, (t15.dekLetterSpacing ?? -0.02) * dekSize);
        ctx.fillStyle = t15.dekColor || '#FFFFFF';
        ctx.textBaseline = 'top';
        for (const line of dekLines) {
            let dx = textPadH;
            if (align === 'center') dx = (W - railW - mW(ctx, line)) / 2;
            else if (align === 'right') dx = W - railW - textPadH - mW(ctx, line);
            ctx.fillText(line, dx, y);
            y += dekLH;
        }
        ctx.restore();
    }

    if (showCta) {
        y += 4;
        y = _drawT15Cta(ctx, t15, dekFF, y, W, railW, textPadH, align);
    }

    if (wmImg && t15.showWatermark !== false && t15.watermarkUrl) {
        const wmW = t15.watermarkSize || 120;
        const natW = wmImg.naturalWidth || wmImg.width || 1;
        const natH = wmImg.naturalHeight || wmImg.height || 1;
        const wmH = (natH / natW) * wmW;
        const posX = t15.watermarkPosX != null ? t15.watermarkPosX : 94;
        const posY = t15.watermarkPosY != null ? t15.watermarkPosY : 6;
        const { x: wx, y: wy } = calcWmXY(posX, posY, W, H, wmW, wmH);
        ctx.save();
        ctx.globalAlpha = t15.watermarkOpacity ?? 0.85;
        ctx.drawImage(wmImg, wx, wy, wmW, wmH);
        ctx.restore();
    }

    if (t15.showFooter) {
        ctx.save();
        ctx.font = `500 ${footerSize}px "${brandFF}", sans-serif`;
        setLS(ctx, (t15.footerLetterSpacing ?? 0.02) * footerSize);
        ctx.fillStyle = t15.footerColor || '#FFFFFF';
        ctx.textBaseline = 'bottom';
        const fy = H - footerBottomPad;
        ctx.fillText(t15.footerLeft || '', PAD_H, fy);
        const right = t15.footerRight || '';
        if (right) ctx.fillText(right, W - PAD_H - railW - mW(ctx, right), fy);
        ctx.restore();
    }
}

function _roundRectPath(ctx, x, y, w, h, rx, ry) {
    if (ry === undefined) ry = rx;
    let rxRad = Math.max(0, rx);
    let ryRad = Math.max(0, ry);
    const scale = Math.min(1, w / (2 * rxRad || w), h / (2 * ryRad || h));
    rxRad = Math.min(rxRad * scale, w / 2);
    ryRad = Math.min(ryRad * scale, h / 2);

    if (typeof ctx.roundRect === 'function') {
        ctx.beginPath();
        if (Math.abs(rxRad - ryRad) < 0.01) {
            ctx.roundRect(x, y, w, h, rxRad);
        } else {
            ctx.roundRect(x, y, w, h, [
                { x: rxRad, y: ryRad },
                { x: rxRad, y: ryRad },
                { x: rxRad, y: ryRad },
                { x: rxRad, y: ryRad },
            ]);
        }
        return;
    }
    const rad = Math.min(rxRad, ryRad);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
}

function _alignX(align, pad, boxW, contentW) {
    if (align === 'center') return (boxW - contentW) / 2;
    if (align === 'right') return boxW - pad - contentW;
    return pad;
}

// ─── TEMPLATE 16 (Launch - SaaS product ad) ───────────────────────────────────
async function exportT16(ctx, state, W, H) {
    const t16 = state.post.t16 || {};
    const PAD_H = t16.paddingH ?? 72;
    const PAD_V = t16.paddingV ?? 64;
    const align = t16.textAlign || 'left';
    const stackOffsetX = t16.stackOffsetX ?? 0;
    const stackOffsetY = t16.stackOffsetY ?? 0;
    const textPadH = PAD_H + stackOffsetX;
    const maxTextW = W - textPadH * 2;
    const headlinePos = t16.headlinePos || 'top';
    const logoOffsetX = t16.logoOffsetX ?? 0;
    const logoOffsetY = t16.logoOffsetY ?? 0;

    const [logoImg, productImg] = await Promise.all([
        (t16.showLogo && t16.logoUrl) ? loadImg(t16.logoUrl) : null,
        (t16.showProduct && t16.productUrl) ? loadImg(t16.productUrl) : null,
    ]);

    const ff = t16.customFontFamily || t16.fontFamily || 'Plus Jakarta Sans';
    const dekFF = t16.customDekFontFamily || t16.dekFontFamily || ff;
    const fs = t16.fontSize || 72;
    const fw = t16.fontWeight || 800;
    const dekSize = t16.dekSize || 28;
    const dekWeight = t16.dekWeight || 500;
    const kickerSize = t16.kickerSize || 18;
    const ctaSize = t16.ctaSize || 22;
    const ctaWeight = t16.ctaWeight || 600;
    await Promise.all([
        loadFont(`${fw} ${fs}px "${ff}"`),
        loadFont(`${dekWeight} ${dekSize}px "${dekFF}"`),
        loadFont(`700 ${kickerSize}px "${dekFF}"`),
        loadFont(`${ctaWeight} ${ctaSize}px "${dekFF}"`),
    ]);

    ctx.fillStyle = t16.bgColor || '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    const textureSrc = t16.textureId ? textureUrl(t16.textureId) : '';
    if (textureSrc) {
        const texImg = await loadImg(textureSrc);
        if (texImg) {
            const natW = texImg.naturalWidth || texImg.width || 1;
            const texturePct = (t16.textureScale ?? 100) / 100;
            const pattern = ctx.createPattern(texImg, 'repeat');
            if (pattern) {
                if (typeof pattern.setTransform === 'function') {
                    // Match CSS background-size: N% (width % of canvas, height auto).
                    const scale = (W / natW) * texturePct;
                    pattern.setTransform(new DOMMatrix().scale(scale));
                }
                ctx.save();
                ctx.globalAlpha = t16.textureOpacity ?? 0.35;
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, W, H);
                ctx.restore();
            }
        }
    }

    if (t16.showBlob) {
        const bw = t16.blobWidth || 520;
        const bh = t16.blobHeight || 420;
        const cx = (t16.blobPosX ?? 78) / 100 * W;
        const cy = (t16.blobPosY ?? 72) / 100 * H;
        const rot = ((t16.blobRotate || 0) * Math.PI) / 180;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = t16.blobColor || '#FF3D8A';
        const pct = (t16.blobRadius ?? 50) / 100;
        const rx = bw * pct;
        const ry = bh * pct;
        _roundRectPath(ctx, -bw / 2, -bh / 2, bw, bh, rx, ry);
        ctx.fill();
        ctx.restore();
    }

    if (productImg) {
        const bottom = t16.productBottom ?? 56;
        const prodH = Math.round(H * ((t16.productHeight ?? 46) / 100));
        const widthPct = Math.max(50, Math.min(100, t16.productWidth ?? 100));
        const availW = W - PAD_H * 2;
        const prodW = Math.round(availW * (widthPct / 100));
        const anchorX = (t16.productOffsetX ?? 50) / 100;
        const prodX = Math.round(PAD_H + (availW - prodW) * anchorX);
        const prodY = H - bottom - prodH;
        const rad = t16.productRadius ?? 32;
        if (t16.showShadow) {
            ctx.save();
            ctx.shadowColor = t16.shadowColor || 'rgba(17,17,17,0.14)';
            ctx.shadowBlur = Math.round((t16.shadowSize || 28) * 2.2);
            ctx.shadowOffsetY = t16.shadowSize || 28;
            ctx.fillStyle = '#fff';
            _roundRectPath(ctx, prodX, prodY, prodW, prodH, rad);
            ctx.fill();
            ctx.restore();
        }
        ctx.save();
        _roundRectPath(ctx, prodX, prodY, prodW, prodH, rad);
        ctx.clip();
        drawCover(
            ctx,
            productImg,
            prodX, prodY, prodW, prodH,
            t16.imagePosX ?? 50,
            t16.imagePosY ?? 50,
            (t16.imageScale ?? 100) / 100,
        );
        ctx.restore();
        const border = t16.productBorder || 0;
        if (border > 0) {
            ctx.save();
            ctx.strokeStyle = t16.productBorderColor || '#EDEDED';
            ctx.lineWidth = border;
            _roundRectPath(ctx, prodX + border / 2, prodY + border / 2, prodW - border, prodH - border, Math.max(0, rad - border / 2));
            ctx.stroke();
            ctx.restore();
        }
    }

    let logoBlockH = 0;
    let logoW = 0;
    let logoH = 0;
    if (logoImg) {
        logoW = t16.logoSize || 72;
        const natW = logoImg.naturalWidth || logoImg.width || 1;
        const natH = logoImg.naturalHeight || logoImg.height || 1;
        logoH = (natH / natW) * logoW;
        logoBlockH = logoH + 28 + logoOffsetY;
    }

    const kickerBlockH = t16.showKicker ? Math.round(kickerSize * 1.2) + 14 : 0;

    const fontSpec = `${fw} ${fs}px "${ff}", sans-serif`;
    ctx.font = fontSpec;
    setLS(ctx, (t16.letterSpacing ?? -0.04) * fs);
    const allLines = [];
    const rawLines = String(t16.headline || '').split(/\r?\n/);
    for (const rawLine of rawLines) {
        const parts = rawLine.split(/(\[.*?\])/);
        const words = [];
        for (const p of parts) {
            if (!p) continue;
            if (p.startsWith('[') && p.endsWith(']')) {
                p.slice(1, -1).split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t16.highlightColor || '#4353FF' });
                });
            } else {
                p.split(/\s+/).forEach((w) => {
                    if (w) words.push({ word: w, color: t16.headlineColor || '#111111' });
                });
            }
        }
        if (!words.length) {
            allLines.push([]);
            continue;
        }
        const wrapped = wrapColored(ctx, words, maxTextW);
        for (const line of wrapped) allLines.push(line);
    }

    const lineH = Math.round(fs * (t16.lineHeight ?? 1.08));
    const headlineBlockH = Math.max(1, allLines.length) * lineH;

    let dekLines = [];
    const dekLH = Math.round(dekSize * (t16.dekLineHeight ?? 1.35));
    if (t16.showDek) {
        ctx.save();
        ctx.font = `${dekWeight} ${dekSize}px "${dekFF}", sans-serif`;
        setLS(ctx, (t16.dekLetterSpacing ?? -0.02) * dekSize);
        dekLines = wrapSimple(ctx, String(t16.dek || ''), maxTextW);
        ctx.restore();
    }
    const dekBlockH = t16.showDek ? 18 + dekLines.length * dekLH : 0;

    let ctaBlockH = 0;
    if (t16.showCta) {
        const padY = t16.ctaPadV ?? 16;
        ctaBlockH = 28 + ctaSize + padY * 2;
    }

    const stackH = logoBlockH + kickerBlockH + headlineBlockH + dekBlockH + ctaBlockH;
    const productReserve = productImg ? (t16.productBottom ?? 56) + Math.round(H * ((t16.productHeight ?? 46) / 100)) + 24 : 0;

    let y;
    if (headlinePos === 'center') y = (H - stackH) / 2 + stackOffsetY;
    else if (headlinePos === 'bottom') y = H - productReserve - PAD_V - stackH - stackOffsetY;
    else y = PAD_V + stackOffsetY;

    if (logoImg) {
        const lx = _alignX(align, textPadH, W, logoW) + logoOffsetX;
        ctx.drawImage(logoImg, lx, y + logoOffsetY, logoW, logoH);
        y += logoBlockH;
    }

    if (t16.showKicker) {
        ctx.save();
        ctx.font = `700 ${kickerSize}px "${dekFF}", sans-serif`;
        setLS(ctx, (t16.kickerLetterSpacing ?? 0.16) * kickerSize);
        ctx.fillStyle = t16.kickerColor || '#8A8A8A';
        ctx.textBaseline = 'top';
        const kickerText = String(t16.kickerText || '').toUpperCase();
        const kx = _alignX(align, textPadH, W, mW(ctx, kickerText));
        ctx.fillText(kickerText, kx, y);
        ctx.restore();
        y += kickerBlockH;
    }

    ctx.save();
    ctx.font = fontSpec;
    setLS(ctx, (t16.letterSpacing ?? -0.04) * fs);
    ctx.textBaseline = 'top';
    const sp = mW(ctx, ' ');
    const uppercase = t16.uppercase;
    for (const line of allLines) {
        if (!line.length) {
            y += lineH;
            continue;
        }
        let lineW = 0;
        if (align !== 'left') {
            lineW = line.reduce(
                (acc, item, i) => acc + mW(ctx, uppercase ? item.word.toUpperCase() : item.word) + (i < line.length - 1 ? sp : 0),
                0,
            );
        }
        let x = textPadH;
        if (align === 'center') x = (W - lineW) / 2;
        else if (align === 'right') x = W - textPadH - lineW;
        for (let i = 0; i < line.length; i++) {
            ctx.fillStyle = line[i].color;
            const word = uppercase ? line[i].word.toUpperCase() : line[i].word;
            ctx.fillText(word, x, y);
            x += mW(ctx, word);
            if (i < line.length - 1) x += sp;
        }
        y += lineH;
    }
    ctx.restore();

    if (t16.showDek && dekLines.length) {
        y += 18;
        ctx.save();
        ctx.font = `${dekWeight} ${dekSize}px "${dekFF}", sans-serif`;
        setLS(ctx, (t16.dekLetterSpacing ?? -0.02) * dekSize);
        ctx.fillStyle = t16.dekColor || '#5C5C5C';
        ctx.textBaseline = 'top';
        for (const line of dekLines) {
            const dx = _alignX(align, textPadH, W, mW(ctx, line));
            ctx.fillText(line, dx, y);
            y += dekLH;
        }
        ctx.restore();
    }

    if (t16.showCta) {
        y += 28;
        const padX = t16.ctaPadH ?? 28;
        const padY = t16.ctaPadV ?? 16;
        ctx.save();
        ctx.font = `${ctaWeight} ${ctaSize}px "${dekFF}", sans-serif`;
        setLS(ctx, (t16.ctaLetterSpacing ?? -0.01) * ctaSize);
        const label = t16.ctaText || '';
        const textW = mW(ctx, label);
        const btnW = textW + padX * 2;
        const btnH = ctaSize + padY * 2;
        const bx = _alignX(align, textPadH, W, btnW);
        ctx.fillStyle = t16.ctaBg || '#111111';
        _roundRectPath(ctx, bx, y, btnW, btnH, t16.ctaRadius ?? 14);
        ctx.fill();
        ctx.fillStyle = t16.ctaColor || '#FFFFFF';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, bx + padX, y + btnH / 2);
        ctx.restore();
    }
}

// ─── MAIN EXPORT FUNCTION ─────────────────────────────────────────────────────
async function exportCanvas() {
    const state = window.state;
    const notify = window.showNotification || ((m, t) => console.log(`[${t}]`, m));

    if (!state)            { notify('State not ready', 'error'); return; }
    if (state.isExporting) { notify('Export already in progress…', 'error'); return; }

    state.isExporting = true;

    try {
        const isPost = state.mode !== 'highlight';
        const postSize = isPost ? _postTemplateSize(state) : null;
        const W      = isPost ? postSize.W : window.CONSTANTS.HIGHLIGHT_SIZE;
        const H      = isPost ? postSize.H : window.CONSTANTS.HIGHLIGHT_SIZE;
        const videoSrc = isPost ? _activeVideoSourceFromPost(state.post) : null;

        try { await document.fonts.ready; } catch (_) {}

        if (!_exportSession) {
            _exportSession = { cache: new Map(), videoMode: false, cleanupUrls: [] };
        }

        // Create offscreen canvas at native 1:1 resolution
        const canvas  = document.createElement('canvas');
        canvas.width  = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        if (isPost && videoSrc) {
            const style = (state.post && state.post.style) ? state.post.style : {};
            const showVideoAudio = style.showVideoAudio === true;
            const videoVolume = Math.max(0, Math.min(1, Number(style.videoVolume != null ? style.videoVolume : 0.85)));
            _exportSession = {
                cache: new Map(),
                videoMode: true,
                cleanupUrls: [],
                showVideoAudio,
                videoVolume,
                audioCtx: null,
            };
            const primary = await loadImg(videoSrc);
            if (!primary || primary.tagName !== 'VIDEO') {
                notify('Video export failed: could not decode video source.', 'error');
                return;
            }
            const videos = _collectSessionVideos();
            const duration = Math.max(0.1, Math.min(60, Number.isFinite(primary.duration) ? primary.duration : 8));
            const fps = 24;

            if (typeof MediaRecorder === 'undefined') {
                notify('Video export is not supported in this browser.', 'error');
                return;
            }
            const canvasStream = canvas.captureStream(fps);
            let stream = canvasStream;
            const chunks = [];
            // Prefer MP4 when supported; otherwise fall back to WebM.
            const mp4Candidates = [
                'video/mp4;codecs=avc1.42E01E',
                'video/mp4;codecs=avc1',
                'video/mp4',
            ];
            const webmCandidates = [
                'video/webm;codecs=vp9',
                'video/webm;codecs=vp8',
                'video/webm',
            ];
            let mime = null;
            let outExt = 'webm';
            for (const c of mp4Candidates) {
                try {
                    if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
                        mime = c;
                        outExt = 'mp4';
                        break;
                    }
                } catch (_) {}
            }
            if (!mime) {
                for (const c of webmCandidates) {
                    try {
                        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c)) {
                            mime = c;
                            outExt = 'webm';
                            break;
                        }
                    } catch (_) {}
                }
            }
            if (!mime) {
                // Last resort: let the browser pick a default.
                mime = '';
                outExt = 'webm';
                try { notify('MP4 not supported here; exporting in browser default format.', 'error'); } catch (_) {}
            } else if (outExt !== 'mp4') {
                try { notify('MP4 not supported here; exporting in WebM instead.', 'error'); } catch (_) {}
            }

            // Higher bitrate improves quality (best-effort; actual encoding depends on browser).
            // Canvas is ~1080x1350; 24fps. 20Mbps tends to produce noticeably better quality.
            const videoBitsPerSecond = 20_000_000;

            // Optional audio: mix all video element audio tracks into a single audio track.
            // Note: some browsers may refuse audio mixing for cross-origin media.
            if (showVideoAudio) {
                try {
                    const AudioCtx = window.AudioContext || window.webkitAudioContext;
                    if (AudioCtx) {
                        const audioCtx = new AudioCtx();
                        _exportSession.audioCtx = audioCtx;
                        await audioCtx.resume().catch(() => {});
                        const dest = audioCtx.createMediaStreamDestination();
                        for (const v of videos) {
                            try {
                                const srcNode = audioCtx.createMediaElementSource(v);
                                const gain = audioCtx.createGain();
                                gain.gain.value = videoVolume;
                                srcNode.connect(gain).connect(dest);
                            } catch (e) {
                                // createMediaElementSource can throw if called multiple times for the same element.
                                // We'll just skip those videos' audio tracks.
                                console.warn('[export] audio mix skipped for one video:', e);
                            }
                        }
                        const aTracks = dest.stream.getAudioTracks();
                        if (aTracks && aTracks.length) {
                            const mixed = new MediaStream();
                            canvasStream.getVideoTracks().forEach(t => mixed.addTrack(t));
                            aTracks.forEach(t => mixed.addTrack(t));
                            stream = mixed;
                        }
                    }
                } catch (e) {
                    console.warn('[export] video audio export failed, falling back to video-only.', e);
                    stream = canvasStream;
                }
            }
            const recorder = new MediaRecorder(stream, {
                mimeType: mime,
                videoBitsPerSecond,
            });
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) chunks.push(e.data);
            };

            const stopped = new Promise((resolve) => {
                recorder.onstop = resolve;
            });

            // Start all video layers in sync and capture in real-time to keep
            // temporal pacing stable (prevents speed-up/slow-down artifacts).
            for (const v of videos) {
                try {
                    v.pause();
                    v.currentTime = 0;
                    v.playbackRate = 1;
                } catch (_) {}
            }
            await Promise.all(videos.map(async (v) => {
                try {
                    const p = v.play();
                    if (p && typeof p.then === 'function') await p;
                } catch (_) {}
            }));

            recorder.start();
            const frameMs = 1000 / fps;
            const startMs = performance.now();
            let nextFrameMs = startMs;
            while ((performance.now() - startMs) < (duration * 1000)) {
                const now = performance.now();
                if (now >= nextFrameMs) {
                    ctx.clearRect(0, 0, W, H);
                    await _renderPostToCtx(ctx, state, W, H);
                    nextFrameMs += frameMs;
                }
                await new Promise((r) => requestAnimationFrame(r));
            }
            for (const v of videos) {
                try { v.pause(); } catch (_) {}
            }
            recorder.stop();
            await stopped;

            const blobType = mime || (outExt === 'mp4' ? 'video/mp4' : 'video/webm');
            const blob = new Blob(chunks, { type: blobType });
            if (!blob.size) {
                notify('Video export failed: no output frames recorded.', 'error');
                return;
            }
            const outUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = outUrl;
            link.download = `instatools-post-${Date.now()}.${outExt}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(outUrl);
            notify('Video exported successfully!', 'success');
            _bumpDownloadCount();
            return;
        }

        if (isPost) {
            await _renderPostToCtx(ctx, state, W, H);
        } else {
            await exportHighlight(ctx, state, W);
        }

        const blob = await new Promise((resolve, reject) => {
            try {
                canvas.toBlob((next) => {
                    if (!next) reject(new Error('Failed to generate image data'));
                    else resolve(next);
                }, 'image/png');
            } catch (secErr) {
                reject(secErr);
            }
        });
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href     = url;
        link.download = `instatools-${state.mode}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        notify('Image exported successfully!', 'success');
        _bumpDownloadCount();

    } catch (err) {
        console.error('Export error:', err);
        if (err && err.name === 'SecurityError') {
            notify('Export blocked: one or more images could not be loaded due to CORS restrictions. Try uploading images directly instead of pasting external URLs.', 'error');
        } else {
            notify('Export failed: ' + (err.message || 'Unknown error'), 'error');
        }
    } finally {
        if (_exportSession && Array.isArray(_exportSession.cleanupUrls)) {
            _exportSession.cleanupUrls.forEach((u) => {
                try { URL.revokeObjectURL(u); } catch (_) {}
            });
        }
        if (_exportSession && _exportSession.audioCtx && typeof _exportSession.audioCtx.close === 'function') {
            try { _exportSession.audioCtx.close(); } catch (_) {}
        }
        _exportSession = null;
        state.isExporting = false;
    }
}

function _bumpDownloadCount() {
    const downloadCount = parseInt(localStorage.getItem('instatoolsDownloadCount') || '0', 10) + 1;
    localStorage.setItem('instatoolsDownloadCount', String(downloadCount));
    if (typeof window.checkSupportPopup === 'function') {
        setTimeout(() => window.checkSupportPopup(), 500);
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

if (typeof window !== 'undefined') {
    window.exportCanvas  = exportCanvas;
    window.exportPresets = exportPresets;
}

export { exportCanvas, exportPresets }
