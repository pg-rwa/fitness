import AsyncStorage from "@react-native-async-storage/async-storage";

const QUEUE_KEY = "@fittracker_offline_queue";
const CACHE_PREFIX = "@fittracker_cache_";

let isOnline = true;
let syncInProgress = false;
let NetInfo = null;

// Initialize network listener
export async function initOfflineSupport() {
  try {
    NetInfo = require("@react-native-community/netinfo").default;
    const state = await NetInfo.fetch();
    isOnline = state.isConnected && state.isInternetReachable !== false;

    NetInfo.addEventListener((state) => {
      const wasOffline = !isOnline;
      isOnline = state.isConnected && state.isInternetReachable !== false;
      if (wasOffline && isOnline) {
        processQueue();
      }
    });
  } catch {
    // NetInfo not available, assume online
    isOnline = true;
  }
}

export function getIsOnline() {
  return isOnline;
}

// Queue a failed API request for retry when online
export async function queueRequest(path, options) {
  try {
    const queue = await getQueue();
    queue.push({
      id: Date.now().toString(),
      path,
      options,
      timestamp: new Date().toISOString(),
      retries: 0,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.warn("[offline] Failed to queue request:", err.message);
  }
}

// Get pending queue
async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Process queued requests
export async function processQueue() {
  if (syncInProgress || !isOnline) return;
  syncInProgress = true;

  try {
    const { api } = require("./api");
    const queue = await getQueue();
    if (queue.length === 0) {
      syncInProgress = false;
      return;
    }

    const remaining = [];
    for (const item of queue) {
      try {
        await api(item.path, item.options);
      } catch {
        item.retries++;
        if (item.retries < 5) {
          remaining.push(item);
        }
      }
    }

    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } catch (err) {
    console.warn("[offline] Queue processing failed:", err.message);
  } finally {
    syncInProgress = false;
  }
}

// Get pending queue count
export async function getPendingCount() {
  const queue = await getQueue();
  return queue.length;
}

// Cache API responses for offline access
export async function cacheResponse(key, data, ttlMinutes = 60) {
  try {
    await AsyncStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({
        data,
        cachedAt: Date.now(),
        ttl: ttlMinutes * 60 * 1000,
      })
    );
  } catch {}
}

// Get cached response
export async function getCachedResponse(key) {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const { data, cachedAt, ttl } = JSON.parse(raw);
    if (Date.now() - cachedAt > ttl) {
      await AsyncStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

// Clear all cached data
export async function clearCache() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch {}
}
