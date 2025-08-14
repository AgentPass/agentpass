import NodeCache from "node-cache";

export enum CacheItemType {
  SERVER_ACCESS = "server_access",
  SERVER = "server",
  ENDUSER_TOKEN = "enduser_token",
}

interface CacheItem<T> {
  value: T;
  type: CacheItemType;
}

interface CacheTTLConfig {
  [key: string]: number;
}

const TTL_CONFIG: CacheTTLConfig = {
  [CacheItemType.SERVER_ACCESS]: 300, // 5 minutes
  [CacheItemType.SERVER]: 120, // 2 minutes
  [CacheItemType.ENDUSER_TOKEN]: 300, // 5 minutes
};

export const cache = new NodeCache({
  checkperiod: 30,
});

type CacheKey = {
  type: CacheItemType;
  ids: string[];
};

const keyToString = (key: CacheKey): string => `${key.type}::${key.ids.join(":")}`;

export async function cacheGetOrAdd<T>(key: CacheKey, fetchFn: () => Promise<T>): Promise<T> {
  const keyString = keyToString(key);
  const cached = cache.get<CacheItem<T>>(keyString);

  if (cached) {
    return cached.value;
  }

  const value = await fetchFn();
  const ttl = TTL_CONFIG[key.type];

  cache.set(keyString, { value }, ttl);

  return value;
}

export function clearCache(key: CacheKey): boolean {
  const keyString = keyToString(key);
  return cache.del(keyString) > 0;
}

const clearCacheByKeyPrefix = (keyString: string) => {
  const keys = cache.keys();
  const matchingKeys = keys.filter((key) => key.startsWith(keyString));

  if (matchingKeys.length > 0) {
    cache.del(matchingKeys);
  }
};

export function clearCacheByType(type: CacheItemType): void {
  clearCacheByKeyPrefix(`${type}::`);
}

export function clearCacheByPartialKey(type: CacheItemType, id: string): void {
  clearCacheByKeyPrefix(keyToString({ type, ids: [id] }));
}
