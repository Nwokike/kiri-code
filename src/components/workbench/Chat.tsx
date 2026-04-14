import React, { useState, useEffect } from 'react';
import { agentService } from '../../lib/services/agent';
import { LLMManager } from '../../lib/modules/llm/LLMManager';
import { Send, Settings2, Sparkles } from 'lucide-react';

const Chat: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('Google');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash');
  const [providers, setProviders] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const llmManager = LLMManager.getInstance();
    const allProviders = llmManager.getAllProviders().map(p => p.name);
    setProviders(allProviders);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // PULL KEYS FROM YOUR EXACT VAULT STRUCTURE
    const saved = localStorage.getItem('kiri_creds');
    const creds = saved ? JSON.parse(saved) : {};
    
    // Map provider name to key name
    let keyName = '';
    if (selectedProvider === 'Google') keyName = 'GOOGLE_API_KEY';
    else if (selectedProvider === 'Anthropic') keyName = 'ANTHROPIC_API_KEY';
    else if (selectedProvider === 'OpenAI') keyName = 'OPENAI_API_KEY';
    else if (selectedProvider === 'Deepseek') keyName = 'DEEPSEEK_API_KEY';
    else if (selectedProvider === 'Groq') keyName = 'GROQ_API_KEY';
    else if (selectedProvider === 'OpenRouter') keyName = 'OPEN_ROUTER_API_KEY';
    else if (selectedProvider === 'Mistral') keyName = 'MISTRAL_API_KEY';
    else if (selectedProvider === 'Perplexity') keyName = 'PERPLEXITY_API_KEY';
    else if (selectedProvider === 'xAI') keyName = 'XAI_API_KEY';
    
    const requiredKey = creds[keyName];

    if (!requiredKey) {
      alert(`Please click the "Settings" button in the top right and enter your ${selectedProvider} API key.`);
      return;
    }

    setIsLoading(true);
    try {
      await agentService.runLoop(prompt, selectedProvider, selectedModel, requiredKey);
      setPrompt('');
    } catch (error: any) {
      console.error(error);
      alert(`Agent Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] flex flex-col font-sans relative">
      {/* Settings Header */}
      <div className="absolute top-0 left-0 right-0 p-2 flex justify-end z-10">
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-md transition-colors ${showSettings ? 'bg-[#222] text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-[#111]'}`}
        >
          <Settings2 size={16} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="absolute top-10 left-2 right-2 bg-[#111] border border-[#222] rounded-lg p-3 z-20 shadow-xl">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Provider</label>
              <select 
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#222] rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {providers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Model Name</label>
              <input 
                type="text"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="e.g. gemini-2.5-flash"
                className="w-full bg-[#0a0a0a] border border-[#222] rounded px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
          <Sparkles className="text-emerald-400" size={28} />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">What are we building?</h3>
        <p className="text-sm text-gray-400 max-w-[240px] leading-relaxed">
          I can write code, create files, and run terminal commands to help you build your project.
        </p>
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0a0a0a] border-t border-[#222]">
        <form onSubmit={handleSubmit} className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-500/0 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-[#111] border border-[#222] rounded-xl focus-within:border-emerald-500/50 transition-colors shadow-sm">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask me to build something..."
              disabled={isLoading}
              className="w-full bg-transparent p-3 pr-12 text-sm text-gray-200 placeholder-gray-500 resize-none focus:outline-none disabled:opacity-50 min-h-[80px] max-h-[200px] custom-scrollbar"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !prompt.trim()}
              className="absolute right-2 bottom-2 h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center disabled:opacity-50 disabled:bg-[#222] disabled:text-gray-500 hover:bg-emerald-500 transition-all shadow-md"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={14} className="ml-0.5" />
              )}
            </button>
          </div>
        </form>
        <div className="mt-2 text-center">
          <span className="text-[10px] text-gray-500 font-medium">
            Using <span className="text-emerald-500/80">{selectedModel}</span> via {selectedProvider}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Chat;
