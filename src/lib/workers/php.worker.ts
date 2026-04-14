/// <reference lib="webworker" />
importScripts('https://cdn.jsdelivr.net/npm/php-wasm@0.0.9/dist/php-wasm.js');

let php: any = null;

async function loadPHPEnvironment() {
  if (!php) {
    self.postMessage({ type: 'stdout', text: '\x1b[33mLoading PHP Environment...\x1b[0m\r\n' });
    
    // @ts-ignore
    const { PHP } = self.phpvms;
    php = new PHP();
    
    self.postMessage({ type: 'stdout', text: '\x1b[32mPHP Ready.\x1b[0m\r\n' });
  }
}

self.onmessage = async (event) => {
  if (event.data.action === 'run') {
    await loadPHPEnvironment();

    const { code, files } = event.data;

    if (files) {
      for (const [filename, content] of Object.entries(files)) {
        try {
          php.writeFile(filename, content);
        } catch (err) {
          console.error(`[PHPWorker] FS Sync Error for ${filename}:`, err);
        }
      }
    }

    try {
      const output = await php.run(code);
      self.postMessage({ type: 'stdout', text: output + '\r\n' });
    } catch (error) {
      self.postMessage({ type: 'stdout', text: `\x1b[31m${error}\x1b[0m\r\n` });
    }

    self.postMessage({ type: 'done' });
  }
};
