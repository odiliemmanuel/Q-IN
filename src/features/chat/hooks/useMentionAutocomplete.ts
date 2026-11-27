'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useUserSearch } from '../api';

const MENTION_REGEX = /(?:^|\s)@([a-zA-Z0-9_.-]{1,32})$/;

interface UseMentionAutocompleteProps {
  onSelect: (username: string) => void;
  debounceMs?: number;
}

export function useMentionAutocomplete({ onSelect, debounceMs = 200 }: UseMentionAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchMutation = useUserSearch();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTextChange = useCallback(
    (text: string, selectionStart: number) => {
      const beforeCursor = text.slice(0, selectionStart);
      const match = beforeCursor.match(MENTION_REGEX);
      if (!match) {
        setQuery('');
        setResults([]);
        setHighlightedIndex(-1);
        return;
      }

      const mentionQuery = match[1];
      setQuery(mentionQuery);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchMutation.mutate(mentionQuery, {
          onSuccess: (users) => {
            setResults(users.map((u) => u.username));
            setHighlightedIndex(0);
          },
        });
      }, debounceMs);
    },
    [debounceMs, searchMutation],
  );

  const handleSelect = useCallback(
    (username: string) => {
      onSelect(username);
      setQuery('');
      setResults([]);
      setHighlightedIndex(-1);
    },
    [onSelect],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (results.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => (i + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i - 1 + results.length) % results.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelect(results[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        setQuery('');
        setResults([]);
        setHighlightedIndex(-1);
      }
    },
    [results, highlightedIndex, handleSelect],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    query,
    results,
    highlightedIndex,
    handleTextChange,
    handleSelect,
    handleKeyDown,
    isSearching: searchMutation.isPending,
  };
}
