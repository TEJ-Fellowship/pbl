const STORAGE_KEY = "pustakalaya_pendingBorrowBookId";

/*
typeof window !== "undefined": Checks if we are actually in a browser (and not on a server).

window.localStorage != null: Checks if the browser allows us to save things.*/ 
function canUseStorage() {
    return typeof window !== "undefined" && window.localStorage != null;
  }

  // set the pending borrow book id to the local storage
  export function setPendingBorrow(bookId) {
    if (!canUseStorage()) return;
    const id = bookId?.toString().trim() ?? "";    // if bookId is null or undefined, set it to an empty string
    if (!id) return;  // if id is an empty string, return
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Quota / private mode — ignore
    }
  }

/**
 * Reads the saved book ID from storage and immediately deletes it.
 * To be used after login to finish a 'pending' borrow action exactly once.
 */
  export function consumePendingBorrow() {
    if (!canUseStorage()) return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
      const id = raw?.trim();
      return id || null;
    } catch {
      return null;
    }
  }
