/**
 * Local storage helper functions
 */

/**
 * Get item from localStorage with expiration check
 * @param {string} key - Storage key
 * @returns {any} - Stored value or null if expired/not found
 */
export function getItem(key) {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const parsedItem = JSON.parse(item);

    // Check if item has expiration and if it has expired
    if (parsedItem.expiry && parsedItem.expiry < Date.now()) {
      localStorage.removeItem(key);
      return null;
    }

    return parsedItem.value;
  } catch (e) {
    // If not in expected format, return as is
    return item;
  }
}

/**
 * Set item in localStorage with optional expiration
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 * @param {number} [expiryInMinutes] - Expiration time in minutes
 */
export function setItem(key, value, expiryInMinutes) {
  try {
    const item = {
      value: value,
    };

    // Add expiration if specified
    if (expiryInMinutes) {
      item.expiry = Date.now() + expiryInMinutes * 60 * 1000;
    }

    localStorage.setItem(key, JSON.stringify(item));
  } catch (e) {
    console.error("Error saving to localStorage", e);
  }
}

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export function removeItem(key) {
  localStorage.removeItem(key);
}

/**
 * Clear all data from localStorage
 */
export function clearAll() {
  localStorage.clear();
}

export default {
  getItem,
  setItem,
  removeItem,
  clearAll,
};
