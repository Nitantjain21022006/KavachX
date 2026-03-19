import { EventEmitter } from 'events';

/**
 * Singleton log broadcaster.
 * Intercepts console.log / console.error / console.warn and emits each line
 * as a 'log' event so SSE clients can stream them in real time.
 */
class LogBroadcaster extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(50); // Allow many simultaneous SSE clients
        this._patched = false;
    }

    /**
     * Call once at server startup to patch console methods.
     * After this, every console.log/error/warn line is:
     * 1. Printed to stdout as before
     * 2. Emitted as a 'log' event for SSE clients
     */
    patch() {
        if (this._patched) return;
        this._patched = true;

        const self = this;
        const originalLog   = console.log.bind(console);
        const originalError = console.error.bind(console);
        const originalWarn  = console.warn.bind(console);

        console.log = (...args) => {
            originalLog(...args);
            self.emit('log', { level: 'info', message: args.map(String).join(' '), ts: Date.now() });
        };

        console.error = (...args) => {
            originalError(...args);
            self.emit('log', { level: 'error', message: args.map(String).join(' '), ts: Date.now() });
        };

        console.warn = (...args) => {
            originalWarn(...args);
            self.emit('log', { level: 'warn', message: args.map(String).join(' '), ts: Date.now() });
        };
    }
}

// Export a single shared instance
const logBroadcaster = new LogBroadcaster();
export default logBroadcaster;
