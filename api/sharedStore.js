// Shared in-memory store for local development fallback
// This allows api/admin/schedules.js to save data that api/schedules.js can read
export const memoryStore = {
  schedules: null
};
