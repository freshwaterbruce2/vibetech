/**
 * Browser-compatible EventEmitter
 * Simple implementation to replace Node.js 'events' module
 */

type Listener = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, Listener[]> = new Map();

  on(event: string, listener: Listener): this {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(listener);
    return this;
  }

  once(event: string, listener: Listener): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper);
      listener(...args);
    };
    return this.on(event, onceWrapper);
  }

  off(event: string, listener: Listener): this {
    const listeners = this.events.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length === 0) {
        this.events.delete(event);
      }
    }
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event);
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => listener(...args));
      return true;
    }
    return false;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0;
  }
}
