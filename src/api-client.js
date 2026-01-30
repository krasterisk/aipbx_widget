import { Logger } from './utils/logger.js';

/**
 * API Client for widget backend communication
 */
export class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.logger = new Logger('ApiClient');
    }

    async fetchConfig(publicKey) {
        try {
            const response = await fetch(`${this.baseUrl}/widget/config/${publicKey}`);

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
}
