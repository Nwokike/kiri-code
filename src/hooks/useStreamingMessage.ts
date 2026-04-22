import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  error?: string;
}

interface UseStreamingOptions {
  onChunk?: (chunk: string) => void;
  onComplete?: (fullContent: string) => void;
  onError?: (error: Error) => void;
}

export function useStreamingMessage(options: UseStreamingOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const contentRef = useRef('');

  const addMessage = useCallback((role: ChatMessage['role'], content: string) => {
    const id = `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const message: ChatMessage = { id, role, content, timestamp: new Date() };
    setMessages(prev => [...prev, message]);
    return id;
  }, []);

  const updateMessage = useCallback((id: string, content: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, content } : msg
    ));
  }, []);

  const addError = useCallback((id: string, error: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, error } : msg
    ));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    setIsLoading(true);
    setIsStreaming(true);
    contentRef.current = '';
    
    addMessage('user', content);
    
    const assistantMsgId = addMessage('assistant', '');
    setMessages(prev => prev.map(msg => 
      msg.id === assistantMsgId ? { ...msg, isStreaming: true } : msg
    ));

    try {
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          content,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        contentRef.current += chunk;
        
        updateMessage(assistantMsgId, contentRef.current);
        options.onChunk?.(chunk);
      }

      setMessages(prev => prev.map(msg => 
        msg.id === assistantMsgId ? { ...msg, isStreaming: false } : msg
      ));
      
      options.onComplete?.(contentRef.current);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      if (error.name !== 'AbortError') {
        addError(assistantMsgId, error.message);
        options.onError?.(error);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [messages, addMessage, updateMessage, addError, options]);

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    contentRef.current = '';
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, []);

  useEffect(() => {
    return () => abortControllerRef.current?.abort();
  }, []);

  return {
    messages,
    isLoading,
    isStreaming,
    sendMessage,
    stopGeneration,
    clearMessages,
    removeMessage,
    addMessage,
  };
}