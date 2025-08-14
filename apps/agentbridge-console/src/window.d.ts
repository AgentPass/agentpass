declare global {
  interface Window {
    ownid?: ((arg: unknown[] | string, payload?: unknown) => Promise<unknown>) & {
      q?: unknown[];
    };
    posthog: {
      identify: (id: string, profile: { email: string; name: string | null }) => void;
      reset: () => void;
      capture: (eventName: string, properties?: Record<string, unknown>) => void;
    };
  }
}

export {};
