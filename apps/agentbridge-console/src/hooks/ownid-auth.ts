import { log } from "@/utils/log.ts";
import { OwnIdConfig } from "@agentbridge/api";
import { useCallback, useRef } from "react";

interface DIResolver {
  resolve(symbol: symbol): unknown | null;
  resolveRequired(symbol: symbol): unknown;
}

interface LastUser {
  loginId: {
    id: string;
    type: string;
  };
  authMethod: string;
}

interface PersistentStoreCapability {
  getLastUser(): Promise<LastUser | undefined>;
  setLastUser(data: LastUser): Promise<void>;
}

const PersistentStoreCapabilitySymbol = "PersistentStoreCapability";

export const useOwnIdAuth = () => {
  const ownidConfigRef = useRef<OwnIdConfig | null>(null);
  const signalController = useRef<AbortController | null>(null);

  const init = useCallback(
    (
      ownidConfig: OwnIdConfig,
      appScope: string | null,
      onToken: ((payload: { token: string }) => void) | null,
      onAccountNotFound: ((email: string) => void) | null,
    ) => {
      if (ownidConfigRef.current) {
        log.info("Ownid already initialized");
        return false;
      }

      window.ownid =
        window.ownid ||
        (async (...args) => {
          return new Promise((resolve) => {
            // @ts-expect-error convention for ownid sdk
            resolve._isResolver = true;
            (window.ownid!.q = window.ownid!.q || []).push([resolve, ...args]);
          });
        });

      const script = document.createElement("script");
      script.src = `https://cdn${ownidConfig.env === "prod" ? "" : `.${ownidConfig.env}`}.ownid.com/sdk/${ownidConfig.appId}`;
      script.async = true;
      document.head.appendChild(script);

      window.ownid("init", {
        branding: false,
        enableClose: false,
        appApiScope: appScope,
        registrations: (resolver: DIResolver) => {
          const originalProvider = resolver.resolveRequired(
            Symbol.for(PersistentStoreCapabilitySymbol),
          ) as PersistentStoreCapability;

          return {
            [PersistentStoreCapabilitySymbol]: (): PersistentStoreCapability => ({
              ...originalProvider,
              getLastUser: async (): Promise<LastUser | undefined> => {
                const data = localStorage.getItem(`ownid-s-${ownidConfig.appId}`);
                if (!data) {
                  return undefined;
                }
                return JSON.parse(data) as LastUser;
              },
              setLastUser: async (data: LastUser): Promise<void> => {
                localStorage.setItem(`ownid-s-${ownidConfig.appId}`, JSON.stringify(data));
              },
            }),
          };
        },
        onLogin: onToken,
        onError: onAccountNotFound
          ? (_: string, details: { code: string; additionalDetails?: { loginId?: { id: string } } }) => {
              if (details.code === "user_blocked") {
                signalController.current?.abort();
              }
              if (details.code === "user_not_found") {
                onAccountNotFound(details.additionalDetails?.["loginId"]?.["id"] || "");
                signalController.current?.abort();
              }
            }
          : undefined,
      });
      ownidConfigRef.current = ownidConfig;
      return true;
    },
    [],
  );

  const start = useCallback(async (loginId?: string) => {
    if (!window.ownid) {
      log.error("Ownid not initialized");
      return;
    }
    const abort = new AbortController();
    signalController.current = abort;
    try {
      return await window.ownid("start", {
        abortSignal: abort.signal,
        ...(loginId && { loginId }),
      });
    } finally {
      signalController.current = null;
    }
  }, []);

  const signOut = useCallback(() => window.ownid?.("logout"), []);

  return { init, start, signOut, getConfig: () => ownidConfigRef.current };
};
