/**
 * filter.js — Canvas-based post-processing effects
 *
 * Provides grain / film-noise rendering that works both in the live preview
 * (as a CSS background-image data URL) and in the canvas export pipeline
 * (drawn directly onto an offscreen canvas).
 *
 * Why a dedicated file?
 *   The SVG turbulence approach used before is unreliable across browsers and
 *   produces a repeating mathematical pattern — not real grain.  This module
 *   generates true random monochrome pixel noise via ImageData.
 */

// ─── Internal: build a tiled grain canvas ────────────────────────────────────
// Returns a small HTMLCanvasElement filled with random greyscale pixels.
// The same tile is then tiled (repeated) over the whole canvas.
function _buildGrainTile(tileSize) {
    tileSize = tileSize || 180;
    const c   = document.createElement('canvas');
    c.width   = tileSize;
    c.height  = tileSize;
    const ctx  = c.getContext('2d');
    const img  = ctx.createImageData(tileSize, tileSize);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
        const v    = (Math.random() * 255) | 0;
        data[i]    = v;   // R
        data[i+1]  = v;   // G
        data[i+2]  = v;   // B
        data[i+3]  = 255; // A — fully opaque; opacity is set on the layer
    }
    ctx.putImageData(img, 0, 0);
    return c;
}

/**
 * Draw a film-grain overlay onto an existing canvas context.
 *
 * Mirrors the CSS:
 *   background-image: url(NOISE_SVG);
 *   background-size: 80px 80px;
 *   mix-blend-mode: multiply;
 *   opacity: amount * 1.6;
 *   filter: contrast(1.6) brightness(1.05);
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} W   - canvas pixel width
 * @param {number} H   - canvas pixel height
 * @param {number} amount  - grain strength 0–1  (matches state.t10.noiseAmount)
 */
function applyGrain(ctx, W, H, amount) {
    if (!amount || amount <= 0) return;

    const tileSize = 180;
    const tile     = _buildGrainTile(tileSize);
    const pattern  = ctx.createPattern(tile, 'repeat');

    ctx.save();
    // globalAlpha mirrors  opacity: amount * 1.6  (capped at 1)
    ctx.globalAlpha                = Math.min(1, amount * 1.6);
    // 'multiply' blend darkens brighter pixels → grunge / aged look
    ctx.globalCompositeOperation   = 'multiply';
    ctx.fillStyle                  = pattern;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
}

/**
 * Return a base64 PNG data-URL of a noise tile.
 * Used as the CSS  background-image  of the live-preview noise div,
 * replacing the unreliable SVG turbulence approach.
 *
 * @param  {number} [tileSize=180]
 * @returns {string}  data:image/png;base64,…
 */
function getGrainDataUrl(tileSize) {
    return _buildGrainTile(tileSize || 180).toDataURL('image/png');
}

// Make available globally (used by renderers-core.js and export.js)
if (typeof window !== 'undefined') {
    window.applyGrain    = applyGrain;
    window.getGrainDataUrl = getGrainDataUrl;
}
