import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent } from 'react';
import { Send, Settings2, Bot, User, Square } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus as vscDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { agentService } from '~/lib/services/agent';
import { LLMManager } from '~/lib/modules/llm/LLMManager';
import { useSettings } from '~/contexts';
import { ScrollArea } from '../ui/Misc';
import { Select } from '../ui/Select';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  error?: string;
}

export function ChatContainer({ className = '' }: { className?: string }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const { selectedProvider, setSelectedProvider, selectedModel, setSelectedModel, saveToStorage } = useSettings();
  
  const llmManager = LLMManager.getInstance();
  const providers = llmManager.getAllProviders().map(p => ({ value: p.name, label: p.name }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const creds = JSON.parse(localStorage.getItem('kiri_creds') || '{}');
    const keyName = `${selectedProvider.toUpperCase()}_API_KEY`;
    const apiKey = creds[keyName];

    if (!apiKey) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Please add your ${selectedProvider} API key in Settings.` 
      }]);
      return;
    }

    const userMessage = prompt;
    setPrompt('');
    setIsLoading(true);

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true }]);

    try {
      const response = await agentService.runLoop(userMessage, selectedProvider, selectedModel, creds);
      setMessages(prev => prev.map((msg, i) => 
        i === prev.length - 1 ? { ...msg, content: response, isStreaming: false } : msg
      ));
    } catch (error: any) {
      setMessages(prev => prev.map((msg, i) => 
        i === prev.length - 1 ? { ...msg, error: error.message, isStreaming: false } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStop = () => {
    setIsLoading(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-1.5 rounded-md transition-colors ${
            showSettings ? 'bg-[var(--kiri-green)]/15 text-[var(--kiri-green)]' : 'text-[var(--kiri-muted)] hover:text-[var(--kiri-body)] hover:bg-[#ffffff08]'
          }`}
        >
          <Settings2 size={16} />
        </button>
      </div>

      {showSettings && (
        <div className="absolute top-10 left-2 right-2 bg-[var(--kiri-surface)] border border-[var(--kiri-border)] rounded-lg p-3 z-20 shadow-xl">
          <div className="space-y-3">
            <Select
              label="Provider"
              options={providers}
              value={selectedProvider}
              onChange={(val) => {
                setSelectedProvider(val);
                saveToStorage();
              }}
            />
            <input
              type="text"
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                saveToStorage();
              }}
              placeholder="Model name"
              className="w-full bg-[var(--kiri-bg)] border border-[var(--kiri-border)] rounded px-3 py-2 text-xs text-[var(--kiri-body)] focus:outline-none focus:border-[var(--kiri-green)]"
            />
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Bot size={24} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">What are we building?</h3>
            <p className="text-xs text-[var(--kiri-muted)] max-w-[200px]">
              I can write code, create files, and run terminal commands.
            </p>
          </div>
        ) : (
          <div className="space-y-4 pb-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-[var(--kiri-surface)] border border-[var(--kiri-border)]' 
                    : 'bg-emerald-500/15 border border-emerald-500/20'
                }`}>
                  {msg.role === 'user' ? <User size={12} className="text-[var(--kiri-muted)]" /> : <Bot size={12} className="text-emerald-400" />}
                </div>
                <div className={`flex-1 px-3 py-2 rounded-lg text-xs ${
                  msg.role === 'user' 
                    ? 'bg-[var(--kiri-surface)] text-[var(--kiri-body)]' 
                    : 'bg-transparent text-[var(--kiri-body)]'
                }`}>
                  {msg.error ? (
                    <div className="text-red-400">{msg.error}</div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          const isInline = !match && !className;
                          return isInline ? (
                            <code className="px-1 py-0.5 bg-[var(--kiri-surface)] rounded text-xs" {...props}>
                              {children}
                            </code>
                          ) : (
                            <SyntaxHighlighter
                              style={vscDark as any}
                              language={match ? match[1] : 'text'}
                              PreTag="div"
                              className="rounded-md text-xs"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          );
                        },
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {msg.isStreaming && (
                    <span className="inline-flex gap-1 ml-2">
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-[var(--kiri-border)]">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to build something..."
            disabled={isLoading}
            className="w-full bg-[var(--kiri-bg)] border border-[var(--kiri-border)] rounded-lg px-3 py-2 text-xs text-[var(--kiri-body)] placeholder-[var(--kiri-muted)] resize-none focus:outline-none focus:border-[var(--kiri-green)] min-h-[60px] max-h-[150px]"
            rows={2}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-[10px] text-[var(--kiri-muted)]">
              {selectedModel} via {selectedProvider}
            </span>
            <div className="flex gap-2">
              {isLoading && (
                <button
                  type="button"
                  onClick={handleStop}
                  className="p-1.5 rounded-md text-[var(--kiri-muted)] hover:text-white hover:bg-[#ffffff08] transition-colors"
                >
                  <Square size={12} />
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading || !prompt.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--kiri-green)] text-white text-xs font-medium rounded-md hover:bg-[var(--kiri-green-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={12} />
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}