import { isShelfItem, formatBookForDisplay } from "./shelfItem";

const STORAGE_KEY = "pustakalaya_pendingBorrow";

function canUseStorage() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage != null;
  } catch {
    return false;
  }
}

export function setPendingBorrow(book) {
  if (!canUseStorage()) return;
  const snapshot = formatBookForDisplay(book);
  if (!snapshot) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota / private mode — ignore
  }
}

export function consumePendingBorrow() {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    window.localStorage.removeItem(STORAGE_KEY);
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw);
    return isShelfItem(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
