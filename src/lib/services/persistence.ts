import FS from '@isomorphic-git/lightning-fs';
import { getWebContainer } from './webcontainer';
import { gitService } from './git';

export class PersistenceService {
  private static instance: PersistenceService;
  public fs: any;
  private syncTimer: any = null;
  private gitTimer: any = null;
  
  private readonly SYNC_DELAY = 1000; // 1s debounce for hard drive
  private readonly GIT_DELAY = 10000; // 10s debounce for git commits

  private constructor() {
    this.fs = new FS('code-kiri-workspace');
  }

  static getInstance(): PersistenceService {
    if (!PersistenceService.instance) {
      PersistenceService.instance = new PersistenceService();
    }
    return PersistenceService.instance;
  }

  async startAutoSync(webcontainer: any, workDir: string) {
    webcontainer.fs.watch(workDir, { recursive: true }, (_event: any, filename: string) => {
      if (typeof filename === 'string') {
        this.queueSync(workDir, filename);
      }
    });

    console.log(`[Persistence] Auto-sync started for ${workDir}`);
  }

  private queueSync(workDir: string, filename: string) {
    if (this.syncTimer) clearTimeout(this.syncTimer);

    this.syncTimer = setTimeout(async () => {
      try {
        await this.syncFile(workDir, filename);
      } catch (err) {
        console.error(`[Persistence] Sync failed for ${filename}:`, err);
      }
    }, this.SYNC_DELAY);
  }

  private async syncFile(workDir: string, filename: string) {
    const webcontainer = await getWebContainer();
    const filePath = `${workDir}/${filename}`;
    
    // 1. Read from Memory
    const content = await webcontainer.fs.readFile(filePath);

    // 2. Write to LightningFS
    const fsPromised = this.fs.promises;
    const parts = filename.split('/');
    if (parts.length > 1) {
      let currentPath = workDir;
      for (const part of parts.slice(0, -1)) {
        currentPath += `/${part}`;
        try { await fsPromised.mkdir(currentPath); } catch (e) {}
      }
    }

    await fsPromised.writeFile(filePath, content);
    console.log(`[Persistence] Synced: ${filename}`);

    // 3. Trigger Git Autonomy Loop
    this.queueGitCommit(workDir);
  }

  private queueGitCommit(workDir: string) {
    if (this.gitTimer) clearTimeout(this.gitTimer);

    this.gitTimer = setTimeout(async () => {
      try {
        const creds = JSON.parse(localStorage.getItem('kiri_creds') || '{}');
        if (creds.GITHUB_PAT) {
          await gitService.commit(
            workDir, 
            `Auto-save: ${new Date().toLocaleTimeString()}`, 
            { name: 'Kiri Agent', email: 'agent@kiricode.com' }
          );
          // Dispatch event to update the GitHub UI counter
          window.dispatchEvent(new CustomEvent('kiri:git-updated'));
        }
      } catch (e) {
        console.error('[Persistence] Git auto-commit failed:', e);
      }
    }, this.GIT_DELAY);
  }

  /**
   * THE REVERSE BRIDGE: Pulls files from LightningFS back into WebContainer RAM
   * Used immediately after cloning a repo.
   */
  async restoreToWebContainer(workDir: string) {
    const webcontainer = await getWebContainer();
    const fsPromised = this.fs.promises;

    const copyRecursive = async (currentPath: string) => {
      const entries = await fsPromised.readdir(currentPath);
      for (const entry of entries) {
        if (entry === '.git') continue; // Do not copy git index to RAM
        
        const fullPath = `${currentPath}/${entry}`;
        const stat = await fsPromised.stat(fullPath);
        
        if (stat.isDirectory()) {
          try { await webcontainer.fs.mkdir(fullPath, { recursive: true }); } catch (e) {}
          await copyRecursive(fullPath);
        } else {
          try {
            const content = await fsPromised.readFile(fullPath);
            await webcontainer.fs.writeFile(fullPath, content);
          } catch(e) {}
        }
      }
    };

    await copyRecursive(workDir);
    // Tell the FileTree UI to refresh!
    window.dispatchEvent(new CustomEvent('kiri:fs-updated'));
    console.log(`[Persistence] Restored LightningFS to WebContainer RAM.`);
  }
}

export const persistenceService = PersistenceService.getInstance();
