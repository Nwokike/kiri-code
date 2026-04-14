import React, { useState, useEffect } from 'react';
import { gitService } from '../../lib/services/git';
import { persistenceService } from '../../lib/services/persistence';

const GitHubManager: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'cloning' | 'pushing' | 'error' | 'success'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [unpushedCount, setUnpushedCount] = useState(0);

  // Keep commit count in sync with the auto-loop
  useEffect(() => {
    const updateCount = () => setUnpushedCount(gitService.getUnpushedCommits());
    updateCount();
    window.addEventListener('kiri:git-updated', updateCount);
    return () => window.removeEventListener('kiri:git-updated', updateCount);
  }, []);

  const getPat = () => {
    const creds = JSON.parse(localStorage.getItem('kiri_creds') || '{}');
    return creds.GITHUB_PAT;
  };

  const handleClone = async () => {
    const pat = getPat();
    if (!pat) {
      setErrorMessage('Please set your GitHub PAT in Settings first.');
      setStatus('error');
      return;
    }
    if (!repoUrl) return;

    setStatus('cloning');
    try {
      // 1. Clone to permanent storage
      await gitService.clone(repoUrl, '/workdir', pat);
      
      // 2. Reverse Bridge to WebContainer memory!
      await persistenceService.restoreToWebContainer('/workdir');
      
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Clone failed');
      setStatus('error');
    }
  };

  const handlePush = async () => {
    const pat = getPat();
    if (!pat) return;

    setStatus('pushing');
    try {
      await gitService.push('/workdir', pat);
      setUnpushedCount(0);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Push failed');
      setStatus('error');
    }
  };

  return (
    <div className="h-full w-full bg-[var(--kiri-surface-subtle)] p-4 flex flex-col text-[var(--kiri-body)] font-sans">
      <div className="flex items-center gap-2 mb-6 border-b border-[var(--kiri-border)] pb-3">
        <span className="i-ph:git-branch text-lg text-[var(--kiri-green)]"></span>
        <h2 className="text-sm font-bold text-[var(--kiri-heading)] uppercase tracking-widest">Version Control</h2>
      </div>

      <div className="space-y-4 flex-1">
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--kiri-muted)]">Clone Repository</label>
          <input 
            type="text" 
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            disabled={status === 'cloning'}
            className="w-full bg-[var(--kiri-bg)] border border-[var(--kiri-border)] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--kiri-green)] transition-colors disabled:opacity-50"
          />
          <button 
            onClick={handleClone}
            disabled={status === 'cloning' || !repoUrl}
            className="w-full py-2 bg-[var(--kiri-surface)] hover:bg-[var(--kiri-border)] border border-[var(--kiri-border)] text-[var(--kiri-heading)] text-xs font-bold rounded-md transition-colors disabled:opacity-50"
          >
            {status === 'cloning' ? 'Cloning & Bridging...' : 'Clone Repository'}
          </button>
        </div>

        {status === 'error' && (
          <div className="p-2 bg-red-500/10 border border-red-500/30 rounded text-[10px] text-red-400">
            {errorMessage}
          </div>
        )}

        <div className="mt-8 p-4 border border-[var(--kiri-border)] rounded-lg bg-[var(--kiri-bg)] flex flex-col items-center text-center">
          <div className="text-[32px] font-bold text-[var(--kiri-green)] mb-1 leading-none">{unpushedCount}</div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--kiri-muted)] mb-4">Unpushed Commits</div>
          
          <button 
            onClick={handlePush}
            disabled={unpushedCount === 0 || status === 'pushing'}
            className="w-full py-2 bg-[var(--kiri-green)] text-white text-xs font-bold rounded-md hover:bg-[var(--kiri-green-dark)] transition-colors shadow-lg shadow-green-900/20 disabled:opacity-50 disabled:shadow-none"
          >
            {status === 'pushing' ? 'Pushing to Remote...' : 'Push to GitHub'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GitHubManager;
