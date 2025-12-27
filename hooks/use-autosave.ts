import { useEffect, useRef, useCallback } from "react";

interface UseAutosaveOptions {
  data: any;
  key: string;
  interval?: number; // milliseconds
  onSave?: (data: any) => void;
  enabled?: boolean;
}

export function useAutosave({ data, key, interval = 1000, onSave, enabled = true }: UseAutosaveOptions) {
  const lastSavedRef = useRef<string>("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataRef = useRef<any>(data);

  // Update data ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Save function that can be called immediately
  const saveNow = useCallback(() => {
    if (!enabled || typeof window === "undefined") return;
    
    try {
      const dataString = JSON.stringify(dataRef.current);
      
      // Only save if data has changed
      if (dataString === lastSavedRef.current) {
        return;
      }

      localStorage.setItem(`autosave_${key}`, dataString);
      lastSavedRef.current = dataString;
      onSave?.(dataRef.current);
    } catch (error) {
      console.error("Autosave failed:", error);
      // If storage is full, try to clear old autosaves
      try {
        const keys = Object.keys(localStorage);
        const autosaveKeys = keys.filter(k => k.startsWith("autosave_") && k !== `autosave_${key}`);
        // Remove oldest autosaves (keep last 10)
        autosaveKeys.slice(0, Math.max(0, autosaveKeys.length - 10)).forEach(k => {
          localStorage.removeItem(k);
        });
        // Retry save
        const dataString = JSON.stringify(dataRef.current);
        localStorage.setItem(`autosave_${key}`, dataString);
        lastSavedRef.current = dataString;
        onSave?.(dataRef.current);
      } catch (retryError) {
        console.error("Autosave retry failed:", retryError);
      }
    }
  }, [key, onSave, enabled]);

  useEffect(() => {
    if (!enabled) {
      // Clear any existing autosave data when disabled
      if (typeof window !== "undefined") {
        localStorage.removeItem(`autosave_${key}`);
      }
      return;
    }

    const dataString = JSON.stringify(data);
    
    // Only save if data has changed
    if (dataString === lastSavedRef.current) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave (reduced interval for faster saves)
    timeoutRef.current = setTimeout(() => {
      saveNow();
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, key, interval, enabled, saveNow]);

  // Save immediately on page unload
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Save immediately before page unloads
      saveNow();
    };

    const handleVisibilityChange = () => {
      // Save when tab becomes hidden (user switching tabs)
      if (document.hidden) {
        saveNow();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enabled, saveNow]);

  // Load autosaved data
  const loadAutosaved = (): any | null => {
    if (typeof window === "undefined" || !enabled) return null;
    try {
      const saved = localStorage.getItem(`autosave_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        lastSavedRef.current = saved;
        return parsed;
      }
    } catch (error) {
      console.error("Failed to load autosaved data:", error);
    }
    return null;
  };

  // Clear autosaved data
  const clearAutosave = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(`autosave_${key}`);
      lastSavedRef.current = "";
    }
  };

  // Force save immediately (useful for form submission or manual save)
  const forceSave = () => {
    saveNow();
  };

  return { loadAutosaved, clearAutosave, forceSave };
}

