type FetchCallback = (response: Response, url: string, init?: RequestInit) => void;
let originalFetch: typeof window.fetch | null = null;
let rules: Map<string, Set<FetchCallback>> = new Map();
let isInitialized = false;
export function onFetch(name: string, callback: FetchCallback): void {
  if (!rules.has(name)) {
    rules.set(name, new Set());
  }
  rules.get(name)!.add(callback);
}
export function offFetch(name: string, callback?: FetchCallback): void {
  if (callback) {
    const callbacks = rules.get(name);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        rules.delete(name);
      }
    }
  } else {
    rules.delete(name);
  }
}
export function fetchListener() {
  const callbacks: Array<{ name: string; cb: FetchCallback }> = [];
  return {
    on(name: string, cb: FetchCallback): void {
      callbacks.push({ name, cb });
    },
    attach(): void {
      callbacks.forEach(({ name, cb }) => onFetch(name, cb));
    },
    detach(): void {
      callbacks.forEach(({ name, cb }) => offFetch(name, cb));
    },
  };
}
export function initFetchMonitor(): void {
  if (isInitialized) return;
  isInitialized = true;
  originalFetch = window.fetch;
  const interceptedFetch: typeof window.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    if (rules.size === 0) {
      return originalFetch!.call(window, input, init);
    }
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const fetchPromise = originalFetch!.call(window, input, init);
    const matchedCallbacks: FetchCallback[] = [];
    rules.forEach((callbacks, name) => {
      if (url.includes(name)) {
        callbacks.forEach((cb) => matchedCallbacks.push(cb));
      }
    });
    if (matchedCallbacks.length > 0) {
      fetchPromise.then((response) => {
        const clonedResponse = response.clone();
        matchedCallbacks.forEach((callback) => {
          try {
            callback(clonedResponse, url, init);
          } catch (_e) {}
        });
      });
    }
    return fetchPromise;
  };
  window.fetch = interceptedFetch;
}
export function destroyFetchMonitor(): void {
  if (!isInitialized) return;
  if (originalFetch) {
    window.fetch = originalFetch;
    originalFetch = null;
  }
  rules.clear();
  isInitialized = false;
}