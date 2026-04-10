"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type MutableRefObject,
} from "react";

/** Minimal message shape for passing context between components */
export interface ContextMessage {
  id: string;
  role: "user" | "assistant";
  parts: Array<{ type: "text"; text: string }>;
}

interface SidepanelControls {
  openSidepanel: (message?: string) => void;
  closeSidepanel: () => void;
  sendMessage: (message: string) => void;
  isOpen: () => boolean;
}

interface SidepanelContextValue {
  register: (controls: SidepanelControls) => () => void;
  openSidepanel: (message?: string) => void;
  closeSidepanel: () => void;
  sendMessage: (message: string) => void;
  /** Open sidepanel with prior conversation context + a follow-up message */
  openSidepanelWithContext: (initialMessages: ContextMessage[], followUp: string) => void;
  /** Ref holding initial messages to inject before the next sent message */
  initialMessagesRef: MutableRefObject<ContextMessage[] | null>;
  /** Reactive boolean tracking whether the sidepanel is currently open */
  isSidepanelOpen: boolean;
  /** Called by the sidepanel component to sync its open state */
  notifyOpenChange: (isOpen: boolean) => void;
  /** Agent suggestions for the current page context */
  agentSuggestions: string[];
  /** Whether agent suggestions are currently loading */
  agentSuggestionsLoading: boolean;
  /** Called by the sidepanel to update suggestions */
  setAgentSuggestions: (suggestions: string[]) => void;
  /** Called by the sidepanel to update loading state */
  setAgentSuggestionsLoading: (loading: boolean) => void;
}

const SidepanelContext = createContext<SidepanelContextValue | null>(null);

interface SidepanelProviderProps {
  children: ReactNode;
}

export function SidepanelProvider({ children }: SidepanelProviderProps) {
  const controlsRef = useRef<SidepanelControls | null>(null);
  const initialMessagesRef = useRef<ContextMessage[] | null>(null);
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false);
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>([]);
  const [agentSuggestionsLoading, setAgentSuggestionsLoading] = useState(false);

  const register = useCallback((controls: SidepanelControls) => {
    controlsRef.current = controls;
    return () => {
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
    };
  }, []);

  const notifyOpenChange = useCallback((isOpen: boolean) => {
    setIsSidepanelOpen(isOpen);
  }, []);

  const openSidepanel = useCallback(
    (message?: string) => {
      if (controlsRef.current) {
        controlsRef.current.openSidepanel(message);
      }
    },
    []
  );

  const closeSidepanel = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.closeSidepanel();
    }
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (controlsRef.current) {
      controlsRef.current.sendMessage(message);
    }
  }, []);

  const openSidepanelWithContext = useCallback(
    (initialMessages: ContextMessage[], followUp: string) => {
      initialMessagesRef.current = initialMessages;
      if (controlsRef.current) {
        controlsRef.current.openSidepanel(followUp);
      }
    },
    []
  );

  return (
    <SidepanelContext.Provider
      value={{
        register,
        openSidepanel,
        closeSidepanel,
        sendMessage,
        openSidepanelWithContext,
        initialMessagesRef,
        isSidepanelOpen,
        notifyOpenChange,
        agentSuggestions,
        agentSuggestionsLoading,
        setAgentSuggestions,
        setAgentSuggestionsLoading,
      }}
    >
      {children}
    </SidepanelContext.Provider>
  );
}

export function useSidepanel() {
  const context = useContext(SidepanelContext);
  if (!context) {
    throw new Error("useSidepanel must be used within a SidepanelProvider");
  }
  return context;
}
