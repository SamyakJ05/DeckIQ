/**
 * Structured logging utility for DeckIQ
 * Replaces console.log in production paths
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, any>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

function sanitizeContext(context?: Record<string, any>): Record<string, any> | undefined {
  if (!context) return undefined;
  
  // Remove sensitive keys
  const sensitiveKeys = ['apiKey', 'api_key', 'password', 'token', 'secret'];
  const sanitized = { ...context };
  
  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

export const log = {
  info(message: string, context?: Record<string, any>): void {
    const entry = createLogEntry('info', message, sanitizeContext(context));
    console.log(JSON.stringify(entry));
  },

  warn(message: string, context?: Record<string, any>): void {
    const entry = createLogEntry('warn', message, sanitizeContext(context));
    console.warn(JSON.stringify(entry));
  },

  error(message: string, context?: Record<string, any>): void {
    const entry = createLogEntry('error', message, sanitizeContext(context));
    console.error(JSON.stringify(entry));
  },

  debug(message: string, context?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development') {
      const entry = createLogEntry('debug', message, sanitizeContext(context));
      console.debug(JSON.stringify(entry));
    }
  },
};

// Made with Bob
