/**
 * Lightweight Browser-Compatible Logger for Kiri Code
 */

const logLevels = {
  info: 'color: #0D7C3D; font-weight: bold;',
  warn: 'color: #C4992E; font-weight: bold;',
  error: 'color: #ef4444; font-weight: bold;',
  debug: 'color: #6366f1; font-weight: bold;',
};

export const createScopedLogger = (scope: string) => {
  return {
    info: (message: string, ...args: any[]) => {
      console.log(`%c[${scope}] %c${message}`, logLevels.info, 'color: inherit;', ...args);
    },
    warn: (message: string, ...args: any[]) => {
      console.warn(`%c[${scope}] %c${message}`, logLevels.warn, 'color: inherit;', ...args);
    },
    error: (message: string, ...args: any[]) => {
      console.error(`%c[${scope}] %c${message}`, logLevels.error, 'color: inherit;', ...args);
    },
    debug: (message: string, ...args: any[]) => {
      console.debug(`%c[${scope}] %c${message}`, logLevels.debug, 'color: inherit;', ...args);
    },
  };
};

export const logger = createScopedLogger('Global');
