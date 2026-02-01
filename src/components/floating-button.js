import { EventEmitter } from '../utils/events.js';

/**
 * Floating action button to trigger the widget
 */
export class FloatingButton extends EventEmitter {
    constructor() {
        super();
        this.button = this.createButton();
        this.render();
    }

    createButton() {
        const btn = document.createElement('div');
        btn.id = 'aipbx-floating-button';
        btn.className = 'aipbx-widget-btn bottom-right'; // Default position

        // Combined icon: Handset + aiPBX nodes
        btn.innerHTML = `
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="white" fill-opacity="0.15"/>
                
                <!-- Handset Icon -->
                <path d="M34 26C31.8 26 30 27.8 30 30V34.5C30 52.4 44.6 67 62.5 67H67C69.2 67 71 65.2 71 63V58.5C71 56.3 69.2 54.5 67 54.5L58 54.5C55.8 54.5 54 56.3 54 58.5V60.5C45.5 58.5 38.5 51.5 36.5 43H38.5C40.7 43 42.5 41.2 42.5 39V30C42.5 27.8 40.7 26 38.5 26H34Z" 
                      fill="white" filter="url(#aipbxGlow)"/>
                
                <!-- aiPBX styled nodes around -->
                <g opacity="0.8">
                    <circle cx="20" cy="30" r="4" fill="white"/>
                    <circle cx="80" cy="70" r="4" fill="white"/>
                    <circle cx="80" cy="30" r="3" fill="white" opacity="0.6"/>
                    <circle cx="20" cy="70" r="3" fill="white" opacity="0.6"/>
                </g>

                <defs>
                    <filter id="aipbxGlow" x="0" y="0" width="100" height="100">
                        <feGaussianBlur stdDeviation="2.5" result="blur"/>
                        <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                    </filter>
                </defs>
            </svg>
        `;

        btn.addEventListener('click', () => {
            this.emit('click');
        });

        return btn;
    }

    render() {
        document.body.appendChild(this.button);
    }

    setPosition(position) {
        // Remove existing position classes
        this.button.classList.remove('bottom-right', 'bottom-left', 'top-right', 'top-left');
        // Add new position class
        this.button.classList.add(position);
    }

    hide() {
        this.button.classList.add('aipbx-widget-hidden');
    }

    show() {
        this.button.classList.remove('aipbx-widget-hidden');
    }

    destroy() {
        this.button.remove();
    }
}
