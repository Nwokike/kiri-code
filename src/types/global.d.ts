/**
 * Global Type Definitions for Kiri Code
 */

/** Cloudflare Workers Env Binding (Mock for local/client-side use) */
export interface Env {
  [key: string]: string;
}

/** Node.js Global Process (Mock for Browser) */
declare global {
  interface Window {
    process: {
      env: Record<string, string>;
    };
  }
}

/** Worker Scope Fixes */
declare global {
  function importScripts(...urls: string[]): void;
}
