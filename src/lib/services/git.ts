import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import { persistenceService } from './persistence';

export class GitService {
  private static instance: GitService;
  private unpushedCommits: number = 0;
  // Defaulting to the standard isomorphic-git cors proxy for zero-config startup
  private corsProxy: string = 'https://cors.isomorphic-git.org'; 

  private constructor() {}

  static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  setProxy(url: string) {
    this.corsProxy = url;
  }

  getUnpushedCommits() {
    return this.unpushedCommits;
  }

  /**
   * Clone a repository into LightningFS
   */
  async clone(url: string, dir: string, token: string) {
    await git.clone({
      fs: persistenceService.fs,
      http,
      dir,
      url,
      corsProxy: this.corsProxy, // Using standard proxy
      onAuth: () => ({ username: token }),
      singleBranch: true,
      depth: 1
    });
    console.log(`[Git] Cloned ${url} into ${dir}`);
  }

  /**
   * Local commit to LightningFS
   */
  async commit(dir: string, message: string, author: { name: string, email: string }) {
    await git.add({ fs: persistenceService.fs, dir, filepath: '.' });
    const sha = await git.commit({
      fs: persistenceService.fs,
      dir,
      message,
      author,
    });
    
    this.unpushedCommits++;
    console.log(`[Git] Committed local: ${sha}`);
    return sha;
  }

  /**
   * Push to remote via Debouncer
   */
  async push(dir: string, token: string) {
    if (this.unpushedCommits === 0) return;

    await git.push({
      fs: persistenceService.fs,
      http,
      dir,
      corsProxy: this.corsProxy,
      onAuth: () => ({ username: token }),
    });

    this.unpushedCommits = 0;
    console.log(`[Git] Pushed to remote`);
  }

  setupExitHandler(dir: string, token: string) {
    window.addEventListener('beforeunload', () => {
      if (this.unpushedCommits > 0) {
        this.push(dir, token);
      }
    });
  }
}

export const gitService = GitService.getInstance();
