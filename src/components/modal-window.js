import { EventEmitter } from '../utils/events.js';
import { AudioVisualizer } from './audio-visualizer.js';

/**
 * Modern Modal Window Component
 */
export class ModalWindow extends EventEmitter {
    constructor(config, translator) {
        super();
        this.config = config;
        this.translator = translator;
        this.modal = this.create();
        this.visualizer = null;
    }

    create() {
        const modal = document.createElement('div');
        const appearance = this.config.appearance || {};
        const position = appearance.buttonPosition || 'bottom-right';

        modal.className = `ai-widget-modal ${position}`;

        let logoContent;
        if (this.config.logoUrl) {
            logoContent = `<img src="${this.config.logoUrl}" alt="${this.config.assistantName || 'Assistant'}" />`;
        } else {
            // Use simplified logo icon for header
            logoContent = `
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" fill="url(#headerGrad)" fill-opacity="0.2"/>
                <g>
                    <circle cx="50" cy="30" r="4" fill="#0EA5E9"/>
                    <circle cx="70" cy="45" r="4" fill="#8B5CF6"/>
                    <circle cx="50" cy="65" r="4" fill="#0EA5E9"/>
                    <circle cx="30" cy="45" r="4" fill="#8B5CF6"/>
                    <line x1="50" y1="30" x2="70" y2="45" stroke="#0EA5E9" stroke-width="2"/>
                    <line x1="70" y1="45" x2="50" y2="65" stroke="#8B5CF6" stroke-width="2"/>
                    <line x1="50" y1="65" x2="30" y2="45" stroke="#0EA5E9" stroke-width="2"/>
                    <circle cx="50" cy="47.5" r="7" fill="#0EA5E9"/>
                </g>
                <defs>
                    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#06B6D4"/>
                        <stop offset="100%" stop-color="#8B5CF6"/>
                    </linearGradient>
                </defs>
            </svg>
        `;
        }

        modal.innerHTML = `
            <div class="modal-header">
                <div class="header-content">
                    <div class="header-logo">${logoContent}</div>
                    <h3>${this.config.assistantName || 'aiPBX Voice Assistant'}</h3>
                </div>
                <button class="close-btn" aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1L13 13M1 13L13 1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="visualizer-wrapper">
                    <canvas id="ai-widget-visualizer" width="320" height="140"></canvas>
                </div>
                
                <div class="status-container" id="widget-status-area">
                    <div class="status-ready" id="status-ready">
                        <p class="status-text">${this.translator.t('ready_to_talk')}</p>
                        <p class="status-subtext">${this.translator.t('click_to_begin')}</p>
                    </div>
                    
                    <div class="connecting-loader hidden" id="status-connecting">
                        <div class="loader-ring"></div>
                        <div class="loader-icon">${logoContent}</div>
                    </div>
                    
                    <div class="status-active hidden" id="status-active">
                        <p class="status-text">${this.translator.t('listening')}</p>
                        <p class="status-subtext">${this.translator.t('ai_ready')}</p>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary btn-start">
                    <span>${this.translator.t('start_conversation')}</span>
                </button>
                <button class="btn btn-danger btn-stop hidden" disabled>
                    <span>${this.translator.t('stop_call')}</span>
                </button>
            </div>
        `;

        // Event listeners
        modal.querySelector('.close-btn').addEventListener('click', () => {
            this.hide();
            this.emit('close');
        });

        modal.querySelector('.btn-start').addEventListener('click', () => {
            this.emit('start');
        });

        modal.querySelector('.btn-stop').addEventListener('click', () => {
            this.emit('stop');
        });

        return modal;
    }

    show() {
        if (!document.body.contains(this.modal)) {
            document.body.appendChild(this.modal);
        }
        setTimeout(() => this.modal.classList.add('visible'), 10);
    }

    hide() {
        this.modal.classList.remove('visible');
        setTimeout(() => {
            if (document.body.contains(this.modal)) {
                this.modal.remove();
            }
        }, 500);
    }

    updateTranslator(translator) {
        this.translator = translator;
        this.refreshText();
    }

    refreshText() {
        const readyText = this.modal.querySelector('#status-ready .status-text');
        const readySubtext = this.modal.querySelector('#status-ready .status-subtext');
        const listeningText = this.modal.querySelector('#status-active .status-text');
        const listeningSubtext = this.modal.querySelector('#status-active .status-subtext');
        const startBtnText = this.modal.querySelector('.btn-start span');
        const stopBtnText = this.modal.querySelector('.btn-danger span');

        if (readyText) readyText.textContent = this.translator.t('ready_to_talk');
        if (readySubtext) readySubtext.textContent = this.translator.t('click_to_begin');
        if (listeningText) listeningText.textContent = this.translator.t('listening');
        if (listeningSubtext) listeningSubtext.textContent = this.translator.t('ai_ready');
        if (startBtnText) startBtnText.textContent = this.translator.t('start_conversation');
        if (stopBtnText) stopBtnText.textContent = this.translator.t('stop_call');
    }

    setStatus(state, message) {
        const readyArea = this.modal.querySelector('#status-ready');
        const connectingArea = this.modal.querySelector('#status-connecting');
        const activeArea = this.modal.querySelector('#status-active');
        const startBtn = this.modal.querySelector('.btn-start');
        const stopBtn = this.modal.querySelector('.btn-stop');

        // Hide all areas first
        [readyArea, connectingArea, activeArea].forEach(el => el?.classList.add('hidden'));

        switch (state) {
            case 'connecting':
                connectingArea?.classList.remove('hidden');
                startBtn.classList.add('hidden');
                stopBtn.classList.remove('hidden');
                stopBtn.disabled = true;
                break;

            case 'connected':
                activeArea?.classList.remove('hidden');
                startBtn.classList.add('hidden');
                stopBtn.classList.remove('hidden');
                stopBtn.disabled = false;
                break;

            case 'error':
                readyArea?.classList.remove('hidden');
                const subtext = this.modal.querySelector('#status-ready .status-subtext');
                if (subtext) {
                    subtext.textContent = message || this.translator.t('error_occurred');
                    subtext.style.color = '#ef4444';
                }
                startBtn.classList.remove('hidden');
                stopBtn.classList.add('hidden');
                startBtn.disabled = false;
                break;

            case 'ready':
            default:
                readyArea?.classList.remove('hidden');
                const readySubtext = this.modal.querySelector('#status-ready .status-subtext');
                if (readySubtext) {
                    readySubtext.textContent = this.translator.t('click_to_begin');
                    readySubtext.style.color = '';
                }
                startBtn.classList.remove('hidden');
                stopBtn.classList.add('hidden');
                startBtn.disabled = false;
        }
    }

    attachVisualizer(audioStream) {
        const canvas = this.modal.querySelector('#ai-widget-visualizer');
        if (!canvas) return;

        if (this.visualizer) {
            this.visualizer.disconnect();
        }

        this.visualizer = new AudioVisualizer(canvas);
        this.visualizer.connect(audioStream);
    }

    destroyVisualizer() {
        if (this.visualizer) {
            this.visualizer.disconnect();
            this.visualizer = null;
        }
    }

    destroy() {
        this.destroyVisualizer();
        this.hide();
    }
}
