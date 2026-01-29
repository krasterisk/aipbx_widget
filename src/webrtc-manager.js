import { EventEmitter } from './utils/events.js';
import { Logger } from './utils/logger.js';

/**
 * WebRTC Connection Manager
 */
export class WebRTCManager extends EventEmitter {
    constructor(apiClient) {
        super();
        this.api = apiClient;
        this.pc = null;
        this.sessionId = null;
        this.localStream = null;
        this.logger = new Logger('WebRTC');
    }

    async startSession(publicKey, domain) {
        try {
            // 1. Request microphone access
            this.logger.log('Requesting microphone access...');
            this.localStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });

            this.emit('microphoneGranted', this.localStream);
            this.logger.log('Microphone access granted');

            // 2. Create RTCPeerConnection
            this.pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            });

            // 3. Add local audio tracks
            this.localStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.localStream);
                this.logger.debug('Added audio track:', track.label);
            });

            // 4. Handle incoming audio tracks
            this.pc.ontrack = (event) => {
                this.logger.log('Received remote audio track');
                const audioElement = new Audio();
                audioElement.srcObject = event.streams[0];
                audioElement.autoplay = true;

                this.emit('audioReceived', event.streams[0]);
            };

            // 5. Handle ICE candidates
            this.pc.onicecandidate = async (event) => {
                if (event.candidate) {
                    this.logger.debug('New ICE candidate');
                    await this.api.sendIceCandidate(this.sessionId, event.candidate);
                }
            };

            // 6. Handle connection state changes
            this.pc.onconnectionstatechange = () => {
                this.logger.log('Connection state:', this.pc.connectionState);

                if (this.pc.connectionState === 'connected') {
                    this.emit('connected');
                } else if (this.pc.connectionState === 'disconnected' ||
                    this.pc.connectionState === 'failed') {
                    this.emit('disconnected');
                }
            };

            // 7. Create SDP offer
            this.logger.log('Creating SDP offer...');
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);

            // 8. Send offer to backend
            this.emit('connecting');
            const response = await this.api.sendOffer(publicKey, domain, offer.sdp);
            this.sessionId = response.sessionId;

            // 9. Set remote description (answer from backend)
            await this.pc.setRemoteDescription({
                type: 'answer',
                sdp: response.sdpAnswer
            });

            this.logger.log('Session established:', this.sessionId);

        } catch (error) {
            this.logger.error('Failed to start session:', error);

            if (error.name === 'NotAllowedError') {
                this.emit('error', 'MICROPHONE_PERMISSION_DENIED');
            } else if (error.message === 'DOMAIN_NOT_ALLOWED') {
                this.emit('error', 'DOMAIN_NOT_ALLOWED');
            } else if (error.message === 'MAX_SESSIONS_REACHED') {
                this.emit('error', 'MAX_SESSIONS_REACHED');
            } else {
                this.emit('error', 'NETWORK_ERROR');
            }

            this.cleanup();
            throw error;
        }
    }

    async stopSession() {
        this.logger.log('Stopping session...');

        // Send hangup to backend
        if (this.sessionId) {
            await this.api.hangup(this.sessionId);
        }

        this.cleanup();
        this.emit('stopped');
    }

    cleanup() {
        // Close peer connection
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }

        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }

        this.sessionId = null;
    }
}
