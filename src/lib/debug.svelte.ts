import { PUBLIC_DEV_MODE } from '$env/static/public';

export const isDevMode = PUBLIC_DEV_MODE === 'true' || PUBLIC_DEV_MODE === '1';

export interface DebugLog {
	id: string;
	type: 'error' | 'warn' | 'info' | 'success';
	message: string;
	details?: any;
	timestamp: Date;
}

class DebugLogger {
	logs = $state<DebugLog[]>([]);

	addLog(type: DebugLog['type'], message: string, details?: any) {
		if (!isDevMode) return;
		
		const newLog: DebugLog = {
			id: Math.random().toString(36).substring(2, 9),
			type,
			message,
			details,
			timestamp: new Date()
		};
		
		this.logs = [newLog, ...this.logs].slice(0, 100); // Keep last 100 logs
		
		// Also output to native console
		if (type === 'error') {
			console.error(`[DEV-DEBUG] ${message}`, details || '');
		} else if (type === 'warn') {
			console.warn(`[DEV-DEBUG] ${message}`, details || '');
		} else {
			console.log(`[DEV-DEBUG] ${message}`, details || '');
		}
	}

	clear() {
		this.logs = [];
	}
}

export const debugLogger = new DebugLogger();

// Auto-catch global unhandled errors in dev mode if on browser
if (typeof window !== 'undefined' && isDevMode) {
	window.addEventListener('error', (event) => {
		debugLogger.addLog('error', `Global error: ${event.message}`, {
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			error: event.error?.stack || event.error
		});
	});

	window.addEventListener('unhandledrejection', (event) => {
		debugLogger.addLog('error', `Unhandled Promise rejection: ${event.reason?.message || event.reason}`, {
			reason: event.reason?.stack || event.reason
		});
	});
}
