import { isShelfItem } from "./shelfItem";

const STORAGE_KEY = "pustakalaya_shelf";

function canUseStorage() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage != null;
  } catch {
    return false;
  }
}

//get the shelf items from the local storage as an array
export function getShelfItems() {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isShelfItem);
  } catch {
    return [];
  }
}

export function addShelfItem(item) {
  if (!isShelfItem(item)) return getShelfItems();
  if (!canUseStorage()) return [item];
  const existing = getShelfItems();
  const next = [item, ...existing.filter((b) => b.id !== item.id)];
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function removeShelfItem(id) {
  if (!canUseStorage()) return [];
  
  const existing = getShelfItems();
  // Keep everything EXCEPT the book we want to remove
  const next = existing.filter((book) => book.id !== id);
  
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
