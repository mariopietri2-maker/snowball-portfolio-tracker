// Minimal localStorage mock so zustand/persist works under Node.
const data = new Map<string, string>();
const localStorageMock: Storage = {
  getItem: (k: string) => data.get(k) ?? null,
  setItem: (k: string, v: string) => {
    data.set(k, v);
  },
  removeItem: (k: string) => {
    data.delete(k);
  },
  clear: () => data.clear(),
  key: (i: number) => Array.from(data.keys())[i] ?? null,
  get length() {
    return data.size;
  },
};

Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

// zustand/persist reads `window.localStorage` by default.
if (typeof (globalThis as Record<string, unknown>).window === "undefined") {
  Object.defineProperty(globalThis, "window", {
    value: { localStorage: localStorageMock } as unknown as Window & typeof globalThis,
    configurable: true,
  });
}
