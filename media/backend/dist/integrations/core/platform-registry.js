class Registry {
    adapters = new Map();
    register(platform, adapter) {
        this.adapters.set(platform, adapter);
    }
    get(platform) {
        const adapter = this.adapters.get(platform);
        if (!adapter) {
            throw new Error(`Platform adapter not found for: ${platform}`);
        }
        return adapter;
    }
}
export const PlatformRegistry = new Registry();
