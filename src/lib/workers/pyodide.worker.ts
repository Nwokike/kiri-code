/// <reference lib="webworker" />
// src/lib/workers/pyodide.worker.ts

// Use standard WebWorker importScripts for the CDN
importScripts('https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

let pyodide: any = null;

async function loadPyodideEnvironment() {
  if (!pyodide) {
    self.postMessage({ type: 'stdout', text: '\x1b[33mLoading Python Environment...\x1b[0m\r\n' });
    
    // @ts-ignore - loadPyodide is injected globally by the CDN script
    pyodide = await self.loadPyodide({
      stdout: (text: string) => self.postMessage({ type: 'stdout', text: text + '\r\n' }),
      stderr: (text: string) => self.postMessage({ type: 'stdout', text: '\x1b[31m' + text + '\x1b[0m\r\n' }),
    });

    self.postMessage({ type: 'stdout', text: '\x1b[32mPython Ready.\x1b[0m\r\n' });
  }
}

self.onmessage = async (event) => {
  if (event.data.action === 'run') {
    await loadPyodideEnvironment();

    const { code, files } = event.data;

    // THE BRIDGE: Write the workspace files into Pyodide's isolated FS
    // This solves the "Two-Brain Problem" by mirroring LightningFS state
    if (files) {
      for (const [filename, content] of Object.entries(files)) {
        try {
          const parts = filename.split('/');
          if (parts.length > 1) {
            let currentPath = '';
            for (const part of parts.slice(0, -1)) {
              currentPath += `/${part}`;
              try { pyodide.FS.mkdir(currentPath); } catch (e) {}
            }
          }
          pyodide.FS.writeFile(`/${filename}`, content);
        } catch (err) {
          console.error(`[PyWorker] FS Sync Error for ${filename}:`, err);
        }
      }
    }

    try {
      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined) {
        self.postMessage({ type: 'stdout', text: `\x1b[34mResult: ${result}\x1b[0m\r\n` });
      }
    } catch (error) {
      self.postMessage({ type: 'stdout', text: `\x1b[31m${error}\x1b[0m\r\n` });
    }

    self.postMessage({ type: 'done' });
  }
};
