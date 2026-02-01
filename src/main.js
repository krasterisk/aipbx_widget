import './styles.css';
import { ApiClient } from './api-client.js';
import { WebRTCManager } from './webrtc-manager.js';
import { FloatingButton } from './components/floating-button.js';
import { ModalWindow } from './components/modal-window.js';
import { Logger } from './utils/logger.js';

/**
 * Main AI Voice Widget Class
 * Version: 1.0.x
 */
class AIVoiceWidget {
    constructor(publicKey, apiUrl) {
        this.publicKey = publicKey;
        this.apiUrl = apiUrl;
        this.config = null;
        this.logger = new Logger('aiPBX widget');

        // Components
        this.api = new ApiClient(apiUrl);
        this.webrtc = new WebRTCManager(this.api);
        this.floatingButton = new FloatingButton();
        this.modal = null;

        // State
        this.isSessionActive = false;
        this.isStopping = false;
    }

    async init() {
        try {
            if (process.env.NODE_ENV !== 'production') {
                console.log('%c[aiPBX Widget] Version: 1.1.5', 'color: #667eea; font-weight: bold; font-size: 12px;');
                this.logger.log('Initializing widget with key:', this.publicKey);
            }

            // Fetch configuration
            this.config = await this.api.fetchConfig(this.publicKey);

            if (process.env.NODE_ENV !== 'production') {
                this.logger.log('Configuration loaded:', this.config);
            }
            // Create UI
            this.modal = new ModalWindow(this.config);
            this.setupEventListeners();

            // Show floating button
            this.floatingButton.show();

            // Export global API
            this.exposePublicAPI();

            this.logger.log('Widget initialized successfully');
        } catch (error) {
            this.logger.error('Failed to initialize widget:', error);

            let message = 'Failed to initialize aiPBX widget. Please check your configuration.';
            if (error.message === 'INVALID_KEY') message = 'Invalid widget key. Please check your public key.';
            if (error.message === 'KEY_INACTIVE') message = 'This widget is inactive. Please contact support.';
            if (error.message === 'NETWORK_ERROR') message = 'Network error. Please check your internet connection.';

            this.showError(message);
        }
    }

    setupEventListeners() {
        // Floating button
        this.floatingButton.on('click', () => {
            if (!this.isSessionActive) {
                this.modal.show();
                this.floatingButton.hide(); // Скрыть кнопку при открытии модалки
            }
        });

        // Modal
        this.modal.on('close', () => {
            this.floatingButton.show(); // Показать кнопку при закрытии
            // Always try to stop if there was an attempt to start
            this.stopSession();
        });

        this.modal.on('start', () => {
            this.startSession();
        });

        this.modal.on('stop', () => {
            this.stopSession();
        });

        // WebRTC events
        this.webrtc.on('connecting', () => {
            this.modal.setStatus('connecting', 'Connecting...');
        });

        this.webrtc.on('microphoneGranted', (stream) => {
            this.logger.log('Microphone granted, attaching visualizer');
            this.modal.attachVisualizer(stream);
        });

        this.webrtc.on('connected', () => {
            this.logger.log('Successfully connected');
            this.modal.setStatus('connected', 'Connected! Start talking...');
            this.isSessionActive = true;
        });

        this.webrtc.on('audioReceived', (stream) => {
            this.logger.log('Receiving audio from AI');
        });

        this.webrtc.on('disconnected', () => {
            this.logger.log('Disconnected');
            this.stopSession();
        });

        this.webrtc.on('stopped', () => {
            this.modal.setStatus('ready', 'Ready to talk...');
            this.modal.destroyVisualizer();
            this.isSessionActive = false;
        });

        this.webrtc.on('error', (errorType) => {
            this.handleError(errorType);
        });
    }

    async startSession() {
        try {
            await this.webrtc.startSession(this.publicKey, this.config);
        } catch (error) {
            this.logger.error('Failed to start session:', error);
        }
    }

    async stopSession() {
        this.logger.log('Stop requested. Params:', { isStopping: this.isStopping, isActive: this.isSessionActive });

        if (this.isStopping) return;
        this.isStopping = true;

        try {
            this.logger.log('Executing parallel hangup tasks...');
            const stopTasks = [
                this.webrtc.stopSession().then(() => this.logger.log('SIP stop done')),
                this.api.sendHangup(this.publicKey).then(() => this.logger.log('HTTP wait finished'))
            ];

            await Promise.allSettled(stopTasks);
            this.logger.log('All stop tasks completed');
        } catch (error) {
            this.logger.error('Error during stopSession:', error);
        } finally {
            this.isSessionActive = false;
            this.isStopping = false;
            this.logger.log('Session state reset');
        }
    }

    handleError(errorType) {
        let message;

        switch (errorType) {
            case 'MICROPHONE_PERMISSION_DENIED':
                message = 'Please allow microphone access to use voice chat';
                break;
            case 'NETWORK_ERROR':
                message = 'Connection failed. Please check your internet';
                break;
            case 'INVALID_KEY':
                message = 'Widget configuration error. Please contact support';
                break;
            case 'MAX_SESSIONS_REACHED':
                message = 'Service is busy. Please try again in a few minutes';
                break;
            case 'DOMAIN_NOT_ALLOWED':
                message = 'This widget is not authorized for this domain';
                break;
            default:
                message = 'An error occurred. Please try again';
        }

        this.modal.setStatus('error', message);
        this.showError(message);
        this.isSessionActive = false;
    }

    showError(message) {
        const toast = document.createElement('div');
        toast.className = 'ai-widget-toast error';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('visible'), 10);
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    exposePublicAPI() {
        window.AIWidget = {
            version: '1.1.5',
            show: () => this.modal.show(),
            hide: () => this.modal.hide(),
            start: () => this.startSession(),
            stop: () => this.stopSession(),
            isActive: () => this.isSessionActive
        };
    }

    destroy() {
        this.floatingButton.destroy();
        if (this.modal) {
            this.modal.destroy();
        }
        if (this.isSessionActive) {
            this.stopSession();
        }
    }
}

// Auto-initialization
(function () {
    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error('[aiPBX widget] Could not find script tag');
        return;
    }

    const publicKey = scriptTag.getAttribute('data-key');
    const apiUrl = scriptTag.getAttribute('data-api') || 'http://localhost:3000';

    if (!publicKey) {
        console.error('[aiPBX widget] Missing data-key attribute');
        return;
    }

    const initWidget = () => {
        if (window.__aiPBXWidgetInstance) return;
        const widget = new AIVoiceWidget(publicKey, apiUrl);
        widget.init();
        window.__aiPBXWidgetInstance = widget;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
