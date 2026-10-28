function getLocalStorage(): Storage {
  if (typeof window === "undefined") {
    throw new Error("LocalStorage is not available outside a browser environment.");
  }

  return window.localStorage;
}

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = getLocalStorage().getItem(key);
    return value === null ? defaultValue : (JSON.parse(value) as T);
  } catch {
    return defaultValue;
  }
}

export function setStorage<T>(key: string, value: T): void {
  const serializedValue = JSON.stringify(value);
  if (serializedValue === undefined) {
    throw new TypeError("The value cannot be serialized to JSON.");
  }

  getLocalStorage().setItem(key, serializedValue);
}

export function removeStorage(key: string): void {
  getLocalStorage().removeItem(key);
}
