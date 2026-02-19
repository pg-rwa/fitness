class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return this;
  }

  off(event, handler) {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(
        event,
        handlers.filter((h) => h !== handler)
      );
    }
    return this;
  }

  async emit(event, data) {
    const handlers = this.listeners.get(event) || [];
    for (const handler of handlers) {
      try {
        await handler(data);
      } catch (err) {
        console.error(`EventBus error in handler for "${event}":`, err);
      }
    }
  }
}

const eventBus = new EventBus();

module.exports = { EventBus, eventBus };
