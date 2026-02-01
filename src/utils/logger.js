/**
 * Simple logger utility
 */
export class Logger {
    constructor(namespace, enabled = true) {
        this.namespace = namespace;
        // Disable general logging in production by default
        this.isProd = process.env.NODE_ENV === 'production';
        this.enabled = this.isProd ? false : enabled;
    }

    log(...args) {
        if (this.enabled) {
            console.log(`[${this.namespace}]`, ...args);
        }
    }

    error(...args) {
        // Errors should probably be visible even in production
        console.error(`[${this.namespace}]`, ...args);
    }

    warn(...args) {
        // Warnings should probably be visible even in production
        console.warn(`[${this.namespace}]`, ...args);
    }

    debug(...args) {
        if (this.enabled) {
            console.debug(`[${this.namespace}]`, ...args);
        }
    }
}
