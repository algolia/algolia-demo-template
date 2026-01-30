"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseSpeechRecognitionOptions = {
  lang?: string;
  onTranscriptEnd?: (transcript: string) => void;
  silenceTimeout?: number; // ms to wait after last speech before auto-stopping
};

export type UseSpeechRecognitionResult = {
  supported: boolean;
  listening: boolean;
  transcript: string;
  error?: string;
  startListening: () => void;
  stopListening: () => void;
  toggle: () => void;
};

/**
 * Hook for browser SpeechRecognition API with live transcript updates.
 * @param options.lang - Language code for recognition (default: "it-IT")
 * @param options.onTranscriptEnd - Callback when listening ends with final transcript
 * @param options.silenceTimeout - Milliseconds to wait after last speech before auto-stopping (optional)
 */
export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionResult {
  const { lang = "it-IT", onTranscriptEnd, silenceTimeout } = options;
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");
  const onTranscriptEndRef = useRef(onTranscriptEnd);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [supported, setSupported] = useState(false);

  // Keep callback ref updated in an effect to avoid updating during render
  useEffect(() => {
    onTranscriptEndRef.current = onTranscriptEnd;
  }, [onTranscriptEnd]);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  // Initialize SpeechRecognition
  useEffect(() => {
    const SpeechRecognitionCtor =
      typeof window !== "undefined" &&
      ((window as Window).SpeechRecognition ||
        (window as Window).webkitSpeechRecognition);

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      setError("SpeechRecognition API not available in this browser.");
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onstart = () => {
      setListening(true);
      setError(undefined);
    };

    recognition.onend = () => {
      // Clear silence timer on end
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      setListening(false);
      // Call onTranscriptEnd callback with final transcript
      if (transcriptRef.current && onTranscriptEndRef.current) {
        onTranscriptEndRef.current(transcriptRef.current);
      }
    };

    recognition.onerror = (event) => {
      setListening(false);
      const errorCode = event.error;
      if (errorCode === "no-speech" || errorCode === "aborted") {
        setError(undefined);
      } else {
        setError(errorCode || "speech-recognition-error");
      }
    };

    recognition.onresult = (event) => {
      const results = Array.from(event.results);
      const currentTranscript = results
        .map((result) => result[0].transcript)
        .join("")
        .trim();
      setTranscript(currentTranscript);
      transcriptRef.current = currentTranscript;

      // Reset silence timer on each result
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (silenceTimeout && recognitionRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          recognitionRef.current?.stop();
        }, silenceTimeout);
      }
    };

    recognitionRef.current = recognition;
    setSupported(true);

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [lang, silenceTimeout]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    // Clear any existing silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    setTranscript("");
    transcriptRef.current = "";
    try {
      recognitionRef.current.start();
    } catch {
      setError("Unable to start speech recognition.");
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    // Clear silence timer when manually stopping
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  }, [listening, startListening, stopListening]);

  return {
    supported,
    listening,
    transcript,
    error,
    startListening,
    stopListening,
    toggle,
  };
}

