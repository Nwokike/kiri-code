import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ApiKey {
  key: string;
  label: string;
  value: string;
  link?: string;
  isSecret?: boolean;
}

export interface SettingsState {
  apiKeys: ApiKey[];
  githubToken: string;
  selectedProvider: string;
  selectedModel: string;
}

interface SettingsContextValue extends SettingsState {
  getApiKey: (key: string) => string | null;
  setApiKey: (key: string, value: string) => void;
  setGithubToken: (token: string) => void;
  setSelectedProvider: (provider: string) => void;
  setSelectedModel: (model: string) => void;
  saveToStorage: () => void;
}

const DEFAULT_API_KEYS: ApiKey[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic', value: '', link: 'https://console.anthropic.com/settings/keys' },
  { key: 'OPENAI_API_KEY', label: 'OpenAI', value: '', link: 'https://platform.openai.com/api-keys' },
  { key: 'GOOGLE_API_KEY', label: 'Google Gemini', value: '', link: 'https://aistudio.google.com/app/apikey' },
  { key: 'DEEPSEEK_API_KEY', label: 'Deepseek', value: '', link: 'https://platform.deepseek.com/' },
  { key: 'GROQ_API_KEY', label: 'Groq', value: '', link: 'https://console.groq.com/keys' },
  { key: 'OPEN_ROUTER_API_KEY', label: 'OpenRouter', value: '', link: 'https://openrouter.ai/keys' },
  { key: 'MISTRAL_API_KEY', label: 'Mistral', value: '', link: 'https://console.mistral.ai/api-keys/' },
  { key: 'PERPLEXITY_API_KEY', label: 'Perplexity', value: '', link: 'https://www.perplexity.ai/settings/api' },
  { key: 'XAI_API_KEY', label: 'xAI', value: '', link: 'https://console.x.ai/' },
  { key: 'NVIDIA_NIM_API_KEY', label: 'Nvidia NIM', value: '', link: 'https://build.nvidia.com/explore/discover' },
  { key: 'OLLAMA_API_BASE_URL', label: 'Ollama Base URL', value: 'http://localhost:11434', isSecret: false },
  { key: 'OPENAI_LIKE_API_KEY', label: 'OpenAI Compatible Key', value: '' },
  { key: 'OPENAI_LIKE_API_BASE_URL', label: 'OpenAI Compatible Base URL', value: '' },
];

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => {
    const stored = localStorage.getItem('kiri_creds');
    if (stored) {
      const parsed = JSON.parse(stored);
      return DEFAULT_API_KEYS.map(defaultKey => ({
        ...defaultKey,
        value: parsed[defaultKey.key] || '',
      }));
    }
    return DEFAULT_API_KEYS;
  });

  const [githubToken, setGithubToken] = useState(() => {
    const stored = localStorage.getItem('kiri_creds');
    return stored ? JSON.parse(stored).GITHUB_PAT || '' : '';
  });

  const [selectedProvider, setSelectedProvider] = useState(() => {
    return localStorage.getItem('kiri_selected_provider') || 'OpenAI';
  });

  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('kiri_selected_model') || 'gpt-4o';
  });

  const getApiKey = useCallback((key: string): string | null => {
    const found = apiKeys.find(k => k.key === key);
    return found?.value || null;
  }, [apiKeys]);

  const setApiKey = useCallback((key: string, value: string) => {
    setApiKeys(prev => prev.map(k => 
      k.key === key ? { ...k, value } : k
    ));
  }, []);

  const setGithubTokenFn = useCallback((token: string) => {
    setGithubToken(token);
  }, []);

  const saveToStorage = useCallback(() => {
    const creds: Record<string, string> = {};
    apiKeys.forEach(k => {
      if (k.value) creds[k.key] = k.value;
    });
    if (githubToken) creds.GITHUB_PAT = githubToken;
    
    localStorage.setItem('kiri_creds', JSON.stringify(creds));
    localStorage.setItem('kiri_selected_provider', selectedProvider);
    localStorage.setItem('kiri_selected_model', selectedModel);
  }, [apiKeys, githubToken, selectedProvider, selectedModel]);

  return (
    <SettingsContext.Provider value={{
      apiKeys,
      githubToken,
      selectedProvider,
      selectedModel,
      getApiKey,
      setApiKey,
      setGithubToken: setGithubTokenFn,
      setSelectedProvider,
      setSelectedModel,
      saveToStorage,
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
}