import { PlatformAdapter } from './platform-adapter';

class Registry {
  private adapters = new Map<string, PlatformAdapter>();

  register(platform: string, adapter: PlatformAdapter) {
    this.adapters.set(platform, adapter);
  }

  get(platform: string): PlatformAdapter {
    const adapter = this.adapters.get(platform);
    if (!adapter) {
      throw new Error(`Platform adapter not found for: ${platform}`);
    }
    return adapter;
  }
}

export const PlatformRegistry = new Registry();
