// --- SAVED TEMPLATES CARD BUILDER ---
// Builds the saved presets list HTML using ONLY inline styles (no Tailwind dependency).
// Called by both renderPostTemplates and renderLibrary.
function buildPresetsHtml() {
    var presets = (window.state && window.state.presets) ? window.state.presets : [];

    // Filter to presets that can actually be loaded: must have id, name, and style data.
    // Presets without style data are silently excluded — they would just show an error on click.
    var valid = presets.filter(function(p) {
        if (!p || typeof p !== 'object') return false;
        if (p.id == null) return false;
        if (typeof p.name !== 'string' || !p.name.trim()) return false;
        var hasTopStyle  = p.style && typeof p.style === 'object';
        var hasPostStyle = p.post && p.post.style && typeof p.post.style === 'object';
        return hasTopStyle || hasPostStyle;
    });

    if (valid.length === 0) {
        return '<div style="text-align:center; padding:48px 16px; color:#6b7280; font-size:11px; border-radius:8px; background:#282828; border:1px solid #3e3e3e;">No templates saved yet. Use &ldquo;Save Current State&rdquo; above!</div>';
    }

    var cards = valid.map(function(p) {
        var styleObj = (p.post && p.post.style) ? p.post.style : (p.style || {});
        var color    = (styleObj && styleObj.highlightColor) ? styleObj.highlightColor : '#d53478';
        var rawName  = p.name || '';
        var safeName = window.escapeHtml ? window.escapeHtml(rawName) : rawName.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        var numId    = p.id;
        var modeLabel = p.mode ? (p.mode.charAt(0).toUpperCase() + p.mode.slice(1)) : '';
        var tmplLabel = (p.post && p.post.template) ? p.post.template.replace('template', 'T') : '';
        var meta      = [modeLabel, tmplLabel].filter(Boolean).join(' \u00b7 ');

        return '<div onclick="window.loadPreset(' + numId + ')" '
             + 'style="display:flex; align-items:center; justify-content:space-between; '
             +        'width:100%; padding:10px; border-radius:8px; background:#282828; '
             +        'border:1px solid #3e3e3e; cursor:pointer; box-sizing:border-box; '
             +        'margin-bottom:6px;">'

             // LEFT: colour dot + text
             + '<div style="display:flex; align-items:center; gap:12px; overflow:hidden; flex:1; min-width:0;">'
                 + '<div style="width:8px; height:28px; border-radius:9999px; flex-shrink:0; '
                 +            'background-color:' + color + '; '
                 +            'box-shadow:0 0 8px ' + color + '44;"></div>'
                 + '<div style="display:flex; flex-direction:column; min-width:0; gap:2px; overflow:hidden;">'
                     + '<span style="font-size:12px; font-weight:700; color:#dddddd; '
                     +             'white-space:nowrap; overflow:hidden; text-overflow:ellipsis; display:block;">'
                     + safeName
                     + '</span>'
                     + (meta ? '<span style="font-size:9px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; display:block;">' + meta + '</span>' : '')
                 + '</div>'
             + '</div>'

             // RIGHT: action buttons
             + '<div style="display:flex; align-items:center; gap:2px; padding-left:8px; flex-shrink:0; opacity:0.5;">'
                 + '<button onclick="event.stopPropagation(); window.loadPreset(' + numId + ')" '
                 +         'title="Load template" '
                 +         'style="padding:6px; border:none; background:transparent; color:#9ca3af; cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center;">'
                 +     '<i data-lucide="rotate-ccw" style="width:12px; height:12px;"></i>'
                 + '</button>'
                 + '<button onclick="event.stopPropagation(); window.deletePreset(' + numId + ')" '
                 +         'title="Delete template" '
                 +         'style="padding:6px; border:none; background:transparent; color:#6b7280; cursor:pointer; border-radius:6px; display:flex; align-items:center; justify-content:center;">'
                 +     '<i data-lucide="trash-2" style="width:12px; height:12px;"></i>'
                 + '</button>'
             + '</div>'

             + '</div>';
    });

    return '<div style="display:flex; flex-direction:column;">' + cards.join('') + '</div>';
}

function renderColorPicker(label, currentColor, onChangeStr) {
  const id = Math.random().toString(36).substr(2, 9);
  const toggleId = `cp-${id}`;

  // Create a global handler function name
  const handlerName = `handleColorPick_${id}`;

  // Parse the onChange string to extract function name and parameter
  // Format is like: "window.updatePostStyle('highlightColor', '$VAL')"
  const match = onChangeStr.match(
    /^([\w.]+)\(['"]([^'"]+)['"],\s*['"]\$VAL['"]\)$/,
  );

  // Register the handler globally
  window[handlerName] = function (color) {
    try {
      if (match) {
        // Direct function call approach
        const funcName = match[1];
        const paramName = match[2];

        if (funcName === "updatePostStyle" || funcName === "window.updatePostStyle") {
          window.updatePostStyle(paramName, color);
        } else if (funcName === "updateHighlightState" || funcName === "window.updateHighlightState") {
          window.updateHighlightState(paramName, color);
        } else {
          // Fallback to eval (safe in this context since we control the input)
          const code = onChangeStr.replace(/['"]?\$VAL['"]?/g, JSON.stringify(color));
          const fn = new Function("return " + code);
          fn();
        }
      } else {
        // Fallback: try to execute the onChange string directly
        const code = onChangeStr.replace(/['"]?\$VAL['"]?/g, JSON.stringify(color));
        const fn = new Function("return " + code);
        fn();
      }

      // Don't close the picker - allow multiple color selections
      // Re-render sidebar to update the color display
      window.renderSidebarContent();
    } catch (e) {
      console.error("Color picker error:", e);
      console.error("OnChange string:", onChangeStr);
      console.error("Color value:", color);
    }
  };

  return `
                <div class="relative">
                    <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">${label}</label>
                    <button 
                        onclick="event.stopPropagation(); document.getElementById('${toggleId}').classList.toggle('hidden');" 
                        class="flex items-center gap-2 bg-[#1e1e1e] rounded-lg p-2 w-full transition-all-200 group hover:bg-[#252525]"
                        style="border: 1px solid #3e3e3e;"
                        onmouseover="this.style.borderColor='#535353'; this.style.backgroundColor='#252525'"
                        onmouseout="this.style.borderColor='#3e3e3e'; this.style.backgroundColor='#1e1e1e'"
                        aria-label="Open color picker for ${label}"
                    >
                        <div class="w-7 h-7 rounded-md shadow-sm flex-shrink-0" style="background-color: ${currentColor}; border: 1px solid #3e3e3e; box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset;"></div>
                        <span class="text-xs font-mono text-gray-400 group-hover:text-[#dddddd] flex-1 text-left whitespace-nowrap">${currentColor}</span>
                        <i data-lucide="palette" class="w-4 h-4 text-gray-400 group-hover:text-gray-300 flex-shrink-0 transition-colors"></i>
                    </button>
                    <div id="${toggleId}" class="hidden absolute top-full left-0 mt-2 z-50 bg-[#282828] rounded-xl shadow-2xl p-4 w-64 color-picker-popover" style="border: 1px solid #3e3e3e; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                        <div class="flex items-center gap-2 mb-3">
                            <i data-lucide="palette" class="w-3.5 h-3.5 text-gray-400"></i>
                            <span class="text-[10px] font-bold text-gray-400 uppercase">Quick Colors</span>
                        </div>
                        <div class="grid grid-cols-7 gap-2 mb-4">
                            ${window.CONSTANTS.COLORS.map((c) => {
                              const escapedColor = c.replace(/'/g, "\\'");
                              return `
                                <button 
                                    onclick="event.stopPropagation(); window['${handlerName}']('${escapedColor}')" 
                                    class="w-7 h-7 rounded-full hover:scale-110 hover:ring-2 hover:ring-gray-500 transition-all-200 color-picker-btn" 
                                    style="background-color: ${c} !important; border: 2px solid ${c === "#FFFFFF" ? "#3e3e3e" : "rgba(0,0,0,0.2)"}; --btn-bg-color: ${c}; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"
                                    aria-label="Select color ${c}"
                                    title="${c}"
                                ></button>
                            `;
                            }).join("")}
                        </div>
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="sliders-horizontal" class="w-3.5 h-3.5 text-gray-400"></i>
                            <span class="text-[10px] font-bold text-gray-400 uppercase">Custom Color</span>
                        </div>
                        <div class="flex gap-2 items-stretch">
                            <button 
                                type="button"
                                class="relative h-10 w-24 flex-shrink-0 overflow-hidden rounded-lg group cursor-pointer border border-[#3e3e3e] transition-all-200 hover:border-[#535353]"
                                style="background-color: ${currentColor};"
                                onclick="event.stopPropagation(); document.getElementById('color-input-${toggleId}').click();"
                                aria-label="Open color picker"
                            >
                                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all-200 flex items-center justify-center pointer-events-none z-20">
                                    <i data-lucide="palette" class="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg"></i>
                                </div>
                                <input 
                                    type="color" 
                                    id="color-input-${toggleId}"
                                    value="${currentColor}" 
                                    oninput="const hexInput = document.getElementById('hex-input-${toggleId}'); if (hexInput) hexInput.value = this.value.toUpperCase(); const colorBtn = this.closest('button'); if (colorBtn) colorBtn.style.backgroundColor = this.value;" 
                                    onchange="window['${handlerName}'](this.value);" 
                                    class="absolute inset-0 w-full h-full cursor-pointer opacity-0 z-10 pointer-events-none"
                                    style="cursor: pointer; width: 100%; height: 100%;"
                                    aria-label="Color picker"
                                >
                            </button>
                            <input 
                                type="text" 
                                id="hex-input-${toggleId}"
                                class="hex-color-input bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg px-2.5 py-2 text-xs font-mono text-gray-300 h-10 flex-1 min-w-[70px] max-w-[80px] focus:outline-none focus:border-[#535353] focus:bg-[#252525] transition-all-200 hover:border-[#4a4a4a]"
                                value="${currentColor.toUpperCase()}" 
                                placeholder="#FFFFFF"
                                maxlength="7"
                                oninput="let val = this.value.toUpperCase(); if (!val.startsWith('#')) val = '#' + val.replace(/[^0-9A-F]/g, ''); else val = '#' + val.slice(1).replace(/[^0-9A-F]/g, ''); val = val.slice(0, 7); this.value = val; if (val.length === 7 && /^#[0-9A-F]{6}$/i.test(val)) { window['${handlerName}'](val); const colorInput = document.getElementById('color-input-${toggleId}'); if (colorInput) { colorInput.value = val; const colorBtn = colorInput.closest('button'); if (colorBtn) colorBtn.style.backgroundColor = val; } }"
                                onkeypress="if (event.key === 'Enter') { this.blur(); }"
                                onblur="if (!/^#[0-9A-F]{6}$/i.test(this.value)) { this.value = '${currentColor.toUpperCase()}'; }"
                                aria-label="Hex color code"
                            >
                        </div>
                    </div>
                </div>
            `;
}

// Export renderColorPicker immediately so it's available for template strings
if (typeof window !== "undefined") {
  window.renderColorPicker = renderColorPicker;
}

function renderPostEditor(container) {
  const s = window.state.post.style;
  const safeBgImage = window.state.post.bgImage.startsWith("data:")
    ? ""
    : window.escapeHtml(window.state.post.bgImage);

  container.innerHTML = `
                <!-- Background -->
                <div class="space-y-3 animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <i data-lucide="image" class="w-3 h-3"></i> Background Image
                    </label>
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white" 
                            placeholder="Image URL..." 
                            oninput="window.updatePostBgUrl(this.value)" 
                            value="${safeBgImage}"
                            aria-label="Background image URL"
                        >
                        <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload background image">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                            <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 'postBg')">
                        </label>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="250" 
                                    value="${s.imageScale}" 
                                    oninput="window.updatePostStyleWithDisplay('imageScale', parseFloat(this.value), 'bg-zoom-display', 'percent-value')" 
                                    class="w-full"
                                    aria-label="Image zoom"
                                >
                                <div id="bg-zoom-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.imageScale}%</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Opacity</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value="${s.bgOpacity}" 
                                    oninput="window.updatePostStyleWithDisplay('bgOpacity', parseFloat(this.value), 'bg-opacity-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Background opacity"
                                >
                                <div id="bg-opacity-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(s.bgOpacity * 100)}%</div>
                            </div>
                        </div>
                        <div class="flex gap-3">
                            <div class="flex-1">
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value="${s.imagePosX}" 
                                    oninput="window.updatePostStyleWithDisplay('imagePosX', parseFloat(this.value), 'bg-posx-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Image position X"
                                >
                                <div id="bg-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.imagePosX}%</div>
                            </div>
                            <div class="flex-1">
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value="${s.imagePosY}" 
                                    oninput="window.updatePostStyleWithDisplay('imagePosY', parseFloat(this.value), 'bg-posy-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Image position Y"
                                >
                                <div id="bg-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.imagePosY}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Overlay -->
                <div class="space-y-3 pt-6 border-t border-gray-100 animate-fade-in">
                    <div class="flex justify-between items-center">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="circle" class="w-3 h-3"></i> Circle Overlay
                        </label>
                        ${
                          s.overlayImgUrl
                            ? `
                            <button 
                                onclick="window.updatePostStyle('overlayImgUrl', '')" 
                                class="text-red-500 text-[10px] font-medium hover:text-red-600 transition-colors"
                                aria-label="Remove overlay"
                            >
                                Remove
                            </button>
                        `
                            : ""
                        }
                    </div>
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            id="input-overlay-url"
                            class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white" 
                            placeholder="Overlay URL..." 
                            oninput="window.updatePostOverlayUrl(this.value)"
                            value="${window.escapeHtml(s.overlayImgUrl)}"
                            aria-label="Overlay image URL"
                        >
                        <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload overlay image">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                            <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 'postOverlay')">
                        </label>
                    </div>
                    ${
                      s.overlayImgUrl
                        ? `
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size</label>
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="800" 
                                    value="${s.overlayImgSize}" 
                                    oninput="window.updatePostStyleWithDisplay('overlayImgSize', parseFloat(this.value), 'overlay-size-display', 'px')" 
                                    class="w-full"
                                    aria-label="Overlay size"
                                >
                                <div id="overlay-size-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.overlayImgSize}px</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Border</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="50" 
                                    value="${s.overlayBorderWidth}" 
                                    oninput="window.updatePostStyleWithDisplay('overlayBorderWidth', parseFloat(this.value), 'overlay-border-display', 'px')" 
                                    class="w-full"
                                    aria-label="Overlay border width"
                                >
                                <div id="overlay-border-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.overlayBorderWidth}px</div>
                            </div>
                        </div>
                        ${window.renderColorPicker("Border Color", s.overlayBorderColor, "window.updatePostStyle('overlayBorderColor', '$VAL')")}
                        <div class="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="checkbox-show-overlay-border"
                                ${s.showOverlayBorder !== false ? "checked" : ""}
                                onchange="window.updatePostStyle('showOverlayBorder', this.checked)"
                                class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                aria-label="Show overlay border"
                            >
                            <label for="checkbox-show-overlay-border" class="text-[9px] uppercase font-bold text-gray-400 cursor-pointer">
                                Show Border Ring
                            </label>
                        </div>
                        ${window.renderColorPicker("Glow Color", s.overlayGlowColor || s.overlayBorderColor, "window.updatePostStyle('overlayGlowColor', '$VAL')")}
                        <div class="flex items-center gap-2">
                            <input 
                                type="checkbox" 
                                id="checkbox-show-overlay-glow"
                                ${s.showOverlayGlow ? "checked" : ""}
                                onchange="window.toggleOverlayGlow(this.checked)"
                                class="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                                aria-label="Show overlay glow"
                            >
                            <label for="checkbox-show-overlay-glow" class="text-[9px] uppercase font-bold text-gray-400 cursor-pointer">
                                Enable Circle Glow
                            </label>
                        </div>
                        ${
                          s.showOverlayGlow
                            ? `
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Glow Intensity</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.01" 
                                value="${s.overlayGlowIntensity !== undefined ? s.overlayGlowIntensity : 0.5}" 
                                oninput="window.updatePostStyleWithDisplay('overlayGlowIntensity', parseFloat(this.value), 'overlay-glow-intensity-display', 'percent')" 
                                class="w-full"
                                aria-label="Glow intensity"
                            >
                            <div id="overlay-glow-intensity-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round((s.overlayGlowIntensity !== undefined ? s.overlayGlowIntensity : 0.5) * 100)}%</div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Glow Size</label>
                            <input 
                                type="range" 
                                min="0" 
                                max="2" 
                                step="0.1" 
                                value="${s.overlayGlowSize !== undefined ? s.overlayGlowSize : 1.0}" 
                                oninput="window.updatePostStyleWithDisplay('overlayGlowSize', parseFloat(this.value), 'overlay-glow-size-display', 'number')" 
                                class="w-full"
                                aria-label="Glow size"
                            >
                            <div id="overlay-glow-size-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${(s.overlayGlowSize !== undefined ? s.overlayGlowSize : 1.0).toFixed(1)}x</div>
                        </div>
                        `
                            : ""
                        }
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">X-Pos</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value="${s.overlayImgPosX}" 
                                    oninput="window.updatePostStyleWithDisplay('overlayImgPosX', parseFloat(this.value), 'overlay-posx-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Overlay position X"
                                >
                                <div id="overlay-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.overlayImgPosX}%</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Y-Pos</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value="${s.overlayImgPosY}" 
                                    oninput="window.updatePostStyleWithDisplay('overlayImgPosY', parseFloat(this.value), 'overlay-posy-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Overlay position Y"
                                >
                                <div id="overlay-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.overlayImgPosY}%</div>
                            </div>
                        </div>
                    </div>`
                        : ""
                    }
                </div>

                <!-- Text -->
                <div class="space-y-3 pt-6 border-t border-gray-100 animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <i data-lucide="type" class="w-3 h-3"></i> Content
                    </label>
                    <textarea 
                        id="input-headline"
                        oninput="window.state.post.headline = this.value; window.debouncedRenderCanvas()" 
                        class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-black focus:bg-white transition-all-200 resize-none" 
                        rows="3"
                        placeholder="Enter headline... Use [brackets] and {braces} for colored text"
                        aria-label="Headline text"
                    >${window.escapeHtml(window.state.post.headline)}</textarea>
                    <input 
                        type="text" 
                        id="input-caption"
                        oninput="window.state.post.caption = this.value; window.debouncedRenderCanvas()" 
                        value="${window.escapeHtml(window.state.post.caption)}" 
                        class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                        placeholder="Caption text..."
                        aria-label="Caption text"
                    >
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            id="input-source"
                            oninput="window.updatePostStyle('sourceText', this.value)" 
                            value="${window.escapeHtml(s.sourceText)}" 
                            class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                            placeholder="Source text..."
                            aria-label="Source text"
                        >
                        <button 
                            onclick="window.updatePostStyle('showSource', ${!s.showSource}); window.renderSidebarContent();" 
                            class="p-2.5 rounded-lg border border-gray-200 transition-all-200 ${s.showSource ? "bg-black text-white border-black" : "bg-white text-gray-400 hover:bg-gray-50"}"
                            aria-label="${s.showSource ? "Hide" : "Show"} source"
                        >
                            <i data-lucide="${s.showSource ? "eye-off" : "eye"}" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                </div>

                <!-- Badges -->
                <section class="space-y-4 pt-6 border-t border-gray-100 animate-fade-in">
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="layers" class="w-3.5 h-3.5 text-gray-400"></i>
                        <h3 class="text-xs font-bold uppercase tracking-wider text-gray-900">Badges</h3>
                    </div>
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold text-gray-500 uppercase">News Badge</span>
                            <input 
                                type="checkbox" 
                                id="input-showNewsBadge"
                                ${s.showNewsBadge ? "checked" : ""} 
                                onchange="window.updatePostStyle('showNewsBadge', this.checked)" 
                                class="accent-black h-4 w-4 cursor-pointer"
                                aria-label="Toggle news badge"
                            >
                        </div>
                        ${
                          s.showNewsBadge
                            ? `
                            <input 
                                type="text" 
                                id="input-badgeText"
                                value="${window.escapeHtml(s.badgeText)}" 
                                oninput="window.updatePostStyle('badgeText', this.value)" 
                                class="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs font-bold uppercase text-center focus:outline-none focus:border-black transition-all-200"
                                aria-label="Badge text"
                            >
                        `
                            : ""
                        }
                    </div>
                    <div class="bg-[#282828] p-4 rounded-lg space-y-3" style="border: 1px solid #3e3e3e;">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-bold text-gray-400 uppercase">Swipe Left Indicator</span>
                            <input 
                                type="checkbox" 
                                id="input-showSwipeBadge"
                                ${s.showSwipeBadge ? "checked" : ""} 
                                onchange="window.updatePostStyle('showSwipeBadge', this.checked)" 
                                class="accent-[#d53478] h-4 w-4 cursor-pointer"
                                aria-label="Toggle swipe badge"
                            >
                        </div>
                        ${
                          s.showSwipeBadge
                            ? `
                            <div class="space-y-3 pt-2 border-t border-[#3e3e3e]">
                                <div>
                                    <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Text</label>
                                    <input 
                                        type="text" 
                                        id="input-swipeText"
                                        value="${window.escapeHtml(s.swipeText || "Swipe Left")}" 
                                        oninput="window.updatePostStyle('swipeText', this.value)" 
                                        class="w-full bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg px-3 py-2 text-xs font-bold uppercase text-[#dddddd] focus:outline-none focus:border-[#d53478] focus:bg-[#131314] transition-all-200 placeholder-gray-500"
                                        placeholder="Swipe Left"
                                        aria-label="Swipe text"
                                    >
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Font Size</label>
                                        <input 
                                            type="range" 
                                            min="12" 
                                            max="48" 
                                            value="${s.swipeFontSize || 20}" 
                                            oninput="window.updatePostStyleWithDisplay('swipeFontSize', parseInt(this.value), 'swipe-font-size-display', 'px')" 
                                            class="w-full"
                                            aria-label="Swipe font size"
                                        >
                                        <div id="swipe-font-size-display" class="text-[9px] text-gray-500 mt-1 text-center font-mono">${s.swipeFontSize || 20}px</div>
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Icon Size</label>
                                        <input 
                                            type="range" 
                                            min="12" 
                                            max="48" 
                                            value="${s.swipeIconSize || 24}" 
                                            oninput="window.updatePostStyleWithDisplay('swipeIconSize', parseInt(this.value), 'swipe-icon-size-display', 'px')" 
                                            class="w-full"
                                            aria-label="Swipe icon size"
                                        >
                                        <div id="swipe-icon-size-display" class="text-[9px] text-gray-500 mt-1 text-center font-mono">${s.swipeIconSize || 24}px</div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Font Family</label>
                                    <select 
                                        id="input-swipeFontFamily"
                                        onchange="window.updatePostStyle('swipeFontFamily', this.value)" 
                                        class="w-full bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg px-3 py-2 text-xs text-[#dddddd] focus:outline-none focus:border-[#d53478] focus:bg-[#131314] transition-all-200"
                                        aria-label="Swipe font family"
                                    >
                                        ${[
                                          "Inter",
                                          "DM Sans",
                                          "Plus Jakarta Sans",
                                          "Poppins",
                                          "Montserrat",
                                          "Roboto Condensed",
                                          "Archivo Black",
                                        ]
                                          .map(
                                            (font) => `
                                            <option value="${font}" ${(s.swipeFontFamily || "Inter") === font ? "selected" : ""}>${font}</option>
                                        `,
                                          )
                                          .join("")}
                                    </select>
                                    <div class="mt-2">
                                        <label class="text-[8px] font-bold text-gray-500 uppercase block mb-1">Custom Font Family</label>
                                        <input
                                            type="text"
                                            id="input-customSwipeFontFamily"
                                            value="${s.customSwipeFontFamily || ""}"
                                            oninput="window.updatePostStyle('customSwipeFontFamily', this.value); window.debouncedRenderCanvas()"
                                            placeholder="e.g., 'Comic Sans MS', 'Times New Roman'"
                                            class="w-full bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg px-3 py-2 text-xs text-[#dddddd] focus:outline-none focus:border-[#d53478] focus:bg-[#131314] transition-all-200"
                                            aria-label="Custom swipe font family"
                                        >
                                        <p class="text-[7px] text-gray-500 mt-1">Enter a custom font name (will override selected font)</p>
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Text Color</label>
                                        <input 
                                            type="color" 
                                            id="input-swipeTextColor"
                                            value="${s.swipeTextColor || "#FFFFFF"}" 
                                            oninput="window.updatePostStyle('swipeTextColor', this.value)" 
                                            class="w-full h-10 rounded-lg cursor-pointer"
                                            style="border: 1px solid #3e3e3e;"
                                            aria-label="Swipe text color"
                                        >
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Icon Color</label>
                                        <input 
                                            type="color" 
                                            id="input-swipeColor"
                                            value="${s.swipeColor || "#FFFFFF"}" 
                                            oninput="window.updatePostStyle('swipeColor', this.value)" 
                                            class="w-full h-10 rounded-lg cursor-pointer"
                                            style="border: 1px solid #3e3e3e;"
                                            aria-label="Swipe icon color"
                                        >
                                    </div>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-2">
                                    <div>
                                        <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Opacity</label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            value="${Math.round((s.swipeOpacity || 0.9) * 100)}" 
                                            oninput="window.updatePostStyleWithDisplay('swipeOpacity', parseFloat(this.value) / 100, 'swipe-opacity-display', 'percent')" 
                                            class="w-full"
                                            aria-label="Swipe opacity"
                                        >
                                        <div id="swipe-opacity-display" class="text-[9px] text-gray-500 mt-1 text-center font-mono">${Math.round((s.swipeOpacity || 0.9) * 100)}%</div>
                                    </div>
                                    <div>
                                        <label class="text-[9px] font-bold text-gray-400 uppercase block mb-1.5">Letter Spacing</label>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="30" 
                                            value="${Math.round((s.swipeLetterSpacing || 0.1) * 100)}" 
                                            oninput="window.updatePostStyleWithDisplay('swipeLetterSpacing', parseFloat(this.value) / 100, 'swipe-letter-spacing-display', 'number')" 
                                            class="w-full"
                                            aria-label="Swipe letter spacing"
                                        >
                                        <div id="swipe-letter-spacing-display" class="text-[9px] text-gray-500 mt-1 text-center font-mono">${(s.swipeLetterSpacing || 0.1).toFixed(2)}em</div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between pt-2 border-t border-[#3e3e3e]">
                                    <span class="text-[9px] font-bold text-gray-400 uppercase">Show Icon</span>
                                    <input 
                                        type="checkbox" 
                                        id="input-swipeShowIcon"
                                        ${s.swipeShowIcon !== false ? "checked" : ""} 
                                        onchange="window.updatePostStyle('swipeShowIcon', this.checked)" 
                                        class="accent-[#d53478] h-4 w-4 cursor-pointer"
                                        aria-label="Toggle swipe icon"
                                    >
                                </div>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </section>

                <!-- Watermark -->
                <div class="space-y-3 pt-6 border-t border-gray-100 animate-fade-in">
                    <div class="flex justify-between items-center">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Watermark
                        </label>
                        <div class="flex items-center gap-2">
                            <span class="text-[9px] text-gray-400">Show</span>
                            <input 
                                type="checkbox" 
                                id="input-showWatermark"
                                ${s.showWatermark ? "checked" : ""} 
                                onchange="window.updatePostStyle('showWatermark', this.checked)" 
                                class="accent-black h-3.5 w-3.5 cursor-pointer"
                                aria-label="Toggle watermark"
                            >
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <input 
                            type="text" 
                            id="input-watermarkUrl"
                            class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white" 
                            placeholder="Watermark URL..." 
                            oninput="window.updatePostStyle('watermarkUrl', this.value)"
                            value="${window.escapeHtml(s.watermarkUrl)}"
                            aria-label="Watermark image URL"
                        >
                        <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload watermark">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                            <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 'postWatermark')">
                        </label>
                    </div>
                    ${
                      s.watermarkUrl
                        ? `
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-4">
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size</label>
                                <input 
                                    type="range" 
                                    min="50" 
                                    max="500" 
                                    value="${s.watermarkSize}" 
                                    oninput="window.updatePostStyleWithDisplay('watermarkSize', parseFloat(this.value), 'watermark-size-display', 'px')" 
                                    class="w-full"
                                    aria-label="Watermark size"
                                >
                                <div id="watermark-size-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.watermarkSize}px</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Opacity</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.01" 
                                    value="${s.watermarkOpacity}" 
                                    oninput="window.updatePostStyleWithDisplay('watermarkOpacity', parseFloat(this.value), 'watermark-opacity-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Watermark opacity"
                                >
                                <div id="watermark-opacity-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(s.watermarkOpacity * 100)}%</div>
                            </div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Position</label>
                            <div class="grid grid-cols-3 gap-1.5 mb-3">
                                <button onclick="window.setWatermarkPosition(10, 10)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 10 && s.watermarkPosY === 10 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Top Left">TL</button>
                                <button onclick="window.setWatermarkPosition(50, 10)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 50 && s.watermarkPosY === 10 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Top Center">TC</button>
                                <button onclick="window.setWatermarkPosition(90, 10)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 90 && s.watermarkPosY === 10 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Top Right">TR</button>
                                <button onclick="window.setWatermarkPosition(10, 50)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 10 && s.watermarkPosY === 50 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Center Left">CL</button>
                                <button onclick="window.setWatermarkPosition(50, 50)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 50 && s.watermarkPosY === 50 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Center">C</button>
                                <button onclick="window.setWatermarkPosition(90, 50)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 90 && s.watermarkPosY === 50 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Center Right">CR</button>
                                <button onclick="window.setWatermarkPosition(10, 90)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 10 && s.watermarkPosY === 90 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Bottom Left">BL</button>
                                <button onclick="window.setWatermarkPosition(50, 90)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 50 && s.watermarkPosY === 90 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Bottom Center">BC</button>
                                <button onclick="window.setWatermarkPosition(90, 90)" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${s.watermarkPosX === 90 && s.watermarkPosY === 90 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Bottom Right">BR</button>
                            </div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Manual Position</label>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">X-Pos</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="140" 
                                        value="${s.watermarkPosX}" 
                                        oninput="window.updatePostStyleWithDisplay('watermarkPosX', parseFloat(this.value), 'watermark-posx-display', 'percent')" 
                                        class="w-full"
                                        aria-label="Watermark position X"
                                    >
                                    <div id="watermark-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.watermarkPosX}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Y-Pos</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="100" 
                                        value="${s.watermarkPosY}" 
                                        oninput="window.updatePostStyleWithDisplay('watermarkPosY', parseFloat(this.value), 'watermark-posy-display', 'percent')" 
                                        class="w-full"
                                        aria-label="Watermark position Y"
                                    >
                                    <div id="watermark-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.watermarkPosY}%</div>
                                </div>
                            </div>
                        </div>
                    </div>`
                        : ""
                    }
                </div>
            `;
}

function renderPostTemplates(container) {
  var _presetsHtml = buildPresetsHtml();
  container.innerHTML = `
                <div class="space-y-4 animate-fade-in">
                    <div class="flex items-center gap-2 mb-4">
                        <i data-lucide="layout-template" class="w-4 h-4 text-gray-400"></i>
                        <h3 class="text-xs font-bold uppercase tracking-wider" style="color: #dddddd;">System Templates</h3>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-3">
                        ${window.SYSTEM_TEMPLATES.map(
                          (t) => `
                            <button 
                                onclick="window.loadSystemTemplate('${t.id}')" 
                                class="group relative flex flex-col items-start justify-start gap-2 p-3 rounded-lg border border-[#3e3e3e] hover:border-[#535353] hover:shadow-md transition-all-200 w-full h-full"
                                style="background-color: #131314 !important; text-align: left;"
                            >
                                <div class="w-full aspect-video rounded-md mb-1 overflow-hidden relative flex items-center justify-center" style="border: 1px solid #3e3e3e; background-color: #282828;">
                                    ${
                                      t.previewImage
                                        ? `
                                        <img src="${t.previewImage}" alt="${t.name}" class="w-full h-full object-cover">
                                    `
                                        : `
                                        <!-- Simple CSS Preview Fallback -->
                                        <div class="absolute inset-0 opacity-20" style="background-color: ${t.previewColor || "#000"}"></div>
                                        <div class="scale-50 transform origin-center flex flex-col items-center gap-1 opacity-80">
                                           <div class="w-12 h-1 bg-current opacity-40 rounded-full"></div> 
                                           <div class="w-8 h-1 bg-current opacity-20 rounded-full"></div> 
                                        </div>
                                    `
                                    }
                                </div>
                                
                                <div class="w-full text-left">
                                    <span class="text-xs font-bold block leading-tight group-hover:text-white" style="color: #dddddd;">${t.name}</span>
                                    <span class="text-[9px] uppercase tracking-wider mt-0.5 block" style="color: #dddddd;">Preset</span>
                                </div>
                            </button>
                        `,
                        ).join("")}
                    </div>
                    
                    <div class="mt-6 pt-6 border-t border-gray-100">
                         <div class="rounded-lg p-3 flex gap-3" style="background-color: #282828; border: 1px solid #3e3e3e;">
                            <i data-lucide="info" class="w-4 h-4 shrink-0 mt-0.5" style="color: #dddddd;"></i>
                            <div class="text-[10px] leading-relaxed" style="color: #dddddd;">
                                <strong class="block mb-0.5">How Templates Work</strong>
                                Selecting a template will update your editor settings (fonts, colors, layout). Your text content will stay safe!
                            </div>
                         </div>
                    </div>

                    <!-- Merged Library Content -->
                    <div class="mt-8 pt-6 border-t border-[#3e3e3e] space-y-6">
                       <div class="bg-[#282828] p-4 rounded-lg space-y-3" style="border: 1px solid #3e3e3e;">
                          <label class="text-[10px] font-bold text-gray-400 uppercase">Save Current State</label>
                          <div class="flex gap-2">
                            <input 
                                type="text" 
                                id="preset-name-input" 
                                placeholder="Template Name..." 
                                class="flex-1 bg-[#1e1e1e] text-[#dddddd] rounded-lg px-3 py-2 text-xs focus:border-[#d53478] focus:outline-none transition-all-200 placeholder-gray-500"
                                style="border: 1px solid #3e3e3e;"
                                aria-label="Preset name"
                                onkeypress="if(event.key === 'Enter') window.savePreset()"
                            >
                            <button 
                                onclick="window.savePreset()" 
                                class="bg-[#d53478] hover:bg-[#b334a0] text-white p-2 rounded-lg transition-colors btn-primary"
                                aria-label="Save preset"
                            >
                                <i data-lucide="save" class="w-4 h-4"></i>
                            </button>
                          </div>
                       </div>

                       <div class="grid grid-cols-2 gap-2">
                            <button 
                                onclick="window.exportPresets()" 
                                class="flex items-center justify-center gap-2 p-3 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-[#dddddd] text-xs font-bold uppercase rounded-lg transition-colors btn-primary"
                                aria-label="Export all presets"
                            >
                                <i data-lucide="folder-down" class="w-3.5 h-3.5"></i> Export All
                            </button>
                            <label class="flex items-center justify-center gap-2 p-3 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-[#dddddd] text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer btn-primary" aria-label="Import presets">
                                <i data-lucide="folder-up" class="w-3.5 h-3.5"></i> Import
                                <input type="file" hidden accept=".json" onchange="window.handleFileUpload(event, 'import')">
                            </label>
                       </div>

                       <div class="space-y-2">
                          <label style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; display:block; margin-bottom:8px;">Saved Templates</label>
                          ${_presetsHtml}
                       </div>
                    </div>
                </div>
            `;

  // Re-init icons
  setTimeout(() => window.initializeIcons(container), 0);
}

function loadSystemTemplate(id) {
  // Show loader in preview area (outside canvas)
  const previewContainer = document.getElementById("preview-container");
  const scaleWrapper = document.getElementById("scale-wrapper");
  let loader = null;

  if (previewContainer) {
    loader = document.createElement("div");
    loader.id = "template-loader";
    loader.className = "absolute inset-0 flex items-center justify-center z-50";
    // Scale up the loader using a wrapper to avoid animation conflict
    loader.innerHTML =
      '<div style="transform: scale(1.4);"><div class="loader"></div></div>';
    previewContainer.appendChild(loader);
  }

  if (scaleWrapper) {
    scaleWrapper.style.opacity = "0";
    scaleWrapper.style.transition = "opacity 0.2s ease";
  }

  setTimeout(() => {
    const template = window.SYSTEM_TEMPLATES.find((t) => t.id === id);
    if (!template) {
      // Cleanup if failed
      if (loader) loader.remove();
      if (scaleWrapper) scaleWrapper.style.opacity = "1";
      return;
    }

    // Switch the active template
    window.state.post.template = template.templateId || template.id;

    // For template1, merge style settings
    if (template.style) {
      window.state.post.style = {
        ...window.state.post.style,
        ...template.style,
      };
    }

    window.state.activeTab = "editor";
    window.renderApp();

    // Remove loader and show canvas
    if (loader) loader.remove();
    if (scaleWrapper) {
      scaleWrapper.style.opacity = "1";
    }
  }, 2000); // Wait 2 seconds
}

function renderPostDesign(container) {
  const s = window.state.post.style;
  container.innerHTML = `
                <!-- Font Family -->
                <div class="space-y-3 animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                    <div class="grid grid-cols-1 gap-2">
                        ${window.CONSTANTS.FONTS.map(
                          (font) => `
                            <button 
                                onclick="window.updatePostStyle('fontFamily', '${font}')" 
                                class="flex items-center justify-between px-4 py-3 rounded-lg border transition-all-200 ${s.fontFamily === font ? "bg-black border-black text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm"}"
                                aria-label="Select ${font} font"
                            >
                                <span style="font-family: ${font}" class="text-lg">Aa</span>
                                <span class="text-xs uppercase tracking-widest font-bold">${font}</span>
                            </button>
                        `,
                        ).join("")}
                    </div>
                    <div class="pt-2">
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Custom Font Family</label>
                        <input
                            type="text"
                            id="input-customFontFamily"
                            value="${s.customFontFamily || ""}"
                            oninput="window.updatePostStyle('customFontFamily', this.value); window.debouncedRenderCanvas()"
                            placeholder="e.g., 'Comic Sans MS', 'Times New Roman'"
                            class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-black focus:bg-white transition-all-200"
                            aria-label="Custom font family"
                        >
                        <p class="text-[8px] text-gray-400 mt-1">Enter a custom font name (will override selected font)</p>
                    </div>
                </div>

                <!-- Colors -->
                <div class="space-y-3 pt-6 border-t border-gray-100 animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Text Colors</label>
                    <div class="space-y-3">
                        <div class="space-y-2">
                            ${window.renderColorPicker("Bracket [ ] Color", s.highlightColor, "window.updatePostStyle('highlightColor', '$VAL')")}
                            ${window.renderColorPicker("Brace { } Color", s.secondaryColor, "window.updatePostStyle('secondaryColor', '$VAL')")}
                        </div>
                        <div class="flex flex-col gap-1 text-[10px] text-gray-600">
                            <label class="inline-flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    ${s.useBracketColor ? "checked" : ""} 
                                    onchange="window.updatePostStyle('useBracketColor', this.checked)" 
                                    class="square-checkbox"
                                >
                                <span>Use color for words inside [brackets]</span>
                            </label>
                            <label class="inline-flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    ${s.useBraceColor ? "checked" : ""} 
                                    onchange="window.updatePostStyle('useBraceColor', this.checked)" 
                                    class="square-checkbox"
                                >
                                <span>Use color for words inside {braces}</span>
                            </label>
                            <p class="text-[9px] text-gray-400 mt-1">
                                Turn both off for plain black text like the examples.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Typography Settings -->
                <div class="space-y-3 pt-6 border-t border-gray-100 animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-500 uppercase">Typography Settings</label>
                    <div class="space-y-4">
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size</label>
                            <input 
                                type="range" 
                                min="40" 
                                max="200" 
                                value="${s.fontSize}" 
                                oninput="window.updatePostStyleWithDisplay('fontSize', parseFloat(this.value), 'font-size-display', 'px')" 
                                class="w-full"
                                aria-label="Font size"
                            >
                            <div id="font-size-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.fontSize}px</div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Line Height</label>
                            <input 
                                type="range" 
                                min="0.5" 
                                max="1.5" 
                                step="0.01" 
                                value="${s.lineHeight}" 
                                oninput="window.updatePostStyleWithDisplay('lineHeight', parseFloat(this.value), 'line-height-display', 'number')" 
                                class="w-full"
                                aria-label="Line height"
                            >
                            <div id="line-height-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${s.lineHeight}</div>
                        </div>
                    </div>
                </div>
            `;
}

// --- TEMPLATE 2 SIDEBAR EDITOR ---
function renderTemplate2Editor(container) {
  const t2 = window.state.post.t2;
  const safeBgUrl =
    t2.bgImage && !t2.bgImage.startsWith("data:")
      ? window.escapeHtml(t2.bgImage)
      : "";
  const safeWmUrl =
    t2.watermarkUrl && !t2.watermarkUrl.startsWith("data:")
      ? window.escapeHtml(t2.watermarkUrl)
      : "";

  container.innerHTML = `
                <div class="space-y-6 animate-fade-in">

                    <!-- Headline -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="type" class="w-3 h-3"></i> Headline
                        </label>
                        <textarea
                            id="t2-headline"
                            oninput="window.updateT2State('headline', this.value)"
                            class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-black focus:bg-white transition-all-200 resize-none"
                            rows="4"
                            placeholder="Enter headline text..."
                            aria-label="Template 2 headline"
                        >${window.escapeHtml(t2.headline)}</textarea>
                    </div>

                    <!-- Font -->
                    <div class="space-y-2 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                        <div class="grid grid-cols-1 gap-2">
                            ${[
                              "DM Sans",
                              "Plus Jakarta Sans",
                              "Inter",
                              "Poppins",
                              "Montserrat",
                              "Roboto Condensed",
                            ]
                              .map(
                                (font) => `
                                <button
                                    onclick="window.updateT2State('fontFamily',  '${font}'; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="flex items-center justify-between px-4 py-3 rounded-lg border transition-all-200 ${t2.fontFamily === font ? "bg-black border-black text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm"}"
                                    aria-label="${font} font"
                                >
                                    <span style="font-family: ${font}" class="text-lg">Aa</span>
                                    <span class="text-xs uppercase tracking-widest font-bold">${font}</span>
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Custom Font Family</label>
                            <input
                                type="text"
                                id="input-t2-customFontFamily"
                                value="${t2.customFontFamily || ""}"
                                oninput="window.updateT2State('customFontFamily',  this.value; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                placeholder="e.g., 'Comic Sans MS', 'Times New Roman'"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-black focus:bg-white transition-all-200"
                                aria-label="Custom font family"
                            >
                            <p class="text-[8px] text-gray-400 mt-1">Enter a custom font name (will override selected font)</p>
                        </div>
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                            <input
                                type="range" min="28" max="120" value="${t2.fontSize}"
                                oninput="window.updateT2State('fontSize', parseFloat(this.value)); document.getElementById('t2-fs-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Font size"
                            >
                            <div id="t2-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.fontSize}px</div>
                        </div>
                        <!-- Font Weight -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Font Weight</label>
                            <div class="grid grid-cols-5 gap-1">
                                ${[
                                  ["300", "Light"],
                                  ["400", "Regular"],
                                  ["500", "Medium"],
                                  ["600", "Semi"],
                                  ["700", "Bold"],
                                ]
                                  .map(
                                    ([w, label]) => `
                                    <button
                                        onclick="window.updateT2State('fontWeight',  ${w}; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="py-2 rounded-lg border text-[9px] font-bold transition-all-200 ${String(t2.fontWeight) === w ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                        style="font-weight:${w}"
                                        aria-label="${label} weight"
                                    >${label}</button>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>
                    </div>

                    <!-- Image -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Image
                        </label>
                        <div class="flex gap-2">
                            <input
                                type="text" id="t2-bg-url"
                                class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="Image URL..."
                                oninput="window.updateT2State('bgImage', this.value)"
                                value="${safeBgUrl}"
                                aria-label="Template 2 image URL"
                            >
                            <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload image">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 't2Bg')">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                                    <input type="range" min="100" max="250" value="${t2.imageScale}"
                                        oninput="window.updateT2State('imageScale', parseFloat(this.value)); document.getElementById('t2-zoom-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Image zoom">
                                    <div id="t2-zoom-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.imageScale}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                                    <input type="range" min="0" max="100" value="${t2.imagePosX}"
                                        oninput="window.updateT2State('imagePosX', parseFloat(this.value)); document.getElementById('t2-posx-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Image X position">
                                    <div id="t2-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.imagePosX}%</div>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                                <input type="range" min="0" max="100" value="${t2.imagePosY}"
                                    oninput="window.updateT2State('imagePosY', parseFloat(this.value)); document.getElementById('t2-posy-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Image Y position">
                                <div id="t2-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.imagePosY}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Watermark -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="image" class="w-3 h-3"></i> Watermark
                            </label>
                            <div class="flex items-center gap-2">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input
                                    type="checkbox" id="t2-show-watermark"
                                    ${t2.showWatermark ? "checked" : ""}
                                    onchange="window.updateT2State('showWatermark',  this.checked; window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer"
                                    aria-label="Toggle watermark"
                                >
                            </div>
                        </div>
                        <div class="flex gap-2">
                            <input
                                type="text" id="t2-watermark-url"
                                class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="Watermark URL..."
                                oninput="window.updateT2State('watermarkUrl',  this.value; window.debouncedRenderCanvas()"
                                value="${safeWmUrl}"
                                aria-label="Watermark URL"
                            >
                            <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload watermark">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <input type="file" hidden accept="image/*" onchange="(e => { const f=e.target.files[0]; if(!f) return; e.target.value=''; const r=new FileReader(); r.onload=ev=>{window.state.post.t2.watermarkUrl=ev.target.result; window.state.post.t2.showWatermark=true; window.debouncedRenderCanvas();}; r.readAsDataURL(f); })(event)">
                            </label>
                        </div>
                        ${
                          t2.watermarkUrl
                            ? `
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size</label>
                                    <input type="range" min="40" max="400" value="${t2.watermarkSize}"
                                        oninput="window.updateT2State('watermarkSize', parseFloat(this.value)); document.getElementById('t2-wm-size-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Watermark size">
                                    <div id="t2-wm-size-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.watermarkSize}px</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Opacity</label>
                                    <input type="range" min="0" max="1" step="0.01" value="${t2.watermarkOpacity}"
                                        oninput="window.updateT2State('watermarkOpacity', parseFloat(this.value)); document.getElementById('t2-wm-opacity-display').textContent = Math.round(this.value*100) + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Watermark opacity">
                                    <div id="t2-wm-opacity-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(t2.watermarkOpacity * 100)}%</div>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Position</label>
                                <div class="grid grid-cols-3 gap-1.5 mb-3">
                                    <button onclick="window.state.post.t2.watermarkPosX=10;window.state.post.t2.watermarkPosY=10;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 10 && t2.watermarkPosY === 10 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Top Left">TL</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=50;window.state.post.t2.watermarkPosY=10;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 50 && t2.watermarkPosY === 10 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Top Center">TC</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=90;window.state.post.t2.watermarkPosY=10;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 90 && t2.watermarkPosY === 10 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Top Right">TR</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=10;window.state.post.t2.watermarkPosY=50;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 10 && t2.watermarkPosY === 50 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Center Left">CL</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=50;window.state.post.t2.watermarkPosY=50;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 50 && t2.watermarkPosY === 50 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Center">C</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=90;window.state.post.t2.watermarkPosY=50;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 90 && t2.watermarkPosY === 50 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Center Right">CR</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=10;window.state.post.t2.watermarkPosY=90;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 10 && t2.watermarkPosY === 90 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Bottom Left">BL</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=50;window.state.post.t2.watermarkPosY=90;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 50 && t2.watermarkPosY === 90 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Bottom Center">BC</button>
                                    <button onclick="window.state.post.t2.watermarkPosX=90;window.state.post.t2.watermarkPosY=90;window.debouncedRenderCanvas();window.renderSidebarContent()" class="p-2 text-[9px] font-bold uppercase rounded border transition-all-200 ${t2.watermarkPosX === 90 && t2.watermarkPosY === 90 ? "bg-black text-white border-black" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}" title="Bottom Right">BR</button>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Manual Position</label>
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">X-Pos</label>
                                        <input type="range" min="0" max="140" value="${t2.watermarkPosX}"
                                            oninput="window.updateT2State('watermarkPosX', parseFloat(this.value)); document.getElementById('t2-wm-posx-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                            class="w-full" aria-label="Watermark X position">
                                        <div id="t2-wm-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.watermarkPosX}%</div>
                                    </div>
                                    <div>
                                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Y-Pos</label>
                                        <input type="range" min="0" max="100" value="${t2.watermarkPosY}"
                                            oninput="window.updateT2State('watermarkPosY', parseFloat(this.value)); document.getElementById('t2-wm-posy-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                            class="w-full" aria-label="Watermark Y position">
                                        <div id="t2-wm-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t2.watermarkPosY}%</div>
                                    </div>
                                </div>
                            </div>
                        </div>`
                            : ""
                        }
                </div>
            `;
  setTimeout(() => window.initializeIcons(container), 0);
}

// --- TEMPLATE 3 SIDEBAR EDITOR (Wealth Split Style) ---
function renderTemplate3Editor(container) {
  const t3 = window.state.post.t3;
  const safeBgUrl =
    t3.bgImage && !t3.bgImage.startsWith("data:")
      ? window.escapeHtml(t3.bgImage)
      : "";

  container.innerHTML = `
                <div class="space-y-6 animate-fade-in">

                    <!-- Headline -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="type" class="w-3 h-3"></i> Headline
                        </label>
                        <textarea
                            id="t3-headline"
                            oninput="window.updateT3State('headline',  this.value; window.debouncedRenderCanvas()"
                            class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-black focus:bg-white transition-all-200 resize-none"
                            rows="4"
                            placeholder="Enter headline text..."
                            aria-label="Template 3 headline"
                        >${window.escapeHtml(t3.headline)}</textarea>
                    </div>

                    <!-- Text Color -->
                    <div class="space-y-2 pt-4 border-t border-gray-100">
                        ${renderColorPicker('Headline Color', t3.headlineColor, "window.updateT3State('headlineColor', '$VAL')")}
                    </div>

                    <!-- Font -->
                    <div class="space-y-2 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                        <div class="grid grid-cols-1 gap-2">
                            ${[
                              "Oswald",
                              "Anton",
                              "Bebas Neue",
                              "Archivo Black",
                              "Montserrat",
                              "Roboto Condensed",
                              "Teko",
                              "Inter",
                            ]
                              .map(
                                (font) => `
                                <button
                                    onclick="window.updateT3State('fontFamily',  '${font}'; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="flex items-center justify-between px-4 py-3 rounded-lg border transition-all-200 ${t3.fontFamily === font ? "bg-black border-black text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm"}"
                                    aria-label="${font} font"
                                >
                                    <span style="font-family: ${font}" class="text-lg">Aa</span>
                                    <span class="text-xs uppercase tracking-widest font-bold">${font}</span>
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Custom Font Family</label>
                            <input
                                type="text"
                                id="input-t3-customFontFamily"
                                value="${t3.customFontFamily || ""}"
                                oninput="window.updateT3State('customFontFamily',  this.value; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                placeholder="e.g., 'Comic Sans MS', 'Times New Roman'"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-black focus:bg-white transition-all-200"
                                aria-label="Custom font family"
                            >
                            <p class="text-[8px] text-gray-400 mt-1">Enter a custom font name (will override selected font)</p>
                        </div>
                        <!-- Font Style -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Style</label>
                            <div class="grid grid-cols-2 gap-2">
                                <button
                                    onclick="window.state.post.t3.fontStyle='normal'; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="py-2 rounded-lg border text-xs font-bold transition-all-200 ${t3.fontStyle === "normal" ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                >Normal</button>
                                <button
                                    onclick="window.state.post.t3.fontStyle='italic'; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="py-2 rounded-lg border text-xs font-bold italic transition-all-200 ${t3.fontStyle === "italic" ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                >Italic</button>
                            </div>
                        </div>
                        <!-- Font Size -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                            <input
                                type="range" min="40" max="160" value="${t3.fontSize}"
                                oninput="window.updateT3State('fontSize',  parseFloat(this.value); document.getElementById('t3-fs-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Font size"
                            >
                            <div id="t3-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.fontSize}px</div>
                        </div>
                        <!-- Font Weight -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Font Weight</label>
                            <div class="grid grid-cols-5 gap-1">
                                ${[
                                  ["300", "Light"],
                                  ["400", "Regular"],
                                  ["500", "Medium"],
                                  ["600", "Semi"],
                                  ["700", "Bold"],
                                ]
                                  .map(
                                    ([w, label]) => `
                                    <button
                                        onclick="window.updateT3State('fontWeight',  ${w}; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="py-2 rounded-lg border text-[9px] font-bold transition-all-200 ${String(t3.fontWeight) === w ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                        style="font-weight:${w}"
                                        aria-label="${label} weight"
                                    >${label}</button>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>
                        <!-- Line Height -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Line Height</label>
                            <input
                                type="range" min="0.7" max="1.5" step="0.01" value="${t3.lineHeight}"
                                oninput="window.updateT3State('lineHeight',  parseFloat(this.value); document.getElementById('t3-lh-display').textContent = parseFloat(this.value).toFixed(2); window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Line height"
                            >
                            <div id="t3-lh-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.lineHeight}</div>
                        </div>
                    </div>

                    <!-- Image -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Background Image
                        </label>
                        <div class="flex gap-2">
                            <input
                                type="text" id="t3-bg-url"
                                class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="Image URL..."
                                oninput="window.updateT3State('bgImage', this.value)"
                                value="${safeBgUrl}"
                                aria-label="Template 3 image URL"
                            >
                            <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload image">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 't3Bg')">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                                    <input type="range" min="100" max="250" value="${t3.imageScale}"
                                        oninput="window.updateT3State('imageScale',  parseFloat(this.value); document.getElementById('t3-zoom-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Image zoom">
                                    <div id="t3-zoom-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.imageScale}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                                    <input type="range" min="0" max="100" value="${t3.imagePosX}"
                                        oninput="window.updateT3State('imagePosX',  parseFloat(this.value); document.getElementById('t3-posx-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Image X position">
                                    <div id="t3-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.imagePosX}%</div>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                                <input type="range" min="0" max="100" value="${t3.imagePosY}"
                                    oninput="window.updateT3State('imagePosY',  parseFloat(this.value); document.getElementById('t3-posy-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Image Y position">
                                <div id="t3-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.imagePosY}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Layout Split -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="layout" class="w-3 h-3"></i> Image / Text Split
                        </label>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Image Height <span class="normal-case font-normal">(% of canvas)</span></label>
                            <input type="range" min="30" max="75" value="${t3.imageSplit}"
                                oninput="window.updateT3State('imageSplit',  parseFloat(this.value); document.getElementById('t3-split-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Image/text split">
                            <div id="t3-split-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.imageSplit}%</div>
                        </div>

                        <!-- Background Color with toggle -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-[9px] uppercase font-bold text-gray-400">Background Color</label>
                                <label class="flex items-center gap-1.5 cursor-pointer">
                                    <span class="text-[9px] text-gray-400">Enable</span>
                                    <input type="checkbox" ${t3.showBgColor !== false ? "checked" : ""}
                                        onchange="window.updateT3State('showBgColor',  this.checked; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle background color">
                                </label>
                            </div>
                            ${
                              t3.showBgColor !== false
                                ? renderColorPicker('Background Color', t3.bgColor, "window.updateT3State('bgColor', '$VAL')")
                                : `<p class="text-[9px] text-gray-400 pt-1">Disabled — image fills full canvas. Use Bottom Fade for darkening.</p>`
                            }
                        </div>

                        <!-- Bottom Fade -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-[9px] uppercase font-bold text-gray-400 flex items-center gap-1.5">
                                    <i data-lucide="sunset" class="w-3 h-3"></i> Bottom Fade
                                </label>
                                <label class="flex items-center gap-1.5 cursor-pointer">
                                    <span class="text-[9px] text-gray-400">Enable</span>
                                    <input type="checkbox" ${t3.showBottomFade ? "checked" : ""}
                                        onchange="window.updateT3State('showBottomFade',  this.checked; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle bottom fade">
                                </label>
                            </div>
                            ${
                              t3.showBottomFade
                                ? `
                            <div class="space-y-3">
                                <div>
                                    ${renderColorPicker('Fade Color', t3.bottomFadeColor, "window.updateT3State('bottomFadeColor', '$VAL')")}
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Fade Height</label>
                                    <input type="range" min="15" max="100" value="${t3.bottomFadeHeight}"
                                        oninput="window.updateT3State('bottomFadeHeight',  parseFloat(this.value); document.getElementById('t3-fade-h-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Fade height">
                                    <div id="t3-fade-h-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.bottomFadeHeight}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Fade Strength</label>
                                    <input type="range" min="0.1" max="1" step="0.01" value="${t3.bottomFadeOpacity}"
                                        oninput="window.updateT3State('bottomFadeOpacity',  parseFloat(this.value); document.getElementById('t3-fade-op-display').textContent = Math.round(this.value*100) + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Fade strength">
                                    <div id="t3-fade-op-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(t3.bottomFadeOpacity * 100)}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y <span class="normal-case font-normal">(shift up/down)</span></label>
                                    <input type="range" min="-200" max="200" value="${t3.bottomFadePosY || 0}"
                                        oninput="window.updateT3State('bottomFadePosY',  parseFloat(this.value); document.getElementById('t3-fade-posy-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Fade Y position">
                                    <div id="t3-fade-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.bottomFadePosY || 0}px</div>
                                </div>
                            </div>
                            `
                                : `<p class="text-[9px] text-gray-400">Fades the bottom of your image into the text section for a seamless transition.</p>`
                            }
                        </div>
                    </div>

                    <!-- Brand Divider -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="minus-square" class="w-3 h-3"></i> Brand Divider
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t3.showBrand ? "checked" : ""}
                                    onchange="window.updateT3State('showBrand',  this.checked; window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle brand divider">
                            </label>
                        </div>
                        <!-- Circle Logo Letter -->
                        <div class="bg-gray-50 rounded-lg p-3 border border-gray-100 space-y-2">
                            <div class="flex items-center justify-between">
                                <label class="text-[9px] uppercase font-bold text-gray-400">Circle Logo Letter</label>
                                <label class="flex items-center gap-1.5 cursor-pointer">
                                    <span class="text-[9px] text-gray-400">Show</span>
                                    <input type="checkbox" ${t3.showBrandLetter !== false ? "checked" : ""}
                                        onchange="window.updateT3State('showBrandLetter',  this.checked; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle circle letter">
                                </label>
                            </div>
                            ${
                              t3.showBrandLetter !== false
                                ? `
                            <div>
                                <label class="text-[9px] text-gray-400 block mb-1.5">Pick any letter for the â“” circle</label>
                                <div class="grid grid-cols-9 gap-1 mb-2">
                                    ${"abcdefghijklmnopqrstuvwxyz"
                                      .split("")
                                      .map(
                                        (l) => `
                                        <button
                                            onclick="window.state.post.t3.brandLetter='${l}'; window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                            class="h-7 rounded text-[10px] font-bold uppercase border transition-all-200 ${(t3.brandLetter || "w") === l ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"}"
                                        >${l}</button>
                                    `,
                                      )
                                      .join("")}
                                </div>
                                <div class="flex gap-2 items-center">
                                    <label class="text-[9px] text-gray-400 shrink-0">Custom:</label>
                                    <input type="text" maxlength="1"
                                        value="${window.escapeHtml(t3.brandLetter || "w")}"
                                        oninput="if(this.value.trim()) { window.state.post.t3.brandLetter=this.value.trim().charAt(0); window.debouncedRenderCanvas(); }"
                                        class="w-12 bg-white border border-gray-200 rounded-lg p-1.5 text-xs text-center font-mono focus:outline-none focus:border-black transition-all-200"
                                        placeholder="w" aria-label="Custom circle letter">
                                </div>
                            </div>
                            `
                                : `<p class="text-[9px] text-gray-400">Circle logo hidden â€” only brand name shows.</p>`
                            }
                        </div>

                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Brand Name</label>
                            <input type="text" value="${window.escapeHtml(t3.brandName)}"
                                oninput="window.updateT3State('brandName',  this.value; window.debouncedRenderCanvas()"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="e.g. ealth, CNN, Forbes..."
                                aria-label="Brand name">
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                ${renderColorPicker('Brand Color', t3.brandColor, "window.updateT3State('brandColor', '$VAL')")}
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Brand Size</label>
                                <input type="range" min="12" max="40" value="${t3.brandSize}"
                                    oninput="window.updateT3State('brandSize',  parseFloat(this.value); document.getElementById('t3-brand-size-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Brand size">
                                <div id="t3-brand-size-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t3.brandSize}px</div>
                            </div>
                        </div>
                    </div>

                </div>
            `;
  setTimeout(() => window.initializeIcons(container), 0);
}

// --- HIGHLIGHT GENERATOR UI ---
function renderHighlightEditor(container) {
  const h = window.state.highlight;
  const icons = Object.keys(window.HIGHLIGHT_ICON_MAP);

  container.innerHTML = `
                <!-- Icon Source -->
                <div class="space-y-3 animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                        <i data-lucide="grid" class="w-3 h-3"></i> Icon Source
                    </label>
                    
                    <div class="bg-[#282828] p-4 rounded-lg space-y-4" style="border: 1px solid #3e3e3e;">
                        <div class="grid grid-cols-2 gap-2">
                            <button 
                                onclick="window.updateHighlightState('iconType', 'icon')" 
                                class="rounded-lg h-[72px] text-center transition-all-200 flex flex-col items-center justify-center gap-1.5 ${h.iconType === "icon" ? "bg-[#131314] text-white shadow-md" : "bg-[#1e1e1e] text-gray-400 hover:bg-[#323232] hover:shadow-sm"}"
                                style="${h.iconType === "icon" ? "border: 1px solid #d53478;" : "border: 1px solid #3e3e3e;"}"
                                aria-label="Use icon gallery"
                            >
                                <i data-lucide="grid-3x3" class="w-4 h-4 mb-0.5"></i>
                                <span class="text-xs font-bold leading-none capitalize">Gallery</span>
                                <span class="text-[9px] opacity-70 leading-none uppercase">Lucide</span>
                            </button>
                            <label class="cursor-pointer rounded-lg h-[72px] text-center transition-all-200 flex flex-col items-center justify-center gap-1.5 ${h.iconType === "custom" ? "bg-[#131314] text-white shadow-md" : "bg-[#1e1e1e] text-gray-400 hover:bg-[#323232] hover:shadow-sm"}" style="${h.iconType === "custom" ? "border: 1px solid #d53478;" : "border: 1px solid #3e3e3e;"}" aria-label="Upload custom icon">
                                <i data-lucide="upload" class="w-4 h-4 mb-0.5"></i>
                                <span class="text-xs font-bold leading-none uppercase">Upload</span>
                                <span class="text-[9px] opacity-70 leading-none uppercase">Custom PNG</span>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 'highlightIcon')">
                            </label>
                        </div>

                        <!-- Gallery -->
                        ${
                          h.iconType === "icon"
                            ? `
                                <div class="pt-2 border-t border-[#3e3e3e]">
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Select Icon</label>
                                <div class="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1" style="max-width: 100%;">
                                    ${icons
                                      .map((icon) => {
                                        const lucideName =
                                          window.HIGHLIGHT_ICON_MAP[icon];
                                        return `
                                            <button 
                                                onclick="window.updateHighlightState('iconName', '${icon}')" 
                                                class="icon-gallery-btn p-2 rounded-lg flex items-center justify-center transition-all-200 ${h.iconName === icon ? "bg-[#d53478] text-white shadow-md scale-110" : "bg-[#1e1e1e] text-gray-400 hover:bg-[#323232] hover:shadow-sm"}"
                                                style="min-width: 36px; min-height: 36px; max-width: 36px; max-height: 36px; border: 1px solid ${h.iconName === icon ? "#d53478" : "#3e3e3e"};"
                                                aria-label="Select ${icon} icon"
                                            >
                                                <i data-lucide="${lucideName}" class="w-4 h-4 icon-lucide"></i>
                                            </button>
                                        `;
                                      })
                                      .join("")}
                                </div>
                            </div>
                        `
                            : ""
                        }
                    </div>
                </div>

                <!-- Background Image -->
                <div class="space-y-3 pt-6 border-t border-[#3e3e3e] animate-fade-in">
                    <div class="flex items-center justify-between">
                        <label class="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Highlight Background
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <span class="text-[9px] text-gray-400">Enable</span>
                            <input type="checkbox" ${h.showBgImage ? "checked" : ""}
                                onchange="window.updateHighlightState('showBgImage', this.checked)"
                                class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle background image">
                        </label>
                    </div>
                    
                    <div class="bg-[#282828] p-4 rounded-lg space-y-4 transition-opacity duration-200 ${!h.showBgImage ? 'opacity-50 pointer-events-none' : ''}" style="border: 1px solid #3e3e3e;">
                        <div class="flex gap-2">
                            <input 
                                type="text" 
                                class="flex-1 bg-[#1e1e1e] border border-[#3e3e3e] rounded-lg p-2.5 text-xs text-white transition-all-200 focus:border-[#d53478]" 
                                placeholder="Background Image URL..." 
                                oninput="window.updateHighlightBgUrl(this.value)" 
                                value="${h.bgImage && !h.bgImage.startsWith('data:') ? h.bgImage : ''}"
                                aria-label="Background image URL"
                            >
                            <label class="bg-[#1e1e1e] hover:bg-[#323232] p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload background image">
                                <i data-lucide="upload" class="w-3.5 h-3.5 text-gray-400"></i>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 'highlightBg')">
                            </label>
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5 font-sans">Zoom</label>
                                <input 
                                    type="range" 
                                    min="100" 
                                    max="300" 
                                    value="${h.imageScale}" 
                                    oninput="window.updateHighlightStateWithDisplay('imageScale', parseFloat(this.value), 'hl-zoom-display', 'percent-value')" 
                                    class="w-full"
                                    aria-label="Image zoom"
                                >
                                <div id="hl-zoom-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${h.imageScale}%</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5 font-sans">Opacity</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05" 
                                    value="${h.bgOpacity}" 
                                    oninput="window.updateHighlightStateWithDisplay('bgOpacity', parseFloat(this.value), 'hl-opacity-display', 'percent')" 
                                    class="w-full"
                                    aria-label="Image opacity"
                                >
                                <div id="hl-opacity-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(h.bgOpacity * 100)}%</div>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 pt-2">
                             <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5 font-sans">Position X</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value="${h.imagePosX}" 
                                    oninput="window.updateHighlightStateWithDisplay('imagePosX', parseFloat(this.value), 'hl-posx-display', 'percent-value')" 
                                    class="w-full"
                                    aria-label="Position X"
                                >
                                <div id="hl-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${h.imagePosX}%</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5 font-sans">Position Y</label>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value="${h.imagePosY}" 
                                    oninput="window.updateHighlightStateWithDisplay('imagePosY', parseFloat(this.value), 'hl-posy-display', 'percent-value')" 
                                    class="w-full"
                                    aria-label="Position Y"
                                >
                                <div id="hl-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${h.imagePosY}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Colors & Settings -->
                <div class="space-y-3 pt-6 border-t border-[#3e3e3e] animate-fade-in">
                    <label class="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-2">
                        <i data-lucide="palette" class="w-3 h-3"></i> Colors & Settings
                    </label>
                    
                    <div class="bg-[#282828] p-4 rounded-lg space-y-4" style="border: 1px solid #3e3e3e;">
                        <div class="space-y-3">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block font-sans">Colors</label>
                            <div class="grid grid-cols-1 gap-2">
                                ${window.renderColorPicker("Background", h.bgColor, "window.updateHighlightState('bgColor', '$VAL')")}
                                <div id="highlight-ring-color-control">
                                    ${window.renderColorPicker("Ring", h.ringColor, "window.updateHighlightState('ringColor', '$VAL')")}
                                </div>
                                <div id="highlight-icon-color-control">
                                    ${window.renderColorPicker("Icon", h.iconColor, "window.updateHighlightState('iconColor', '$VAL')")}
                                </div>
                            </div>
                        </div>

                        <div class="pt-3 border-t border-[#3e3e3e] space-y-4">
                            <div id="highlight-ring-thickness-control">
                                <div class="flex justify-between mb-1.5">
                                    <label class="text-[9px] uppercase font-bold text-gray-400">Ring Thickness</label>
                                    <span id="highlight-ring-width-display" class="text-[10px] font-mono text-gray-500">${h.ringWidth}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    id="highlight-ring-thickness-slider"
                                    min="0" 
                                    max="100" 
                                    value="${h.ringWidth}" 
                                    oninput="window.updateHighlightStateWithDisplay('ringWidth', parseInt(this.value), 'highlight-ring-width-display', 'px')" 
                                    class="w-full"
                                    aria-label="Ring thickness"
                                >
                            </div>
                            <div id="highlight-icon-size-control">
                                <div class="flex justify-between mb-1.5">
                                    <label class="text-[9px] uppercase font-bold text-gray-400">Icon Size</label>
                                    <span id="highlight-icon-size-display" class="text-[10px] font-mono text-gray-500">${h.iconSize}px</span>
                                </div>
                                <input 
                                    type="range" 
                                    id="highlight-icon-size-slider"
                                    min="100" 
                                    max="800" 
                                    value="${h.iconSize}" 
                                    oninput="window.updateHighlightStateWithDisplay('iconSize', parseInt(this.value), 'highlight-icon-size-display', 'px')" 
                                    class="w-full"
                                    aria-label="Icon size"
                                >
                            </div>
                        </div>
                    </div>
                </div>
            `;

  // Initialize icons multiple times with delays to ensure they render in the gallery
  setTimeout(() => {
    window.initializeIcons(container);
  }, 10);
  setTimeout(() => {
    window.initializeIcons(container);
  }, 50);
  setTimeout(() => {
    window.initializeIcons(container);
  }, 150);
}

function renderLibrary(container) {
  var _presetsHtml = buildPresetsHtml();
  container.innerHTML = `
                <div class="space-y-6 animate-fade-in">
                   <div class="bg-[#282828] p-4 rounded-lg space-y-3" style="border: 1px solid #3e3e3e;">
                      <label class="text-[10px] font-bold text-gray-400 uppercase">Save Current State</label>
                      <div class="flex gap-2">
                        <input 
                            type="text" 
                            id="preset-name-input" 
                            placeholder="Template Name..." 
                            class="flex-1 bg-[#1e1e1e] text-[#dddddd] rounded-lg px-3 py-2 text-xs focus:border-[#d53478] focus:outline-none transition-all-200 placeholder-gray-500"
                            style="border: 1px solid #3e3e3e;"
                            aria-label="Preset name"
                            onkeypress="if(event.key === 'Enter') window.savePreset()"
                        >
                        <button 
                            onclick="window.savePreset()" 
                            class="bg-[#d53478] hover:bg-[#b334a0] text-white p-2 rounded-lg transition-colors btn-primary"
                            aria-label="Save preset"
                        >
                            <i data-lucide="save" class="w-4 h-4"></i>
                        </button>
                      </div>
                   </div>

                   <div class="grid grid-cols-2 gap-2">
                        <button 
                            onclick="window.exportPresets()" 
                            class="flex items-center justify-center gap-2 p-3 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-[#dddddd] text-xs font-bold uppercase rounded-lg transition-colors btn-primary"
                            aria-label="Export all presets"
                        >
                            <i data-lucide="folder-down" class="w-3.5 h-3.5"></i> Export All
                        </button>
                        <label class="flex items-center justify-center gap-2 p-3 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-[#dddddd] text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer btn-primary" aria-label="Import presets">
                            <i data-lucide="folder-up" class="w-3.5 h-3.5"></i> Import
                            <input type="file" hidden accept=".json" onchange="window.handleFileUpload(event, 'import')">
                        </label>
                   </div>

                   <div class="space-y-2">
                      <label style="font-size:10px; font-weight:700; color:#9ca3af; text-transform:uppercase; display:block; margin-bottom:8px;">Saved Templates</label>
                      ${_presetsHtml}
                   </div>
                </div>
            `;
}

// --- TEMPLATE 4 SIDEBAR EDITOR (Magazine Cover: XXL-style) ---
function renderTemplate4Editor(container) {
  const t4 = window.state.post.t4;
  const safeBgUrl =
    t4.bgImage && !t4.bgImage.startsWith("data:")
      ? window.escapeHtml(t4.bgImage)
      : "";

  container.innerHTML = `
                <div class="space-y-6 animate-fade-in">

                    <!-- Headline -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="type" class="w-3 h-3"></i> Headline
                        </label>
                        <textarea
                            id="t4-headline"
                            oninput="window.updateT4State('headline', this.value)"
                            class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-black focus:bg-white transition-all-200 resize-none"
                            rows="4"
                            placeholder="Enter headline text..."
                            aria-label="Template 4 headline"
                        >${window.escapeHtml(t4.headline)}</textarea>
                    </div>

                    <!-- Headline Color -->
                    <div class="space-y-2 pt-4 border-t border-gray-100">
                        ${renderColorPicker('Headline Color', t4.headlineColor, "window.updateT4State('headlineColor', '$VAL')")}
                    </div>

                    <!-- Font -->
                    <div class="space-y-2 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                        <div class="grid grid-cols-1 gap-2">
                            ${[
                              "Archivo Black",
                              "Anton",
                              "Bebas Neue",
                              "Oswald",
                              "Montserrat",
                              "Roboto Condensed",
                              "Teko",
                              "Inter",
                            ]
                              .map(
                                (font) => `
                                <button
                                    onclick="window.updateT4State('fontFamily', '${font}'); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="flex items-center justify-between px-4 py-3 rounded-lg border transition-all-200 ${t4.fontFamily === font ? "bg-black border-black text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm"}"
                                    aria-label="${font} font"
                                >
                                    <span style="font-family: ${font}" class="text-lg">Aa</span>
                                    <span class="text-xs uppercase tracking-widest font-bold">${font}</span>
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Custom Font Family</label>
                            <input
                                type="text"
                                id="input-t4-customFontFamily"
                                value="${t4.customFontFamily || ""}"
                                oninput="window.updateT4State('customFontFamily', this.value); window.debouncedRenderCanvas()"
                                placeholder="e.g., 'Impact', 'Times New Roman'"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-black focus:bg-white transition-all-200"
                                aria-label="Custom font family"
                            >
                            <p class="text-[8px] text-gray-400 mt-1">Overrides the selected font above</p>
                        </div>
                        <!-- Font Size -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                            <input
                                type="range" min="40" max="160" value="${t4.fontSize}"
                                oninput="window.updateT4State('fontSize', parseFloat(this.value)); document.getElementById('t4-fs-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Font size"
                            >
                            <div id="t4-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.fontSize}px</div>
                        </div>
                        <!-- Font Weight -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Font Weight</label>
                            <div class="grid grid-cols-5 gap-1">
                                ${[
                                  ["400", "Regular"],
                                  ["500", "Medium"],
                                  ["600", "Semi"],
                                  ["700", "Bold"],
                                  ["900", "Black"],
                                ]
                                  .map(
                                    ([w, label]) => `
                                    <button
                                        onclick="window.updateT4State('fontWeight', ${w}); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="py-2 rounded-lg border text-[9px] font-bold transition-all-200 ${String(t4.fontWeight) === w ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                        style="font-weight:${w}"
                                        aria-label="${label} weight"
                                    >${label}</button>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>
                        <!-- Line Height -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Line Height</label>
                            <input
                                type="range" min="0.7" max="1.5" step="0.01" value="${t4.lineHeight}"
                                oninput="window.updateT4State('lineHeight', parseFloat(this.value)); document.getElementById('t4-lh-display').textContent = parseFloat(this.value).toFixed(2); window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Line height"
                            >
                            <div id="t4-lh-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.lineHeight}</div>
                        </div>
                        <!-- Letter Spacing -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Letter Spacing</label>
                            <input
                                type="range" min="-0.05" max="0.2" step="0.005" value="${t4.letterSpacing}"
                                oninput="window.updateT4State('letterSpacing', parseFloat(this.value)); document.getElementById('t4-ls-display').textContent = parseFloat(this.value).toFixed(3) + 'em'; window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Letter spacing"
                            >
                            <div id="t4-ls-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.letterSpacing}em</div>
                        </div>
                    </div>

                    <!-- Background Image -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Background Image
                        </label>
                        <div class="flex gap-2">
                            <input
                                type="text" id="t4-bg-url"
                                class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="Image URL..."
                                oninput="window.updateT4State('bgImage', this.value)"
                                value="${safeBgUrl}"
                                aria-label="Template 4 image URL"
                            >
                            <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload image">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 't4Bg')">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                                    <input type="range" min="100" max="250" value="${t4.imageScale}"
                                        oninput="window.updateT4State('imageScale', parseFloat(this.value)); document.getElementById('t4-zoom-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Image zoom">
                                    <div id="t4-zoom-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.imageScale}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                                    <input type="range" min="0" max="100" value="${t4.imagePosX}"
                                        oninput="window.updateT4State('imagePosX', parseFloat(this.value)); document.getElementById('t4-posx-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Image X position">
                                    <div id="t4-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.imagePosX}%</div>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                                <input type="range" min="0" max="100" value="${t4.imagePosY}"
                                    oninput="window.updateT4State('imagePosY', parseFloat(this.value)); document.getElementById('t4-posy-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Image Y position">
                                <div id="t4-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.imagePosY}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Overlay / Gradient -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="layers" class="w-3 h-3"></i> Overlay &amp; Gradient
                        </label>
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Overlay Opacity</label>
                                <input type="range" min="0" max="0.8" step="0.01" value="${t4.overlayOpacity}"
                                    oninput="window.updateT4State('overlayOpacity', parseFloat(this.value)); document.getElementById('t4-ov-op-display').textContent = Math.round(this.value*100) + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Overlay opacity">
                                <div id="t4-ov-op-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(t4.overlayOpacity * 100)}%</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Gradient Strength <span class="normal-case font-normal">(bottom darkness)</span></label>
                                <input type="range" min="20" max="100" value="${t4.gradientStrength}"
                                    oninput="window.updateT4State('gradientStrength', parseFloat(this.value)); document.getElementById('t4-grad-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Gradient strength">
                                <div id="t4-grad-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.gradientStrength}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Brand Badge (top-left) -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="tag" class="w-3 h-3"></i> Brand Badge (Top-Left)
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t4.showBrand ? "checked" : ""}
                                    onchange="window.updateT4State('showBrand', this.checked); window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle brand badge">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Brand Text</label>
                                <input type="text" id="t4-brand-text"
                                    value="${window.escapeHtml(t4.brandText)}"
                                    oninput="window.updateT4State('brandText', this.value)"
                                    class="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200"
                                    placeholder="e.g. XXL, CNN, TMZ..."
                                    aria-label="Brand text">
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                                <input type="range" min="18" max="72" value="${t4.brandFontSize}"
                                    oninput="window.updateT4State('brandFontSize', parseFloat(this.value)); document.getElementById('t4-brand-fs-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Brand font size">
                                <div id="t4-brand-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.brandFontSize}px</div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    ${renderColorPicker('Background', t4.brandBgColor, "window.updateT4State('brandBgColor', '$VAL')")}
                                </div>
                                <div>
                                    ${renderColorPicker('Text Color', t4.brandTextColor, "window.updateT4State('brandTextColor', '$VAL')")}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- News Badge -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="badge-check" class="w-3 h-3"></i> News Badge
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t4.showBadge ? "checked" : ""}
                                    onchange="window.updateT4State('showBadge', this.checked); window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle news badge">
                            </label>
                        </div>
                        <input type="text" id="t4-badge-text"
                            value="${window.escapeHtml(t4.badgeText)}"
                            oninput="window.updateT4State('badgeText', this.value)"
                            class="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                            placeholder="e.g. NEWS, EXCLUSIVE..."
                            aria-label="Badge text">
                    </div>

                    <!-- Swipe Text -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="chevrons-right" class="w-3 h-3"></i> Swipe Text
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t4.showSwipe ? "checked" : ""}
                                    onchange="window.updateT4State('showSwipe', this.checked); window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle swipe text">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <input type="text" id="t4-swipe-text"
                                value="${window.escapeHtml(t4.swipeText)}"
                                oninput="window.updateT4State('swipeText', this.value)"
                                class="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200"
                                placeholder="e.g. Swipe Left..."
                                aria-label="Swipe text">
                            <div>
                                ${renderColorPicker('Text Color', t4.swipeColor, "window.updateT4State('swipeColor', '$VAL')")}
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                                <input type="range" min="12" max="48" value="${t4.swipeFontSize}"
                                    oninput="window.updateT4State('swipeFontSize', parseFloat(this.value)); document.getElementById('t4-swipe-fs-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Swipe font size">
                                <div id="t4-swipe-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.swipeFontSize}px</div>
                            </div>
                        </div>
                    </div>

                    <!-- Divider -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="minus" class="w-3 h-3"></i> Divider Line
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t4.showDivider ? "checked" : ""}
                                    onchange="window.updateT4State('showDivider', this.checked); window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle divider">
                            </label>
                        </div>
                        ${t4.showDivider ? renderColorPicker('Divider Color', t4.dividerColor, "window.updateT4State('dividerColor', '$VAL')") : ''}
                    </div>

                    <!-- Dots -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="more-horizontal" class="w-3 h-3"></i> Pagination Dots
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t4.showDots ? "checked" : ""}
                                    onchange="window.updateT4State('showDots', this.checked); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle dots">
                            </label>
                        </div>
                        ${t4.showDots ? `
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Count</label>
                                <input type="range" min="1" max="8" step="1" value="${t4.dotCount}"
                                    oninput="window.updateT4State('dotCount', parseInt(this.value)); document.getElementById('t4-dot-count-display').textContent = this.value; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Dot count">
                                <div id="t4-dot-count-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.dotCount}</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Active Dot</label>
                                <input type="range" min="0" max="${t4.dotCount - 1}" step="1" value="${t4.activeDot}"
                                    oninput="window.updateT4State('activeDot', parseInt(this.value)); document.getElementById('t4-active-dot-display').textContent = parseInt(this.value)+1; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Active dot">
                                <div id="t4-active-dot-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t4.activeDot + 1}</div>
                            </div>
                            <div>
                                ${renderColorPicker('Dot Color', t4.dotColor, "window.updateT4State('dotColor', '$VAL')")}
                            </div>
                        </div>
                        ` : ''}
                    </div>

                </div>
            `;
  setTimeout(() => window.initializeIcons(container), 0);
}

// --- TEMPLATE 5 SIDEBAR EDITOR (Dual Image: two side-by-side photos) ---
function renderTemplate5Editor(container) {
  const t5 = window.state.post.t5;
  const safeLeftUrl  = t5.imageLeft  && !t5.imageLeft.startsWith("data:")  ? window.escapeHtml(t5.imageLeft)  : "";
  const safeRightUrl = t5.imageRight && !t5.imageRight.startsWith("data:") ? window.escapeHtml(t5.imageRight) : "";

  container.innerHTML = `
                <div class="space-y-6 animate-fade-in">

                    <!-- Headline -->
                    <div class="space-y-2">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="type" class="w-3 h-3"></i> Headline
                        </label>
                        <textarea
                            id="t5-headline"
                            oninput="window.updateT5State('headline', this.value)"
                            class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-black focus:bg-white transition-all-200 resize-none"
                            rows="4"
                            placeholder="Use [brackets] for highlight color..."
                            aria-label="Template 5 headline"
                        >${window.escapeHtml(t5.headline)}</textarea>
                        <p class="text-[8px] text-gray-400">Wrap words in <strong>[brackets]</strong> to apply the highlight color</p>
                    </div>

                    <!-- Colors -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="grid grid-cols-1 gap-3">
                            <div>${renderColorPicker('Base Text Color', t5.headlineColor, "window.updateT5State('headlineColor', '$VAL')")}</div>
                            <div>${renderColorPicker('[Bracket] Highlight Color', t5.highlightColor, "window.updateT5State('highlightColor', '$VAL')")}</div>
                            <div>${renderColorPicker('Background Color', t5.bgColor, "window.updateT5State('bgColor', '$VAL')")}</div>
                        </div>
                    </div>

                    <!-- Font -->
                    <div class="space-y-2 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                        <div class="grid grid-cols-1 gap-2">
                            ${[
                              "Archivo Black",
                              "Anton",
                              "Bebas Neue",
                              "Oswald",
                              "Montserrat",
                              "Roboto Condensed",
                              "Teko",
                              "Inter",
                            ]
                              .map(
                                (font) => `
                                <button
                                    onclick="window.updateT5State('fontFamily', '${font}'); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="flex items-center justify-between px-4 py-3 rounded-lg border transition-all-200 ${t5.fontFamily === font ? "bg-black border-black text-white shadow-md" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 hover:shadow-sm"}"
                                    aria-label="${font} font"
                                >
                                    <span style="font-family: ${font}" class="text-lg">Aa</span>
                                    <span class="text-xs uppercase tracking-widest font-bold">${font}</span>
                                </button>
                            `,
                              )
                              .join("")}
                        </div>
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Custom Font Family</label>
                            <input
                                type="text"
                                value="${t5.customFontFamily || ""}"
                                oninput="window.updateT5State('customFontFamily', this.value); window.debouncedRenderCanvas()"
                                placeholder="e.g., 'Impact', 'Times New Roman'"
                                class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-black focus:bg-white transition-all-200"
                                aria-label="Custom font family"
                            >
                        </div>
                        <!-- Font Size -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                            <input type="range" min="40" max="180" value="${t5.fontSize}"
                                oninput="window.updateT5State('fontSize', parseFloat(this.value)); document.getElementById('t5-fs-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Font size">
                            <div id="t5-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.fontSize}px</div>
                        </div>
                        <!-- Font Weight -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Font Weight</label>
                            <div class="grid grid-cols-5 gap-1">
                                ${[
                                  ["400", "Regular"],
                                  ["500", "Medium"],
                                  ["600", "Semi"],
                                  ["700", "Bold"],
                                  ["900", "Black"],
                                ]
                                  .map(
                                    ([w, label]) => `
                                    <button
                                        onclick="window.updateT5State('fontWeight', ${w}); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="py-2 rounded-lg border text-[9px] font-bold transition-all-200 ${String(t5.fontWeight) === w ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                        style="font-weight:${w}"
                                        aria-label="${label} weight"
                                    >${label}</button>
                                `,
                                  )
                                  .join("")}
                            </div>
                        </div>
                        <!-- Line Height -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Line Height</label>
                            <input type="range" min="0.7" max="1.5" step="0.01" value="${t5.lineHeight}"
                                oninput="window.updateT5State('lineHeight', parseFloat(this.value)); document.getElementById('t5-lh-display').textContent = parseFloat(this.value).toFixed(2); window.debouncedRenderCanvas()"
                                class="w-full" aria-label="Line height">
                            <div id="t5-lh-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.lineHeight}</div>
                        </div>
                        <!-- Text Align -->
                        <div class="pt-2">
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Text Align</label>
                            <div class="grid grid-cols-3 gap-1">
                                ${["left","center","right"].map(align => `
                                <button
                                    onclick="window.updateT5State('textAlign', '${align}'); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="py-2 rounded-lg border text-[9px] font-bold transition-all-200 ${t5.textAlign === align ? "bg-black border-black text-white" : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400"}"
                                    aria-label="${align} align"
                                >${align.charAt(0).toUpperCase() + align.slice(1)}</button>
                                `).join("")}
                            </div>
                        </div>
                    </div>

                    <!-- Left Image -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Left Image
                        </label>
                        <div class="flex gap-2">
                            <input
                                type="text" id="t5-left-url"
                                class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="Image URL..."
                                oninput="window.updateT5State('imageLeft', this.value)"
                                value="${safeLeftUrl}"
                                aria-label="Left image URL"
                            >
                            <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload left image">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 't5Left')">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                                    <input type="range" min="100" max="250" value="${t5.leftScale}"
                                        oninput="window.updateT5State('leftScale', parseFloat(this.value)); document.getElementById('t5-lz-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Left zoom">
                                    <div id="t5-lz-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.leftScale}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                                    <input type="range" min="0" max="100" value="${t5.leftPosX}"
                                        oninput="window.updateT5State('leftPosX', parseFloat(this.value)); document.getElementById('t5-lx-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Left X position">
                                    <div id="t5-lx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.leftPosX}%</div>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                                <input type="range" min="0" max="100" value="${t5.leftPosY}"
                                    oninput="window.updateT5State('leftPosY', parseFloat(this.value)); document.getElementById('t5-ly-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Left Y position">
                                <div id="t5-ly-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.leftPosY}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Image -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="image" class="w-3 h-3"></i> Right Image
                        </label>
                        <div class="flex gap-2">
                            <input
                                type="text" id="t5-right-url"
                                class="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200 focus:bg-white"
                                placeholder="Image URL..."
                                oninput="window.updateT5State('imageRight', this.value)"
                                value="${safeRightUrl}"
                                aria-label="Right image URL"
                            >
                            <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all-200 active:scale-95" aria-label="Upload right image">
                                <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                                <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event, 't5Right')">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-2">
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                                    <input type="range" min="100" max="250" value="${t5.rightScale}"
                                        oninput="window.updateT5State('rightScale', parseFloat(this.value)); document.getElementById('t5-rz-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Right zoom">
                                    <div id="t5-rz-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.rightScale}%</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                                    <input type="range" min="0" max="100" value="${t5.rightPosX}"
                                        oninput="window.updateT5State('rightPosX', parseFloat(this.value)); document.getElementById('t5-rx-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Right X position">
                                    <div id="t5-rx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.rightPosX}%</div>
                                </div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                                <input type="range" min="0" max="100" value="${t5.rightPosY}"
                                    oninput="window.updateT5State('rightPosY', parseFloat(this.value)); document.getElementById('t5-ry-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Right Y position">
                                <div id="t5-ry-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.rightPosY}%</div>
                            </div>
                        </div>
                    </div>

                    <!-- Layout -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="layout" class="w-3 h-3"></i> Layout
                        </label>
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Image Height <span class="normal-case font-normal">(% of canvas)</span></label>
                                <input type="range" min="40" max="80" value="${t5.imageSplit}"
                                    oninput="window.updateT5State('imageSplit', parseFloat(this.value)); document.getElementById('t5-split-display').textContent = this.value + '%'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Image split">
                                <div id="t5-split-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.imageSplit}%</div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Padding H</label>
                                    <input type="range" min="10" max="100" value="${t5.paddingH}"
                                        oninput="window.updateT5State('paddingH', parseFloat(this.value)); document.getElementById('t5-ph-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Horizontal padding">
                                    <div id="t5-ph-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.paddingH}px</div>
                                </div>
                                <div>
                                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Padding V</label>
                                    <input type="range" min="10" max="100" value="${t5.paddingV}"
                                        oninput="window.updateT5State('paddingV', parseFloat(this.value)); document.getElementById('t5-pv-display').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                        class="w-full" aria-label="Vertical padding">
                                    <div id="t5-pv-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.paddingV}px</div>
                                </div>
                            </div>
                            <!-- Image Separator -->
                            <div class="flex items-center justify-between">
                                <label class="text-[9px] uppercase font-bold text-gray-400">Image Separator Line</label>
                                <label class="flex items-center gap-1.5 cursor-pointer">
                                    <span class="text-[9px] text-gray-400">Show</span>
                                    <input type="checkbox" ${t5.imageSeparator ? "checked" : ""}
                                        onchange="window.updateT5State('imageSeparator', this.checked); window.debouncedRenderCanvas()"
                                        class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle separator">
                                </label>
                            </div>
                            ${t5.imageSeparator ? renderColorPicker('Separator Color', t5.separatorColor, "window.updateT5State('separatorColor', '$VAL')") : ''}
                        </div>
                    </div>

                    <!-- Brand Badge -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <div class="flex justify-between items-center">
                            <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                                <i data-lucide="tag" class="w-3 h-3"></i> Brand Circle (Top-Left)
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <span class="text-[9px] text-gray-400">Show</span>
                                <input type="checkbox" ${t5.showBrand ? "checked" : ""}
                                    onchange="window.updateT5State('showBrand', this.checked); window.debouncedRenderCanvas()"
                                    class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle brand badge">
                            </label>
                        </div>
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Brand Text</label>
                                <input type="text" id="t5-brand-text"
                                    value="${window.escapeHtml(t5.brandText)}"
                                    oninput="window.updateT5State('brandText', this.value)"
                                    class="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs transition-all-200"
                                    placeholder="e.g. CAN, ESPN, TMZ..."
                                    aria-label="Brand text">
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Circle Size</label>
                                <input type="range" min="10" max="40" value="${t5.brandFontSize}"
                                    oninput="window.updateT5State('brandFontSize', parseFloat(this.value)); document.getElementById('t5-brand-fs').textContent = this.value + 'px'; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Brand size">
                                <div id="t5-brand-fs" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.brandFontSize}px</div>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div>${renderColorPicker('BG Color', t5.brandBgColor, "window.updateT5State('brandBgColor', '$VAL')")}</div>
                                <div>${renderColorPicker('Text Color', t5.brandTextColor, "window.updateT5State('brandTextColor', '$VAL')")}</div>
                            </div>
                            <div>${renderColorPicker('Border Color', t5.brandBorderColor, "window.updateT5State('brandBorderColor', '$VAL')")}</div>
                        </div>
                    </div>

                    <!-- Arrow + Dots -->
                    <div class="space-y-3 pt-4 border-t border-gray-100">
                        <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                            <i data-lucide="more-horizontal" class="w-3 h-3"></i> Navigation (Arrow + Dots)
                        </label>
                        <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <!-- Arrow -->
                            <div class="flex items-center justify-between">
                                <label class="text-[9px] uppercase font-bold text-gray-400">Arrow</label>
                                <label class="flex items-center gap-1.5 cursor-pointer">
                                    <span class="text-[9px] text-gray-400">Show</span>
                                    <input type="checkbox" ${t5.showArrow ? "checked" : ""}
                                        onchange="window.updateT5State('showArrow', this.checked); window.debouncedRenderCanvas()"
                                        class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle arrow">
                                </label>
                            </div>
                            ${t5.showArrow ? renderColorPicker('Arrow Color', t5.arrowColor, "window.updateT5State('arrowColor', '$VAL')") : ''}
                            <!-- Dots -->
                            <div class="flex items-center justify-between pt-1">
                                <label class="text-[9px] uppercase font-bold text-gray-400">Dots</label>
                                <label class="flex items-center gap-1.5 cursor-pointer">
                                    <span class="text-[9px] text-gray-400">Show</span>
                                    <input type="checkbox" ${t5.showDots ? "checked" : ""}
                                        onchange="window.updateT5State('showDots', this.checked); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                        class="accent-black h-3.5 w-3.5 cursor-pointer" aria-label="Toggle dots">
                                </label>
                            </div>
                            ${t5.showDots ? `
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Count</label>
                                <input type="range" min="1" max="8" step="1" value="${t5.dotCount}"
                                    oninput="window.updateT5State('dotCount', parseInt(this.value)); document.getElementById('t5-dot-count').textContent = this.value; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Dot count">
                                <div id="t5-dot-count" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.dotCount}</div>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Active Dot</label>
                                <input type="range" min="0" max="${t5.dotCount - 1}" step="1" value="${t5.activeDot}"
                                    oninput="window.updateT5State('activeDot', parseInt(this.value)); document.getElementById('t5-active-dot').textContent = parseInt(this.value)+1; window.debouncedRenderCanvas()"
                                    class="w-full" aria-label="Active dot">
                                <div id="t5-active-dot" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t5.activeDot + 1}</div>
                            </div>
                            ${renderColorPicker('Dot Color', t5.dotColor, "window.updateT5State('dotColor', '$VAL')")}
                            ` : ''}
                        </div>
                    </div>

                </div>
            `;
  setTimeout(() => window.initializeIcons(container), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 6 EDITOR  (Sports / Hurdels style)
// ─────────────────────────────────────────────────────────────────────────────
function renderTemplate6Editor(container) {
    const t6 = window.state.post.t6;
    const safeBgUrl    = t6.bgImage     && !t6.bgImage.startsWith('data:')     ? window.escapeHtml(t6.bgImage)     : '';
    const safeCircleUrl = t6.circleImage && !t6.circleImage.startsWith('data:') ? window.escapeHtml(t6.circleImage) : '';

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">

            <!-- ── HEADLINE ── -->
            <div class="space-y-2">
                <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                    <i data-lucide="type" class="w-3 h-3"></i> Headline
                </label>
                <textarea
                    id="t6-headline"
                    oninput="window.updateT6State('headline', this.value); window.debouncedRenderCanvas()"
                    class="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm font-mono focus:outline-none focus:border-black focus:bg-white transition-all resize-none"
                    rows="4"
                    placeholder="Use [WORD] for highlight color…"
                >${window.escapeHtml(t6.headline)}</textarea>
                <p class="text-[9px] text-gray-400">Wrap words in <span class="font-mono font-bold">[brackets]</span> to apply the highlight colour.</p>
            </div>

            <!-- ── HEADLINE COLORS ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <label class="text-[10px] font-bold text-gray-500 uppercase">Headline Colors</label>
                <div class="grid grid-cols-2 gap-3">
                    <div>${renderColorPicker('Base Text', t6.headlineColor, "window.updateT6State('headlineColor','$VAL')")}</div>
                    <div>${renderColorPicker('[Highlight]', t6.highlightColor, "window.updateT6State('highlightColor','$VAL')")}</div>
                </div>
            </div>

            <!-- ── FONT ── -->
            <div class="space-y-2 pt-4 border-t border-gray-100">
                <label class="text-[10px] font-bold text-gray-500 uppercase">Font Family</label>
                <div class="grid grid-cols-1 gap-2">
                    ${["Archivo Black","Anton","Bebas Neue","Oswald","Montserrat","Roboto Condensed","Teko","Inter"].map(font => `
                        <button
                            onclick="window.updateT6State('fontFamily','${font}'); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                            class="flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${t6.fontFamily === font ? 'bg-black border-black text-white shadow-md' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}"
                        >
                            <span style="font-family:${font}" class="text-lg">Aa</span>
                            <span class="text-xs uppercase tracking-widest font-bold">${font}</span>
                        </button>`).join('')}
                </div>
                <div class="pt-2">
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Custom Font</label>
                    <input type="text" id="t6-custom-font"
                        value="${window.escapeHtml(t6.customFontFamily || '')}"
                        oninput="window.updateT6State('customFontFamily',this.value); window.debouncedRenderCanvas()"
                        placeholder="e.g. Impact, 'Times New Roman'"
                        class="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-black focus:bg-white transition-all">
                    <p class="text-[8px] text-gray-400 mt-1">Overrides selected font above.</p>
                </div>
                <div class="pt-2">
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                    <input type="range" min="40" max="180" value="${t6.fontSize}"
                        oninput="window.updateT6State('fontSize',parseFloat(this.value)); document.getElementById('t6-fs-display').textContent=this.value+'px'; window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-fs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.fontSize}px</div>
                </div>
                <div class="pt-2">
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-2">Font Weight</label>
                    <div class="grid grid-cols-5 gap-1">
                        ${[["300","Light"],["400","Regular"],["500","Medium"],["600","Semi"],["700","Bold"],["900","Black"]].map(([w,label]) => `
                            <button onclick="window.updateT6State('fontWeight',${w}); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                class="py-2 rounded-lg border text-[9px] font-bold transition-all ${String(t6.fontWeight)===w ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-400'}"
                                style="font-weight:${w}">${label}</button>`).join('')}
                    </div>
                </div>
                <div class="pt-2">
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Line Height</label>
                    <input type="range" min="0.7" max="1.5" step="0.01" value="${t6.lineHeight}"
                        oninput="window.updateT6State('lineHeight',parseFloat(this.value)); document.getElementById('t6-lh-display').textContent=parseFloat(this.value).toFixed(2); window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-lh-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.lineHeight}</div>
                </div>
                <div class="pt-2">
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Letter Spacing</label>
                    <input type="range" min="-0.05" max="0.1" step="0.001" value="${t6.letterSpacing}"
                        oninput="window.updateT6State('letterSpacing',parseFloat(this.value)); document.getElementById('t6-ls-display').textContent=parseFloat(this.value).toFixed(3)+'em'; window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-ls-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.letterSpacing}em</div>
                </div>
                <div class="pt-2">
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Bottom Padding (text clearance)</label>
                    <input type="range" min="60" max="220" value="${t6.paddingBottom}"
                        oninput="window.updateT6State('paddingBottom',parseFloat(this.value)); document.getElementById('t6-pb-display').textContent=this.value+'px'; window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-pb-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.paddingBottom}px</div>
                </div>
            </div>

            <!-- ── BACKGROUND IMAGE ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                    <i data-lucide="image" class="w-3 h-3"></i> Background Image
                </label>
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div class="flex gap-2">
                        <input type="text" id="t6-bg-url"
                            class="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black transition-all"
                            placeholder="Image URL…"
                            oninput="window.updateT6State('bgImage',this.value); window.debouncedRenderCanvas()"
                            value="${safeBgUrl}">
                        <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all active:scale-95" title="Upload image">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                            <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event,'t6Bg')">
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Zoom</label>
                            <input type="range" min="100" max="250" value="${t6.imageScale}"
                                oninput="window.updateT6State('imageScale',parseFloat(this.value)); document.getElementById('t6-zoom-display').textContent=this.value+'%'; window.debouncedRenderCanvas()"
                                class="w-full">
                            <div id="t6-zoom-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.imageScale}%</div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                            <input type="range" min="0" max="100" value="${t6.imagePosX}"
                                oninput="window.updateT6State('imagePosX',parseFloat(this.value)); document.getElementById('t6-posx-display').textContent=this.value+'%'; window.debouncedRenderCanvas()"
                                class="w-full">
                            <div id="t6-posx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.imagePosX}%</div>
                        </div>
                    </div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                        <input type="range" min="0" max="100" value="${t6.imagePosY}"
                            oninput="window.updateT6State('imagePosY',parseFloat(this.value)); document.getElementById('t6-posy-display').textContent=this.value+'%'; window.debouncedRenderCanvas()"
                            class="w-full">
                        <div id="t6-posy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.imagePosY}%</div>
                    </div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Opacity</label>
                        <input type="range" min="0" max="1" step="0.01" value="${t6.bgOpacity}"
                            oninput="window.updateT6State('bgOpacity',parseFloat(this.value)); document.getElementById('t6-bgop-display').textContent=Math.round(this.value*100)+'%'; window.debouncedRenderCanvas()"
                            class="w-full">
                        <div id="t6-bgop-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(t6.bgOpacity*100)}%</div>
                    </div>
                </div>
            </div>

            <!-- ── GRADIENT ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                    <i data-lucide="layers" class="w-3 h-3"></i> Cinematic Gradient
                </label>
                <p class="text-[9px] text-gray-400 -mt-1">Controls the dark fade from the bottom of the image.</p>
                <div>
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Fade Starts At</label>
                    <input type="range" min="0" max="60" value="${t6.gradientStart}"
                        oninput="window.updateT6State('gradientStart',parseFloat(this.value)); document.getElementById('t6-gs-display').textContent=this.value+'% from top'; window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-gs-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.gradientStart}% from top</div>
                </div>
                <div>
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Darkness at Bottom</label>
                    <input type="range" min="0" max="1" step="0.01" value="${t6.gradientStrength}"
                        oninput="window.updateT6State('gradientStrength',parseFloat(this.value)); document.getElementById('t6-gstr-display').textContent=Math.round(this.value*100)+'%'; window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-gstr-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(t6.gradientStrength*100)}%</div>
                </div>
                <div>
                    <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Flat Dim Overlay</label>
                    <input type="range" min="0" max="0.6" step="0.01" value="${t6.overlayOpacity}"
                        oninput="window.updateT6State('overlayOpacity',parseFloat(this.value)); document.getElementById('t6-ov-display').textContent=Math.round(this.value*100)+'%'; window.debouncedRenderCanvas()"
                        class="w-full">
                    <div id="t6-ov-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${Math.round(t6.overlayOpacity*100)}%</div>
                </div>
            </div>

            <!-- ── BRAND TEXT ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <i data-lucide="at-sign" class="w-3 h-3"></i> Brand Text
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <span class="text-[9px] text-gray-400">Show</span>
                        <input type="checkbox" ${t6.showBrand ? 'checked' : ''}
                            onchange="window.updateT6State('showBrand',this.checked); window.debouncedRenderCanvas()"
                            class="accent-black h-3.5 w-3.5 cursor-pointer">
                    </label>
                </div>
                ${t6.showBrand ? `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Text</label>
                        <input type="text" id="t6-brand-text" value="${window.escapeHtml(t6.brandText)}"
                            oninput="window.updateT6State('brandText',this.value); window.debouncedRenderCanvas()"
                            class="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black transition-all"
                            placeholder="e.g. HURDELS, ESPN, COMPLEX…">
                    </div>
                    <div>${renderColorPicker('Color', t6.brandColor, "window.updateT6State('brandColor','$VAL')")}</div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                        <input type="range" min="14" max="60" value="${t6.brandFontSize}"
                            oninput="window.updateT6State('brandFontSize',parseFloat(this.value)); document.getElementById('t6-brand-fs').textContent=this.value+'px'; window.debouncedRenderCanvas()"
                            class="w-full">
                        <div id="t6-brand-fs" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.brandFontSize}px</div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-[9px] uppercase font-bold text-gray-400">Italic</span>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" ${t6.brandItalic ? 'checked' : ''}
                                onchange="window.updateT6State('brandItalic',this.checked); window.debouncedRenderCanvas()"
                                class="accent-black h-3.5 w-3.5 cursor-pointer">
                        </label>
                    </div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Family</label>
                        <div class="grid grid-cols-1 gap-1">
                            ${["Archivo Black","Anton","Bebas Neue","Oswald","Inter"].map(font => `
                                <button onclick="window.updateT6State('brandFontFamily','${font}'); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${t6.brandFontFamily===font ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}"
                                ><span style="font-family:${font}">Aa</span><span class="font-bold">${font}</span></button>`).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- ── CIRCLE INSET ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <i data-lucide="circle" class="w-3 h-3"></i> Circle Inset Photo
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <span class="text-[9px] text-gray-400">Show</span>
                        <input type="checkbox" ${t6.showCircle ? 'checked' : ''}
                            onchange="window.updateT6State('showCircle',this.checked); window.debouncedRenderCanvas()"
                            class="accent-black h-3.5 w-3.5 cursor-pointer">
                    </label>
                </div>
                ${t6.showCircle ? `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div class="flex gap-2">
                        <input type="text" id="t6-circle-url"
                            class="flex-1 bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black transition-all"
                            placeholder="Circle image URL…"
                            oninput="window.updateT6State('circleImage',this.value); window.debouncedRenderCanvas()"
                            value="${safeCircleUrl}">
                        <label class="bg-gray-100 hover:bg-gray-200 p-2.5 rounded-lg cursor-pointer transition-all active:scale-95" title="Upload circle image">
                            <i data-lucide="upload" class="w-3.5 h-3.5"></i>
                            <input type="file" hidden accept="image/*" onchange="window.handleFileUpload(event,'t6Circle')">
                        </label>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Size</label>
                            <input type="range" min="80" max="400" value="${t6.circleSize}"
                                oninput="window.updateT6State('circleSize',parseFloat(this.value)); document.getElementById('t6-csize-display').textContent=this.value+'px'; window.debouncedRenderCanvas()"
                                class="w-full">
                            <div id="t6-csize-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.circleSize}px</div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Border W</label>
                            <input type="range" min="0" max="20" value="${t6.circleBorderWidth}"
                                oninput="window.updateT6State('circleBorderWidth',parseFloat(this.value)); document.getElementById('t6-cbw-display').textContent=this.value+'px'; window.debouncedRenderCanvas()"
                                class="w-full">
                            <div id="t6-cbw-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.circleBorderWidth}px</div>
                        </div>
                    </div>
                    <div>${renderColorPicker('Border Color', t6.circleBorderColor, "window.updateT6State('circleBorderColor','$VAL')")}</div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos X</label>
                            <input type="range" min="30" max="90" value="${t6.circlePosX}"
                                oninput="window.updateT6State('circlePosX',parseFloat(this.value)); document.getElementById('t6-cpx-display').textContent=this.value+'%'; window.debouncedRenderCanvas()"
                                class="w-full">
                            <div id="t6-cpx-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.circlePosX}%</div>
                        </div>
                        <div>
                            <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Pos Y</label>
                            <input type="range" min="5" max="55" value="${t6.circlePosY}"
                                oninput="window.updateT6State('circlePosY',parseFloat(this.value)); document.getElementById('t6-cpy-display').textContent=this.value+'%'; window.debouncedRenderCanvas()"
                                class="w-full">
                            <div id="t6-cpy-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.circlePosY}%</div>
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- ── >>> SWIPE >>> ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <i data-lucide="chevrons-right" class="w-3 h-3"></i> Swipe Indicator
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <span class="text-[9px] text-gray-400">Show</span>
                        <input type="checkbox" ${t6.showSwipe ? 'checked' : ''}
                            onchange="window.updateT6State('showSwipe',this.checked); window.debouncedRenderCanvas()"
                            class="accent-black h-3.5 w-3.5 cursor-pointer">
                    </label>
                </div>
                ${t6.showSwipe ? `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Swipe Text</label>
                        <input type="text" id="t6-swipe-text" value="${window.escapeHtml(t6.swipeText)}"
                            oninput="window.updateT6State('swipeText',this.value); window.debouncedRenderCanvas()"
                            class="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:border-black transition-all"
                            placeholder="e.g. SWIPE, NEXT, READ MORE…">
                    </div>
                    <div>${renderColorPicker('Color', t6.swipeColor, "window.updateT6State('swipeColor','$VAL')")}</div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Size</label>
                        <input type="range" min="14" max="60" value="${t6.swipeFontSize}"
                            oninput="window.updateT6State('swipeFontSize',parseFloat(this.value)); document.getElementById('t6-swipe-fs').textContent=this.value+'px'; window.debouncedRenderCanvas()"
                            class="w-full">
                        <div id="t6-swipe-fs" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.swipeFontSize}px</div>
                    </div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Font Family</label>
                        <div class="grid grid-cols-1 gap-1">
                            ${["Bebas Neue","Oswald","Anton","Rajdhani","Archivo Black","Inter"].map(font => `
                                <button onclick="window.updateT6State('swipeFontFamily','${font}'); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                                    class="flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-all ${t6.swipeFontFamily===font ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300'}"
                                ><span style="font-family:${font}">Aa</span><span class="font-bold">${font}</span></button>`).join('')}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>

            <!-- ── PAGINATION DOTS ── -->
            <div class="space-y-3 pt-4 border-t border-gray-100">
                <div class="flex justify-between items-center">
                    <label class="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2">
                        <i data-lucide="ellipsis" class="w-3 h-3"></i> Pagination Dots
                    </label>
                    <label class="flex items-center gap-2 cursor-pointer">
                        <span class="text-[9px] text-gray-400">Show</span>
                        <input type="checkbox" ${t6.showDots ? 'checked' : ''}
                            onchange="window.updateT6State('showDots',this.checked); window.debouncedRenderCanvas(); window.renderSidebarContent()"
                            class="accent-black h-3.5 w-3.5 cursor-pointer">
                    </label>
                </div>
                ${t6.showDots ? `
                <div class="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Number of Dots</label>
                        <input type="range" min="1" max="8" value="${t6.dotCount}"
                            oninput="window.updateT6State('dotCount',parseInt(this.value)); document.getElementById('t6-dotcount-display').textContent=this.value; window.debouncedRenderCanvas()"
                            class="w-full">
                        <div id="t6-dotcount-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.dotCount}</div>
                    </div>
                    <div>
                        <label class="text-[9px] uppercase font-bold text-gray-400 block mb-1.5">Active Dot</label>
                        <input type="range" min="0" max="${t6.dotCount - 1}" value="${t6.activeDot}"
                            oninput="window.updateT6State('activeDot',parseInt(this.value)); document.getElementById('t6-actdot-display').textContent=parseInt(this.value)+1; window.debouncedRenderCanvas()"
                            class="w-full">
                        <div id="t6-actdot-display" class="text-[10px] text-gray-500 mt-1 text-center font-mono">${t6.activeDot + 1}</div>
                    </div>
                    <div>${renderColorPicker('Dot Color', t6.dotColor, "window.updateT6State('dotColor','$VAL')")}</div>
                </div>
                ` : ''}
            </div>

        </div>
    `;
    setTimeout(() => window.initializeIcons(container), 0);
}

// Make globally available
if (typeof window !== "undefined") {
  window.buildPresetsHtml = buildPresetsHtml;
  window.renderColorPicker = renderColorPicker;
  window.renderPostEditor = renderPostEditor;
  window.renderPostTemplates = renderPostTemplates;
  window.renderPostDesign = renderPostDesign;
  window.renderTemplate2Editor = renderTemplate2Editor;
  window.renderTemplate3Editor = renderTemplate3Editor;
  window.renderTemplate4Editor = renderTemplate4Editor;
  window.renderTemplate5Editor = renderTemplate5Editor;
  window.renderHighlightEditor = renderHighlightEditor;
  window.renderLibrary = renderLibrary;
  window.loadSystemTemplate = loadSystemTemplate;
}