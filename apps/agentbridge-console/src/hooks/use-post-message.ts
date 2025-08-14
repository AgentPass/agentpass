import { log } from "@/utils/log.ts";
import { useCallback, useEffect, useRef } from "react";

type MessageHandler<T = unknown> = (data: T) => void;

interface MessageHandlers {
  [key: string]: MessageHandler;
}

interface PostMessageConfig {
  handlers?: MessageHandlers;
  onConfigReceived?: (config: unknown) => void;
}

interface Message {
  type: string;
  data?: unknown;
}

const ALLOWED_DOMAIN = import.meta.env.POST_MESSAGE_ALLOWED_DOMAIN || "https://www.agentpass.ai";

export const usePostMessage = ({ handlers = {} }: PostMessageConfig = {}) => {
  const isFirstRender = useRef(true);

  const sendMessage = useCallback((type: string, data?: unknown) => {
    const message: Message = { type, ...(data ? { data } : {}) };
    if (window.opener) {
      window.opener.postMessage(message, ALLOWED_DOMAIN);
    } else {
      window.postMessage(message, window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      sendMessage("READY");
      isFirstRender.current = false;
    }

    const handlePostMessage = (event: MessageEvent) => {
      try {
        if (event.origin !== window.location.origin && event.origin !== ALLOWED_DOMAIN) {
          return;
        }

        const { type, data } = event.data;

        if (type && typeof type === "string") {
          if (handlers[type]) {
            handlers[type](data);
          }
        }
      } catch (error) {
        log.error("Error handling a post message:", error);
      }
    };

    window.addEventListener("message", handlePostMessage);

    return () => {
      window.removeEventListener("message", handlePostMessage);
    };
  }, [handlers, sendMessage]);

  return { sendMessage };
};
