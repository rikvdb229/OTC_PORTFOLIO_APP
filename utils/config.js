/**
 * ===== APP CONFIGURATION & CONSTANTS =====
 * Shared configuration for both main and renderer processes
 */

const APP_CONFIG = {
  VERSION: "1.0.2",
  APP_NAME: "Portfolio tracker", // Changed from "KBC ESOP Portfolio Tracker"
  STATUS: "Development Version",
  BUILD_DATE: "2025-06-19",
  AUTHOR: "Portfolio Manager",

  // Version helpers
  getFullVersion() {
    return `${this.APP_NAME} v${this.VERSION}`;
  },

  getVersionWithStatus() {
    return `v${this.VERSION} - ${this.STATUS}`;
  },

  isDevVersion() {
    return this.STATUS.toLowerCase().includes("development");
  },
};

// Export to global scope
window.AppConfig = {
  APP_CONFIG,
};

// Debug logging
console.log("✅ Config loaded:", window.AppConfig);
