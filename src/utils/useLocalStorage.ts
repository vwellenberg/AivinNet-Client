/**
 * Retrieeves the value of a key from localStorage.
 * @param key the key to read from local storage
 * @returns A javascript object representing the value stored in local storage
 */
export function readLocalStorage(key: string) {
  const value = localStorage.getItem(key);
  // JSON.parse(null) also yields null, so returning null here is behavior-identical.
  if (value === null) return null;

  try {
    return JSON.parse(value);
  } catch {
    // A stored value that is not JSON is a corrupt entry, not an exception the
    // callers can do anything with — and every one of them reads during setup
    // or inside a watcher, where a throw takes the whole view (or the search
    // watcher, and with it every result) down with it. Absent is the honest
    // answer; the next write replaces it.
    return null;
  }
}

/**
 * Stores a value in localStorage.
 * @param key the key to store the value in local storage
 * @param value the value to store in local storage
 * @returns true if the value was successfully stored, false otherwise
 * @throws if the value is not a valid JSON string
 */

export function writeLocalStorage(key: string, value: any) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}
