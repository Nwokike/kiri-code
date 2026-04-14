/// <reference lib="webworker" />
importScripts('https://cdn.jsdelivr.net/npm/@ruby/wasm-wasi@2.1.0/dist/browser.umd.js');

let ruby: any = null;

async function loadRubyEnvironment() {
  if (!ruby) {
    self.postMessage({ type: 'stdout', text: '\x1b[33mLoading Ruby Environment...\x1b[0m\r\n' });
    
    // @ts-ignore
    const { RubyVM } = self.rubyWasm;
    const response = await fetch("https://cdn.jsdelivr.net/npm/@ruby/3.3-wasm-wasi@2.1.0/dist/ruby.wasm");
    const module = await WebAssembly.compileStreaming(response);
    const { vm } = await RubyVM.getRubyVM(module);
    ruby = vm;
    
    self.postMessage({ type: 'stdout', text: '\x1b[32mRuby Ready.\x1b[0m\r\n' });
  }
}

self.onmessage = async (event) => {
  if (event.data.action === 'run') {
    await loadRubyEnvironment();

    const { code } = event.data;

    try {
      // ruby.wasm currently has limited FS write support in simple browser VMs, 
      // but we execute the script directly.
      const result = ruby.eval(code);
      self.postMessage({ type: 'stdout', text: String(result) + '\r\n' });
    } catch (error) {
      self.postMessage({ type: 'stdout', text: `\x1b[31m${error}\x1b[0m\r\n` });
    }

    self.postMessage({ type: 'done' });
  }
};
