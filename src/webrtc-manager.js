import { UserAgent, Inviter, SessionState } from 'sip.js';
import { EventEmitter } from './utils/events.js';
import { Logger } from './utils/logger.js';

/**
 * SIP Connection Manager (replacing legacy WebRTC manager)
 */
export class WebRTCManager extends EventEmitter {
    constructor(apiClient) {
        super();
        this.api = apiClient;
        this.userAgent = null;
        this.session = null;
        this.localStream = null;
        this.remoteAudio = new Audio();
        this.sessionTimer = null;
        this.logger = new Logger('SIP');
    }

    /**
     * Start a SIP session
     * @param {string} publicKey - The widget public key
     * @param {Object} config - The widget configuration from backend
     */
    async startSession(publicKey, config) {
        try {
            this.logger.log('Starting SIP session...');

            // SIP Configuration. 
            // Prefer assistantId or extension from backend config
            const sipDomain = config.sipDomain || 'asterisk-domain.com';
            const sipServer = config.sipServer || `wss://${sipDomain}:8089/ws`;
            const extension = config.assistantId || config.extension || '100';
            this.logger.log('Determined extension for call:', extension);
            this.logger.debug('Full configuration received:', config);

            this.logger.debug('SIP Config:', { sipDomain, sipServer, extension });

            // 1. Initialize UserAgent
            this.userAgent = new UserAgent({
                uri: UserAgent.makeURI(`sip:aipbxwidget@${sipDomain}`),
                transportOptions: {
                    server: sipServer
                },
                delegate: {
                    onConnect: () => this.logger.log('Connected to SIP server'),
                    onDisconnect: (error) => {
                        if (error) {
                            this.logger.error('Disconnected from SIP server with error:', error);
                        } else {
                            this.logger.log('Disconnected from SIP server');
                        }
                    }
                }
            });

            await this.userAgent.start();

            // 2. Create Inviter (call to extension)
            const target = UserAgent.makeURI(`sip:${extension}@${sipDomain}`);

            const extraHeaders = [
                `X-Widget-Key: ${publicKey}`
            ];

            this.logger.debug('Sending INVITE with headers:', extraHeaders);

            this.session = new Inviter(this.userAgent, target, {
                extraHeaders,
                sessionDescriptionHandlerOptions: {
                    constraints: {
                        audio: true,
                        video: false
                    }
                }
            });

            // 3. Handle session state changes
            this.session.stateChange.addListener((state) => {
                this.logger.debug('Session state changed to:', state);

                switch (state) {
                    case SessionState.Establishing:
                        this.emit('connecting');
                        break;
                    case SessionState.Established:
                        this.logger.log('SIP Call established');
                        this.setupAudio();
                        this.emit('connected');

                        // Start session duration timer if specified
                        if (config.maxSessionDuration && config.maxSessionDuration > 0) {
                            this.logger.log(`Session duration limit set to ${config.maxSessionDuration}s`);
                            this.sessionTimer = setTimeout(() => {
                                this.logger.warn('Session duration limit reached, terminating...');
                                this.stopSession();
                            }, config.maxSessionDuration * 1000);
                        }
                        break;
                    case SessionState.Terminated:
                        this.logger.log('SIP Call terminated');
                        this.emit('disconnected');
                        this.cleanup();
                        break;
                    case SessionState.Initial:
                    case SessionState.Terminating:
                    default:
                        break;
                }
            });

            // 4. Send Invite 
            await this.session.invite({
                extraHeaders
            });

            // 5. Setup local media monitoring for the visualizer
            this.setupLocalMediaMonitoring();

        } catch (error) {
            this.logger.error('Failed to start SIP session:', error);

            if (error.name === 'NotAllowedError') {
                this.emit('error', 'MICROPHONE_PERMISSION_DENIED');
            } else {
                this.emit('error', 'NETWORK_ERROR');
            }

            this.cleanup();
            throw error;
        }
    }

    /**
     * Configure remote audio playback
     */
    setupAudio() {
        const pc = this.session.sessionDescriptionHandler.peerConnection;
        const remoteStream = new MediaStream();

        pc.getReceivers().forEach(receiver => {
            if (receiver.track && receiver.track.kind === 'audio') {
                remoteStream.addTrack(receiver.track);
            }
        });

        if (remoteStream.getTracks().length > 0) {
            this.remoteAudio.srcObject = remoteStream;
            this.remoteAudio.play().catch(e => this.logger.error('Failed to play remote audio:', e));
            this.emit('audioReceived', remoteStream);
        }
    }

    /**
     * Capture local stream for visualizer
     */
    setupLocalMediaMonitoring() {
        const pc = this.session.sessionDescriptionHandler.peerConnection;

        // Wait for tracks to be available
        const checkTracks = () => {
            const localStream = new MediaStream();
            pc.getSenders().forEach(sender => {
                if (sender.track && sender.track.kind === 'audio') {
                    localStream.addTrack(sender.track);
                }
            });

            if (localStream.getTracks().length > 0) {
                this.logger.log('Local stream captured');
                this.localStream = localStream;
                this.emit('microphoneGranted', localStream);
            } else {
                // Try again in a short delay if not yet available
                setTimeout(checkTracks, 100);
            }
        };

        checkTracks();
    }

    /**
     * Hangup the call and stop the UA
     */
    async stopSession() {
        this.logger.log('Stopping SIP session...');

        const session = this.session;
        const ua = this.userAgent;

        // Clear references immediately to prevent race conditions
        this.cleanup();

        try {
            const tasks = [];
            if (session) {
                this.logger.debug('Disposing SIP session (BYE/CANCEL)');
                // In SIP.js 0.21+, .dispose() is the standard way to terminate
                tasks.push(Promise.resolve(session.dispose()));
            }
            if (ua) {
                this.logger.debug('Stopping SIP UserAgent');
                tasks.push(ua.stop().catch(e => this.logger.error('UA stop failed:', e)));
            }

            if (tasks.length > 0) {
                // Safety timeout: don't wait more than 2 seconds for SIP to close
                const timeout = new Promise(resolve => setTimeout(resolve, 2000));
                await Promise.race([
                    Promise.allSettled(tasks),
                    timeout
                ]);
                this.logger.debug('Stop tasks settled or timed out');
            }
        } catch (error) {
            this.logger.error('Error during stop sequences:', error);
        }

        this.emit('stopped');
    }

    cleanup() {
        if (this.remoteAudio) {
            this.remoteAudio.pause();
            this.remoteAudio.srcObject = null;
        }

        if (this.localStream) {
            this.logger.log('Stopping local audio tracks');
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        if (this.sessionTimer) {
            clearTimeout(this.sessionTimer);
            this.sessionTimer = null;
        }

        this.session = null;
        this.userAgent = null;
    }
}
