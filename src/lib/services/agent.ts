import { generateText } from 'ai';
import { LLMManager } from '../modules/llm/LLMManager';
import { getWebContainer } from './webcontainer';
import { MessageParser } from './MessageParser';
import { terminalEmitter } from './terminalEmitter';
import type { Env } from '~/types/global';

export class AgentService {
  private parser = new MessageParser();

  async runLoop(prompt: string, providerName: string, modelName: string, apiKey: string) {
    const manager = LLMManager.getInstance();
    const provider = manager.getProvider(providerName);
    
    if (!provider) throw new Error(`Provider ${providerName} not found`);

    const model = provider.getModelInstance({
      model: modelName,
      serverEnv: (window as any).process?.env || {} as Env,
      apiKeys: { [providerName]: apiKey }
    });

    await getWebContainer();

    const systemPrompt = `
      You are Coder, a powerful AI coding assistant for Kiri Code.
      You operate 100% in the user's browser using WebContainers.
      
      Rules:
      1. Always wrap file changes in <boltArtifact> and <boltAction type="file" filePath="..."> tags.
      2. Always wrap shell commands in <boltAction type="shell"> tags.
      3. Use modern, best-practice code.
      4. If you need to install dependencies, use 'npm install'.
    `;

    terminalEmitter.emit('\x1b[35m[Coder Agent]\x1b[0m Thinking...\r\n');

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: prompt,
    });

    const artifacts = this.parser.parse(Date.now().toString(), text);

    for (const artifact of artifacts) {
      for (const action of artifact.actions) {
        if (action.type === 'file' && action.filePath) {
          await this.writeFile(action.filePath, action.content);
        } else if (action.type === 'shell') {
          await this.runCommand(action.content);
        }
      }
    }

    terminalEmitter.emit('\x1b[32m[Coder Agent]\x1b[0m Task Complete.\r\n');
    return text;
  }

  private async writeFile(path: string, content: string) {
    const webcontainer = await getWebContainer();
    const parts = path.split('/');
    if (parts.length > 1) {
      const dir = parts.slice(0, -1).join('/');
      await webcontainer.fs.mkdir(dir, { recursive: true });
    }
    
    // 1. Write to active RAM (WebContainer). 
    // Your persistence.ts watcher will automatically catch this and sync it!
    await webcontainer.fs.writeFile(path, content);
    
    terminalEmitter.emit(`\x1b[36m[File Created]\x1b[0m ${path}\r\n`);
    
    // 2. Dispatch an event so the FileTree UI knows to refresh the sidebar
    window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
  }

  private async runCommand(command: string) {
    const webcontainer = await getWebContainer();
    const [cmd, ...args] = command.split(' ');
    
    terminalEmitter.emit(`\x1b[33m$ ${command}\x1b[0m\r\n`);
    
    const process = await webcontainer.spawn(cmd, args);
    process.output.pipeTo(new WritableStream({
      write(data) {
        terminalEmitter.emit(data);
      }
    }));

    return process.exit;
  }
}

export const agentService = new AgentService();
