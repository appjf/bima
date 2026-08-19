import { useState, useEffect, useRef, useCallback } from 'react';

interface AutoSaveOptions<T> {
  key: string;
  data: T;
  intervalMs?: number; // Default 30,000ms = 30s
  enabled?: boolean;
  onSave?: (savedData: T, timestamp: string) => void;
}

export interface AutoSaveReturn<T> {
  lastSavedTime: string | null;
  isSaving: boolean;
  hasDraft: boolean;
  loadDraft: () => T | null;
  saveNow: () => void;
  clearDraft: () => void;
}

/**
 * Custom React hook that automatically saves form progress to localStorage
 * every 30 seconds (or custom interval) to prevent operator data loss.
 */
export function useAutoSaveForm<T>({
  key,
  data,
  intervalMs = 30000,
  enabled = true,
  onSave
}: AutoSaveOptions<T>): AutoSaveReturn<T> {
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasDraft, setHasDraft] = useState<boolean>(false);

  const dataRef = useRef<T>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Check if draft exists on mount/key change
  useEffect(() => {
    try {
      const existing = localStorage.getItem(key);
      setHasDraft(!!existing);
      if (existing) {
        const parsed = JSON.parse(existing);
        if (parsed._savedAt) {
          const date = new Date(parsed._savedAt);
          setLastSavedTime(
            date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
          );
        }
      }
    } catch {
      setHasDraft(false);
    }
  }, [key]);

  const saveNow = useCallback(() => {
    if (!key || !enabled) return;
    try {
      setIsSaving(true);
      const now = new Date();
      const payload = {
        ...dataRef.current,
        _savedAt: now.toISOString()
      };
      localStorage.setItem(key, JSON.stringify(payload));
      setHasDraft(true);
      
      const formattedTime = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' WIB';

      setLastSavedTime(formattedTime);
      if (onSave) {
        onSave(dataRef.current, formattedTime);
      }
      setTimeout(() => setIsSaving(false), 600);
    } catch (err) {
      console.error('Failed to auto-save form progress to localStorage:', err);
      setIsSaving(false);
    }
  }, [key, enabled, onSave]);

  // Periodic Auto-Save Timer (every 30 seconds)
  useEffect(() => {
    if (!enabled) return;

    const timer = setInterval(() => {
      saveNow();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs, enabled, saveNow]);

  const loadDraft = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      delete parsed._savedAt;
      return parsed as T;
    } catch {
      return null;
    }
  }, [key]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setHasDraft(false);
      setLastSavedTime(null);
    } catch (err) {
      console.error('Failed to clear draft:', err);
    }
  }, [key]);

  return {
    lastSavedTime,
    isSaving,
    hasDraft,
    loadDraft,
    saveNow,
    clearDraft
  };
}
