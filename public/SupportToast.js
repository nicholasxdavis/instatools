class SupportToast {
    constructor() {
        this.containerId = 'support-toast-container';
        this.init();
    }

    init() {
        if (document.getElementById(this.containerId)) return;
        if (window.matchMedia('(max-width: 899px)').matches) return;

        // Load strictly the official free GSAP 3 core. 
        // No premium plugins (like DrawSVG) are required anymore.
        this.loadScripts([
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js'
        ]).then(() => {
            this.injectStyles();
            this.injectHTML();
            this.setupEventListeners();
            this.initAnimation();
            
            // Show toast smoothly after brief delay
            setTimeout(() => this.show(), 500);
        }).catch(err => console.error('SupportToast: Failed to load GSAP', err));
    }

    loadScripts(urls) {
        return urls.reduce((promise, url) => {
            return promise.then(() => new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = url;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            }));
        }, Promise.resolve());
    }

    injectStyles() {
        const style = document.createElement('style');
        style.innerHTML = `
            #support-toast-container {
                position: fixed;
                bottom: -100px;
                right: 32px;
                z-index: 99999;
                background: #1a1a1a;
                color: #ffffff;
                border-radius: 9999px; /* Sleek pill shape */
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
                padding: 10px 20px 10px 8px;
                display: flex;
                align-items: center;
                gap: 2px;
                cursor: pointer;
                transition: bottom 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s ease, box-shadow 0.2s ease;
                border: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                user-select: none;
            }

            #support-toast-container:hover {
                transform: translateY(-4px) scale(1.02);
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.25);
            }

            #support-toast-container.show {
                bottom: 32px;
            }

            @media (max-width: 899px) {
                #support-toast-container { display: none !important; }
            }

            .support-toast-icon-wrapper {
                width: 46px;
                height: 46px;
                margin-right: -2px;
                background: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                overflow: visible;
                flex-shrink: 0;
            }

            .support-toast-icon-wrapper svg {
                width: 100%;
                height: 100%;
                visibility: hidden; 
                overflow: visible; 
            }

            .support-toast-text {
                font-size: 15px; /* Refined text size */
                font-weight: 600;
                color: #ffffff;
                letter-spacing: -0.2px;
                white-space: nowrap;
            }

            .support-toast-close {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: 6px;
                color: #a3a3a3;
                font-size: 18px; /* Refined close icon */
                line-height: 1;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                transition: all 0.2s ease;
            }

            .support-toast-close:hover {
                color: #ffffff;
                background: #2a2a2a;
            }
        `;
        document.head.appendChild(style);
    }

    injectHTML() {
        const container = document.createElement('div');
        container.id = this.containerId;

        // Tightened ViewBox removes inner dead-space, allowing text to sit closer to the actual graphic
        const svgContent = `
            <svg id="support-toast-svg" viewBox="300 200 240 240" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <circle class="particle" cx="0" cy="0" r="2" fill="#6f43bd" stroke-width="0"/> 
                 <g id="heartChat" class="heartChat">
                <g class="mainHeart" id="mainHeart" opacity="1">
                  <g>
                        <path id="liquid" d="M115.44,92H81.15a8.32,8.32,0,0,0-5.9,2.45l-9.9,9.9a1,1,0,0,1-1.34,0l-9.9-9.9A8.35,8.35,0,0,0,48.2,92H13.91A10.44,10.44,0,0,1,3.5,81.6V13.91A10.45,10.45,0,0,1,13.91,3.5H115.44a10.44,10.44,0,0,1,10.41,10.41V81.6A10.43,10.43,0,0,1,115.44,92Z" fill="#6f43bd"/>
                   </g> 
                <path class="pinkHeart" d="M76.16,23a13.23,13.23,0,0,0-10.83,5.63,13.24,13.24,0,0,0-24.08,7.62c0,18.06,24.08,34.92,24.08,34.92S89.41,54.33,89.41,36.27A13.25,13.25,0,0,0,76.16,23Z" fill="#ff595e"/>
                <g id="shineGroup">
                <path d="M89.34,37.92c-1.39,17.42-24,33.26-24,33.26s-1.8-1.26-4.42-3.46C66.39,64.18,83.07,52.53,89.34,37.92Z" fill="#7f474b" opacity="0.32"/>
                <path d="M60.15,26a14.06,14.06,0,0,0-1.72-.1c-7.33,0-13.48,5.38-15.1,12.63,0-.43-.06-.86-.06-1.3,0-6.88,5.27-12.46,11.77-12.46A11.2,11.2,0,0,1,60.15,26Z" fill="#fff" opacity="0.5"/>
                <path d="M81,26.29c-.39-.12-.79-.22-1.2-.31-5.22-1.1-10.21.87-12.18,4.51a5.62,5.62,0,0,1,.1-.7c.78-3.7,5.17-5.9,9.79-4.92A10.26,10.26,0,0,1,81,26.29Z" fill="#fff" opacity="0.5"/>
                </g>   
                   </g>  
                        <path class="outlineBg" transform="translate(1, 2)" d="M115.44,92H81.15a8.32,8.32,0,0,0-5.9,2.45l-9.9,9.9a1,1,0,0,1-1.34,0l-9.9-9.9A8.35,8.35,0,0,0,48.2,92H13.91A10.44,10.44,0,0,1,3.5,81.6V13.91A10.45,10.45,0,0,1,13.91,3.5H115.44a10.44,10.44,0,0,1,10.41,10.41V81.6A10.43,10.43,0,0,1,115.44,92Z" fill="none" stroke="#847C71" stroke-miterlimit="10" stroke-width="7" opacity="0.3"/>
                        <path class="outline" d="M115.44,92H81.15a8.32,8.32,0,0,0-5.9,2.45l-9.9,9.9a1,1,0,0,1-1.34,0l-9.9-9.9A8.35,8.35,0,0,0,48.2,92H13.91A10.44,10.44,0,0,1,3.5,81.6V13.91A10.45,10.45,0,0,1,13.91,3.5H115.44a10.44,10.44,0,0,1,10.41,10.41V81.6A10.43,10.43,0,0,1,115.44,92Z" fill="none" stroke="#f6f7f8" stroke-miterlimit="10" stroke-width="7"/>
                </g>
                 </defs>
                 <g transform="translate(180,80)" id="heartLines" class="heartLines" fill="none" stroke="#f5f7f9" stroke-linecap="round" stroke-width="17">
                        <line x1="316.5" y1="118.5" x2="371.5" y2="6.5" />
                        <line x1="386.5" y1="206.5" x2="476.5" y2="195.5" />
                        <line x1="378.5" y1="340.5" x2="452.5" y2="415.5" />
                        <line x1="241.5" y1="366.5" x2="241.5" y2="442.5" />
                        <line x1="113.5" y1="346.5" x2="29.5" y2="423.5" />
                        <line x1="97.5" y1="207.5" x2="6.5" y2="177.5" />
                        <line x1="168.5" y1="122.5" x2="101.5" y2="11.5" />
                      </g> 
                 <!-- Restored original x,y so the explosion lines attach properly -->
                 <use xlink:href="#heartChat" x="360" y="270"/>
                </svg>
        `;

        container.innerHTML = `
            <div class="support-toast-icon-wrapper">
                ${svgContent}
            </div>
            <div class="support-toast-text">Support Us!</div>
            <div class="support-toast-close" title="Dismiss">&times;</div>
        `;

        document.body.appendChild(container);
    }

    initAnimation() {
        if (!window.gsap) {
            console.error("GSAP 3 library not loaded.");
            return;
        }

        const svg = document.getElementById('support-toast-svg');
        const heartChat = svg.querySelectorAll('.heartChat');
        const heartChatAll = svg.querySelectorAll('.heartChat *');
        const heartLines = svg.querySelectorAll('.heartLines');
        const heartLinesLines = svg.querySelectorAll('#heartLines line');

        const lineLength = (target) => (target.getTotalLength ? target.getTotalLength() : 200);

        gsap.set(svg, { visibility: 'visible' });
        gsap.set(heartChat, { transformOrigin: '50% 100%' });
        gsap.set(heartLines, { transformOrigin: '50% 50%', scale: 0.56, autoAlpha: 0 });
        gsap.set(heartLinesLines, {
            strokeDasharray: (i, target) => lineLength(target),
            strokeDashoffset: (i, target) => lineLength(target),
            autoAlpha: 0
        });

        // Build the loop using official GSAP 3 syntax, slowed down by 50%
        const tl = gsap.timeline({ repeat: -1 }).timeScale(0.5);
        
        tl.fromTo(heartChat, 
            { scaleY: 0, transformOrigin: '50% 100%' }, 
            { scaleY: 1.5, transformOrigin: '50% 100%', duration: 0.3, ease: "sine.inOut" }
        )
        .from(heartChatAll, { fill: '#FFF', duration: 0.3, ease: "expo.in" }, 0)
        .from(heartChat, { y: -300, duration: 0.3, ease: "power2.in" }, 0)
        .addLabel('finish')
        .fromTo(heartChat, 
            { scaleX: 0.013 }, 
            { scaleX: 1, duration: 1, immediateRender: true, ease: "elastic.out(1, 0.5)" }, 
            'finish'
        )
        .fromTo(heartChat, 
            { scaleY: 1.5 }, 
            { scaleY: 1, duration: 1, immediateRender: false, ease: "elastic.out(0.58, 0.25)" }, 
            'finish'
        )
        .to(heartChat, { scaleY: 1.1, transformOrigin: '50% 50%', duration: 1.5, ease: "expo.in" })
        .to(heartChat, { scaleX: 1.3, transformOrigin: '50% 50%', duration: 1.5, ease: "expo.in" }, '-=1.5')
        .set(heartChat, { alpha: 0 })
        .set(heartLines, { autoAlpha: 1 })
        .set(heartLinesLines, {
            autoAlpha: 1,
            strokeDashoffset: (i, target) => lineLength(target)
        })
        .to(heartLinesLines, {
            strokeDashoffset: (i, target) => lineLength(target) * 0.2,
            duration: 0.05,
            ease: "none"
        })
        .to(heartLinesLines, {
            strokeDashoffset: (i, target) => -lineLength(target),
            autoAlpha: 0,
            duration: 0.2,
            ease: "sine.out"
        })
        .set(heartLines, { autoAlpha: 0 })
        .set(heartLinesLines, {
            autoAlpha: 0,
            strokeDashoffset: (i, target) => lineLength(target)
        });
    }

    setupEventListeners() {
        const container = document.getElementById(this.containerId);
        const closeBtn = container.querySelector('.support-toast-close');

        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            this.hide();
        });

        container.addEventListener('click', () => {
            window.open('https://buymeacoffee.com/galore', '_blank', 'noopener,noreferrer');
        });
    }

    show() {
        const container = document.getElementById(this.containerId);
        if (container) container.classList.add('show');
    }

    hide() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.classList.remove('show');
            setTimeout(() => container.remove(), 600); 
        }
    }
}

function checkSupportPopup() {
    if (window.matchMedia('(max-width: 899px)').matches) return;

    var downloadCount = parseInt(localStorage.getItem('instatoolsDownloadCount') || '0', 10);
    var lastShownCount = parseInt(localStorage.getItem('instatoolsSupportPopupLastShown') || '0', 10);

    if (downloadCount > 0 && downloadCount % 10 === 0 && downloadCount !== lastShownCount) {
        localStorage.setItem('instatoolsSupportPopupLastShown', String(downloadCount));
        if (!document.getElementById('support-toast-container')) {
            new SupportToast();
            return;
        }
        var existing = document.getElementById('support-toast-container');
        if (existing) existing.classList.add('show');
    }
}

window.checkSupportPopup = checkSupportPopup;
window.closeSupportPopup = function () {
    var existing = document.getElementById('support-toast-container');
    if (existing) {
        existing.classList.remove('show');
        setTimeout(function () {
            if (existing.parentNode) existing.remove();
        }, 600);
    }
};

// Auto-initialize
new SupportToast();