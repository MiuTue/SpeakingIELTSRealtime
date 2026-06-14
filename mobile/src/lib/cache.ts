import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_PREFIX = "speakielts:cache:";

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const value = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export async function writeCache(key: string, value: unknown) {
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
}

export async function clearCache() {
  const keys = await AsyncStorage.getAllKeys();
  const cached = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  if (cached.length) await AsyncStorage.multiRemove(cached);
}
