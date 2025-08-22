export class MemoryStore {
  constructor() {
    this.store = new Map();
    this.metadata = new Map();
  }

  set(key, value, metadata = {}) {
    this.store.set(key, value);
    this.metadata.set(key, {
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }

  get(key) {
    return this.store.get(key);
  }

  has(key) {
    return this.store.has(key);
  }

  delete(key) {
    this.store.delete(key);
    this.metadata.delete(key);
  }

  clear() {
    this.store.clear();
    this.metadata.clear();
  }

  size() {
    return this.store.size;
  }

  keys() {
    return Array.from(this.store.keys());
  }

  values() {
    return Array.from(this.store.values());
  }

  entries() {
    return Array.from(this.store.entries());
  }

  getMetadata(key) {
    return this.metadata.get(key);
  }

  getAllMetadata() {
    return Array.from(this.metadata.entries());
  }
}
