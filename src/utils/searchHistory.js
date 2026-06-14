const STORAGE_KEY = 'wyt:recentSearches';
const MAX_ENTRIES = 5;

export function getRecentSearches() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addRecentSearch(flightNumber) {
  const normalised = flightNumber.trim().toUpperCase();
  let list = getRecentSearches();
  list = list.filter((entry) => entry.toUpperCase() !== normalised);
  list.unshift(normalised);
  if (list.length > MAX_ENTRIES) {
    list = list.slice(0, MAX_ENTRIES);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // private-mode or storage disabled — return in-memory list
  }
  return list;
}
