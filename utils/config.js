/**
 * ===== APP CONFIGURATION & CONSTANTS =====
 * Shared configuration for both main and renderer processes
 */
const APP_CONFIG = {
  VERSION: "Loading...", // Will be loaded from package.json via IPC
  APP_NAME: "Portfolio Tracker",
  STATUS: "Loading...",
  BUILD_DATE: "Loading...",
  AUTHOR: "Portfolio Manager",

  // Load real values from main process
  async loadFromMain() {
    try {
      console.log("🔄 loadFromMain() called");
      console.log("🔍 window.ipcRenderer available:", !!window.ipcRenderer);
      
      if (window.ipcRenderer) {
        console.log("📞 Calling get-app-version IPC...");
        const info = await window.ipcRenderer.invoke("get-app-version");
        console.log("📥 Received version info:", info);
        
        this.VERSION = info.version || "0.3.4";
        this.APP_NAME = info.appName || "Portfolio Tracker";
        this.STATUS = info.status || "Beta Version";
        this.BUILD_DATE = info.buildDate || "11-08-2025";
        this.AUTHOR = info.author || "Portfolio Manager";
        
        console.log(`✅ Version loaded from main: ${this.getFullVersion()}`);
        console.log("✅ Final config values:", {
          VERSION: this.VERSION,
          APP_NAME: this.APP_NAME,
          STATUS: this.STATUS,
          BUILD_DATE: this.BUILD_DATE
        });
      } else {
        console.warn("⚠️ ipcRenderer not available, using defaults");
        this.VERSION = "0.3.4";
        this.APP_NAME = "Portfolio Tracker";
        this.STATUS = "Beta Version"; 
        this.BUILD_DATE = "11-08-2025";
      }
    } catch (error) {
      console.error("❌ Could not load version from main:", error);
      // Set fallback values
      this.VERSION = "0.3.4";
      this.APP_NAME = "Portfolio Tracker";
      this.STATUS = "Beta Version";
      this.BUILD_DATE = "11-08-2025";
    }
  },

  getFullVersion() {
    return `${this.APP_NAME} v${this.VERSION}`;
  }
};

// Load version info when config loads
if (typeof window !== 'undefined') {
  APP_CONFIG.loadFromMain();
}
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
    } catch (error) {
      console.error("Error loading settings:", error);
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
    } catch (error) {
      console.error("Error saving settings:", error);

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
