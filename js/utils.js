/**
 * Utility Functions
 * Helper functions used throughout the application
 */

// --- CORS PROXY UTILITY ---
// For display, we use direct URLs (no CORS needed for img tags)
// CORS is only needed when reading pixel data for canvas operations
function getCorsProxyUrl(url) {
    // Return URL as-is for display purposes
    // img tags can load from any origin without CORS restrictions
    return url;
}

// --- PERFORMANCE OPTIMIZATION ---
let renderTimeout = null;
let resizeTimeout = null;

function debounceRender(fn, delay = 50) {
    return function(...args) {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

function debounceResize(fn, delay = 150) {
    return function(...args) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => fn.apply(this, args), delay);
    };
}

// --- UTILITY FUNCTIONS ---
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getHostname(url) {
    try { 
        return new URL(url).hostname; 
    } catch (e) { 
        return 'WEB'; 
    }
}

function showNotification(message, type = 'success') {
    // Toast notification matching panel styling
    const notification = document.createElement('div');
    notification.style.cssText = 'position: fixed; top: 20px; right: 16px; background-color: #282828; color: #dddddd; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); z-index: 9999; display: flex; align-items: center; gap: 12px; min-width: 200px; max-width: 400px; opacity: 0; transform: translateY(-10px); transition: opacity 0.3s ease, transform 0.3s ease;';
    
    // Create gradient icon
    const iconWrapper = document.createElement('div');
    iconWrapper.style.cssText = 'width: 20px; height: 20px; flex-shrink: 0; background: linear-gradient(135deg, #d53478 0%, #b334a0 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;';
    
    // Add checkmark or X icon (simple SVG)
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('width', '12');
    iconSvg.setAttribute('height', '12');
    iconSvg.setAttribute('viewBox', '0 0 12 12');
    iconSvg.style.fill = '#ffffff';
    
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (type === 'success') {
        iconPath.setAttribute('d', 'M10 3L4.5 8.5L2 6');
        iconPath.setAttribute('stroke', '#ffffff');
        iconPath.setAttribute('stroke-width', '1.5');
        iconPath.setAttribute('stroke-linecap', 'round');
        iconPath.setAttribute('stroke-linejoin', 'round');
        iconPath.setAttribute('fill', 'none');
    } else {
        iconPath.setAttribute('d', 'M3 3L9 9M9 3L3 9');
        iconPath.setAttribute('stroke', '#ffffff');
        iconPath.setAttribute('stroke-width', '1.5');
        iconPath.setAttribute('stroke-linecap', 'round');
        iconPath.setAttribute('stroke-linejoin', 'round');
        iconPath.setAttribute('fill', 'none');
    }
    iconSvg.appendChild(iconPath);
    iconWrapper.appendChild(iconSvg);
    
    // Create message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    messageText.style.cssText = 'color: #dddddd; font-size: 14px; line-height: 1.4;';
    
    notification.appendChild(iconWrapper);
    notification.appendChild(messageText);
    document.body.appendChild(notification);
    
    // Trigger fade-in animation
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

/**
 * Show confirmation popup matching welcome popup style
 * Returns a Promise that resolves to true if confirmed, false if cancelled
 */
function showConfirmPopup(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.id = 'confirm-popup-overlay';
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100vh; z-index: 9998; align-items: center; background-color: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); display: flex; font-family: "Source Sans Pro", sans-serif; justify-content: center; margin: 0; opacity: 0; visibility: hidden; transition: opacity 0.5s ease, visibility 0.5s ease;';
        
        // Create card
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cssText = 'align-items: center; background-color: #282828; border-radius: 20px; box-shadow: 0 0.4px 3.6px rgba(0, 0, 0, 0.004), 0 1px 8.5px rgba(0, 0, 0, 0.01), 0 1.9px 15.7px rgba(0, 0, 0, 0.019), 0 3.4px 28.2px rgba(0, 0, 0, 0.03), 0 6.3px 54.4px rgba(0, 0, 0, 0.047), 0 15px 137px rgba(0, 0, 0, 0.07); display: flex; flex-direction: column; position: relative; width: 353px; padding-top: 24px; border: none;';
        
        // Create text container
        const textContainer = document.createElement('div');
        textContainer.className = 'text';
        textContainer.style.cssText = 'box-sizing: border-box; padding: 0 20px 20px; width: 100%;';
        
        // Create title
        const titleEl = document.createElement('div');
        titleEl.className = 'title';
        titleEl.style.cssText = 'align-items: center; color: #ffffff; display: flex; font-size: 28px; font-weight: bold; margin-bottom: 8px; position: relative;';
        titleEl.textContent = title;
        
        // Create info message
        const infoEl = document.createElement('div');
        infoEl.className = 'info';
        infoEl.style.cssText = 'color: #dddddd; line-height: 1.4;';
        infoEl.textContent = message;
        
        textContainer.appendChild(titleEl);
        textContainer.appendChild(infoEl);
        
        // Create buttons container
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'buttons';
        buttonsContainer.style.cssText = 'display: flex; margin-top: 8px; width: 100%; box-sizing: border-box;';
        
        // Create cancel button
        const cancelBtn = document.createElement('div');
        cancelBtn.className = 'button';
        cancelBtn.style.cssText = 'align-items: center; background: #535353; color: #dddddd; border-radius: 10px; cursor: pointer; display: flex; height: 50px; justify-content: center; margin: 0 5px 28px 20px; width: 100%; font-weight: bold; transition: background 0.2s, filter 0.2s;';
        cancelBtn.textContent = cancelText;
        cancelBtn.onmouseover = () => cancelBtn.style.background = '#666666';
        cancelBtn.onmouseout = () => cancelBtn.style.background = '#535353';
        cancelBtn.onclick = () => {
            closeConfirmPopup(overlay);
            resolve(false);
        };
        
        // Create confirm button
        const confirmBtn = document.createElement('div');
        confirmBtn.className = 'button button-primary';
        confirmBtn.style.cssText = 'align-items: center; background: linear-gradient(to right, #d53478, #b334a0); color: #fcf5f9; border-radius: 10px; cursor: pointer; display: flex; height: 50px; justify-content: center; margin: 0 20px 28px 5px; width: 100%; font-weight: bold; transition: background 0.2s, filter 0.2s;';
        confirmBtn.textContent = confirmText;
        confirmBtn.onmouseover = () => confirmBtn.style.filter = 'brightness(1.1)';
        confirmBtn.onmouseout = () => confirmBtn.style.filter = 'none';
        confirmBtn.onclick = () => {
            closeConfirmPopup(overlay);
            resolve(true);
        };
        
        buttonsContainer.appendChild(cancelBtn);
        buttonsContainer.appendChild(confirmBtn);
        
        card.appendChild(textContainer);
        card.appendChild(buttonsContainer);
        overlay.appendChild(card);
        document.body.appendChild(overlay);
        
        // Show popup with animation
        setTimeout(() => {
            overlay.style.opacity = '1';
            overlay.style.visibility = 'visible';
        }, 10);
    });
}

function closeConfirmPopup(overlay) {
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 500);
    }
}

// Make globally available
if (typeof window !== 'undefined') {
    window.getCorsProxyUrl = getCorsProxyUrl;
    window.debounceRender = debounceRender;
    window.debounceResize = debounceResize;
    window.escapeHtml = escapeHtml;
    window.getHostname = getHostname;
    window.showNotification = showNotification;
    window.showConfirmPopup = showConfirmPopup;
    window.closeConfirmPopup = closeConfirmPopup;
}
