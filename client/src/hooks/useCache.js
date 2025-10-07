import { useState, useCallback, useRef } from 'react';

// Simple in-memory cache with TTL (Time To Live)
class Cache {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  set(key, value, ttl = 5 * 60 * 1000) { // Default 5 minutes
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set the value
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });

    // Set timer to auto-expire
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timers.set(key, timer);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.value;
  }

  delete(key) {
    this.cache.delete(key);
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  clear() {
    this.cache.clear();
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }

  has(key) {
    return this.cache.has(key) && this.get(key) !== null;
  }
}

// Global cache instance
const globalCache = new Cache();

// Custom hook for caching API responses
export const useCache = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getCachedData = useCallback((key) => {
    return globalCache.get(key);
  }, []);

  const setCachedData = useCallback((key, data, ttl) => {
    globalCache.set(key, data, ttl);
  }, []);

  const clearCache = useCallback((key) => {
    if (key) {
      globalCache.delete(key);
    } else {
      globalCache.clear();
    }
  }, []);

  const fetchWithCache = useCallback(async (key, fetchFn, ttl = 5 * 60 * 1000) => {
    // Check cache first
    const cachedData = globalCache.get(key);
    if (cachedData) {
      return cachedData;
    }

    // Fetch from API
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchFn();
      globalCache.set(key, data, ttl);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    fetchWithCache,
    loading,
    error
  };
};

// Hook for caching static data (longer TTL)
export const useStaticCache = () => {
  const { getCachedData, setCachedData, clearCache, fetchWithCache } = useCache();

  const fetchStaticData = useCallback(async (key, fetchFn) => {
    return fetchWithCache(key, fetchFn, 30 * 60 * 1000); // 30 minutes
  }, [fetchWithCache]);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    fetchStaticData
  };
};

// Hook for caching user-specific data
export const useUserCache = () => {
  const { getCachedData, setCachedData, clearCache, fetchWithCache } = useCache();

  const fetchUserData = useCallback(async (key, fetchFn, userId) => {
    const userKey = `${key}_${userId}`;
    return fetchWithCache(userKey, fetchFn, 10 * 60 * 1000); // 10 minutes
  }, [fetchWithCache]);

  const clearUserCache = useCallback((userId) => {
    // Clear all cache entries for a specific user
    const keys = Array.from(globalCache.cache.keys());
    keys.forEach(key => {
      if (key.includes(`_${userId}`)) {
        globalCache.delete(key);
      }
    });
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache,
    fetchUserData,
    clearUserCache
  };
};

export default useCache;


