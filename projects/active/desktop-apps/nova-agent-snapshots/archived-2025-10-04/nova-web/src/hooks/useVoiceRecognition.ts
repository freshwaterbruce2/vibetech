import { useEffect, useRef, useCallback } from 'react';

interface UseVoiceRecognitionProps {
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
  language?: string;
}

export const useVoiceRecognition = ({
  onResult,
  onError,
  language = 'en-US',
}: UseVoiceRecognitionProps) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      onError?.('Speech recognition is not supported in this browser');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      
      if (event.results[event.results.length - 1].isFinal) {
        onResult(transcript);
      }
    };

    recognition.onerror = (event: any) => {
      onError?.(event.error);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [language, onResult, onError]);

  const start = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        // Already started
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return {
    start,
    stop,
    isSupported: ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window),
  };
};