export function copyObjectWithoutKey<T, K extends keyof T>(
  obj: T,
  keyToRemove: K,
): Omit<T, K> {
  const filteredEntries = Object.entries(obj).filter(([key]) => key !== keyToRemove)
  return Object.fromEntries(filteredEntries) as Omit<T, K>
}
