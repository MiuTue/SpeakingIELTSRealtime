type Handler = (payload: unknown) => void;

export class TypedEmitter<EventMap extends object> {
  private handlers = new Map<keyof EventMap, Set<Handler>>();

  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) {
    const handlers = this.handlers.get(event) ?? new Set<Handler>();
    handlers.add(handler as Handler);
    this.handlers.set(event, handlers);
    return () => this.off(event, handler);
  }

  off<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void) {
    this.handlers.get(event)?.delete(handler as Handler);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]) {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }

  clear() {
    this.handlers.clear();
  }
}
