/**
 * ===== IPC COMMUNICATION UTILITY =====
 * Centralized IPC communication layer for portfolio application
 *
 * STEP 4.1: Create this file as utils/ipc-communication.js
 */

/**
 * Window control operations
 */
const WindowOperations = {
  async minimize() {
    try {
      return await window.ipcRenderer.invoke("window-minimize");
    } catch (error) {
      console.error("❌ Error minimizing window:", error);
      throw error;
    }
  },

  async maximize() {
    try {
      return await window.ipcRenderer.invoke("window-maximize");
    } catch (error) {
      console.error("❌ Error maximizing window:", error);
      throw error;
    }
  },

  async close() {
    try {
      return await window.ipcRenderer.invoke("window-close");
    } catch (error) {
      console.error("❌ Error closing window:", error);
      throw error;
    }
  },
};

/**
 * Portfolio data operations
 */
const PortfolioOperations = {
  async getOverview() {
    try {
      const result = await window.ipcRenderer.invoke("get-portfolio-overview");
      if (result.error) {
        throw new Error(result.error);
      }
      return result;
    } catch (error) {
      console.error("❌ Error getting portfolio overview:", error);
      throw error;
    }
  },

  async addEntry(grantDate, exercisePrice, quantity, taxAmount, notes) {
    try {
      return await window.ipcRenderer.invoke(
        "add-portfolio-entry",
        grantDate,
        exercisePrice,
        quantity,
        taxAmount,
        notes
      );
    } catch (error) {
      console.error("❌ Error adding portfolio entry:", error);
      throw error;
    }
  },

  async updateEntry(id, quantity, taxAmount, notes) {
    try {
      return await window.ipcRenderer.invoke(
        "update-portfolio-entry",
        id,
        quantity,
        taxAmount,
        notes
      );
    } catch (error) {
      console.error("❌ Error updating portfolio entry:", error);
      throw error;
    }
  },

  async deleteEntry(id) {
    try {
      return await window.ipcRenderer.invoke("delete-portfolio-entry", id);
    } catch (error) {
      console.error("❌ Error deleting portfolio entry:", error);
      throw error;
    }
  },

  async checkExistingGrant(grantDate, exercisePrice) {
    try {
      return await window.ipcRenderer.invoke(
        "check-existing-grant",
        grantDate,
        exercisePrice
      );
    } catch (error) {
      console.error("❌ Error checking existing grant:", error);
      throw error;
    }
  },

  async getOptionsByGrantDate(grantDate) {
    try {
      return await window.ipcRenderer.invoke(
        "get-options-by-grant-date",
        grantDate
      );
    } catch (error) {
      console.error("❌ Error getting options by grant date:", error);
      throw error;
    }
  },

  async getAvailableExercisePrices() {
    try {
      return await window.ipcRenderer.invoke("get-available-exercise-prices");
    } catch (error) {
      console.error("❌ Error getting available exercise prices:", error);
      throw error;
    }
  },
};

/**
 * Price update operations
 */
const PriceOperations = {
  async updatePrices() {
    try {
      return await window.ipcRenderer.invoke("scrape-data");
    } catch (error) {
      console.error("❌ Error updating prices:", error);
      throw error;
    }
  },

  async getLatestPriceDate() {
    try {
      return await window.ipcRenderer.invoke("get-latest-price-date");
    } catch (error) {
      console.error("❌ Error getting latest price date:", error);
      throw error;
    }
  },

  async testConnection() {
    try {
      return await window.ipcRenderer.invoke("test-connection");
    } catch (error) {
      console.error("❌ Error testing connection:", error);
      throw error;
    }
  },

  async getLatestCSV() {
    try {
      return await window.ipcRenderer.invoke("get-latest-csv");
    } catch (error) {
      console.error("❌ Error getting latest CSV:", error);
      throw error;
    }
  },
};

/**
 * Settings operations
 */
const SettingsOperations = {
  async getSetting(key) {
    try {
      return await window.ipcRenderer.invoke("get-setting", key);
    } catch (error) {
      console.error(`❌ Error getting setting '${key}':`, error);
      throw error;
    }
  },

  async updateSetting(key, value) {
    try {
      return await window.ipcRenderer.invoke("update-setting", key, value);
    } catch (error) {
      console.error(`❌ Error updating setting '${key}':`, error);
      throw error;
    }
  },

  async loadAllSettings() {
    try {
      const settings = {};
      const settingKeys = [
        "target_percentage",
        "tax_auto_rate",
        "currency_symbol",
        "auto_update_prices",
      ];

      for (const key of settingKeys) {
        settings[key] = await this.getSetting(key);
      }

      return settings;
    } catch (error) {
      console.error("❌ Error loading all settings:", error);
      throw error;
    }
  },

  async saveAllSettings(settings) {
    try {
      const results = {};

      for (const [key, value] of Object.entries(settings)) {
        results[key] = await this.updateSetting(key, value);
      }

      return results;
    } catch (error) {
      console.error("❌ Error saving all settings:", error);
      throw error;
    }
  },
};

/**
 * Sales transaction operations
 */
const SalesOperations = {
  async recordSale(portfolioEntryId, saleDate, quantitySold, salePrice, notes) {
    try {
      return await window.ipcRenderer.invoke(
        "record-sale-transaction",
        portfolioEntryId,
        saleDate,
        quantitySold,
        salePrice,
        notes
      );
    } catch (error) {
      console.error("❌ Error recording sale:", error);
      throw error;
    }
  },

  async getSalesHistory() {
    try {
      return await window.ipcRenderer.invoke("get-sales-history");
    } catch (error) {
      console.error("❌ Error getting sales history:", error);
      throw error;
    }
  },
};

/**
 * Evolution and chart data operations
 */
const EvolutionOperations = {
  async getPortfolioEvolution(days = null) {
    try {
      return await window.ipcRenderer.invoke("get-portfolio-evolution", days);
    } catch (error) {
      console.error("❌ Error getting portfolio evolution:", error);
      throw error;
    }
  },

  async getOptionPriceHistory(exercisePrice, days = null) {
    try {
      return await window.ipcRenderer.invoke(
        "get-option-price-history",
        exercisePrice,
        days
      );
    } catch (error) {
      console.error("❌ Error getting option price history:", error);
      throw error;
    }
  },

  async getGrantHistory() {
    try {
      return await window.ipcRenderer.invoke("get-grant-history");
    } catch (error) {
      console.error("❌ Error getting grant history:", error);
      throw error;
    }
  },
};

/**
 * Database management operations
 */
const DatabaseOperations = {
  async exportDatabase() {
    try {
      return await window.ipcRenderer.invoke("export-database");
    } catch (error) {
      console.error("❌ Error exporting database:", error);
      throw error;
    }
  },

  async importDatabase(mergeMode = false) {
    try {
      return await window.ipcRenderer.invoke("import-database", mergeMode);
    } catch (error) {
      console.error("❌ Error importing database:", error);
      throw error;
    }
  },
  /**
   * Delete the entire database
   */
  async deleteDatabase() {
    try {
      return await window.ipcRenderer.invoke("delete-database");
    } catch (error) {
      console.error("❌ Error deleting database:", error);
      throw error;
    }
  },

  async debugState() {
    try {
      return await window.ipcRenderer.invoke("debug-database-state");
    } catch (error) {
      console.error("❌ Error debugging database state:", error);
      throw error;
    }
  },
};

/**
 * App version operations
 */
const AppOperations = {
  async getVersion() {
    try {
      return await window.ipcRenderer.invoke("get-app-version");
    } catch (error) {
      console.error("❌ Error getting app version:", error);
      throw error;
    }
  },
};

/**
 * IPC Event listeners setup
 */
const IPCEventListeners = {
  /**
   * Set up IPC event listeners
   * @param {Object} app - Application instance for callbacks
   */
  initialize(app) {
    console.log("📡 Setting up IPC event listeners...");

    if (!window.ipcRenderer) {
      console.error("❌ ipcRenderer not available");
      return false;
    }

    // Progress updates during scraping
    window.ipcRenderer.on("scrape-progress", (event, progressText) => {
      if (app.updateProgress && typeof app.updateProgress === "function") {
        app.updateProgress(progressText);
      }
    });

    console.log("✅ IPC event listeners initialized");
    return true;
  },

  /**
   * Remove all IPC listeners (cleanup)
   */
  cleanup() {
    if (window.ipcRenderer) {
      window.ipcRenderer.removeAllListeners("scrape-progress");
      console.log("🧹 IPC listeners cleaned up");
    }
  },
};

/**
 * Main IPC Communication coordinator
 */
const IPCCommunication = {
  /**
   * Initialize IPC communication layer
   * @param {Object} app - Application instance
   */
  initialize(app) {
    console.log("🌐 Initializing IPC communication layer...");

    // Store ipcRenderer reference globally
    if (!window.ipcRenderer) {
      try {
        window.ipcRenderer = require("electron").ipcRenderer;
        console.log("✅ ipcRenderer loaded successfully");
      } catch (error) {
        console.error("❌ Failed to load ipcRenderer:", error);
        return false;
      }
    }

    // Set up event listeners
    const listenersInitialized = IPCEventListeners.initialize(app);

    if (listenersInitialized) {
      console.log("✅ IPC Communication layer initialized successfully");
      return true;
    } else {
      console.error("❌ Failed to initialize IPC listeners");
      return false;
    }
  },

  // Expose all operation groups
  Window: WindowOperations,
  Portfolio: PortfolioOperations,
  Price: PriceOperations,
  Settings: SettingsOperations,
  Sales: SalesOperations,
  Evolution: EvolutionOperations,
  Database: DatabaseOperations,
  App: AppOperations,
  Events: IPCEventListeners,
};

// Export to global scope
window.IPCCommunication = IPCCommunication;

// Debug logging
console.log(
  "✅ IPC Communication loaded with modules:",
  Object.keys(IPCCommunication)
);
