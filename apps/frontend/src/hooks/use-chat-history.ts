/**
 * Chat History Hooks
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message, ChatHistory } from '@/types/ai';
import { getMessageText } from '@/types/ai';
import { ErrorHandler } from '@/lib/error-handler';

/**
 * localStorage key for storing chat histories
 */
const STORAGE_KEY = 'ai-chat-histories';

/**
 * Maximum number of chat histories to keep
 */
const MAX_HISTORIES = 50;

/**
 * Hook for managing chat history in localStorage
 * Provides functions to save, load, and delete chat histories
 */
export function useChatHistory() {
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load all histories from localStorage
   */
  const loadHistories = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ChatHistory[];
        // Sort by updatedAt desc (newest first)
        parsed.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        setHistories(parsed);
      }
    } catch (error) {
      ErrorHandler.log(error, 'Load Chat Histories');
      setHistories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Load histories from localStorage on mount
   */
  useEffect(() => {
    loadHistories();
  }, [loadHistories]);

  /**
   * Generate a title from the first user message
   */
  const generateTitle = useCallback((messages: Message[]): string => {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (!firstUserMessage) return '新對話';

    const content = getMessageText(firstUserMessage).trim();
    // Truncate to 50 characters
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  }, []);

  /**
   * Save a new chat history or update existing one
   */
  const saveHistory = useCallback((id: string, messages: Message[]): void => {
    const now = new Date().toISOString();

    setHistories((prevHistories) => {
      const existingIndex = prevHistories.findIndex((h) => h.id === id);

      if (existingIndex >= 0) {
        // Update existing history
        const updated = [...prevHistories];
        updated[existingIndex] = {
          ...updated[existingIndex],
          messages,
          title: generateTitle(messages),
          updatedAt: now,
        };

        // Persist to localStorage
        try {
          const trimmed = updated.slice(0, MAX_HISTORIES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
          return trimmed;
        } catch (error) {
          ErrorHandler.log(error, 'Save Chat Histories');
          return prevHistories;
        }
      } else {
        // Create new history
        const newHistory: ChatHistory = {
          id,
          title: generateTitle(messages),
          messages,
          createdAt: now,
          updatedAt: now,
        };
        const updated = [newHistory, ...prevHistories];

        // Persist to localStorage
        try {
          const trimmed = updated.slice(0, MAX_HISTORIES);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
          return trimmed;
        } catch (error) {
          ErrorHandler.log(error, 'Save Chat Histories');
          return prevHistories;
        }
      }
    });
  }, [generateTitle]);

  /**
   * Load a specific chat history
   */
  const loadHistory = useCallback((id: string): ChatHistory | undefined => {
    return histories.find((h) => h.id === id);
  }, [histories]);

  /**
   * Delete a chat history
   */
  const deleteHistory = useCallback((id: string): void => {
    setHistories((prevHistories) => {
      const filtered = prevHistories.filter((h) => h.id !== id);
      try {
        const trimmed = filtered.slice(0, MAX_HISTORIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
        return trimmed;
      } catch (error) {
        ErrorHandler.log(error, 'Delete Chat History');
        return prevHistories;
      }
    });
  }, []);

  /**
   * Delete all chat histories
   */
  const clearAll = useCallback((): void => {
    localStorage.removeItem(STORAGE_KEY);
    setHistories([]);
  }, []);

  /**
   * Get recent histories (limited number)
   */
  const getRecent = useCallback((limit: number = 10): ChatHistory[] => {
    return histories.slice(0, limit);
  }, [histories]);

  return {
    histories,
    isLoading,
    saveHistory,
    loadHistory,
    deleteHistory,
    clearAll,
    getRecent,
  };
}
