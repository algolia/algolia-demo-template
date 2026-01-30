"use client";

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  type ReactNode,
} from "react";

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
}

const SidepanelContext = createContext<SidepanelContextValue | null>(null);

interface SidepanelProviderProps {
  children: ReactNode;
}

export function SidepanelProvider({ children }: SidepanelProviderProps) {
  const controlsRef = useRef<SidepanelControls | null>(null);

  const register = useCallback((controls: SidepanelControls) => {
    controlsRef.current = controls;
    return () => {
      if (controlsRef.current === controls) {
        controlsRef.current = null;
      }
    };
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

  return (
    <SidepanelContext.Provider
      value={{
        register,
        openSidepanel,
        closeSidepanel,
        sendMessage,
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

