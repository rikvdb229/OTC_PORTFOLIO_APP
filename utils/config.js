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
const SettingsManager = {
  /**
   * Load settings from database and populate UI elements
   */
  async loadSettings(app) {
    try {
      const settings = await window.IPCCommunication.Settings.loadAllSettings();

      if (settings.target_percentage && app.targetPercentage) {
        app.targetPercentage.value = settings.target_percentage;
      }
      if (settings.tax_auto_rate && app.taxRate) {
        app.taxRate.value = settings.tax_auto_rate;
      }
      if (settings.currency_symbol && app.currencySymbol) {
        app.currencySymbol.value = settings.currency_symbol;
      }
      if (settings.auto_update_prices && app.autoUpdatePrices) {
        app.autoUpdatePrices.checked = settings.auto_update_prices === "true";
      }
    } catch (_error) {      console.error("Error loading settings:", error);
    }
  },

  /**
   * Save settings from UI elements to database
   */
  async saveSettings(app) {
    try {
      const settings = {
        target_percentage: app.targetPercentage?.value || "65",
        tax_auto_rate: app.taxRate?.value || "30",
        currency_symbol: app.currencySymbol?.value || "€",
        auto_update_prices:
          app.autoUpdatePrices?.checked?.toString() || "false",
      };

      await window.IPCCommunication.Settings.saveAllSettings(settings);
      await app.loadPortfolioData();

      // Show success feedback
      const originalText = app.saveSettingsBtn.textContent;
      app.saveSettingsBtn.textContent = "✅ Saved!";
      app.saveSettingsBtn.style.backgroundColor = "#4CAF50";

      setTimeout(() => {
        app.saveSettingsBtn.textContent = originalText;
        app.saveSettingsBtn.style.backgroundColor = "";
      }, 2000);
    } catch (_error) {      console.error("Error saving settings:", error);

      // Show error feedback
      const originalText = app.saveSettingsBtn.textContent;
      app.saveSettingsBtn.textContent = "❌ Error!";
      app.saveSettingsBtn.style.backgroundColor = "#f44336";

      setTimeout(() => {
        app.saveSettingsBtn.textContent = originalText;
        app.saveSettingsBtn.style.backgroundColor = "";
      }, 2000);
    }
  },
};
// Export to global scope
window.AppConfig = {
  APP_CONFIG,
  SettingsManager,
};

// Debug logging
console.log("✅ Config loaded:", window.AppConfig);
