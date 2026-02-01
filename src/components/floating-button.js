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
        btn.className = 'ai-widget-btn'; // Use modern class

        // Simplified icon from aipbx_logo
        btn.innerHTML = `
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="white" fill-opacity="0.15"/>
                <g filter="url(#glow)">
                    <circle cx="50" cy="30" r="5" fill="white"/>
                    <circle cx="75" cy="45" r="5" fill="white"/>
                    <circle cx="50" cy="70" r="5" fill="white"/>
                    <circle cx="25" cy="45" r="5" fill="white"/>
                    <line x1="50" y1="30" x2="75" y2="45" stroke="white" stroke-width="3"/>
                    <line x1="75" y1="45" x2="50" y2="70" stroke="white" stroke-width="3"/>
                    <line x1="50" y1="70" x2="25" y2="45" stroke="white" stroke-width="3"/>
                    <line x1="25" y1="45" x2="50" y2="30" stroke="white" stroke-width="3"/>
                    <circle cx="50" cy="50" r="8" fill="white"/>
                </g>
                <defs>
                    <filter id="glow" x="0" y="0" width="100" height="100">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
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

    hide() {
        this.button.classList.add('hidden');
    }

    show() {
        this.button.classList.remove('hidden');
    }

    destroy() {
        this.button.remove();
    }
}
