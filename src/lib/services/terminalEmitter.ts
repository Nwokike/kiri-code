type TerminalCallback = (data: string) => void;

class TerminalEventEmitter {
  private listeners: TerminalCallback[] = [];
  
  subscribe(callback: TerminalCallback) {
    this.listeners.push(callback);
    // Return an unsubscribe function to prevent memory leaks
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  emit(data: string) {
    this.listeners.forEach(cb => cb(data));
  }
}

export const terminalEmitter = new TerminalEventEmitter();
