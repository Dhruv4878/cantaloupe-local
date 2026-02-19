'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const PostCountContext = createContext();

export function PostCountProvider({ children }) {
  const [postCount, setPostCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to increment post count (called after successful post generation)
  const incrementPostCount = useCallback(() => {
    setPostCount(prev => prev + 1);
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Function to set post count directly (called when fetching from API)
  const updatePostCount = useCallback((count) => {
    setPostCount(count);
  }, []);

  // Function to trigger a refresh of post count from API
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <PostCountContext.Provider value={{
      postCount,
      updatePostCount,
      incrementPostCount,
      triggerRefresh,
      refreshTrigger
    }}>
      {children}
    </PostCountContext.Provider>
  );
}

export function usePostCount() {
  const context = useContext(PostCountContext);
  if (!context) {
    throw new Error('usePostCount must be used within a PostCountProvider');
  }
  return context;
}
