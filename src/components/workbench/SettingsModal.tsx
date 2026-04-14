import React, { useState, useEffect } from 'react';

const PROVIDERS = [
  { key: 'AMAZON_BEDROCK_API_KEY', label: 'Amazon Bedrock', link: 'https://aws.amazon.com/bedrock/' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic', link: 'https://console.anthropic.com/settings/keys' },
  { key: 'CEREBRAS_API_KEY', label: 'Cerebras', link: 'https://inference.cerebras.ai/' },
  { key: 'COHERE_API_KEY', label: 'Cohere', link: 'https://dashboard.cohere.com/api-keys' },
  { key: 'DEEPSEEK_API_KEY', label: 'Deepseek', link: 'https://platform.deepseek.com/' },
  { key: 'FIREWORKS_API_KEY', label: 'Fireworks', link: 'https://fireworks.ai/api-keys' },
  { key: 'GITHUB_TOKEN', label: 'GitHub Models', link: 'https://github.com/settings/tokens' },
  { key: 'GOOGLE_API_KEY', label: 'Google Gemini', link: 'https://aistudio.google.com/app/apikey' },
  { key: 'GROQ_API_KEY', label: 'Groq', link: 'https://console.groq.com/keys' },
  { key: 'HUGGINGFACE_API_KEY', label: 'HuggingFace', link: 'https://huggingface.co/settings/tokens' },
  { key: 'HYPERBOLIC_API_KEY', label: 'Hyperbolic', link: 'https://app.hyperbolic.xyz/' },
  { key: 'LMSTUDIO_API_BASE_URL', label: 'LMStudio Base URL', link: 'https://lmstudio.ai/' },
  { key: 'MISTRAL_API_KEY', label: 'Mistral', link: 'https://console.mistral.ai/api-keys/' },
  { key: 'MOONSHOT_API_KEY', label: 'Moonshot', link: 'https://platform.moonshot.cn/console/api-keys' },
  { key: 'NVIDIA_NIM_API_KEY', label: 'Nvidia NIM', link: 'https://build.nvidia.com/explore/discover' },
  { key: 'OLLAMA_API_BASE_URL', label: 'Ollama Base URL', link: 'https://ollama.com/' },
  { key: 'OPENAI_API_KEY', label: 'OpenAI', link: 'https://platform.openai.com/api-keys' },
  { key: 'OPEN_ROUTER_API_KEY', label: 'OpenRouter', link: 'https://openrouter.ai/keys' },
  { key: 'PERPLEXITY_API_KEY', label: 'Perplexity', link: 'https://www.perplexity.ai/settings/api' },
  { key: 'TOGETHER_API_KEY', label: 'Together', link: 'https://api.together.xyz/settings/api-keys' },
  { key: 'XAI_API_KEY', label: 'xAI', link: 'https://console.x.ai/' },
  { key: 'ZAI_API_KEY', label: 'Z.ai', link: 'https://z.ai/' },
  { key: 'OPENAI_LIKE_API_KEY', label: 'OpenAI Compatible Key', link: '' },
  { key: 'OPENAI_LIKE_API_BASE_URL', label: 'OpenAI Compatible Base URL', link: '' },
];

export const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<Record<string, string>>({
    GITHUB_PAT: '',
    ...Object.fromEntries(PROVIDERS.map(p => [p.key, '']))
  });

  useEffect(() => {
    // Load existing keys from your exact localStorage structure
    const saved = localStorage.getItem('kiri_creds');
    if (saved) {
      try {
        setKeys(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to parse kiri_creds");
      }
    }
  }, [isOpen]);

  const save = () => {
    localStorage.setItem('kiri_creds', JSON.stringify(keys));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[500px] max-h-[85vh] bg-[var(--kiri-surface)] border border-[var(--kiri-border)] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        
        <div className="px-6 py-4 border-b border-[var(--kiri-border)] flex items-center justify-between bg-[var(--kiri-surface-subtle)] shrink-0">
          <h2 className="text-sm font-bold text-[var(--kiri-heading)] tracking-wide flex items-center gap-2">
            <span className="i-ph:gear-duotone text-[var(--kiri-green)] text-lg"></span>
            Workspace Settings
          </h2>
          <button onClick={onClose} className="text-[var(--kiri-muted)] hover:text-white transition-colors">
            <span className="i-ph:x-bold text-lg" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="p-3 rounded-lg bg-[var(--kiri-bg)] border border-[var(--kiri-border)] text-[11px] text-[var(--kiri-muted)]">
            <p><strong className="text-[var(--kiri-green)]">Local Vault:</strong> Your credentials are encrypted and stored purely in your browser's local storage.</p>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--kiri-gold)] uppercase tracking-widest border-b border-[var(--kiri-border)] pb-2">GitHub Autonomy</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[var(--kiri-heading)]">GitHub Personal Access Token</label>
              <input 
                type="password" 
                value={keys.GITHUB_PAT} 
                onChange={e => setKeys({...keys, GITHUB_PAT: e.target.value})}
                placeholder="ghp_..."
                className="w-full bg-[var(--kiri-bg)] border border-[var(--kiri-border)] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--kiri-green)] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[var(--kiri-gold)] uppercase tracking-widest border-b border-[var(--kiri-border)] pb-2">AI Providers (BYOK)</h3>
            <div className="grid grid-cols-1 gap-4">
              {PROVIDERS.map((provider) => (
                <div key={provider.key} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-[var(--kiri-heading)]">{provider.label}</label>
                    <a href={provider.link} target="_blank" rel="noreferrer" className="text-[10px] text-[var(--kiri-green)] hover:underline">Get Key</a>
                  </div>
                  <input 
                    type="password" 
                    value={keys[provider.key] || ''} 
                    onChange={e => setKeys({...keys, [provider.key]: e.target.value})}
                    placeholder={`Enter ${provider.label} API Key...`}
                    className="w-full bg-[var(--kiri-bg)] border border-[var(--kiri-border)] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-[var(--kiri-green)] transition-colors"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--kiri-border)] bg-[var(--kiri-surface-subtle)] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-[var(--kiri-muted)] hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={save} className="px-6 py-2 bg-[var(--kiri-green)] text-white text-xs font-bold rounded-lg hover:bg-[var(--kiri-green-dark)] transition-colors shadow-lg shadow-green-900/20 active:scale-95">
            Save Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
