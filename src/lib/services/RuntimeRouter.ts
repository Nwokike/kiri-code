// src/lib/services/RuntimeRouter.ts
import { getWebContainer } from './webcontainer';
import { persistenceService } from './persistence';
import { terminalEmitter } from './terminalEmitter'; // <-- 1. IMPORT THE BRIDGE

export interface RuntimeResult {
  output: string;
  error?: string;
}

type Extension = 'js' | 'ts' | 'py' | 'php' | 'rb' | 'sql';

export class RuntimeRouter {
  private static instance: RuntimeRouter;
  private workers: Partial<Record<Extension, Worker>> = {};
  private currentResolver: ((value: boolean) => void) | null = null;

  private constructor() {}

  static getInstance(): RuntimeRouter {
    if (!RuntimeRouter.instance) {
      RuntimeRouter.instance = new RuntimeRouter();
    }
    return RuntimeRouter.instance;
  }

  /**
   * Main entry point for executing code in the IDE.
   * Routes to WebContainer (Node/Shell) or specialized WASM Workers.
   */
  async executeFile(filepath: string, fileContent: string) {
    const extension = filepath.split('.').pop()?.toLowerCase() as Extension;

    // <-- 2. Notify the terminal that execution is starting
    terminalEmitter.emit(`\x1b[36m> Executing ${filepath}...\x1b[0m\r\n`);

    if (extension === 'js' || extension === 'ts') {
      return this.executeNode(filepath);
    } 
    
    if (['py', 'php', 'rb', 'sql'].includes(extension)) {
      return this.executeWasm(extension, filepath, fileContent);
    }

    const errorMsg = `Runtime for .${extension} not supported yet.`;
    terminalEmitter.emit(`\x1b[31mError: ${errorMsg}\x1b[0m\r\n`);
    throw new Error(errorMsg);
  }

  private async executeNode(filepath: string): Promise<RuntimeResult> {
    const webcontainer = await getWebContainer();
    const process = await webcontainer.spawn('node', [filepath]);
    
    let output = '';
    process.output.pipeTo(new WritableStream({
      write(data) { 
        output += data;
        // <-- 3. Pipe JS stdout directly to the Xterm UI
        terminalEmitter.emit(data);
      }
    }));

    const exitCode = await process.exit;
    return { output, error: exitCode !== 0 ? 'Process exited with non-zero code' : undefined };
  }

  private async executeWasm(ext: Extension, _filepath: string, code: string) {
    if (!this.workers[ext]) {
      const workerUrl = new URL(`../workers/${this.getWorkerName(ext)}.worker.ts`, import.meta.url);
      this.workers[ext] = new Worker(workerUrl, { type: 'module' });

      this.workers[ext]!.onmessage = (event) => {
        const { type, text } = event.data;
        
        if (type === 'stdout') {
           // <-- 4. Pipe WASM stdout directly to the Xterm UI
           terminalEmitter.emit(text); 
        } else if (type === 'done') {
           if (this.currentResolver) {
             this.currentResolver(true);
             this.currentResolver = null;
           }
        }
      };
    }

    const workspaceFiles = await this.getWorkspaceFiles(); 

    return new Promise((resolve) => {
      this.currentResolver = resolve;
      this.workers[ext]!.postMessage({ 
        action: 'run', 
        code: code,
        files: workspaceFiles 
      });
    });
  }

  private getWorkerName(ext: Extension): string {
    switch(ext) {
      case 'py': return 'pyodide';
      case 'php': return 'php';
      case 'rb': return 'ruby';
      case 'sql': return 'sqlite';
      default: return 'unknown';
    }
  }

  /**
   * Collects all current project files from LightningFS to solve the "Two-Brain Problem"
   */
  private async getWorkspaceFiles(): Promise<Record<string, string>> {
    const files: Record<string, string> = {};
    const fs = persistenceService.fs.promises;
    
    const readDirRecursive = async (path: string) => {
      const entries = await fs.readdir(path);
      for (const entry of entries) {
        const fullPath = `${path}/${entry}`;
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await readDirRecursive(fullPath);
        } else {
          try {
            const content = await fs.readFile(fullPath, 'utf8');
            const relativePath = fullPath.replace(/^\/?workdir\//, '');
            files[relativePath] = content;
          } catch (e) {
            // Likely binary file or read error
          }
        }
      }
    };

    try {
      // Adding absolute path fallback for LightningFS safety
      await readDirRecursive('/workdir');
    } catch (e) {
      try {
        await readDirRecursive('workdir');
      } catch (e2) {
        console.warn('[RuntimeRouter] FS Bridge: workdir not found, skipping sync.');
      }
    }

    return files;
  }
}

export const runtimeRouter = RuntimeRouter.getInstance();
