import { Logger } from './utils/logger.js';

/**
 * API Client for widget backend communication
 */
export class ApiClient {
    constructor(baseUrl, token) {
        this.baseUrl = baseUrl;
        this.token = token;
        this.logger = new Logger('ApiClient');
    }

    async fetchConfig() {
        try {
            const response = await fetch(`${this.baseUrl}/widget/config`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('INVALID_KEY');
                }
                if (response.status === 403) {
                    throw new Error('KEY_INACTIVE');
                }
                throw new Error('NETWORK_ERROR');
            }

            const config = await response.json();
            this.logger.log('Fetched config:', config);
            return config;
        } catch (error) {
            this.logger.error('Failed to fetch config:', error);
            throw error;
        }
    }

    async sendHangup() {
        try {
            this.logger.log('Sending HTTP hangup');
            await fetch(`${this.baseUrl}/widget/hangup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                }
            });
        } catch (error) {
            this.logger.error('Failed to send HTTP hangup:', error);
        }
    }
}
